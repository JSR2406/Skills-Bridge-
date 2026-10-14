// ── LIB: AI — OpenRouter client
// One transport for every AI route: model resolution (see `models.ts`), a
// free-tier retry, and robust JSON extraction. Replaces the copy-pasted fetch +
// markdown-fence-stripping that used to live in each route.
import { FALLBACK_MODEL, getModel, isReasoningModel, type AITask } from './models';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REFERER = process.env.NEXT_PUBLIC_APP_URL || 'https://skillsbridge-jet.vercel.app';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  task: AITask;
  /**
   * The prompt. Pass a function when the prompt should adapt to the model that
   * ends up serving the request — the free-tier fallback needs a smaller JSON
   * contract than a reasoning model, and the fallback is only discovered *after*
   * the first attempt fails.
   */
  messages: ChatMessage[] | ((model: string) => ChatMessage[]);
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export class OpenRouterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
  }
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': REFERER,
    'X-Title': 'SkillBridge',
  };
}

/** Raw single-shot request against a specific model. */
async function request(
  apiKey: string,
  model: string,
  opts: CompletionOptions,
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    signal: opts.signal,
    body: JSON.stringify({
      model,
      messages: typeof opts.messages === 'function' ? opts.messages(model) : opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new OpenRouterError(`OpenRouter ${res.status}: ${detail}`, res.status);
  }

  const json = await res.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? '';

  // Reasoning models put their scratchpad in `content` for some providers and
  // in a sibling `reasoning` field for others — drop either before parsing.
  const reasoning = json?.choices?.[0]?.message?.reasoning;
  const body = [reasoning, raw].filter(Boolean).join('\n');
  return isReasoningModel(model) ? stripThinkTags(body) : body;
}

/**
 * Run a completion, resolving the model for `task`.
 *
 * If the configured model fails (402 no credits, 404 disabled, 5xx provider
 * blip) we transparently retry once on `openrouter/free`, which is always
 * available — the app degrades in quality instead of erroring at the user.
 *
 * @returns the assistant text and the model that actually produced it
 */
export async function chatCompletion(
  apiKey: string,
  opts: CompletionOptions,
): Promise<{ text: string; model: string }> {
  const preferred = getModel(opts.task);

  try {
    return { text: await request(apiKey, preferred, opts), model: preferred };
  } catch (err) {
    if (preferred === FALLBACK_MODEL) throw err;
    console.warn(`[ai] ${preferred} failed, retrying on ${FALLBACK_MODEL}:`, (err as Error).message);
    return { text: await request(apiKey, FALLBACK_MODEL, opts), model: FALLBACK_MODEL };
  }
}

/** Remove `<think>…</think>` scratchpads that reasoning models sometimes leak. */
function stripThinkTags(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^<think>[\s\S]*$/i, '')
    .trim();
}

/**
 * Pull a JSON object out of an LLM response.
 *
 * Models wrap JSON in ```json fences, prepend "Sure! Here is…", or append a
 * closing remark. This peels those off and returns the first balanced object.
 * Returns `null` when there is genuinely no JSON to be found, so callers can
 * fall back to rendering the raw text.
 */
export function extractJson<T>(text: string): T | null {
  if (!text) return null;

  // Already pure JSON.
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      /* fall through to scanning */
    }
  }

  // ```json … ``` (greedy enough for nested braces inside strings is not needed
  // because we scan for a balanced object next).
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;

  const start = candidate.indexOf('{');
  if (start === -1) return null;

  // Walk forward tracking brace depth, ignoring braces inside string literals.
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}