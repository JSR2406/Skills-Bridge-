import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { title, content } = await req.json();

    if (!title && !content) {
      return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Based on the following question:
    Title: ${title}
    Description: ${content}
    
    Suggest up to 5 relevant technical tags (1 word each if possible, hyphenated if necessary).
    Return ONLY a comma-separated list of tags, all lowercase. Nothing else.
    Example output: react, javascript, frontend
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Cleanup AI output just in case
    const rawTags = text.split(',').map(t => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean);
    const tags = Array.from(new Set(rawTags)).slice(0, 5);

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('Gemini Tag Suggestion Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suggest tags' },
      { status: 500 }
    );
  }
}
