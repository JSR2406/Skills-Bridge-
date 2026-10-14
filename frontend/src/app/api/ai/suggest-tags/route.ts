// ── API: POST /api/ai/suggest-tags
// Suggests up to 5 subject/topic tags for a doubt description so students post
// well-categorized questions.
import { NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/openrouter';

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

    const { text } = await chatCompletion(apiKey, {
      task: 'tags',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxTokens: 128,
    });

    const rawTags = text
      .split(/[,|\n]/) // Split by comma or newline
      .map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean);
    const tags = Array.from(new Set(rawTags)).slice(0, 5);

    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to suggest tags';
    console.error('OpenRouter Tag Suggestion Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
