import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  increment,
  writeBatch,
  limit,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { ReputationEventType, POINTS_MAP, BadgeId, UserStats } from './types';

// Badges configured logically
export const BADGES: Record<BadgeId, Omit<import('./types').BadgeDef, 'condition'>> = {
  novice: { id: 'novice', name: 'Novice', description: 'Earned 10 reputation points', icon: 'Star', color: 'text-gray-400' },
  helper: { id: 'helper', name: 'Helper', description: 'Posted 5 answers', icon: 'MessageSquare', color: 'text-blue-400' },
  scholar: { id: 'scholar', name: 'Scholar', description: 'Completed 5 practice tests', icon: 'BookOpen', color: 'text-purple-400' },
  expert: { id: 'expert', name: 'Expert', description: '10 answers accepted by peers', icon: 'CheckCircle', color: 'text-green-500' },
  master: { id: 'master', name: 'Master', description: 'Reached 500 reputation', icon: 'Award', color: 'text-yellow-500' },
  streak_7: { id: 'streak_7', name: '7-Day Streak', description: 'Logged in for 7 consecutive days', icon: 'Flame', color: 'text-orange-500' },
  top_answerer: { id: 'top_answerer', name: 'Top Answerer', description: 'Top contributor in a subject', icon: 'TrendingUp', color: 'text-brand-500' },
};

export async function checkAndAwardBadges(userId: string) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const stats: UserStats = {
    reputation: data.reputation || 0,
    streakDays: data.streakDays || 0,
    answersCount: data.answersCount || 0,
    acceptedAnswersCount: data.acceptedAnswersCount || 0,
    testsCompletedCount: data.testsCompletedCount || 0, // Assuming we track this now
  };

  const currentBadges: BadgeId[] = data.badges || [];
  const newBadges: BadgeId[] = [];

  // Conditions
  if (!currentBadges.includes('novice') && stats.reputation >= 10) newBadges.push('novice');
  if (!currentBadges.includes('helper') && stats.answersCount >= 5) newBadges.push('helper');
  if (!currentBadges.includes('scholar') && stats.testsCompletedCount >= 5) newBadges.push('scholar');
  if (!currentBadges.includes('expert') && stats.acceptedAnswersCount >= 10) newBadges.push('expert');
  if (!currentBadges.includes('master') && stats.reputation >= 500) newBadges.push('master');
  if (!currentBadges.includes('streak_7') && stats.streakDays >= 7) newBadges.push('streak_7');

  if (newBadges.length > 0) {
    const batch = writeBatch(db);
    batch.update(userRef, {
      badges: [...currentBadges, ...newBadges]
    });
    
    // Also send a notification for each badge via central utility
    import('../notifications/utils').then(({ sendNotification }) => {
      newBadges.forEach(badgeId => {
        const badge = BADGES[badgeId];
        sendNotification({
          userId: userId,
          title: 'New Badge Unlocked! 🏆',
          body: `You've earned the "${badge.name}" badge. ${badge.description}`,
          type: 'success',
          url: `/profile/${userId}`,
        }).catch(console.error);
      });
    });

    await batch.commit();
  }
  
  return newBadges;
}

export async function awardPoints(userId: string, type: ReputationEventType, refId: string, refType: string) {
  // Prevent duplicate awards for certain events by checking if event already exists
  const points = POINTS_MAP[type];
  
  const q = query(
    collection(db, 'reputationEvents'),
    where('userId', '==', userId),
    where('type', '==', type),
    where('refId', '==', refId)
  );
  const existing = await getDocs(q);
  if (!existing.empty) return; // Already awarded

  const batch = writeBatch(db);
  
  // 1. Log event
  const eventRef = doc(collection(db, 'reputationEvents'));
  batch.set(eventRef, {
    userId,
    type,
    points,
    refId,
    refType,
    createdAt: serverTimestamp()
  });

  // 2. Update user profile
  const userRef = doc(db, 'users', userId);
  const updates: any = {
    reputation: increment(points)
  };

  if (type === 'answer_posted') updates.answersCount = increment(1);
  if (type === 'answer_accepted') updates.acceptedAnswersCount = increment(1);
  if (type === 'test_completed') updates.testsCompletedCount = increment(1);
  if (type === 'task_completed') updates.tasksCompletedCount = increment(1);

  batch.update(userRef, updates);
  
  await batch.commit();

  // 3. Check for badges asynchronously after updating stats
  checkAndAwardBadges(userId).catch(console.error);
}

export async function processDailyLogin(userId: string) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const lastActive = data.lastActiveDate?.toDate() || new Date(0);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - lastActive.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    await awardPoints(userId, 'daily_login', `login_${now.toISOString().split('T')[0]}`, 'login');
    // We also need to increment streakDays
    await writeBatch(db)
      .update(userRef, { 
        streakDays: increment(1),
        lastActiveDate: serverTimestamp()
      })
      .commit();

    // Notify streak increased
    import('../notifications/utils').then(({ sendNotification }) => {
      sendNotification({
        userId: userId,
        title: 'Streak Increased 🔥',
        body: `You're on a ${(data.streakDays || 0) + 1}-day learning streak!`,
        type: 'success',
        url: `/profile/${userId}`,
      }).catch(console.error);
    });
  } else if (diffDays > 1) {
    // Streak broken
    await writeBatch(db)
      .update(userRef, { 
        streakDays: 1,
        lastActiveDate: serverTimestamp()
      })
      .commit();

    // If they previously had a decent streak, notify them it was reset
    if (data.streakDays > 2) {
      import('../notifications/utils').then(({ sendNotification }) => {
        sendNotification({
          userId,
          title: 'Streak Lost 😢',
          body: `Your streak was reset. Time to start a new learning streak!`,
          type: 'info',
          url: `/profile/${userId}`,
        }).catch(console.error);
      });
    }
  } else {
    // Same day, just update last action
    await writeBatch(db)
      .update(userRef, { lastActiveDate: serverTimestamp() })
      .commit();
  }
}

export function subscribeToLeaderboard(callback: (users: any[]) => void, maxResults = 10) {
  const q = query(
    collection(db, 'users'),
    orderBy('reputation', 'desc'),
    limit(maxResults)
  );
  
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      uid: d.id,
      ...d.data()
    })));
  });
}
