// ── API: POST /api/ai/doubt
// DOUBT_AI core: solves a doubt with OpenRouter using an explicit
// reason → solve → verify protocol, and returns a structured explanation.
// Model selection, the free-tier retry and JSON extraction live in `lib/ai`.
import { NextResponse } from 'next/server';
import { chatCompletion, extractJson } from '@/lib/ai/openrouter';
import { FALLBACK_MODEL } from '@/lib/ai/models';
import type { AIExplanation } from '@/features/doubts/types';

const apiKey = process.env.OPENROUTER_API_KEY || '';

/**
 * Protocol used when a capable model is configured. It asks for an explicit
 * reason → solve → verify → calibrate chain, which is where the reasoning
 * fields come from.
 */
const RICH_SYSTEM_PROMPT = `You are SkillBridge's doubt engine — an expert academic tutor who is unusually careful about correctness.

You follow a strict protocol before you answer:

1. RESTATE. Rewrite the doubt in your own words. If the question is ambiguous or under-specified, pick the single most likely interpretation a student meant, state that assumption explicitly, and answer that. Never ask a clarifying question — always answer your best interpretation.
2. REASON. Work out the approach before writing the solution. Identify the underlying concept, the governing rule or formula, and why that approach applies here. Consider and discard at least one plausible alternative approach.
3. SOLVE. Produce numbered steps. Each step states what is happening and why, not just the operation.
4. VERIFY. Re-read your own solution. Check arithmetic, signs, units, edge cases and internal consistency. State what you checked and name any residual caveat honestly.
5. CALIBRATE. Give a confidence level. Use "low" when the question is ambiguous, under-specified, or outside well-established material — a wrong confident answer is the worst outcome you can produce.`;

/**
 * Instruction used on the free-tier fallback.
 *
 * Small free models cope badly with meta-instructions — given the 5-step
 * protocol they narrate the instructions back instead of answering the doubt.
 * This mirrors the phrasing that reliably produced valid JSON on
 * `openrouter/free`: direct role, explicit "JSON only", and a schema whose
 * values are *examples* rather than further instructions.
 */
const LEAN_SYSTEM_PROMPT = `You are an expert academic tutor and technical mentor. Your goal is to explain complex concepts and solve doubts in a highly structured, educational manner.

Analyze the following student doubt and respond STIRCTLY in valid JSON format ONLY.
Do not include any text before or after the JSON.
If there is code, ensure it is properly escaped inside the JSON strings.

Explain the reasoning behind each step, not just the operation.`;

const RICH_JSON_SCHEMA = `{
  "restatedQuestion": "A clearer, more professional version of the original doubt",
  "reasoning": "2-4 sentences on the chain of reasoning: which concept governs this, why this approach applies, and which alternative you rejected and why",
  "steps": ["Step 1 explanation", "Step 2 explanation", "..."],
  "workedExample": "One concrete worked example — real numbers or a short code snippet — showing the method end to end. Use an empty string if the concept is purely theoretical.",
  "keyConcepts": ["The 3-5 named concepts or techniques this hinges on"],
  "commonMistakes": ["Mistake 1 to avoid", "Mistake 2 to avoid", "..."],
  "verification": "1-3 sentences: what you checked, and any caveat that remains",
  "confidence": "high | medium | low",
  "summaryNotes": "A concise summary for quick revision",
  "titleSuggestion": "A catchy, SEO-friendly title",
  "tagSuggestions": ["tag1", "tag2", "tag3"]
}`;

const LEAN_JSON_SCHEMA = `{
  "restatedQuestion": "A clearer, more professional version of the original doubt",
  "steps": ["Step 1 explanation", "Step 2 explanation", "..."],
  "commonMistakes": ["Mistake 1 to avoid", "Mistake 2 to avoid", "..."],
  "summaryNotes": "A concise summary for quick revision",
  "titleSuggestion": "A catchy, SEO-friendly title",
  "tagSuggestions": ["tag1", "tag2", "tag3"]
}`;

function buildPrompt(title: string, content: string, rich: boolean): string {
  // Size the JSON contract to the model we are about to ask. Small free-tier
  // models reliably fill ~6 keys; asking for 11 gets prose back instead of JSON.
  // `normaliseExplanation` fills whatever the lean contract omits.
  return `${rich ? RICH_SYSTEM_PROMPT : LEAN_SYSTEM_PROMPT}

Student Doubt:
Title: ${title}
Description: ${content}

Request JSON Structure:
${rich ? RICH_JSON_SCHEMA : LEAN_JSON_SCHEMA}`;
}

/**
 * Coerce whatever the model returned into a complete `AIExplanation`.
 * Guarantees every array is an array and every string is a string, so the UI
 * never has to defend against a missing field.
 */
function normaliseExplanation(raw: Record<string, unknown>, title: string): AIExplanation {
  const str = (v: unknown, fallback = ''): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];

  const restated = str(raw.restatedQuestion, title);
  const steps = arr(raw.steps);
  const confidence = str(raw.confidence).toLowerCase();

  return {
    restatedQuestion: restated,
    steps: steps.length ? steps : ['The AI did not return a usable step-by-step breakdown. Try rewording the doubt with more detail.'],
    commonMistakes: arr(raw.commonMistakes),
    summaryNotes: str(raw.summaryNotes, 'No summary was generated for this doubt.'),
    titleSuggestion: str(raw.titleSuggestion, title),
    tagSuggestions: arr(raw.tagSuggestions),
    reasoning: str(raw.reasoning),
    workedExample: str(raw.workedExample),
    keyConcepts: arr(raw.keyConcepts),
    verification: str(raw.verification),
    confidence:
      confidence === 'high' || confidence === 'medium' || confidence === 'low'
        ? confidence
        : steps.length
          ? 'medium'
          : 'low',
  };
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured in .env.local' }, { status: 500 });
  }

  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // The prompt adapts to whichever model actually serves the request: a
    // reasoning model gets the full protocol + 11-key contract, the free-tier
    // fallback gets the shorter instruction + 6-key contract it can reliably fill.
    const { text, model } = await chatCompletion(apiKey, {
      task: 'doubt',
      messages: (servingModel) => [
        { role: 'user', content: buildPrompt(title, content, servingModel !== FALLBACK_MODEL) },
      ],
      temperature: 0.3,
      maxTokens: 3072,
    });

    const parsed = extractJson<Record<string, unknown>>(text);

    if (!parsed) {
      console.error('[ai/doubt] could not extract JSON from model output:', text.slice(0, 500));
      // Render the raw answer rather than failing the request outright.
      return NextResponse.json(
        normaliseExplanation(
          {
            restatedQuestion: title,
            steps: [text || 'The AI was unable to format its response. Please try again with a more detailed question.'],
            commonMistakes: ['The description may be too vague for a structured answer.'],
            summaryNotes: 'Formatting error — showing the raw response.',
            confidence: 'low',
          },
          title,
        ),
      );
    }

    return NextResponse.json({ ...normaliseExplanation(parsed, title), model });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate AI response';
    console.error('OpenRouter API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}