import { NextResponse } from 'next/server';

const apiKey = process.env.OPENROUTER_API_KEY || '';

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured in .env.local' }, { status: 500 });
  }

  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const prompt = `You are an expert academic tutor and technical mentor. Your goal is to explain complex concepts and solve doubts in a highly structured, educational manner.

Analyze the following student doubt and respond STIRCTLY in valid JSON format ONLY. 
Do not include any text before or after the JSON. 
If there is code, ensure it is properly escaped inside the JSON strings.

Student Doubt:
Title: ${title}
Description: ${content}

Request JSON Structure:
{
  "restatedQuestion": "A clearer, more professional version of the original doubt",
  "steps": ["Step 1 explanation", "Step 2 explanation", "..."],
  "commonMistakes": ["Mistake 1 to avoid", "Mistake 2 to avoid", "..."],
  "summaryNotes": "A concise summary for quick revision",
  "titleSuggestion": "A catchy, SEO-friendly title",
  "tagSuggestions": ["tag1", "tag2", "tag3"]
}`;

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
    let responseText = json.choices[0].message.content.trim();
    
    // Safety check for markdown code blocks and stray text
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) responseText = match[1].trim();
    }
    
    // Final cleanup of any potential stray characters before/after JSON
    responseText = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);

    try {
      const parsedData = JSON.parse(responseText);
      return NextResponse.json(parsedData);
    } catch (e) {
      console.error('Failed to parse AI JSON:', responseText);
      // Fallback response instead of crashing
      return NextResponse.json({ 
        restatedQuestion: title,
        steps: [responseText || "AI was unable to format its response correctly. Please try again with a more detailed question."],
        commonMistakes: ["The description might be too vague or the AI is experiencing high load."],
        summaryNotes: "Parsing error occurred. Displaying raw output if available.",
        titleSuggestion: title,
        tagSuggestions: []
      });
    }
  } catch (error: any) {
    console.error('OpenRouter API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
