/**
 * SkillBridge — Mentor Recommendation Seed Data
 *
 * Run with: npx ts-node --project tsconfig.json src/scripts/seed/seedMentorData.ts
 * Target: Firebase Emulator (or production with FIREBASE_EMULATOR=true guard).
 *
 * Seeds:
 *   - 3 mentors          (mentors/ collection)
 *   - 2 students         (users/ collection)
 *   - 5 doubts           (doubts/ collection)
 *   - 3 tests + attempts (practiceTests/ + testAttempts/ collections)
 *   - 4 mentor slots     (mentorSlots/ collection)
 *   - 3 bookings         (bookings/ collection — for follow-up case testing)
 *
 * Follow-up test cases:
 *   FC-01 student_001 + 2 DSA fail tests + 2 unresolved DSA doubts → mentor_001 ranked #1
 *   FC-02 student_002 + TypeScript doubt + already booked mentor_002 → novelty penalises mentor_002
 *   FC-03 student_001 budget=300 → mentor_001 (₹350) loses budget pts, still #1 overall
 *   FC-04 student_002 no weak topics, no doubts → sorted by rating only
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Guard: must target emulator unless ALLOW_PRODUCTION_SEED=true
if (process.env.ALLOW_PRODUCTION_SEED !== 'true') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

initializeApp();
const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

const ts = (daysFromNow: number) =>
  Timestamp.fromDate(new Date(Date.now() + daysFromNow * 86_400_000));

const tsHoursFromNow = (h: number) =>
  Timestamp.fromDate(new Date(Date.now() + h * 3_600_000));

// ── Seed data ──────────────────────────────────────────────────────────────────

const MENTORS = [
  {
    id: 'mentor_001',
    userId: 'mentor_001',
    name: 'Aarav Sharma',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aarav',
    college: 'IIT Bombay',
    headline: 'DSA & Competitive Programming Expert · 3× ICPC Regionals',
    bio: 'I help students crack DSA interviews and understand algorithms from first principles.',
    subjects: ['dsa', 'algorithms', 'competitive programming'],
    expertise: ['recursion', 'dynamic programming', 'graphs', 'trees', 'sorting'],
    fee: 350,
    averageRating: 4.8,
    totalRatings: 23,
    sessionCount: 47,
    mentorApproved: true,
    createdAt: ts(-30),
    updatedAt: ts(-1),
  },
  {
    id: 'mentor_002',
    userId: 'mentor_002',
    name: 'Priya Nair',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    college: 'NIT Trichy',
    headline: 'Full-Stack Web Dev Coach · React + Next.js',
    bio: 'Ex-Flipkart SDE. I make frontend concepts click — from CSS to state management.',
    subjects: ['web', 'frontend', 'javascript'],
    expertise: ['react', 'nextjs', 'typescript', 'css', 'tailwind', 'rest apis'],
    fee: 400,
    averageRating: 4.5,
    totalRatings: 14,
    sessionCount: 22,
    mentorApproved: true,
    createdAt: ts(-60),
    updatedAt: ts(-2),
  },
  {
    id: 'mentor_003',
    userId: 'mentor_003',
    name: 'Rohan Mehta',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan',
    college: 'BITS Pilani',
    headline: 'ML & Data Science · Research at Google DeepMind',
    bio: 'Helping students build intuition for ML — from regression to transformers.',
    subjects: ['machine learning', 'data science', 'python'],
    expertise: ['sklearn', 'pytorch', 'pandas', 'numpy', 'nlp', 'neural networks'],
    fee: 500,
    averageRating: 4.9,
    totalRatings: 31,
    sessionCount: 58,
    mentorApproved: true,
    createdAt: ts(-90),
    updatedAt: ts(-1),
  },
];

const STUDENTS = [
  {
    id: 'student_001',
    name: 'Ananya Joshi',
    email: 'ananya@demo.skillsbridge.app',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya',
    role: 'student',
    reputation: 120,
    createdAt: ts(-14),
    updatedAt: ts(-1),
    // For testing: budgetCeiling = 450 INR
  },
  {
    id: 'student_002',
    name: 'Dev Kapoor',
    email: 'dev@demo.skillsbridge.app',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
    role: 'student',
    reputation: 75,
    createdAt: ts(-7),
    updatedAt: ts(-1),
    // For testing: budgetCeiling = 600 INR, has already booked mentor_002
  },
];

const DOUBTS = [
  // student_001: 2 unresolved DSA doubts → weakens DSA context
  {
    id: 'doubt_001',
    authorId: 'student_001',
    authorName: 'Ananya Joshi',
    title: 'Why does my recursion call stack overflow for n=100?',
    content: 'I wrote a Fibonacci function recursively but it crashes at n=100. Adding memoization helps but I do not understand WHY it overflows without it.',
    tags: ['recursion', 'optimization', 'call-stack'],
    subject: 'dsa',
    isResolved: false,
    upvotes: 5, downvotes: 0, voteScore: 5, responsesCount: 2,
    createdAt: ts(-5), updatedAt: ts(-4),
  },
  {
    id: 'doubt_002',
    authorId: 'student_001',
    authorName: 'Ananya Joshi',
    title: 'DP table not giving correct output for coin change problem',
    content: 'My bottom-up approach gives wrong answer for coins=[1,5,6], amount=11. Expected 2 coins but getting 3.',
    tags: ['dynamic-programming', 'dp', 'bottom-up'],
    subject: 'dsa',
    isResolved: false,
    upvotes: 3, downvotes: 0, voteScore: 3, responsesCount: 0,
    createdAt: ts(-3), updatedAt: ts(-3),
  },
  // student_002: TypeScript doubt (unresolved) + React doubt (resolved)
  {
    id: 'doubt_003',
    authorId: 'student_002',
    authorName: 'Dev Kapoor',
    title: 'useEffect firing twice in React 18 strict mode',
    content: 'My API call runs two times on mount in development. Is this expected?',
    tags: ['react', 'hooks', 'strict-mode'],
    subject: 'web',
    isResolved: true, // resolved — should NOT boost unresolvedSubjects
    upvotes: 12, downvotes: 1, voteScore: 11, responsesCount: 4,
    createdAt: ts(-10), updatedAt: ts(-8),
  },
  {
    id: 'doubt_004',
    authorId: 'student_002',
    authorName: 'Dev Kapoor',
    title: 'TypeScript generic constraints with extends keyword',
    content: 'When do I use `T extends object` vs `T extends Record<string, unknown>`? What is the semantic difference?',
    tags: ['typescript', 'generics', 'types'],
    subject: 'web',
    isResolved: false,
    upvotes: 7, downvotes: 0, voteScore: 7, responsesCount: 1,
    createdAt: ts(-2), updatedAt: ts(-2),
  },
  {
    id: 'doubt_005',
    authorId: 'student_001',
    authorName: 'Ananya Joshi',
    title: 'BFS vs DFS: when should I pick one over the other?',
    content: 'I can implement both. But in interviews I always pick the wrong one. What is the decision rule?',
    tags: ['graphs', 'bfs', 'dfs', 'algorithms'],
    subject: 'dsa',
    isResolved: true,
    upvotes: 9, downvotes: 0, voteScore: 9, responsesCount: 3,
    createdAt: ts(-7), updatedAt: ts(-6),
  },
];

const TESTS_AND_ATTEMPTS = [
  // student_001: failed recursion (44%) → weak topic
  {
    test: {
      id: 'test_001',
      subject: 'dsa', topic: 'recursion',
      difficulty: 'medium', durationMinutes: 20, createdByAI: true,
      questions: [], createdAt: ts(-6),
    },
    attempt: {
      id: 'attempt_001',
      testId: 'test_001', userId: 'student_001',
      subject: 'dsa', topic: 'recursion',
      answers: {}, score: 4, totalQuestions: 9, // 44% — weak
      timeTakenSeconds: 900, submittedAt: ts(-6),
    },
  },
  // student_001: failed dynamic programming (33%) → weak topic
  {
    test: {
      id: 'test_002',
      subject: 'dsa', topic: 'dynamic programming',
      difficulty: 'hard', durationMinutes: 30, createdByAI: true,
      questions: [], createdAt: ts(-4),
    },
    attempt: {
      id: 'attempt_002',
      testId: 'test_002', userId: 'student_001',
      subject: 'dsa', topic: 'dynamic programming',
      answers: {}, score: 2, totalQuestions: 6, // 33% — weak
      timeTakenSeconds: 1600, submittedAt: ts(-4),
    },
  },
  // student_002: passed react hooks (80%) → NOT a weak topic
  {
    test: {
      id: 'test_003',
      subject: 'web', topic: 'react hooks',
      difficulty: 'easy', durationMinutes: 15, createdByAI: true,
      questions: [], createdAt: ts(-3),
    },
    attempt: {
      id: 'attempt_003',
      testId: 'test_003', userId: 'student_002',
      subject: 'web', topic: 'react hooks',
      answers: {}, score: 8, totalQuestions: 10, // 80% — not weak
      timeTakenSeconds: 720, submittedAt: ts(-3),
    },
  },
];

// Mentor slots — all in the next 48h so availability score is active
const MENTOR_SLOTS = [
  {
    id: 'slot_001',
    mentorId: 'mentor_001',
    startTime: tsHoursFromNow(4),
    endTime: tsHoursFromNow(5),
    isBooked: false,
    meetingType: 'jitsi',
    meetingLink: '/call/slot_001',
    fee: 350,
    createdAt: ts(-1),
  },
  {
    id: 'slot_002',
    mentorId: 'mentor_001',
    startTime: tsHoursFromNow(24),
    endTime: tsHoursFromNow(25),
    isBooked: false,
    meetingType: 'jitsi',
    meetingLink: '/call/slot_002',
    fee: 350,
    createdAt: ts(-1),
  },
  {
    id: 'slot_003',
    mentorId: 'mentor_002',
    startTime: tsHoursFromNow(8),
    endTime: tsHoursFromNow(9),
    isBooked: true, // Already booked — tests availability score = 0
    meetingType: 'jitsi',
    meetingLink: '/call/slot_003',
    fee: 400,
    createdAt: ts(-2),
  },
  {
    id: 'slot_004',
    mentorId: 'mentor_003',
    startTime: tsHoursFromNow(36),
    endTime: tsHoursFromNow(37),
    isBooked: false,
    meetingType: 'jitsi',
    meetingLink: '/call/slot_004',
    fee: 500,
    createdAt: ts(-1),
  },
];

// Bookings — student_002 previously booked mentor_002 → novelty penalty test
const BOOKINGS = [
  {
    id: 'booking_001',
    slotId: 'slot_003',
    mentorId: 'mentor_002',
    mentorName: 'Priya Nair',
    mentorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    studentId: 'student_002',
    studentName: 'Dev Kapoor',
    amount: 400,
    paymentStatus: 'paid',
    bookingStatus: 'completed',
    meetingLink: '/call/slot_003',
    startTime: ts(-5),
    endTime: ts(-5),
    createdAt: ts(-6),
    reminderSent30min: true,
    reminderSent5min: true,
  },
];

// ── Seed runner ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting SkillBridge seed...\n');

  const batch = db.batch();

  // Mentors
  for (const mentor of MENTORS) {
    const { id, ...data } = mentor;
    batch.set(db.collection('mentors').doc(id), data);
  }
  console.log(`  ✓ Queued ${MENTORS.length} mentors`);

  // Students
  for (const student of STUDENTS) {
    const { id, ...data } = student;
    batch.set(db.collection('users').doc(id), data);
  }
  console.log(`  ✓ Queued ${STUDENTS.length} students`);

  // Doubts
  for (const doubt of DOUBTS) {
    const { id, ...data } = doubt;
    batch.set(db.collection('doubts').doc(id), data);
  }
  console.log(`  ✓ Queued ${DOUBTS.length} doubts`);

  // Tests + attempts
  for (const { test, attempt } of TESTS_AND_ATTEMPTS) {
    const { id: testId, ...testData } = test;
    const { id: attemptId, ...attemptData } = attempt;
    batch.set(db.collection('practiceTests').doc(testId), testData);
    batch.set(db.collection('testAttempts').doc(attemptId), attemptData);
  }
  console.log(`  ✓ Queued ${TESTS_AND_ATTEMPTS.length} tests + attempts`);

  // Slots
  for (const slot of MENTOR_SLOTS) {
    const { id, ...data } = slot;
    batch.set(db.collection('mentorSlots').doc(id), data);
  }
  console.log(`  ✓ Queued ${MENTOR_SLOTS.length} mentor slots`);

  // Bookings
  for (const booking of BOOKINGS) {
    const { id, ...data } = booking;
    batch.set(db.collection('bookings').doc(id), data);
  }
  console.log(`  ✓ Queued ${BOOKINGS.length} bookings`);

  await batch.commit();
  console.log('\n✅ Seed complete. All documents written in a single batch.\n');

  // ── Validate follow-up cases ────────────────────────────────────────────────
  console.log('📋 Expected recommendation outcomes:');
  console.log('  FC-01  student_001 (DSA fails + doubts)    → mentor_001 ranked #1 (~89/100)');
  console.log('  FC-02  student_002 (already booked m_002)  → mentor_002 loses 10 novelty pts');
  console.log('  FC-03  student_001 budget=300              → mentor_001 (₹350) loses 5 budget pts');
  console.log('  FC-04  student_002 no weak topics          → sorted by rating → mentor_003 first\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
