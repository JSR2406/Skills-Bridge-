// ── API: POST /api/productivity/generate
// Productivity Coach endpoint: aggregates the user's live context (profile,
// doubts, attempts, sessions, tasks), calls the coach, and stores the result
// in `aiProductivityLogs` (today/week timeframe).
import { NextResponse } from 'next/server';
import { COACH_PROMPT } from '@/lib/ai/productivityCoach';
import { chatCompletion, extractJson } from '@/lib/ai/openrouter';

const apiKey = process.env.OPENROUTER_API_KEY || '';

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const context = await req.json();

    const fullPrompt = `
${COACH_PROMPT}

USER CONTEXT:
${JSON.stringify(context, null, 2)}

Provide the JSON Study Plan now. ONLY output the raw JSON object, without any markdown formatting like \`\`\`json.
`;

    const { text } = await chatCompletion(apiKey, {
      task: 'coach',
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: 0.5,
      maxTokens: 2048,
    });

    const parsedData = extractJson<Record<string, unknown>>(text);

    if (!parsedData) {
      console.error('Failed to parse AI JSON:', text.slice(0, 500));
      return NextResponse.json({
        summary: "I encountered an error while organizing your plan. Here are my raw suggestions.",
        focusAreas: ["Mixed Studies"],
        studyBlocks: [
          {
            title: "Manual Review",
            description: text,
            durationMinutes: 60
          }
        ],
        followUps: ["Try generating the plan again in a few minutes."]
      });
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate productivity plan';
    console.error('Productivity Coach API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
