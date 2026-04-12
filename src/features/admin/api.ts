import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';

export async function getAllUsers() {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function updateUserRole(userId: string, targetRole: 'student' | 'mentor' | 'admin') {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: targetRole });
}

export async function getAllDoubts() {
  const q = query(collection(db, 'doubts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    };
  });
}

export async function deleteDoubt(doubtId: string) {
  await deleteDoc(doc(db, 'doubts', doubtId));
  // Note: we could also clean up the 'answers' subcollection but for MVP deleting the doubt stops it from showing.
}

export async function getPlatformStats() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const doubtsSnap = await getDocs(collection(db, 'doubts'));
  const testsSnap = await getDocs(collection(db, 'tests'));
  const attemptsSnap = await getDocs(collection(db, 'testAttempts'));

  return {
    totalUsers: usersSnap.size,
    totalDoubts: doubtsSnap.size,
    totalTests: testsSnap.size,
    totalAttempts: attemptsSnap.size,
    mentorsCount: usersSnap.docs.filter(d => d.data().role === 'mentor').length,
    studentsCount: usersSnap.docs.filter(d => d.data().role === 'student').length,
    activeToday: Math.floor(usersSnap.size * 0.4) // Simulated active users for demo
  };
}
