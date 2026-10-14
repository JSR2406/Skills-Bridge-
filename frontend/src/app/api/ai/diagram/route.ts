// ── API: POST /api/ai/diagram
// Takes a doubt topic, returns a Mermaid `flowchart TD` diagram illustrating
// the concept (hidden behind the "Generate diagram" button in the AI answer).
import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/openrouter';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

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

    const { text } = await chatCompletion(OPENROUTER_API_KEY, {
      task: 'diagram',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.3,
    });

    // Strip markdown fences / reasoning chatter if the model adds them
    const diagram = text.replace(/^```(?:mermaid)?\n?/i, '').replace(/\n?```$/i, '').trim();

    return NextResponse.json({ diagram });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Diagram generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
