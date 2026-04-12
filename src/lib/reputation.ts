import { db } from './firebase/config';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';

export type ActivityType = 
  | 'ASK_DOUBT' 
  | 'GIVE_ANSWER' 
  | 'HELPFUL_ANSWER' 
  | 'COMPLETE_TEST' 
  | 'COMPLETE_STUDY_TASK'
  | 'DAILY_LOGIN';

const REPUTATION_REWARDS: Record<ActivityType, number> = {
  ASK_DOUBT: 5,
  GIVE_ANSWER: 10,
  HELPFUL_ANSWER: 5,
  COMPLETE_TEST: 20, // Base reward, can be scaled by score
  COMPLETE_STUDY_TASK: 15,
  DAILY_LOGIN: 2,
};

import { BADGES, getBadgesForStats } from './badges';

/**
 * Updates a user's reputation points and stats in Firestore.
 * Handles both adding points and checking for badge unlocks.
 */
export async function awardReputation(userId: string, activity: ActivityType, customAmount?: number) {
  const amount = customAmount ?? REPUTATION_REWARDS[activity];
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return 0;

    const data = userDoc.data();
    const currentBadges = data.badges || [];
    const currentReputation = (data.reputation || 0) + amount;
    
    // Preparation for stats update
    const updates: any = {
      reputation: increment(amount),
      updatedAt: new Date(),
    };

    if (activity === 'COMPLETE_STUDY_TASK') {
      updates.tasksCompletedCount = increment(1);
    } else if (activity === 'COMPLETE_TEST') {
      updates.testAttemptsCount = increment(1);
    }

    // Perform update
    await updateDoc(userRef, updates);

    // Badge Check (Refresh local copy of stats for check)
    const stats = {
      reputation: currentReputation,
      doubtsSolved: data.acceptedAnswersCount || 0,
      tasksCompleted: (data.tasksCompletedCount || 0) + (activity === 'COMPLETE_STUDY_TASK' ? 1 : 0),
      highScoreTests: (data.testAttemptsCount || 0) + (activity === 'COMPLETE_TEST' ? 1 : 0), // Simplifying for demo
    };

    const eligibleBadges = getBadgesForStats(stats);
    const newBadges = eligibleBadges.filter(b => !currentBadges.includes(b.id));

    if (newBadges.length > 0) {
      await updateDoc(userRef, {
        badges: [...currentBadges, ...newBadges.map(b => b.id)]
      });
      return { amount, newBadges };
    }
    
    return { amount, newBadges: [] };
  } catch (error) {
    console.error('Failed to award reputation:', error);
    throw error;
  }
}

/**
 * Calculate level based on reputation points.
 * Level 1: 0-100
 * Level 2: 101-300
 * Level 3: 301-600
 * etc.
 */
export function calculateLevel(reputation: number = 0) {
  if (reputation <= 100) return 1;
  if (reputation <= 300) return 2;
  if (reputation <= 600) return 3;
  if (reputation <= 1000) return 4;
  return Math.floor(reputation / 300) + 1;
}

export const XP_FOR_NEXT_LEVEL = [100, 300, 600, 1000, 1500, 2100];
