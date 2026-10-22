export type ValidationVerdict = 'pass' | 'fail' | 'needs_review' | 'unknown';
export type AIConfidence = 'high' | 'medium' | 'low';

export interface CriticValidationResult {
  verdict: 'pass' | 'revise' | 'fail';
  scores: {
    correctness: number;
    soundness: number;
    completeness: number;
    clarity: number;
    honesty: number;
  };
  issues: string[];
  fix: string;
  confidence: AIConfidence;
}

export interface AIValidationResult {
  verdict: ValidationVerdict;
  score: number;
  checks: string[];
  issues: string[];
  confidence?: AIConfidence;
  critic?: CriticValidationResult;
  tier0?: AIValidationResult;
  tier1?: AIValidationResult;
  tier2?: AIValidationResult;
}

export function createValidationResult(
  verdict: ValidationVerdict,
  score: number,
  checks: string[] = [],
  issues: string[] = [],
  confidence: AIConfidence = 'medium',
  critic?: CriticValidationResult,
): AIValidationResult {
  return {
    verdict,
    score,
    checks,
    issues,
    confidence,
    critic,
  };
}

export function summariseValidation(value: unknown): AIValidationResult {
  if (typeof value === 'object' && value !== null && 'verdict' in value) {
    const candidate = value as Partial<AIValidationResult>;
    return createValidationResult(
      candidate.verdict ?? 'unknown',
      typeof candidate.score === 'number' ? candidate.score : 0,
      Array.isArray(candidate.checks) ? candidate.checks.filter((item): item is string => typeof item === 'string') : [],
      Array.isArray(candidate.issues) ? candidate.issues.filter((item): item is string => typeof item === 'string') : [],
      candidate.confidence ?? 'medium',
      candidate.critic,
    );
  }

  return createValidationResult('unknown', 0, ['validation scaffold initialized'], ['No validator payload was supplied.']);
}
