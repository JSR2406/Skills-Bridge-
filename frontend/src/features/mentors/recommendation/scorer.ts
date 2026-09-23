/**
 * Deterministic Mentor Recommendation Scorer
 *
 * Scoring Rubric (max 100 pts per mentor)
 * ─────────────────────────────────────────
 *  Signal             Weight   Rationale
 *  ──────────────     ──────   ─────────────────────────────────────────────
 *  Topic Match          40     Primary signal: mentor expertise ∩ student weak areas
 *  Rating               25     Social proof: normalised averageRating (neutral 10 for new)
 *  Availability         20     Actionability: free slot within 48 hours
 *  Novelty              10     Learning breadth: student hasn't booked this mentor before
 *  Budget Fit            5     Practical: mentor fee ≤ student's budgetCeiling
 *
 * Design decisions:
 *  - Pure functions only — scoreMentor() and rankMentors() have zero side effects.
 *  - No ML, no embeddings — every formula is a one-liner with an auditable constant.
 *  - Weights live in SCORE_WEIGHTS — change once, propagates to all scores + tests.
 *  - Unrated mentors get neutral ratingScore (10) rather than 0 to avoid penalising
 *    good new mentors who haven't accumulated reviews yet.
 */

import { MentorProfile, MentorSlot } from '@/features/mentors/types';
import { RecommendationContext, ScoredMentor, ScoreBreakdown } from './types';

// ── Weight constants ──────────────────────────────────────────────────────────
// All scoring formulas reference these. Adjust here to tune recommendations.
export const SCORE_WEIGHTS = {
  TOPIC_MATCH: 40,
  RATING: 25,
  AVAILABILITY: 20,
  NOVELTY: 10,
  BUDGET: 5,
  /** Score given to unrated mentors instead of 0 — fairness for new mentors */
  UNRATED_BASELINE: 10,
} as const;

/** Window (ms) within which an available slot qualifies for availability points */
const AVAILABILITY_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lowercase + trim for topic comparison — avoids "DSA" vs "dsa" mismatches */
const normalise = (s: string): string => s.toLowerCase().trim();

/**
 * Convert a Firestore Timestamp or Date to a JS Date.
 * MentorSlot.startTime can be either depending on how it was fetched.
 */
const toDate = (val: Date | { toDate(): Date }): Date =>
  val instanceof Date ? val : val.toDate();

// ── Core scoring function ─────────────────────────────────────────────────────

/**
 * Score a single mentor against the student's recommendation context.
 *
 * @param mentor    - Approved mentor profile from Firestore
 * @param slots     - This mentor's current (pre-fetched) available slots
 * @param context   - Student's aggregated activity context
 * @returns         ScoredMentor with breakdown and human-readable match reasons
 *
 * This is a pure function — deterministic, no network calls, fully unit-testable.
 */
export function scoreMentor(
  mentor: MentorProfile,
  slots: MentorSlot[],
  context: RecommendationContext,
): ScoredMentor {
  const reasons: string[] = [];

  // ── Signal 1: Topic Match (0–40) ─────────────────────────────────────────
  // Build normalised set of mentor's domain coverage
  const mentorCoverage = new Set([
    ...mentor.subjects.map(normalise),
    ...mentor.expertise.map(normalise),
  ]);

  // Student's learning gaps — union of weak test topics + unresolved doubt subjects
  const studentGapsNorm = [
    ...context.weakTopics.map(normalise),
    ...context.unresolvedSubjects.map(normalise),
  ];
  const uniqueGaps = Array.from(new Set(studentGapsNorm)); // deduplicate

  const matchingTopics = uniqueGaps.filter(t => mentorCoverage.has(t));

  const topicMatchRatio = uniqueGaps.length > 0
    ? matchingTopics.length / uniqueGaps.length
    : 0;

  const topicMatchScore = Math.round(topicMatchRatio * SCORE_WEIGHTS.TOPIC_MATCH);

  if (matchingTopics.length > 0) {
    reasons.push(
      `Covers your weak areas: ${matchingTopics.slice(0, 2).join(', ')}${matchingTopics.length > 2 ? ` +${matchingTopics.length - 2} more` : ''}`,
    );
  }

  // ── Signal 2: Rating (0–25) ──────────────────────────────────────────────
  // Unrated mentors (totalRatings === 0) get a neutral 10/25 — not penalised for being new.
  const ratingScore = mentor.totalRatings > 0
    ? Math.round((mentor.averageRating / 5) * SCORE_WEIGHTS.RATING)
    : SCORE_WEIGHTS.UNRATED_BASELINE;

  if (mentor.totalRatings > 0 && mentor.averageRating >= 4.5) {
    reasons.push(`Highly rated: ${mentor.averageRating.toFixed(1)}★ (${mentor.totalRatings} reviews)`);
  } else if (mentor.totalRatings === 0) {
    reasons.push('New mentor — be among the first to review!');
  }

  // ── Signal 3: Availability (0–20) ────────────────────────────────────────
  const windowEnd = new Date(Date.now() + AVAILABILITY_WINDOW_MS);
  const hasSlotSoon = slots.some(s => {
    if (s.isBooked) return false;
    const slotStart = toDate(s.startTime as any);
    return slotStart > new Date() && slotStart <= windowEnd;
  });

  const availabilityScore = hasSlotSoon ? SCORE_WEIGHTS.AVAILABILITY : 0;
  if (hasSlotSoon) reasons.push('Has a slot open in the next 48 hours');

  // ── Signal 4: Novelty (0–10) ─────────────────────────────────────────────
  const alreadyBooked = context.bookedMentorIds.includes(mentor.userId);
  const noveltyScore = alreadyBooked ? 0 : SCORE_WEIGHTS.NOVELTY;

  if (!alreadyBooked) {
    if (mentor.sessionCount > 10) {
      reasons.push(`${mentor.sessionCount} sessions taught — new perspective for you`);
    }
  } else {
    reasons.push("You've worked with this mentor before");
  }

  // ── Signal 5: Budget (0–5) ───────────────────────────────────────────────
  const budgetScore =
    context.budgetCeiling !== undefined
      ? mentor.fee <= context.budgetCeiling
        ? SCORE_WEIGHTS.BUDGET
        : 0
      : SCORE_WEIGHTS.BUDGET; // no ceiling set → don't penalise

  if (context.budgetCeiling !== undefined && mentor.fee <= context.budgetCeiling) {
    reasons.push(`Within budget (₹${mentor.fee})`);
  } else if (context.budgetCeiling !== undefined && mentor.fee > context.budgetCeiling) {
    reasons.push(`Above your budget ceiling (₹${mentor.fee})`);
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const breakdown: ScoreBreakdown = {
    topicMatchScore,
    ratingScore,
    availabilityScore,
    noveltyScore,
    budgetScore,
  };

  const totalScore =
    topicMatchScore + ratingScore + availabilityScore + noveltyScore + budgetScore;

  return {
    mentor,
    totalScore,
    breakdown,
    matchReasons: reasons,
  };
}

// ── Batch ranking helper ──────────────────────────────────────────────────────

/**
 * Score and rank ALL approved mentors descending by totalScore.
 *
 * @param mentors   - List of approved MentorProfiles
 * @param slotsMap  - Pre-fetched slots per mentorId (avoids N+1 Firestore reads)
 * @param context   - Student's recommendation context
 * @returns         Array of ScoredMentor sorted highest-score first
 *
 * Callers should pre-fetch all slots via getMentorSlots() before calling this
 * to avoid triggering individual Firestore reads inside a loop.
 */
export function rankMentors(
  mentors: MentorProfile[],
  slotsMap: Record<string, MentorSlot[]>,
  context: RecommendationContext,
): ScoredMentor[] {
  return mentors
    .map(m => scoreMentor(m, slotsMap[m.userId] ?? [], context))
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ── Context builder helper ────────────────────────────────────────────────────

/**
 * Build a RecommendationContext from raw Firestore data already fetched
 * by getProductivityContext(). No extra reads — reuses existing data.
 *
 * @param recentTestAttempts  - From productivity context
 * @param recentDoubts        - From productivity context
 * @param userBookings        - Mentor IDs the student has booked before
 * @param budgetCeiling       - Optional INR budget limit from user preferences
 */
export function buildRecommendationContext(
  recentTestAttempts: Array<{ topic: string; score: number; total: number }>,
  recentDoubts: Array<{ subject?: string; isResolved: boolean }>,
  userBookings: Array<{ mentorId: string }>,
  budgetCeiling?: number,
): RecommendationContext {
  // Weak topic = scored less than 60%
  const weakTopics = recentTestAttempts
    .filter(a => a.total > 0 && a.score / a.total < 0.6)
    .map(a => a.topic.toLowerCase().trim())
    .filter(Boolean);

  // Unresolved doubt subjects
  const unresolvedSubjects = recentDoubts
    .filter(d => !d.isResolved && d.subject)
    .map(d => d.subject!.toLowerCase().trim())
    .filter(Boolean);

  return {
    weakTopics: Array.from(new Set(weakTopics)),
    unresolvedSubjects: Array.from(new Set(unresolvedSubjects)),
    bookedMentorIds: Array.from(new Set(userBookings.map(b => b.mentorId))),
    budgetCeiling,
  };
}
