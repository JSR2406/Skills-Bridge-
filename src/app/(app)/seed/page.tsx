'use client';

import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-[#dae2fd] mb-2">Database Seeder</h1>
        <p className="text-[#8899b8] text-sm">Create demo accounts and inject mock data for testing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
