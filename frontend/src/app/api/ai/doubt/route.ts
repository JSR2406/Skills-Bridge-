import { NextResponse } from 'next/server';
import { chatCompletion, extractJson } from '@/lib/ai/openrouter';
import { FALLBACK_MODEL } from '@/lib/ai/models';
import { deterministicValidate } from '@/lib/ai/validation/deterministic';
import type { AIExplanation } from '@/features/doubts/types';

const apiKey = process.env.OPENROUTER_API_KEY || '';
const validationShadowMode = process.env.NEXT_PUBLIC_AI_VALIDATION_SHADOW_MODE !== 'false';

function buildPrompt(title: string, content: string, rich: boolean): string {
  const systemPrompt = rich
    ? `You are SkillBridge's doubt engine — an expert academic tutor who is unusually careful about correctness.`
    : `You are an expert academic tutor and technical mentor.`;

  return `${systemPrompt}

Student Doubt:
Title: ${title}
Description: ${content}

Return valid JSON only.`;
}

function normaliseExplanation(raw: Record<string, unknown>, title: string): AIExplanation {
  const str = (v: unknown, fallback = ''): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];

  const restated = str(raw.restatedQuestion, title);
  const steps = arr(raw.steps);
  const confidence = str(raw.confidence).toLowerCase();

  const explanation: AIExplanation = {
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

  explanation.validation = deterministicValidate(explanation);
  return explanation;
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
      const explanation = normaliseExplanation({
        restatedQuestion: title,
        steps: [text || 'The AI was unable to format its response. Please try again with a more detailed question.'],
        commonMistakes: ['The description may be too vague for a structured answer.'],
        summaryNotes: 'Formatting error — showing the raw response.',
        confidence: 'low',
      }, title);

      return NextResponse.json({ ...explanation, model });
    }

    const explanation = normaliseExplanation(parsed, title);

    return NextResponse.json({
      ...explanation,
      model,
      validation: validationShadowMode ? explanation.validation : explanation.validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate AI response';
    console.error('OpenRouter API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
