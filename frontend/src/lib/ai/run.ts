// ── LIB: AI — shared server-side AI execution helper
// This is intentionally a scaffold: it validates input, records best-effort quota
// and cache checks, and returns a safe payload without changing any existing route
// behaviour until the runtime wiring is enabled in later tasks.

import { z } from 'zod';
import { FALLBACK_MODEL, getModel, type AITask } from './models';
import { deterministicValidate } from './validation/deterministic';

const AI_TASKS = ['doubt', 'coach', 'test', 'diagram', 'tags', 'tutor', 'verify'] as const;

const messageRoleSchema = z.enum(['system', 'user', 'assistant']);

const aiMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string()
    .min(1)
    .max(20000)
    .refine((content) => !/(?:__proto__|prototype|constructor)/i.test(content), {
      message: 'Unsafe prototype-pollution markers were detected in the input.',
    })
    .refine((content) => !/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u0009|\u000A|\u000B|\u000C|\u000D|\u000E|\u000F|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001A|\u001B|\u001C|\u001D|\u001E|\u001F|\u007F/.test(content), {
      message: 'Control characters are not allowed in AI input messages.',
    }),
});

export const runAIRequestSchema = z.object({
  task: z.enum(AI_TASKS),
  messages: z.array(aiMessageSchema).min(1).max(25),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(50000).optional(),
  signal: z.any().optional(),
  userId: z.string().trim().min(1).max(128).optional(),
});

export interface RunAIInput {
  task: AITask;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  userId?: string;
}

export interface RunAIValidation {
  verdict: 'pass' | 'fail' | 'needs_review' | 'unknown';
  score: number;
  checks: string[];
  issues: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface RunAIResult {
  ok: boolean;
  data: unknown;
  model: string;
  validation: RunAIValidation;
  cached: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export async function checkQuotaStatus(userId?: string, task?: AITask): Promise<{ enabled: boolean; headroom: number; reason?: string }> {
  if (!userId || !task) {
    return { enabled: false, headroom: 0, reason: 'quota checks are best-effort and disabled until Firebase is available in this runtime.' };
  }

  return { enabled: false, headroom: Number(process.env.AI_DAILY_LIMIT || 60), reason: 'quota check scaffold only; no Firestore write was performed.' };
}

export async function readCachedResponse(_key: string): Promise<unknown | null> {
  return null;
}

export async function writeCachedResponse(_key: string, _value: unknown): Promise<boolean> {
  return false;
}

export async function runAI(input: RunAIInput): Promise<RunAIResult> {
  const safeInput = runAIRequestSchema.parse(input);
  const model = getModel(safeInput.task) || FALLBACK_MODEL;

  await checkQuotaStatus(safeInput.userId, safeInput.task);

  const validation = deterministicValidate({
    task: safeInput.task,
    messages: safeInput.messages,
    score: 100,
  });

  return {
    ok: true,
    data: safeInput.messages,
    model,
    validation: {
      verdict: validation.verdict,
      score: validation.score,
      checks: validation.checks,
      issues: validation.issues,
      confidence: validation.confidence,
    },
    cached: false,
    usage: {
      totalTokens: 0,
    },
  };
}
