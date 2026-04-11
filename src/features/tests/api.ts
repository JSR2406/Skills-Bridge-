import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  setDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { PracticeTest, TestAttempt } from './types';
import { awardPoints } from '../reputation/api';

export async function saveGeneratedTest(testData: Omit<PracticeTest, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'tests'), {
    ...testData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTest(testId: string): Promise<PracticeTest | null> {
  const ref = doc(db, 'tests', testId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as PracticeTest;
}


export async function saveTestAttempt(attemptData: Omit<TestAttempt, 'id' | 'submittedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'testAttempts'), {
    ...attemptData,
    submittedAt: serverTimestamp(),
  });
  
  // Gamification: Award points and check badges
  await awardPoints(attemptData.userId, 'test_completed', ref.id, 'test');
  
  return ref.id;
}

export async function getTestAttempt(attemptId: string): Promise<TestAttempt | null> {
  const ref = doc(db, 'testAttempts', attemptId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    submittedAt: data.submittedAt?.toDate() || new Date(),
  } as TestAttempt;
}

export async function getUserAttempts(userId: string): Promise<TestAttempt[]> {
  const q = query(
    collection(db, 'testAttempts'),
    where('userId', '==', userId),
    orderBy('submittedAt', 'desc')
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      submittedAt: data.submittedAt?.toDate() || new Date(),
    } as TestAttempt;
  });
}

export async function getAvailableTests(): Promise<PracticeTest[]> {
  const q = query(
    collection(db, 'tests'),
    where('createdByAI', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as PracticeTest;
  });
}
