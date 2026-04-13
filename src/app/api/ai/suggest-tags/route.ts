import { NextResponse } from 'next/server';

const apiKey = process.env.OPENROUTER_API_KEY || '';

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured in .env.local' }, { status: 500 });
  }

  try {
    const { title, content } = await req.json();

    if (!title && !content) {
      return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
    }

    const prompt = `Based on the following question:
Title: ${title || ''}
Description: ${content || ''}

Suggest up to 5 relevant technical tags (1 word each if possible, hyphenated if necessary).
Return ONLY a comma-separated list of tags, all lowercase. Nothing else.
Example output: react, javascript, frontend`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillsbridge-jet.vercel.app",
        "X-Title": "SkillBridge"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${err}`);
    }

    const json = await res.json();
    let text = json.choices[0].message.content.trim();

    // Cleanup if AI returns markdown or sentence
    if (text.includes('```')) {
      const match = text.match(/```\s*([\s\S]*?)```/);
      if (match) text = match[1].trim();
    }
    
    const rawTags = text
      .split(/[,|\n]/) // Split by comma or newline
      .map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean);
    const tags = Array.from(new Set(rawTags)).slice(0, 5);

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('OpenRouter Tag Suggestion Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suggest tags' },
      { status: 500 }
    );
  }
}
