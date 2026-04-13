import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { doubt, title } = await request.json();

    if (!doubt) {
      return NextResponse.json({ error: 'doubt content required' }, { status: 400 });
    }

    const prompt = `You are a technical diagram generator. Based on the following student doubt, generate a Mermaid.js diagram that visually explains the concept.

DOUBT TITLE: ${title || 'Technical Doubt'}
DOUBT CONTENT: ${doubt}

Rules:
1. Return ONLY valid Mermaid.js diagram code — no markdown fences, no explanation text
2. Choose the most appropriate diagram type:
   - flowchart TD: for processes, algorithms, decision trees
   - sequenceDiagram: for request-response flows, API calls, protocol interactions
   - classDiagram: for OOP concepts, data structures
   - graph LR: for dependency graphs, trees
   - erDiagram: for database schemas
3. Keep it simple but educational — max 12 nodes
4. Use descriptive, student-friendly labels
5. Start directly with the diagram type keyword

Example output format:
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Result A]
    B -->|No| D[Result B]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillsbridge-jet.vercel.app',
        'X-Title': 'SkillBridge',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    let diagram = data.choices?.[0]?.message?.content?.trim() || '';

    // Strip markdown fences if model adds them
    diagram = diagram.replace(/^```(?:mermaid)?\n?/i, '').replace(/\n?```$/i, '').trim();

    return NextResponse.json({ diagram });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
