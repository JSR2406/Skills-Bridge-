import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  setDoc,
  serverTimestamp,
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

  // Notify the user about their role upgrade
  import('../notifications/utils').then(({ sendNotification }) => {
    sendNotification({
      userId,
      title: 'Role Updated 🎉',
      body: `Your account role has been upated to ${targetRole}.`,
      type: 'success',
      url: `/profile/${userId}`,
    }).catch(console.error);
  });

  // If upgraded to mentor, ensure they have a basic mentor doc so they show up in searches
  if (targetRole === 'mentor') {
    const mentorRef = doc(db, 'mentors', userId);
    const mentorSnap = await getDoc(mentorRef);
    if (!mentorSnap.exists()) {
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if (userData) {
        await setDoc(mentorRef, {
          userId,
          name: userData.name || 'Mentor',
          avatarUrl: userData.avatarUrl || '',
          college: userData.college || '',
          headline: 'Community Expert',
          bio: 'Platform mentor ready to help students.',
          subjects: [],
          expertise: [],
          fee: 100,
          averageRating: 0,
          totalRatings: 0,
          sessionCount: 0,
          mentorApproved: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
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
