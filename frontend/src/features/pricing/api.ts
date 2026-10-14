// ── FEATURE: Pricing — API (client)
// Persists the user's selected tier on `users/{uid}.plan`.
//
// NOTE: paid tiers are marked "coming soon" in the UI — no Razorpay
// subscription flow exists yet, so `setUserPlan` only switches between the free
// tiers. See `isPlanCheckoutReady()` in `plans.ts`.
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DEFAULT_PLAN, PLANS, getPlan } from './plans';
import type { PlanAudience, PlanId, UserPlan } from './types';

function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && PLANS.some((p) => p.id === value);
}

/** Read the stored plan, falling back to the audience default. */
export async function getUserPlan(
  uid: string,
  role: PlanAudience = 'student',
): Promise<PlanId> {
  const snap = await getDoc(doc(db, 'users', uid));
  const stored = snap.exists() ? snap.data().plan : undefined;
  if (isPlanId(stored)) return stored;
  return DEFAULT_PLAN[role];
}

/** Persist a tier selection. Returns the plan that was written. */
export async function setUserPlan(uid: string, planId: PlanId): Promise<PlanId> {
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const ref = doc(db, 'users', uid);
  const payload = { plan: plan.id, planChangedAt: serverTimestamp() };

  // updateDoc throws if the profile doc is missing; fall back to setDoc so a
  // half-provisioned account still gets a plan.
  const snap = await getDoc(ref);
  if (snap.exists()) await updateDoc(ref, payload);
  else await setDoc(ref, payload, { merge: true });

  return plan.id;
}

export type { PlanAudience, PlanId, UserPlan };