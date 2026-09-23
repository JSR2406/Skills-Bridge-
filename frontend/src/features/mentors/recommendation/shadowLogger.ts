/**
 * Shadow-Mode Logger for Mentor Recommendations
 *
 * PURPOSE
 * ────────
 * Before we surface ranked mentors in the UI, the shadow logger writes every
 * recommendation decision — with full input context + per-mentor score breakdown
 * — to Firestore. This lets us audit quality, compare engine versions, and
 * build confidence before enabling ranked results for real students.
 *
 * HOW IT WORKS
 * ────────────
 * 1. The /mentors page calls rankMentors() to get a scored list.
 * 2. writeShadowLog() is called immediately after — fire-and-forget.
 * 3. The log document appears in `mentorRecommendationShadowLogs` collection.
 * 4. If NEXT_PUBLIC_RECOMMENDATION_SHADOW_MODE !== 'false', the UI still shows
 *    the unranked list (shadow mode). Flip the env var to show ranked results.
 *
 * WHAT'S LOGGED PER DOCUMENT
 * ───────────────────────────
 *  studentId          — who triggered the recommendation
 *  context            — full input (weakTopics, unresolvedSubjects, bookedMentors, budget)
 *  rankedMentorIds    — output: mentor IDs in descending score order
 *  scoreBreakdowns    — per-mentor breakdown { topicMatchScore, ratingScore, ... }
 *  matchReasons       — per-mentor human-readable reasons (same as shown in UI)
 *  enabledInUI        — false = shadow only, true = live ranking in UI
 *  engineVersion      — bump when scoring weights change (enables before/after diff)
 *  shadowTimestamp    — Firestore serverTimestamp
 *
 * COLLECTION
 * ───────────
 *  mentorRecommendationShadowLogs  (no new index required — admin-read only)
 *
 * NEVER blocks the UI — addDoc() errors are caught and logged to console only.
 */

import { db } from '@/lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { RecommendationContext, ScoredMentor, ShadowLog } from './types';

const SHADOW_COLLECTION = 'mentorRecommendationShadowLogs';

/** Increment this string whenever SCORE_WEIGHTS changes in scorer.ts */
export const ENGINE_VERSION = 'v1.0-heuristic';

/**
 * Returns true if the recommendation engine is in shadow mode.
 *
 * Shadow mode = observe-only. The UI shows the default unranked mentor list
 * but the engine still runs and logs its output for offline validation.
 *
 * Set NEXT_PUBLIC_RECOMMENDATION_SHADOW_MODE=false to go live.
 */
export const isInShadowMode = (): boolean =>
  process.env.NEXT_PUBLIC_RECOMMENDATION_SHADOW_MODE !== 'false';

/**
 * Write a single shadow log document to Firestore.
 * Fire-and-forget — never awaited by callers to avoid blocking the UI.
 *
 * @param studentId      - UID of the student who triggered the recommendation
 * @param context        - The RecommendationContext used as scoring input
 * @param rankedMentors  - Scored + sorted output of rankMentors()
 */
export async function writeShadowLog(
  studentId: string,
  context: RecommendationContext,
  rankedMentors: ScoredMentor[],
): Promise<void> {
  // Build the document — flatten nested objects for Firestore queryability
  const logDoc: Omit<ShadowLog, 'id'> = {
    studentId,
    context,
    rankedMentorIds: rankedMentors.map(m => m.mentor.userId),
    scoreBreakdowns: Object.fromEntries(
      rankedMentors.map(m => [m.mentor.userId, m.breakdown]),
    ),
    matchReasons: Object.fromEntries(
      rankedMentors.map(m => [m.mentor.userId, m.matchReasons]),
    ),
    enabledInUI: !isInShadowMode(),
    engineVersion: ENGINE_VERSION,
    shadowTimestamp: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, SHADOW_COLLECTION), logDoc);
  } catch (err) {
    // Shadow logging is non-critical — never surface this error to the user
    console.warn('[ShadowLog] Write failed (non-critical):', err);
  }
}
