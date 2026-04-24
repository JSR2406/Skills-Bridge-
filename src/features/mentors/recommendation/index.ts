/**
 * Export the public surface of the recommendation module.
 * Import from '@/features/mentors/recommendation' — never from internal paths.
 */
export { scoreMentor, rankMentors, buildRecommendationContext, SCORE_WEIGHTS } from './scorer';
export { writeShadowLog, isInShadowMode, ENGINE_VERSION } from './shadowLogger';
export type { RecommendationContext, ScoredMentor, ScoreBreakdown, ShadowLog } from './types';
