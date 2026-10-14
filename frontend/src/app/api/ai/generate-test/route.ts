// ── API: POST /api/ai/generate-test
// Generates a practice test (5 MCQ with explanations) for a subject/topic via
// OpenRouter and persists it into the `tests` collection.
import { NextResponse } from 'next/server';
import { chatCompletion, extractJson } from '@/lib/ai/openrouter';

const apiKey = process.env.OPENROUTER_API_KEY || '';

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured in .env.local' }, { status: 500 });
  }

  try {
    const { subject, topic, difficulty = 'medium', questionCount = 5 } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 });
    }

    const prompt = `You are a world-class educational examiner for SkillBridge. Generate a highly structured, valid multiple-choice practice test.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Number of questions: ${questionCount}

Guidelines for Quality:
1. Use plausible distractors (incorrect options should represent common misconceptions).
2. Each question MUST have a 'category' (e.g., 'Conceptual', 'Application', 'Analysis', 'Syntax').
3. The 'explanation' should not just state the answer, but provide a 'Reasoning Step' to help the student learn.
4. If the topic involves programming, include snippets in markdown format within the question text where appropriate.

Return STIRCTLY a valid JSON object:
{
  "questions": [
    {
      "id": "q1",
      "text": "The question content...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "category": "Application",
      "explanation": "Scaffolded reasoning why A is correct and why others are common mistakes..."
    }
  ]
}`;

    const { text } = await chatCompletion(apiKey, {
      task: 'test',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      maxTokens: 3072,
    });

    const parsed = extractJson<{ questions?: unknown }>(text);

    if (!parsed) {
      console.error('Failed to parse AI Test JSON:', text.slice(0, 500));
      throw new Error('AI response was not valid JSON');
    }

    return NextResponse.json({ questions: parsed.questions || parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate test';
    console.error('OpenRouter Test Generation Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
