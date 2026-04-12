import { Timestamp } from 'firebase/firestore';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category?: string;
}

export interface PracticeTest {
  id: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdByAI: boolean;
  questions: Question[];
  createdAt: Timestamp | Date;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  subject: string;
  topic: string;
  answers: Record<number, number>; // question index -> option index
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  submittedAt: Timestamp | Date;
}
