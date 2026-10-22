import { chatCompletion } from '@/lib/ai/openrouter';
import { createValidationResult } from './index';

export async function runSelfConsistency(
  apiKey: string,
  task: 'doubt' | 'coach' | 'test' | 'diagram' | 'tags' | 'tutor',
  messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>,
  userId?: string,
) {
  const samples: string[] = [];

  for (let i = 0; i < 2; i += 1) {
    const { text } = await chatCompletion(apiKey, {
      task,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    samples.push(text);
  }

  const normalized = samples.map((sample) =>
    sample.replace(/```json|```/gi, '').replace(/\s+/g, ' ').trim().toLowerCase(),
  );

  if (new Set(normalized).size <= 1) {
    return createValidationResult('pass', 88, ['self-consistency sampling'], [], 'medium');
  }

  const disagreementRate = 100 - (new Set(normalized).size / normalized.length) * 100;
  return createValidationResult(
    disagreementRate > 50 ? 'needs_review' : 'pass',
    Math.max(0, 100 - disagreementRate),
    ['self-consistency sampling'],
    [`Self-consistency disagreement detected across ${normalized.length} samples.`],
    'low',
  );
}
