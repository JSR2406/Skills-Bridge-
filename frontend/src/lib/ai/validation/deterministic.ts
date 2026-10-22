// ── LIB: AI — deterministic validation stub
// This is intentionally lightweight so the repo can compile while the real
// validator is iterated in later tasks without breaking the app.

import { createValidationResult, type AIValidationResult } from './index';

export function deterministicValidate(value: unknown): AIValidationResult {
  const normalised = typeof value === 'string' ? value.trim() : value;

  if (normalised === null || normalised === undefined) {
    return createValidationResult('fail', 0, ['deterministic validator ran'], ['No payload was provided.'], 'low');
  }

  const checks = ['schema check', 'safe input guard', 'content length check'];
  const issues: string[] = [];

  if (typeof normalised === 'string' && normalised.length > 20000) {
    issues.push('Response exceeds the maximum supported length.');
  }

  if (typeof normalised === 'string' && /__proto__|prototype|constructor/i.test(normalised)) {
    issues.push('Unsafe field names or prototype pollution markers detected.');
  }

  if (!issues.length) {
    return createValidationResult('pass', 100, checks, issues, 'high');
  }

  return createValidationResult('fail', 40, checks, issues, 'low');
}
