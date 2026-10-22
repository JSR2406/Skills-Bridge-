// ── LIB: AI — model configuration
// Single source of truth for which model backs each AI task, so a model swap is
// an env change instead of a five-file code edit.
//
// Resolution order for every task:
//   1. OPENROUTER_MODEL_<TASK>   e.g. OPENROUTER_MODEL_DOUBT=google/gemini-2.5-pro
//   2. OPENROUTER_MODEL           global override for every task
//   3. the built-in default below
//
// `openrouter/free` is never a default — it is the FALLBACK_MODEL, used when a
// configured model is unavailable on the account (no credits, model disabled,
// transient provider error). See `openrouter.ts` for the automatic retry.

export type AITask = 'doubt' | 'coach' | 'test' | 'diagram' | 'tags' | 'tutor' | 'verify';

/** Always-available route, used as the last-resort retry model. */
export const FALLBACK_MODEL = 'openrouter/free';

const DEFAULT_MODELS: Record<AITask, string> = {
  // Reasoning-heavy: long, multi-step, self-checked answers where quality is
  // worth the extra tokens and latency.
  doubt: 'deepseek/deepseek-r1',
  coach: 'deepseek/deepseek-r1',
  tutor: 'google/gemini-2.0-flash-001',
  verify: 'google/gemini-2.0-flash-001',

  // Cheap + fast: small structured payloads (MCQs, tags, Mermaid) where a
  // reasoning pass adds latency without adding insight.
  test: 'google/gemini-2.0-flash-001',
  diagram: 'google/gemini-2.0-flash-001',
  tags: 'google/gemini-2.0-flash-001',
};

/** Models that emit an explicit reasoning trace we should strip from content. */
const REASONING_MODEL_PATTERN = /(deepseek|\/r1|-r1:|o1|o3|gpt-5|qwq|magistral-medium.*reason)/i;

export function getModel(task: AITask): string {
  const perTask = process.env[`OPENROUTER_MODEL_${task.toUpperCase()}`];
  const globalOverride = process.env.OPENROUTER_MODEL;
  const resolved = perTask || globalOverride || DEFAULT_MODELS[task];
  return resolved || FALLBACK_MODEL;
}

/** True when the model prefixes answers with its own reasoning trace. */
export function isReasoningModel(model: string): boolean {
  return REASONING_MODEL_PATTERN.test(model);
}

/** Human-readable label for the UI ("Deep reasoning" vs "Fast"). */
export function describeModel(task: AITask): string {
  const model = getModel(task);
  if (model === FALLBACK_MODEL) return 'SkillBridge AI · free tier';
  if (isReasoningModel(model)) return 'SkillBridge AI · deep reasoning';
  return 'SkillBridge AI · fast';
}
