import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedData() {
  console.log('Seeding Demo Backend Data...');
  
  // 1. Create Demo User
  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'demo@skillsbridge.com', 'password123');
    user = cred.user;
    console.log('Created auth user: demo@skillsbridge.com');
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('Demo user already exists. Signing in to retrieve UID...');
      const cred = await signInWithEmailAndPassword(auth, 'demo@skillsbridge.com', 'password123');
      user = cred.user;
    } else {
      console.error('Failed to create auth user:', err);
      process.exit(1);
    }
  }

  // 2. Insert Profile Data into Firestore
  const userProfile = {
    uid: user.uid,
    name: 'Demo Student',
    email: 'demo@skillsbridge.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
    role: 'student',
    college: 'SkillBridge University',
    branch: 'Computer Science',
    semester: 6,
    subjects: ['React', 'Next.js', 'Firebase'],
    bio: 'Hi! I am a demo student exploring the SkillBridge platform. I love learning and assisting my peers.',
    socialLinks: {
      github: 'https://github.com/skillsbridge',
    },
    reputation: 150,
    streakDays: 5,
    answersCount: 12,
    acceptedAnswersCount: 4,
    badges: ['Pioneer', 'Helpful'],
    mentorApproved: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('Successfully created user profile document in Firestore.');
  } catch (err) {
    console.error('Error creating user profile document:', err);
  }

  // 3. Create a Demo Doubt from another "user" to appear in the Feed
  const doubtId = 'demo-doubt-x1';
  const doubtRef = doc(collection(db, 'doubts'), doubtId);
  const doubtDoc = {
    authorId: 'system-bot-123',
    authorName: 'Curious Learner',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Curious',
    title: 'How does Next.js App Router differ from Pages Router?',
    content: 'I have been using the old pages directory for a while but I am confused about when to use Server Components versus Client Components in the new App Router. Can someone provide a concise guide?',
    tags: ['nextjs', 'react', 'frontend'],
    upvotes: 8,
    downvotes: 0,
    voteScore: 8,
    responsesCount: 0,
    isResolved: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    await setDoc(doubtRef, doubtDoc);
    console.log('Successfully created demo doubt in Firestore.');
  } catch (err) {
    console.error('Error creating demo doubt:', err);
  }

  console.log('✅ Demo Backend Database Seeded Successfully!');
  process.exit(0);
}

seedData();
