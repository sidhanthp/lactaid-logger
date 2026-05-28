import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { meals } = await request.json();
  if (!Array.isArray(meals) || meals.length === 0) {
    return Response.json({ error: 'No meals provided' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AI not configured' }, { status: 503 });
  }

  const summary = meals.slice(0, 50).map((m: Record<string, unknown>) =>
    `${m.food} (${m.dairyLevel}, ${m.estimatedLactoseGrams}g lactose, ${m.lactaidPills} pills) → ${m.symptoms ?? 'pending'}`
  ).join('\n');

  const systemPrompt = `You are a helpful lactose intolerance coach. Analyze the user's meal log and give 3-4 concise, personalized insights. Focus on:
- What's working well (food + pill combos with no symptoms)
- What needs adjustment (foods still causing symptoms)
- Specific actionable advice (try X pills for Y food next time)
- Encouragement for good tracking habits

Be warm, specific, and brief. Use the person's actual foods and pill counts. Each insight should be 1-2 sentences max. Return as a JSON array of objects with "emoji" (single emoji) and "text" (the insight). Nothing else.

Example output:
[{"emoji":"🎯","text":"Pizza with 3 pills has worked perfectly for you 4 times — keep that combo!"},{"emoji":"⚠️","text":"Ice cream still causes moderate symptoms even at 4 pills. Try 5 next time or switch to a lower-lactose dessert."},{"emoji":"💪","text":"Your symptom-free rate improved from 60% to 85% over the last 2 weeks."}]`;

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
          { role: 'user', content: `Here is my meal log:\n${summary}` },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OpenRouter error:', err);
      return Response.json({ error: 'AI request failed' }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';

    let parsed: { emoji: string; text: string }[];
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return Response.json({ error: 'Could not parse AI response' }, { status: 422 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const validated = parsed
      .filter(i => typeof i.emoji === 'string' && typeof i.text === 'string')
      .slice(0, 5)
      .map(i => ({ emoji: i.emoji.slice(0, 4), text: i.text.slice(0, 200) }));

    return Response.json({ insights: validated });
  } catch (err) {
    console.error('Insights error:', err);
    return Response.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
