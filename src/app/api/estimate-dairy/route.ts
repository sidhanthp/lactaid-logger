import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { food } = await request.json();
  if (!food || typeof food !== 'string') {
    return Response.json({ error: 'No food provided' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AI not configured' }, { status: 503 });
  }

  const systemPrompt = `You are a lactose content expert. Given a food item, estimate its lactose content per typical serving.

Use these science-backed reference values:
- Whole milk (250ml): 12g lactose
- Skim milk (250ml): 13g lactose
- Heavy cream (30ml): 0.4g
- Butter (14g pat): 0.01g (essentially none)
- Cheddar cheese (28g): 0.07g (aged cheeses are very low)
- Mozzarella (28g): 0.5g
- Cottage cheese (113g): 3.5g
- Cream cheese (28g): 0.8g
- Yogurt (170g): 4-8g (varies; Greek yogurt ~4g, regular ~8g)
- Ice cream (1/2 cup): 4-6g
- Sour cream (30ml): 0.4g
- Whey protein powder (30g scoop): 1-2g

Consider:
- Cooking/fermentation reduces lactose (aged cheese has almost none)
- Portion size matters enormously (a splash of milk vs a glass)
- Mixed dishes: estimate dairy component only
- If the food has NO dairy ingredients, lactose is 0g

Return ONLY valid JSON:
{"dairyLevel":"none|trace|low|medium|high|very_high","estimatedLactoseGrams":0,"reasoning":"brief explanation"}

Dairy level thresholds: none=0g, trace=<0.5g, low=0.5-2g, medium=2-4g, high=4-8g, very_high=8g+`;

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
          { role: 'user', content: `Estimate lactose content for: ${food}` },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
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
        return Response.json({ error: 'Could not parse response' }, { status: 422 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const validLevels = ['none', 'trace', 'low', 'medium', 'high', 'very_high'];
    const dairyLevel = validLevels.includes(parsed.dairyLevel) ? parsed.dairyLevel : 'medium';
    const estimatedLactoseGrams = Math.max(0, Math.min(20, Number(parsed.estimatedLactoseGrams) || 0));
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 200) : '';

    return Response.json({ dairyLevel, estimatedLactoseGrams, reasoning });
  } catch (err) {
    console.error('Dairy estimation error:', err);
    return Response.json({ error: 'Failed to estimate' }, { status: 500 });
  }
}
