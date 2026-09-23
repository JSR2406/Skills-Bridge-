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

export interface AIExplanation {
  restatedQuestion: string;
  steps: string[];
  commonMistakes: string[];
  summaryNotes: string;
  titleSuggestion?: string;
  tagSuggestions?: string[];
}
