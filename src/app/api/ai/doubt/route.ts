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

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert tutor on the SkillBridge platform. 
A student has asked the following doubt:

Title: ${title}
Description: ${content}

Please provide a helpful, accurate, and step-by-step explanation to resolve their doubt.
Format your response in neat Markdown. Use code blocks if applicable.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ answer: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
