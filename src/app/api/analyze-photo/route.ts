import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const mealsJson = formData.get('meals') as string | null;
  const context = (formData.get('context') as string | null)?.trim() || '';

  if (!image) {
    return Response.json({ error: 'No image provided' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AI not configured' }, { status: 503 });
  }

  const bytes = await image.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mimeType = image.type || 'image/jpeg';

  let pillContext = '';
  if (mealsJson) {
    try {
      const meals = JSON.parse(mealsJson);
      const tracked = meals.filter((m: Record<string, unknown>) => m.symptoms !== null);
      if (tracked.length > 0) {
        const byLevel: Record<string, { pills: number[]; symptoms: string[] }> = {};
        tracked.forEach((m: Record<string, unknown>) => {
          const level = m.dairyLevel as string;
          if (!byLevel[level]) byLevel[level] = { pills: [], symptoms: [] };
          byLevel[level].pills.push(m.lactaidPills as number);
          byLevel[level].symptoms.push(m.symptoms as string);
        });
        const lines = Object.entries(byLevel).map(([level, data]) => {
          const successful = data.pills.filter((_, i) => data.symptoms[i] === 'none' || data.symptoms[i] === 'mild');
          const rec = successful.length > 0 ? Math.min(...successful) : Math.max(...data.pills) + 1;
          return `${level}: ${rec} pills works best`;
        });
        pillContext = `\n\nUser's personal Lactaid history:\n${lines.join('\n')}\nUse this to personalize pill recommendations.`;
      }
    } catch { /* ignore malformed meals */ }
  }

  const systemPrompt = `You analyze photos of food/meals to identify dairy content for someone with lactose intolerance.

Look at the photo carefully. Estimate portion sizes from visual cues (plate size, utensils, hands for scale). For each food item visible, determine:
- food: descriptive name including estimated portion (e.g. "2 slices pepperoni pizza", "small latte ~8oz")
- dairyLevel: one of "none", "trace", "low", "medium", "high", "very_high"  
- estimatedLactoseGrams: number 0-20 (be precise based on portion)
- hasDairy: boolean

Science-backed lactose reference values per standard serving:
- Whole milk (250ml/8oz): 12g | Skim milk: 13g
- Heavy cream (30ml): 0.4g | Half-and-half (30ml): 0.6g
- Butter (1 tbsp/14g): 0.01g (essentially zero)
- Cheddar/Parmesan/Swiss (28g): 0.05-0.1g (aged = very low)
- Mozzarella (28g): 0.5g | Cream cheese (28g): 0.8g
- Cottage cheese (113g): 3.5g | Ricotta (60g): 1.5g
- Yogurt (170g): 4-8g (Greek ~4g, regular ~8g)
- Ice cream (1/2 cup/65g): 4-6g
- Sour cream (30ml): 0.4g | Whipped cream (30ml): 0.4g

Key principles:
- Aged/fermented dairy has much less lactose than fresh
- Cooking does NOT destroy lactose (it's heat-stable)
- Fermentation reduces lactose (yogurt, aged cheese)
- Scale estimates by actual portion visible in the photo
- Pizza: ~0.5g per oz mozzarella, typical slice has 2-3oz

Dairy levels: none=0g, trace=<0.5g, low=0.5-2g, medium=2-4g, high=4-8g, very_high=8g+

Also provide:
- totalLactoseGrams: sum of all items
- recommendedPills: Lactaid pills for the whole meal (1 pill per ~4-5g lactose is typical)
- summary: 1-2 sentence summary noting key dairy sources and portions${pillContext}

Return ONLY valid JSON. Format:
{"items":[{"food":"...","dairyLevel":"...","estimatedLactoseGrams":0,"hasDairy":true}],"totalLactoseGrams":0,"recommendedPills":0,"summary":"..."}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Analyze this meal photo for dairy content and Lactaid dosage.${context ? `\n\nAdditional context from user: ${context}` : ''}` },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OpenRouter error:', err);
      return Response.json({ error: 'AI request failed' }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Response.json({ error: 'Could not parse AI response' }, { status: 422 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const validLevels = ['none', 'trace', 'low', 'medium', 'high', 'very_high'];
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .filter((item: Record<string, unknown>) =>
        typeof item.food === 'string' && item.food.length > 0
      )
      .map((item: Record<string, unknown>) => ({
        food: String(item.food).slice(0, 100),
        dairyLevel: validLevels.includes(item.dairyLevel as string)
          ? item.dairyLevel
          : 'medium',
        estimatedLactoseGrams: Math.max(0, Math.min(20, Number(item.estimatedLactoseGrams) || 0)),
        hasDairy: Boolean(item.hasDairy),
      }));

    const totalLactoseGrams = Math.max(0, Number(parsed.totalLactoseGrams) || items.reduce((s: number, i: { estimatedLactoseGrams: number }) => s + i.estimatedLactoseGrams, 0));
    const recommendedPills = Math.max(0, Math.min(10, Math.round(Number(parsed.recommendedPills) || 0)));
    const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 300) : '';

    return Response.json({ items, totalLactoseGrams, recommendedPills, summary });
  } catch (err) {
    console.error('Photo analysis error:', err);
    return Response.json({ error: 'Failed to analyze photo' }, { status: 500 });
  }
}
