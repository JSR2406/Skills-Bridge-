// Use this script to seed the platform with sample mentors and messages
// Run with: npx tsx src/scripts/seed.ts

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Seed Mentors
  const mentors = [
    {
      id: 'mentor_aara',
      data: {
        name: 'Aara Singh',
        bio: 'Senior Software Engineer @ Google. Expert in Distributed Systems and React Performance.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        subjects: ['Computer Science', 'Web Development'],
        expertise: ['System Design', 'Frontend'],
        mentorApproved: true,
        averageRating: 5.0,
        totalRatings: 12,
        sessionCount: 45,
        fee: 499,
        createdAt: serverTimestamp(),
      }
    },
    {
      id: 'mentor_ryan',
      data: {
        name: 'Ryan Gosling',
        bio: 'Machine Learning Lead. I just drive... deep learning models to production.',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        subjects: ['Mathematics', 'AI/ML'],
        expertise: ['PyTorch', 'Linear Algebra'],
        mentorApproved: true,
        averageRating: 4.8,
        totalRatings: 8,
        sessionCount: 20,
        fee: 799,
        createdAt: serverTimestamp(),
      }
    }
  ];

  for (const m of mentors) {
    await setDoc(doc(db, 'mentors', m.id), m.data);
    // Also add to users
    await setDoc(doc(db, 'users', m.id), {
      displayName: m.data.name,
      photoURL: m.data.avatarUrl,
      role: 'mentor',
      email: `${m.id}@example.com`,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  // 2. Seed Messaging
  const studentUid = 'demo_student';
  const mentorUid = 'mentor_aara';
  const convId = [studentUid, mentorUid].sort().join('_');
  
  await setDoc(doc(db, 'conversations', convId), {
    participants: [studentUid, mentorUid],
    participantNames: { [studentUid]: 'Demo Student', [mentorUid]: 'Aara Singh' },
    participantAvatars: { 
      [studentUid]: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', 
      [mentorUid]: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' 
    },
    lastMessage: 'I understand now, thanks Aara!',
    lastMessageAt: serverTimestamp(),
    lastSenderId: studentUid,
    unreadCount: { [studentUid]: 0, [mentorUid]: 1 },
    createdAt: serverTimestamp(),
  });

  const msgRef = collection(db, 'conversations', convId, 'messages');
  const messages = [
    { senderId: studentUid, content: "Hi Aara, I'm struggling with the Dijkstra visualization project.", senderName: "Demo Student" },
    { senderId: mentorUid, content: "Hey! That's a classic. Are you stuck on the priority queue implementation?", senderName: "Aara Singh" },
    { senderId: studentUid, content: "Exactly. The AI coach suggested I revisit the custom comparator.", senderName: "Demo Student" },
    { senderId: mentorUid, content: "No problem! I understand now, thanks Aara!", senderName: "Demo Student" }
  ];

  for (const msg of messages) {
    await addDoc(msgRef, {
      ...msg,
      senderAvatar: msg.senderId === studentUid ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      type: 'text',
      createdAt: serverTimestamp()
    });
  }

  console.log('✅ Seeding complete!');
}

seed().catch(console.error);
