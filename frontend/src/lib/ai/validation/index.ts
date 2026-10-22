// ── LIB: AI — validation scaffolding
// The broader validation engine is implemented in stages. This file keeps the
// public API stable enough for future tasks without changing existing routes.

export type ValidationVerdict = 'pass' | 'fail' | 'needs_review' | 'unknown';

export interface AIValidationResult {
  verdict: ValidationVerdict;
  score: number;
  checks: string[];
  issues: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export function createValidationResult(
  verdict: ValidationVerdict,
  score: number,
  checks: string[] = [],
  issues: string[] = [],
  confidence: AIValidationResult['confidence'] = 'medium',
): AIValidationResult {
  return {
    verdict,
    score,
    checks,
    issues,
    confidence,
  };
}

export function validationSummary(value: unknown): AIValidationResult {
  if (typeof value === 'object' && value !== null && 'verdict' in value) {
    const candidate = value as Partial<AIValidationResult>;
    return createValidationResult(
      candidate.verdict ?? 'unknown',
      typeof candidate.score === 'number' ? candidate.score : 0,
      Array.isArray(candidate.checks) ? candidate.checks.filter((item): item is string => typeof item === 'string') : [],
      Array.isArray(candidate.issues) ? candidate.issues.filter((item): item is string => typeof item === 'string') : [],
      candidate.confidence ?? 'medium',
    );
  }

  return createValidationResult('unknown', 0, ['validation scaffold initialized'], ['No validator payload was supplied.']);
}
