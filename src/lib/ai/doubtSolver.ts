import { AIExplanation } from '@/features/doubts/types';

export const SOLVER_PROMPT = `
You are an expert academic tutor and technical mentor. Your goal is to explain complex concepts and solve doubts in a highly structured, educational manner.

Analyze the student's doubt and response in the following JSON format:
{
  "restatedQuestion": "A clearer, more professional version of the original doubt",
  "steps": ["Step 1 explanation", "Step 2 explanation", "..."],
  "commonMistakes": ["Mistake 1 to avoid", "Mistake 2 to avoid", "..."],
  "summaryNotes": "A concise summary for quick revision",
  "titleSuggestion": "A catchy, SEO-friendly title for the community post",
  "tagSuggestions": ["tag1", "tag2", "tag3"]
}

Guidelines:
1. Be encouraging and clear.
2. If code is involved, use markdown blocks within the steps.
3. Focus on 'why', not just 'what'.
4. Ensure the output is valid JSON only. do not add markdown prefix or suffix outside the JSON.
`;

export async function solveWithAI(question: string, context?: string): Promise<AIExplanation> {
  const response = await fetch('/api/ai/doubt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });

  if (!response.ok) {
    throw new Error('AI Solver failed to respond');
  }

  const data = await response.json();
  // If the API doesn't return JSON directly or needs parsing, handle it here
  return data as AIExplanation;
}
