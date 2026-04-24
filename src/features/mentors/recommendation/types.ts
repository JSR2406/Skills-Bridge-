import { MentorProfile } from '@/features/mentors/types';

/**
 * Context derived from the current student's Firestore activity.
 * Feeds the deterministic scoring engine — no ML, fully auditable.
 *
 * Built by `buildRecommendationContext()` which aggregates:
 *   - testAttempts where score/total < 0.6 → weakTopics
 *   - doubts where isResolved=false → unresolvedSubjects
 *   - bookings → bookedMentorIds
 */
export interface RecommendationContext {
  /** Topics the student scored < 60% on in test attempts */
  weakTopics: string[];
  /** Subjects from unresolved doubts (deduped) */
  unresolvedSubjects: string[];
  /** Mentor userIds the student has already booked at least once */
  bookedMentorIds: string[];
  /** Optional INR ceiling — mentors above this lose budget points */
  budgetCeiling?: number;
}

/** Per-signal score breakdown for a single mentor — used by UI + shadow logs */
export interface ScoreBreakdown {
  /** 0–40: expertise ∩ weak topics (primary signal) */
  topicMatchScore: number;
  /** 0–25: averageRating / 5 * 25 (neutral 10 for unrated) */
  ratingScore: number;
  /** 0–20: has a free slot within next 48 hours */
  availabilityScore: number;
  /** 0–10: student hasn't booked this mentor before */
  noveltyScore: number;
  /** 0–5: mentor fee ≤ budgetCeiling */
  budgetScore: number;
}

/** Full scored mentor — output of rankMentors() */
export interface ScoredMentor {
  mentor: MentorProfile;
  /** Sum of all breakdown scores (max 100) */
  totalScore: number;
  breakdown: ScoreBreakdown;
  /** Human-readable reasons shown in UI and stored in shadow log */
  matchReasons: string[];
}

/**
 * Shadow log document written to `mentorRecommendationShadowLogs`.
 *
 * Shadow mode lets us validate recommendation accuracy before
 * enabling the ranked UI. Flip NEXT_PUBLIC_RECOMMENDATION_SHADOW_MODE
 * to "false" to surface ranked results in the mentor list UI.
 */
export interface ShadowLog {
  id?: string;
  studentId: string;
  context: RecommendationContext;
  /** Mentor userIds in descending score order */
  rankedMentorIds: string[];
  /** Full breakdown per mentorId for audit */
  scoreBreakdowns: Record<string, ScoreBreakdown>;
  /** Human-readable match reasons per mentorId */
  matchReasons: Record<string, string[]>;
  /** false = shadow mode (observe only), true = ranking shown in UI */
  enabledInUI: boolean;
  /** Increment when scoring algorithm changes — enables before/after comparison */
  engineVersion: string;
  shadowTimestamp: Date | any;
}
