import { Timestamp } from 'firebase/firestore';

export type TaskType = 'study' | 'revision' | 'follow-up' | 'exam-prep' | 'custom';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: TaskType;
  subject?: string;
  topic?: string;
  relatedDoubtId?: string | null;
  relatedTestId?: string | null;
  relatedSessionId?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDateTime: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface StudyBlock {
  title: string;
  description: string;
  durationMinutes: number;
  subject?: string;
  topic?: string;
  relatedDoubtId?: string;
  relatedTestId?: string;
  relatedSessionId?: string;
}

export interface AIStudyPlan {
  summary: string;
  focusAreas: string[];
  studyBlocks: StudyBlock[];
  followUps: string[];
}

export interface AIProductivityLog {
  id: string;
  userId: string;
  timeframe: 'today' | 'week';
  inputSummary: string;
  suggestions: AIStudyPlan;
  createdAt: Timestamp | Date;
}
