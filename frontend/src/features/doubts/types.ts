// ── FEATURE: Doubts — Domain types
// `Doubt` (posts collection), `Answer` (answers subcollection), and the AI
// explanation payload shaped by the `api/ai/doubt` route.
import { Timestamp } from 'firebase/firestore';

export interface Doubt {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  tags: string[];
  subject?: string;
  upvotes: number;

  downvotes: number;
  voteScore: number;
  responsesCount: number;
  isResolved: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface DoubtVote {
  userId: string;
  doubtId: string;
  value: 1 | -1;
  createdAt: Timestamp | Date;
}

// Data needed when creating a doubt
export type CreateDoubtInput = Omit<
  Doubt,
  'id' | 'upvotes' | 'downvotes' | 'voteScore' | 'responsesCount' | 'isResolved' | 'createdAt' | 'updatedAt' | 'authorName' | 'authorAvatarUrl'
>;

export type AIConfidence = 'high' | 'medium' | 'low';

/**
 * Structured answer from `POST /api/ai/doubt`.
 *
 * `reasoning` … `confidence` are the enhanced-reasoning fields: the model is
 * asked to show its chain of reasoning, verify its own work and calibrate how
 * sure it is. All four are optional so older cached payloads still render.
 */
export interface AIExplanation {
  restatedQuestion: string;
  steps: string[];
  commonMistakes: string[];
  summaryNotes: string;
  titleSuggestion?: string;
  tagSuggestions?: string[];

  /** Why this approach was chosen, and which alternative was rejected. */
  reasoning?: string;
  /** Concrete end-to-end example (numbers or a short code snippet). */
  workedExample?: string;
  /** The 3–5 named concepts the answer hinges on. */
  keyConcepts?: string[];
  /** Self-check: what was verified and what caveat remains. */
  verification?: string;
  confidence?: AIConfidence;
  /** Which model actually answered (reported by the route). */
  model?: string;
}
