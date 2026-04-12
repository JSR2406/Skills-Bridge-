'use client';

import { useState } from 'react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';

// ── Demo account definitions ──────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    email: 'demo.student@skillsbridge.app',
    password: 'Demo@1234',
    profile: {
      name: 'Demo Student',
      role: 'student' as const,
      college: 'NIT Pune',
      branch: 'Computer Science',
      semester: 5,
      subjects: ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS'],
      bio: 'A demo student account for testing SkillBridge features.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo.student',
      reputation: 120,
      badges: ['First Answer', 'Streak Master'],
      streakDays: 5,
      answersCount: 3,
      acceptedAnswersCount: 1,
      tasksCompletedCount: 8,
      testAttemptsCount: 4,
      mentorApproved: false,
    }
  },
  {
    email: 'demo.mentor@skillsbridge.app',
    password: 'Demo@1234',
    profile: {
      name: 'Demo Mentor',
      role: 'mentor' as const,
      college: 'IIT Bombay',
      branch: 'Computer Science',
      semester: 8,
      subjects: ['Data Structures', 'Web Development', 'Machine Learning'],
      bio: 'Senior CS student passionate about teaching. This is a demo mentor account — all sessions are free.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo.mentor',
      reputation: 450,
      badges: ['Top Mentor', 'Expert Solver'],
      streakDays: 12,
      answersCount: 28,
      acceptedAnswersCount: 19,
      tasksCompletedCount: 0,
      testAttemptsCount: 0,
      mentorApproved: true,
    },
    mentorDoc: {
      name: 'Demo Mentor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo.mentor',
      college: 'IIT Bombay',
      headline: 'Senior CS Student | Loves solving doubts',
      bio: 'Senior CS student passionate about teaching. This is a demo mentor account. Book a free session to see the video call feature in action.',
      subjects: ['Data Structures', 'Web Development', 'Machine Learning'],
      expertise: ['Data Structures', 'Web Dev', 'Machine Learning'],
      fee: 0,
      averageRating: 4.9,
      totalRatings: 5,
      sessionCount: 10,
      mentorApproved: true,
    }
  },
  {
    email: 'demo.admin@skillsbridge.app',
    password: 'Admin@1234',
    profile: {
      name: 'SkillBridge Admin',
      role: 'admin' as const,
      college: 'SkillBridge HQ',
      branch: 'Administration',
      semester: 1,
      subjects: [],
      bio: 'Platform administrator account.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo.admin',
      reputation: 999,
      badges: ['Admin', 'Founder'],
      streakDays: 0,
      answersCount: 0,
      acceptedAnswersCount: 0,
      tasksCompletedCount: 0,
      testAttemptsCount: 0,
      mentorApproved: false,
    }
  }
];

// ── Seed mock mentors ──────────────────────────────────────────────────────────

const MOCK_MENTORS = [
  {
    id: 'mentor_alex_123',
    name: 'Alex Rivera',
    avatarUrl: 'https://i.pravatar.cc/150?u=mentor_alex_123',
    college: 'MIT',
    headline: 'Senior Full Stack Engineer @ Google',
    bio: 'I specialize in large-scale Distributed Systems and modern React ecosystems. Happy to help with system design interviews and web-development queries.',
    subjects: ['System Design', 'React', 'Node.js'],
    expertise: ['Web Development', 'Architecture'],
    fee: 500,
    averageRating: 4.8,
    totalRatings: 120,
    sessionCount: 230,
    mentorApproved: true,
  },
  {
    id: 'mentor_sarah_456',
    name: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=mentor_sarah_456',
    college: 'Stanford',
    headline: 'Machine Learning Researcher @ OpenAI',
    bio: 'Passionate about deep learning and computer vision. Let me help you break into AI and master TensorFlow/PyTorch fundamentals.',
    subjects: ['Machine Learning', 'Python', 'Data Science'],
    expertise: ['AI', 'Data Structures'],
    fee: 800,
    averageRating: 4.9,
    totalRatings: 85,
    sessionCount: 154,
    mentorApproved: true,
  },
  {
    id: 'mentor_james_789',
    name: 'James Walker',
    avatarUrl: 'https://i.pravatar.cc/150?u=mentor_james_789',
    college: 'IIT Bombay',
    headline: 'Lead Cloud Architect @ AWS',
    bio: '10+ years of cloud infrastructure scaling. If your backend needs extreme performance tuning, set up a chat with me.',
    subjects: ['AWS', 'DevOps', 'Go'],
    expertise: ['Cloud Infrastructure', 'Backend'],
    fee: 650,
    averageRating: 4.7,
    totalRatings: 42,
    sessionCount: 88,
    mentorApproved: true,
  }
];

// ── Mock doubts for the feed ───────────────────────────────────────────────────

const MOCK_DOUBTS = [
  {
    title: 'Why is Quick Sort not stable and how does merge sort handle it?',
    content: `<p>I was studying sorting algorithms for my DSA exam and came across the concept of <strong>stability</strong> in sorting algorithms.</p>
<p>I understand that merge sort is stable because it preserves the relative order of equal elements by using a "left-biased" merge. But quick sort is not stable — can someone explain <em>exactly</em> where quick sort loses stability?</p>
<pre><code>// Example to illustrate instability
let arr = [(3,'a'), (1,'b'), (3,'c'), (2,'d')];
// Quick sort might give: (1,'b'), (2,'d'), (3,'c'), (3,'a') — order of 3s changed!</code></pre>
<p>Also, if I need a stable in-place sort, what's the best option in O(n log n)?</p>`,
    tags: ['Data Structures', 'Sorting', 'Algorithms'],
    subject: 'Data Structures',
    authorId: 'student_mock_1',
    authorName: 'Rohan Mehta',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan',
    voteScore: 24,
    upvotes: 26,
    downvotes: 2,
    responsesCount: 3,
    isResolved: true,
  },
  {
    title: 'Difference between process and thread — when nginx creates worker processes vs threads?',
    content: `<p>I'm confused about when to use <strong>multiple processes</strong> vs <strong>multiple threads</strong>. Specifically:</p>
<ul>
<li>Nginx uses worker <em>processes</em> by default (forking the master)</li>
<li>Apache httpd can use worker <em>threads</em> (worker MPM)</li>
</ul>
<p>What's the exact memory/isolation difference? If processes don't share memory, how does nginx share the accept mutex and connection queue between workers?</p>
<p>OS: Linux, Kernel 6.x</p>`,
    tags: ['Operating Systems', 'Linux', 'Processes'],
    subject: 'Operating Systems',
    authorId: 'student_mock_2',
    authorName: 'Priya Sharma',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    voteScore: 31,
    upvotes: 33,
    downvotes: 2,
    responsesCount: 5,
    isResolved: false,
  },
  {
    title: 'B+ Tree vs Hash Index — which to use for range queries in PostgreSQL?',
    content: `<p>In my DBMS project, I'm designing the indexing strategy for a student grades table with 10M rows. I need to run range queries like:</p>
<pre><code>SELECT * FROM grades WHERE marks BETWEEN 70 AND 90;</code></pre>
<p>I know:</p>
<ul>
<li><strong>B+ Tree</strong>: supports range, ordered; O(log n) point lookup</li>
<li><strong>Hash Index</strong>: O(1) point lookup but NO range support</li>
</ul>
<p>My professor says PostgreSQL actually doesn't support hash indexes in older versions. Is that still true in PG 14+? And would a composite index on (student_id, marks) be better here?</p>`,
    tags: ['DBMS', 'Indexing', 'PostgreSQL'],
    subject: 'Database Management',
    authorId: 'student_mock_3',
    authorName: 'Aditya Verma',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aditya',
    voteScore: 18,
    upvotes: 21,
    downvotes: 3,
    responsesCount: 4,
    isResolved: true,
  },
  {
    title: 'TCP 3-way handshake vs TLS handshake — what adds latency in HTTPS?',
    content: `<p>I'm optimizing API latency in our backend and want to understand the exact number of round trips for a new HTTPS connection:</p>
<ol>
<li>TCP 3-way handshake: 1 RTT</li>
<li>TLS 1.2 handshake: 2 RTTs additional??</li>
<li>TLS 1.3: 1 RTT (or 0-RTT with session resumption?)</li>
</ol>
<p>So for TLS 1.2, total = 3 RTTs before any HTTP data? That's huge at 150ms RTT. How does HTTP/2 connection reuse help? And what exactly is <strong>QUIC</strong> solving here?</p>`,
    tags: ['Computer Networks', 'TCP/IP', 'TLS', 'HTTP'],
    subject: 'Computer Networks',
    authorId: 'student_mock_4',
    authorName: 'Sneha Gupta',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha',
    voteScore: 42,
    upvotes: 44,
    downvotes: 2,
    responsesCount: 7,
    isResolved: false,
  },
  {
    title: 'Why does gradient descent converge faster with batch normalization?',
    content: `<p>I implemented a deep neural network for image classification. Without batch norm my training loss oscillates wildly and I need a very small learning rate (0.0001). With BatchNorm, I can use lr=0.01 and it converges 5x faster.</p>
<p>I've read the original paper but the math is still unclear. Specifically:</p>
<ul>
<li>Why does normalizing the intermediate activations help gradient flow?</li>
<li>What is "internal covariate shift" intuitively?</li>
<li>Does BatchNorm act as a regularizer or is that a side-effect?</li>
</ul>
<pre><code># My implementation
layer = nn.Sequential(
    nn.Linear(256, 128),
    nn.BatchNorm1d(128),  # Before or after activation?
    nn.ReLU()
)</code></pre>`,
    tags: ['Machine Learning', 'Deep Learning', 'Neural Networks'],
    subject: 'Machine Learning',
    authorId: 'student_mock_5',
    authorName: 'Rahul Nair',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
    voteScore: 55,
    upvotes: 58,
    downvotes: 3,
    responsesCount: 8,
    isResolved: true,
  },
  {
    title: 'How does virtual memory work — page fault vs TLB miss?',
    content: `<p>We covered virtual memory in OS class but I'm confused about the exact sequence of events when a process accesses memory:</p>
<p><strong>My understanding:</strong></p>
<ol>
<li>CPU generates virtual address</li>
<li>TLB checked — if hit, physical address found instantly</li>
<li>If TLB miss, page table walked</li>
<li>If page table entry says NOT PRESENT → page fault</li>
<li>OS loads page from swap → updates page table → retries</li>
</ol>
<p>Questions:</p>
<ul>
<li>Where exactly does the hardware stop and the OS kernel begin?</li>
<li>Is a page fault always catastrophic for performance?</li>
<li>How does demand paging interact with fork() and copy-on-write?</li>
</ul>`,
    tags: ['Operating Systems', 'Memory Management', 'Virtual Memory'],
    subject: 'Operating Systems',
    authorId: 'student_mock_6',
    authorName: 'Kavya Reddy',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kavya',
    voteScore: 37,
    upvotes: 40,
    downvotes: 3,
    responsesCount: 6,
    isResolved: false,
  },
  {
    title: 'React useEffect cleanup — why does my WebSocket reconnect on every render?',
    content: `<p>I'm building a real-time chat app in React 18 and my WebSocket keeps reconnecting every time the component re-renders. Here's my code:</p>
<pre><code>useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/chat');
  ws.onmessage = (e) => setMessages(prev => [...prev, e.data]);
  return () => ws.close(); // cleanup
}, [userId]); // dependency: userId</code></pre>
<p>The issue: in development with StrictMode, React mounts → unmounts → remounts, causing 2 WebSocket connections. In production it works fine but I still see reconnection when parent re-renders.</p>
<p>How do I properly stabilize a WebSocket connection across renders? Should I use useRef or move WS to a Context/Zustand store?</p>`,
    tags: ['React', 'Web Development', 'WebSockets'],
    subject: 'Web Development',
    authorId: 'student_mock_7',
    authorName: 'Arjun Kumar',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
    voteScore: 29,
    upvotes: 31,
    downvotes: 2,
    responsesCount: 9,
    isResolved: true,
  },
  {
    title: 'Dijkstra vs Bellman-Ford — when does negative weight break Dijkstra?',
    content: `<p>I know Dijkstra doesn\'t work with negative edge weights, but I want to understand <em>exactly why</em> with an example:</p>
<pre><code>Graph:
A --5--> B
A --2--> C  
C --(-4)--> B

Dijkstra: dist[B] = 5 (incorrect! should be 2+(-4) = -2)
Bellman-Ford: dist[B] = -2 (correct)</code></pre>
<p>Is it because Dijkstra greedily marks nodes as "settled" too early? And if so, can I just add a big constant to all edge weights to make them positive before running Dijkstra (Johnson\'s algorithm idea)?</p>`,
    tags: ['Algorithms', 'Graph Theory', 'Shortest Path'],
    subject: 'Algorithms',
    authorId: 'student_mock_8',
    authorName: 'Ishaan Patel',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ishaan',
    voteScore: 33,
    upvotes: 35,
    downvotes: 2,
    responsesCount: 4,
    isResolved: false,
  },
  {
    title: 'ACID vs BASE — how does Cassandra achieve eventual consistency?',
    content: `<p>My professor explained ACID for relational DBs and BASE for NoSQL, but how does Cassandra actually implement eventual consistency?</p>
<p>Specifically, I\'m confused about:</p>
<ul>
<li><strong>Tunable consistency</strong>: what does QUORUM mean exactly (e.g., R + W > N)?</li>
<li><strong>Hinted Handoff</strong>: if a node is down, another stores the write temporarily?</li>
<li><strong>Read Repair</strong>: how does it detect and fix stale replicas during reads?</li>
</ul>
<p>If I set ConsistencyLevel = ALL reads and writes in Cassandra, do I effectively get strong consistency? At what cost?</p>`,
    tags: ['DBMS', 'NoSQL', 'Distributed Systems'],
    subject: 'Database Management',
    authorId: 'student_mock_9',
    authorName: 'Divya Singh',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=divya',
    voteScore: 21,
    upvotes: 24,
    downvotes: 3,
    responsesCount: 6,
    isResolved: false,
  },
  {
    title: 'Overfitting in Decision Trees — how does pruning vs max_depth control it?',
    content: `<p>I\'m building a Decision Tree classifier for a binary classification problem (predict loan default). My training accuracy is 98% but test accuracy is only 67% — classic overfitting.</p>
<p>I tried two approaches:</p>
<pre><code># Approach 1: Limit depth
clf = DecisionTreeClassifier(max_depth=5)

# Approach 2: Post-pruning with cost complexity
clf = DecisionTreeClassifier(ccp_alpha=0.01)</code></pre>
<p>Which approach is generally better? And how do I choose the right <code>ccp_alpha</code> value — is cross-validation the only way? Also, does Random Forest inherently solve this overfitting problem?</p>`,
    tags: ['Machine Learning', 'Decision Trees', 'Overfitting'],
    subject: 'Machine Learning',
    authorId: 'student_mock_10',
    authorName: 'Manav Joshi',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manav',
    voteScore: 27,
    upvotes: 29,
    downvotes: 2,
    responsesCount: 5,
    isResolved: true,
  },
  {
    title: 'How does the Linux kernel scheduler decide which process to run next?',
    content: `<p>I want to deep-dive into the Linux CFS (Completely Fair Scheduler). My questions:</p>
<ol>
<li>What is <strong>virtual runtime (vruntime)</strong> and how does it differ from actual CPU time?</li>
<li>Why does CFS use a red-black tree instead of a simple priority queue?</li>
<li>How does CFS handle I/O-bound vs CPU-bound processes fairly?</li>
<li>What is the significance of <code>sched_latency_ns</code> and <code>sched_min_granularity_ns</code>?</li>
</ol>
<p>I\'m trying to understand why increasing the number of processes slows each one down proportionally rather than causing starvation like older schedulers.</p>`,
    tags: ['Operating Systems', 'Linux', 'Scheduling'],
    subject: 'Operating Systems',
    authorId: 'student_mock_11',
    authorName: 'Tanvi Desai',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tanvi',
    voteScore: 48,
    upvotes: 50,
    downvotes: 2,
    responsesCount: 11,
    isResolved: false,
  },
  {
    title: 'What is the CAP theorem and does Firebase Firestore sacrifice C, A, or P?',
    content: `<p>We\'re building a distributed app with Firebase Firestore and my team is debating which CAP theorem guarantee Firestore provides:</p>
<ul>
<li><strong>Consistency</strong>: every read gets the most recent write</li>
<li><strong>Availability</strong>: every request receives a response</li>
<li><strong>Partition Tolerance</strong>: system works despite network partitions</li>
</ul>
<p>CAP says you can only have 2 of 3. Firestore is a globally distributed NoSQL — so is it CP or AP?</p>
<p>Also: Firestore supports <strong>offline writes</strong> that sync when reconnected. Doesn\'t that mean it sacrifices consistency? How does it reconcile offline writes without conflicts?</p>`,
    tags: ['Distributed Systems', 'Cloud', 'Databases'],
    subject: 'Database Management',
    authorId: 'student_mock_12',
    authorName: 'Siddharth Rao',
    authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=siddharth',
    voteScore: 39,
    upvotes: 41,
    downvotes: 2,
    responsesCount: 8,
    isResolved: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function createOrUpdateAccount(account: typeof DEMO_ACCOUNTS[0], log: (msg: string) => void) {
  const auth = getAuth();
  let uid: string;

  // Try creating the account first; if it exists, sign in to get the UID
  try {
    log(`Creating auth: ${account.email}...`);
    const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
    uid = cred.user.uid;
    await updateProfile(cred.user, { displayName: account.profile.name });
    log(`  ✅ Auth created (${uid})`);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      log(`  ℹ️ Auth exists, signing in...`);
      const cred = await signInWithEmailAndPassword(auth, account.email, account.password);
      uid = cred.user.uid;
      log(`  ✅ Signed in (${uid})`);
    } else {
      throw err;
    }
  }

  // Write Firestore user doc
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: account.email,
    ...account.profile,
    socialLinks: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  log(`  ✅ User doc written`);

  // Write mentor doc if applicable
  if ('mentorDoc' in account && account.mentorDoc) {
    await setDoc(doc(db, 'mentors', uid), {
      userId: uid,
      ...account.mentorDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    log(`  ✅ Mentor doc written`);
  }

  return uid;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SeederPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const runDemoSeed = async () => {
    setLogs([]);
    setIsRunning(true);
    try {
      addLog('🚀 Creating demo accounts...');
      for (const account of DEMO_ACCOUNTS) {
        await createOrUpdateAccount(account, addLog);
      }
      addLog('');
      addLog('✅ All demo accounts ready!');
      addLog('');
      addLog('Credentials:');
      addLog('  demo.student@skillsbridge.app  /  Demo@1234');
      addLog('  demo.mentor@skillsbridge.app   /  Demo@1234');
      addLog('  demo.admin@skillsbridge.app    /  Admin@1234');
      toast.success('Demo accounts created!');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runMentorSeed = async () => {
    if (!user) { toast.error('Login first'); return; }
    setLogs([]);
    setIsRunning(true);
    try {
      addLog('🌱 Seeding mock mentors...');
      for (const m of MOCK_MENTORS) {
        await setDoc(doc(db, 'users', m.id), {
          uid: m.id,
          name: m.name,
          email: `${m.name.split(' ')[0].toLowerCase()}@example.com`,
          avatarUrl: m.avatarUrl,
          reputation: Math.floor(Math.random() * 500) + 100,
          badges: ['mentor'],
          role: 'mentor',
          expertise: m.expertise,
          createdAt: serverTimestamp(),
        }, { merge: true });
        await setDoc(doc(db, 'mentors', m.id), {
          ...m,
          userId: m.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        addLog(`  ✅ ${m.name}`);
      }
      addLog('✅ Mock mentors seeded!');
      toast.success('Mock mentors injected!');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runDoubtSeed = async () => {
    if (!user) { toast.error('Login first'); return; }
    setLogs([]);
    setIsRunning(true);
    try {
      addLog('💬 Seeding mock doubts...');
      // Space doubts out over the last 7 days for realistic timestamps
      for (let i = 0; i < MOCK_DOUBTS.length; i++) {
        const d = MOCK_DOUBTS[i];
        const daysAgo = Math.floor(i / 2); // 2 doubts per day
        const hoursOffset = (i % 2) * 4;
        const ts = new Date();
        ts.setDate(ts.getDate() - daysAgo);
        ts.setHours(ts.getHours() - hoursOffset);
        await addDoc(collection(db, 'doubts'), {
          ...d,
          createdAt: ts,
          updatedAt: ts,
        });
        addLog(`  ✅ "${d.title.slice(0, 50)}..."`);
      }
      addLog(`✅ ${MOCK_DOUBTS.length} doubts seeded!`);
      toast.success('Feed populated with mock doubts!');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-[#dae2fd] mb-2">Database Seeder</h1>
        <p className="text-[#8899b8] text-sm">Create demo accounts and inject mock data for testing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={runDemoSeed}
          disabled={isRunning}
          className="px-6 py-4 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}
        >
          🔑 Create Demo Accounts
          <p className="text-xs font-normal mt-1 opacity-80">student, mentor, admin</p>
        </button>

        <button
          onClick={runMentorSeed}
          disabled={isRunning}
          className="px-6 py-4 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'rgba(79,219,200,0.1)', border: '1px solid rgba(79,219,200,0.2)', color: '#4fdbc8' }}
        >
          🌱 Inject Mock Mentors
          <p className="text-xs font-normal mt-1 opacity-80">Alex, Sarah, James</p>
        </button>

        <button
          onClick={runDoubtSeed}
          disabled={isRunning}
          className="px-6 py-4 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'rgba(221,183,255,0.1)', border: '1px solid rgba(221,183,255,0.2)', color: '#ddb7ff' }}
        >
          💬 Seed Doubt Feed
          <p className="text-xs font-normal mt-1 opacity-80">12 realistic questions</p>
        </button>
      </div>

      {logs.length > 0 && (
        <div
          className="rounded-xl p-5 font-mono text-xs space-y-1 overflow-y-auto max-h-80"
          style={{ background: 'rgba(9,15,28,0.8)', border: '1px solid rgba(79,219,200,0.1)' }}
        >
          {logs.map((log, i) => (
            <div
              key={i}
              className={log.startsWith('✅') ? 'text-[#4fdbc8]' : log.startsWith('❌') ? 'text-red-400' : log.startsWith('ℹ️') ? 'text-[#ddb7ff]' : 'text-[#8899b8]'}
            >
              {log || <br />}
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-xl p-5 text-sm"
        style={{ background: 'rgba(221,183,255,0.05)', border: '1px solid rgba(221,183,255,0.1)' }}
      >
        <p className="text-[#ddb7ff] font-bold mb-3">📋 Demo Credentials</p>
        <table className="w-full text-xs text-[#8899b8]">
          <thead>
            <tr className="text-[#dae2fd] border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left py-1.5">Role</th>
              <th className="text-left py-1.5">Email</th>
              <th className="text-left py-1.5">Password</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Student', 'demo.student@skillsbridge.app', 'Demo@1234'],
              ['Mentor', 'demo.mentor@skillsbridge.app', 'Demo@1234'],
              ['Admin', 'demo.admin@skillsbridge.app', 'Admin@1234'],
            ].map(([role, email, pass]) => (
              <tr key={role} className="border-b border-[rgba(255,255,255,0.04)]">
                <td className="py-1.5 font-bold text-[#dae2fd]">{role}</td>
                <td className="py-1.5 font-mono">{email}</td>
                <td className="py-1.5 font-mono">{pass}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
