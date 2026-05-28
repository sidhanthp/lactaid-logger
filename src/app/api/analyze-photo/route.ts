import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const mealsJson = formData.get('meals') as string | null;

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

Look at the photo and identify every food item visible. For each item, determine:
- food: descriptive name
- dairyLevel: one of "none", "trace", "low", "medium", "high", "very_high"  
- estimatedLactoseGrams: number 0-20
- hasDairy: boolean

Dairy level guide:
- none: 0g (salad, rice, fruit, grilled meat, bread)
- trace: <0.5g (butter, hard aged cheese, dark chocolate)
- low: 0.5-2g (coffee with cream, cookie, light cheese sauce)
- medium: 2-4g (cheeseburger, pancakes, cream soup)
- high: 4-8g (pizza, mac & cheese, yogurt, cream cheese bagel)
- very_high: 8g+ (ice cream, glass of milk, milkshake, cheesecake, alfredo pasta)

Also provide:
- totalLactoseGrams: sum of all items
- recommendedPills: number of Lactaid pills for the whole meal
- summary: 1-2 sentence summary of the dairy content${pillContext}

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
              { type: 'text', text: 'Analyze this meal photo for dairy content and Lactaid dosage:' },
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
