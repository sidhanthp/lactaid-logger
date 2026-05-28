import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface ParsedMeal {
  food: string;
  dairyLevel: string;
  estimatedLactoseGrams: number;
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text || typeof text !== 'string') {
    return Response.json({ error: 'Missing text' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AI not configured' }, { status: 503 });
  }

  const systemPrompt = `You parse natural language meal descriptions into structured dairy data. 
For each food item mentioned, return:
- food: the food name (e.g. "Latte", "Pizza (2 slices)")
- dairyLevel: one of "none", "trace", "low", "medium", "high", "very_high"
- estimatedLactoseGrams: number (0-20)

Dairy level guide:
- none: 0g (salad, rice, grilled chicken)
- trace: <0.5g (butter, hard cheese, whey protein)
- low: 0.5-2g (coffee with cream, latte, cookie)  
- medium: 2-4g (cheeseburger, pancakes, buttered toast)
- high: 4-8g (pizza, mac & cheese, yogurt, cream cheese bagel)
- very_high: 8g+ (ice cream, glass of milk, milkshake, cheesecake)

Return ONLY a JSON array of objects. No extra text. Example:
Input: "had a latte and two slices of pizza"
Output: [{"food":"Latte","dairyLevel":"low","estimatedLactoseGrams":2},{"food":"Pizza (2 slices)","dairyLevel":"high","estimatedLactoseGrams":6}]`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OpenRouter error:', err);
      return Response.json({ error: 'AI request failed' }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';

    let parsed: ParsedMeal[];
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return Response.json({ error: 'Could not parse AI response' }, { status: 422 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }
    const validLevels = ['none', 'trace', 'low', 'medium', 'high', 'very_high'];
    const validated = parsed
      .filter(m => m.food && validLevels.includes(m.dairyLevel) && typeof m.estimatedLactoseGrams === 'number')
      .map(m => ({
        food: String(m.food).slice(0, 100),
        dairyLevel: m.dairyLevel,
        estimatedLactoseGrams: Math.max(0, Math.min(20, m.estimatedLactoseGrams)),
      }));

    return Response.json({ meals: validated });
  } catch (err) {
    console.error('Parse error:', err);
    return Response.json({ error: 'Failed to parse meal' }, { status: 500 });
  }
}
