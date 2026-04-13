import { NextResponse } from 'next/server';
import { COACH_PROMPT } from '@/lib/ai/productivityCoach';

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

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        response_format: { type: "json_object" },
        messages: [
          { role: "user", content: fullPrompt }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Openrouter raw error:', err);
      throw new Error(`OpenRouter error: ${res.statusText}`);
    }

    const json = await res.json();
    let responseText = json.choices?.[0]?.message?.content || "";
    responseText = responseText.trim();
    
    // Cleanup markdown code blocks if any
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json|```$/gm, '').trim();
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```|```$/gm, '').trim();
    }

    try {
      const parsedData = JSON.parse(responseText);
      return NextResponse.json(parsedData);
    } catch (e) {
      console.error('Failed to parse AI JSON:', responseText);
      return NextResponse.json({ 
        summary: "I encountered an error while organizing your plan. Here are my raw suggestions.",
        focusAreas: ["Mixed Studies"],
        studyBlocks: [
          {
            title: "Manual Review",
            description: responseText,
            durationMinutes: 60
          }
        ],
        followUps: ["Try generating the plan again in a few minutes."]
      });
    }
  } catch (error: any) {
    console.error('Productivity Coach API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate productivity plan' },
      { status: 500 }
    );
  }
}
