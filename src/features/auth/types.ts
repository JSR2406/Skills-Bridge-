import { User } from 'firebase/auth';

export type UserRole = 'student' | 'mentor' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  college: string;
  branch: string;
  semester: number;
  subjects: string[];
  bio: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  reputation: number;
  streakDays: number;
  answersCount: number;
  acceptedAnswersCount: number;
  tasksCompletedCount: number;
  testAttemptsCount: number;
  badges: string[];
  mentorApproved: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}
