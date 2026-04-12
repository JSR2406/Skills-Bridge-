import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { Task, AIProductivityLog, TaskStatus } from './types';

const TASKS_COLLECTION = 'tasks';
const AI_LOGS_COLLECTION = 'aiProductivityLogs';

// Tasks CRUD
export async function fetchTasks(userId: string): Promise<Task[]> {
  // Simple query — just filter by userId (no orderBy to avoid composite index requirement)
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId)
  );
  
  const snap = await getDocs(q);
  const tasks = snap.docs.map(d => {
    const data = d.data();
    const convertDate = (val: any) => {
      if (!val) return new Date();
      if (val instanceof Date) return val;
      if (val.toDate) return val.toDate();
      return new Date(val);
    };

    return {
      ...data,
      id: d.id,
      dueDateTime: convertDate(data.dueDateTime),
      createdAt: convertDate(data.createdAt),
      updatedAt: convertDate(data.updatedAt),
    };
  }) as Task[];

  // Sort client-side: pending first, then by dueDateTime ascending
  return tasks.sort((a, b) => {
    // Done tasks go to the bottom
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return (a.dueDateTime as Date).getTime() - (b.dueDateTime as Date).getTime();
  });
}

export async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  // Ensure dueDateTime is a proper Date (not a raw string from datetime-local input)
  const dueDateTime = data.dueDateTime instanceof Date
    ? data.dueDateTime
    : new Date(data.dueDateTime as any);

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    ...data,
    dueDateTime,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<void> {
  const ref = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}

export async function toggleTaskStatus(taskId: string, currentStatus: TaskStatus): Promise<void> {
  const newStatus: TaskStatus = currentStatus === 'done' ? 'pending' : 'done';
  await updateTask(taskId, { status: newStatus });
}

// AI Logs
export async function getLastAILog(userId: string): Promise<AIProductivityLog | null> {
  const q = query(
    collection(db, AI_LOGS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  const d = snap.docs[0];
  return {
    ...d.data(),
    id: d.id,
    createdAt: d.data().createdAt?.toDate() || new Date(),
  } as AIProductivityLog;
}

export async function saveAILog(data: Omit<AIProductivityLog, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, AI_LOGS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Productivity Context Fetching
export async function getProductivityContext(userId: string) {
  // Fetch user profile
  const userProfileSnap = await getDoc(doc(db, 'users', userId));
  const userProfile = userProfileSnap.exists() ? userProfileSnap.data() : null;

  // Fetch recent doubts
  const doubtsQ = query(
    collection(db, 'doubts'),
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const doubtsSnap = await getDocs(doubtsQ);
  const recentDoubts = doubtsSnap.docs.map(d => ({
    id: d.id,
    title: d.data().title,
    subject: d.data().subject,
    topic: d.data().topic,
    isResolved: d.data().isResolved
  }));

  const attemptsQ = query(
    collection(db, 'testAttempts'),
    where('userId', '==', userId),
    orderBy('submittedAt', 'desc'),
    limit(10)
  );
  const attemptsSnap = await getDocs(attemptsQ);
  const recentAttempts = attemptsSnap.docs.map(d => ({
    id: d.id,
    subject: d.data().subject,
    topic: d.data().topic,
    score: d.data().score,
    total: d.data().totalQuestions,
    submittedAt: (d.data().submittedAt as Timestamp)?.toDate() || new Date()
  }));

  // Fetch upcoming mentor sessions
  const now = new Date();
  const sessionsQ = query(
    collection(db, 'bookings'),
    where('studentId', '==', userId),
    where('startTime', '>=', now),
    orderBy('startTime', 'asc'),
    limit(5)
  );
  const sessionsSnap = await getDocs(sessionsQ);
  const upcomingMentorSessions = sessionsSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      mentorName: data.mentorName,
      startTime: data.startTime?.toDate?.() || (data.startTime instanceof Date ? data.startTime : new Date(data.startTime || Date.now())),
      topic: data.topic
    };
  });

  // Fetch existing tasks (filter status client-side to avoid inequality index)
  const tasksQ = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    limit(20)
  );
  const tasksSnap = await getDocs(tasksQ);
  const existingTasks = tasksSnap.docs
    .filter(d => d.data().status !== 'done')
    .map(d => ({
      id: d.id,
      title: d.data().title,
      type: d.data().type,
      status: d.data().status
    }));

  return {
    userProfile,
    recentDoubts,
    recentTestAttempts: recentAttempts,
    upcomingMentorSessions,
    existingTasks
  };
}
