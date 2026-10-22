import { randomUUID } from 'crypto';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface AIEventTelemetry {
  task: string;
  model: string;
  requestedModel?: string;
  retriedToFree: boolean;
  latencyMs: number;
  tokensApprox?: number;
  validationVerdict?: string;
  cacheHit?: boolean;
  userIdHash?: string;
  createdAt: string;
}

export async function writeAIEventTelemetry(entry: AIEventTelemetry): Promise<void> {
  try {
    await addDoc(collection(db, 'aiEvents'), {
      ...entry,
      createdAt: serverTimestamp(),
      id: randomUUID(),
    });
  } catch (error) {
    console.warn('[ai telemetry] failed to write event:', error);
  }
}
