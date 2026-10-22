import { chatCompletion } from '@/lib/ai/openrouter';
import { createValidationResult, type AIValidationResult, type CriticValidationResult } from './index';

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

const CRITIC_SYSTEM_PROMPT = `You are SkillBridge's Answer Critic. You did NOT write the answer under review. Judge it against the student's question. You are adversarial but fair: your job is to catch errors, not to nitpick style.

Score the answer on this rubric, each 0-10:
- correctness
- soundness
- completeness
- clarity
- honesty

Then decide:
- verdict: "pass" (all >= 6 and correctness >= 8) | "revise" (fixable) | "fail" (wrong or unsafe)
- issues: the specific, concrete problems
- fix: the single most important correction
- confidence: high | medium | low

Return ONLY valid JSON, no prose:
{
  "scores": { "correctness": 0, "soundness": 0, "completeness": 0, "clarity": 0, "honesty": 0 },
  "verdict": "pass | revise | fail",
  "issues": ["..."],
  "fix": "...",
  "confidence": "high | medium | low"
}`;

export async function runCritic(
  apiKey: string,
  task: 'doubt' | 'coach' | 'test' | 'diagram' | 'tags' | 'tutor',
  question: string,
  answer: string,
  context?: string,
): Promise<AIValidationResult> {
  const { text } = await chatCompletion(apiKey, {
    task: 'verify',
    messages: [
      { role: 'system', content: CRITIC_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          'Question:',
          question,
          '',
          'Student context (optional):',
          context ?? '',
          '',
          'Answer under review:',
          answer,
        ].join('\n'),
      },
    ],
    temperature: 0.2,
    maxTokens: 2048,
  });

  const parsed = safeJsonParse<CriticValidationResult>(text);
  if (!parsed) {
    return createValidationResult('unknown', 0, ['critic model call'], ['Critic response was not valid JSON.'], 'low');
  }

  const score = Math.round(
    (parsed.scores.correctness +
      parsed.scores.soundness +
      parsed.scores.completeness +
      parsed.scores.clarity +
      parsed.scores.honesty) / 5,
  );

  const verdict = parsed.verdict === 'pass'
    ? 'pass'
    : parsed.verdict === 'revise'
      ? 'needs_review'
      : 'fail';

  return createValidationResult(
    verdict,
    score,
    ['critic model call'],
    parsed.issues.length ? parsed.issues : [],
    parsed.confidence,
    parsed,
  );
}
