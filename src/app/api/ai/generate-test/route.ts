import { NextResponse } from 'next/server';

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

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        response_format: { type: "json_object" },
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

    // Safety check for markdown code blocks and stray text
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) text = match[1].trim();
    }
    
    // Final cleanup of any potential stray characters before/after JSON
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    }

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ questions: parsed.questions || parsed });
    } catch (e) {
      console.error('Failed to parse AI Test JSON:', text);
      throw new Error('AI response was not valid JSON');
    }

  } catch (error: any) {
    console.error('OpenRouter Test Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test' },
      { status: 500 }
    );
  }
}
