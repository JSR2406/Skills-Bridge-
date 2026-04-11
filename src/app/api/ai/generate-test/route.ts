import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { subject, topic, difficulty = 'medium', questionCount = 5 } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 });
    }

    // We use gemini-1.5-flash as it's fast and accepts JSON format prompts
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    You are an expert examiner. Generate a multiple-choice practice test.
    Subject: ${subject}
    Topic: ${topic}
    Difficulty: ${difficulty}
    Number of questions: ${questionCount}

    Return EXACTLY a valid JSON object with a single key "questions" containing an array.
    Do NOT include Markdown formatting like \`\`\`json or \`\`\`. Just the raw JSON string.

    Format of each question:
    {
      "id": "q1", // unique string
      "text": "The question text itself",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Exactly 4 options
      "correctIndex": 0, // Integer 0-3 indicating the correct option
      "explanation": "Brief explanation of why the correct option is correct."
    }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Cleanup AI output just in case the AI wraps in markdown blocks
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    const parsed = JSON.parse(text);

    return NextResponse.json({ questions: parsed.questions });
  } catch (error: any) {
    console.error('Gemini Test Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test' },
      { status: 500 }
    );
  }
}
