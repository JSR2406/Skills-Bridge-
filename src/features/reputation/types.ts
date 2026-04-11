import { Timestamp } from 'firebase/firestore';

export type ReputationEventType = 
  | 'answer_posted' 
  | 'answer_accepted' 
  | 'daily_login' 
  | 'test_completed' 
  | 'doubt_upvoted';

export interface ReputationEvent {
  id?: string;
  userId: string;
  type: ReputationEventType;
  points: number;
  refId: string;
  refType: string;
  createdAt: Timestamp | Date;
}

export const POINTS_MAP: Record<ReputationEventType, number> = {
  answer_posted: 5,
  answer_accepted: 20,
  daily_login: 2,
  test_completed: 10,
  doubt_upvoted: 2,
};

export type BadgeId = 
  | 'novice' 
  | 'helper' 
  | 'scholar' 
  | 'expert' 
  | 'master' 
  | 'streak_7' 
  | 'top_answerer';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // lucide icon name
  color: string;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  reputation: number;
  streakDays: number;
  answersCount: number;
  acceptedAnswersCount: number;
  testsCompletedCount: number;
}
