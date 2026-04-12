'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BookOpenCheck, Loader2, User, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { getFirestore, doc, setDoc, Timestamp, collection, getDocs, query, where, addDoc } from 'firebase/firestore';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  const handleDemoLogin = async (type: 'student' | 'mentor') => {
    try {
      setIsDemoLoading(true);
      const email = type === 'student' ? 'demo@skillsbridge.com' : 'alex@skillsbridge.com';
      const password = 'password123';
      
      const seedDatabase = async (uid: string) => {
        toast.loading(`Initializing ${type === 'student' ? 'Student' : 'Mentor'} Data...`, { id: 'demo-init' });
        const db = getFirestore();

        if (type === 'student') {
          await setDoc(doc(db, 'users', uid), {
            uid: uid,
            name: 'Demo Student',
            email: 'demo@skillsbridge.com',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
            role: 'student',
            college: 'SkillBridge University',
            branch: 'Computer Science',
            semester: 6,
            subjects: ['React', 'Next.js', 'Firebase'],
            bio: 'Hi! I am a demo student exploring the SkillBridge platform.',
            socialLinks: { github: 'https://github.com/skillsbridge' },
            reputation: 150,
            streakDays: 5,
            answersCount: 12,
            acceptedAnswersCount: 4,
            badges: ['Pioneer', 'Helpful'],
            mentorApproved: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Seed all 3 mentors for student interaction
          const mentors = [
            {
              id: 'mentor_alex_123',
              name: 'Alex Rivera',
              avatarUrl: 'https://i.pravatar.cc/150?u=mentor_alex_123',
              college: 'MIT',
              headline: 'Senior Full Stack Engineer @ Google',
              bio: 'I specialize in large-scale Distributed Systems and modern React ecosystems. Happy to help with system design interviews and strict web-development queries.',
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
              bio: '10+ years of cloud infrastructure scaling. If your backend needs extreme performance tuning, setup a chat with me.',
              subjects: ['AWS', 'DevOps', 'Go'],
              expertise: ['Cloud Infrasturcture', 'Backend'],
              fee: 650,
              averageRating: 4.7,
              totalRatings: 42,
              sessionCount: 88,
              mentorApproved: true,
            }
          ];

          for (const m of mentors) {
            await setDoc(doc(db, 'mentors', m.id), {
              ...m,
              userId: m.id,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            // Also ensure user doc exists for messaging
            await setDoc(doc(db, 'users', m.id), {
              uid: m.id,
              name: m.name,
              email: `${m.name.split(' ')[0].toLowerCase()}@example.com`,
              avatarUrl: m.avatarUrl,
              role: 'mentor',
              mentorApproved: true,
              createdAt: Timestamp.now()
            });
          }

          // Create a sample conversation between student and Alex Rivera
          const alexId = 'mentor_alex_123';
          const convId = [uid, alexId].sort().join('_');
          await setDoc(doc(db, 'conversations', convId), {
            participants: [uid, alexId],
            participantNames: { [uid]: 'Demo Student', [alexId]: 'Alex Rivera' },
            participantAvatars: { 
              [uid]: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo', 
              [alexId]: 'https://i.pravatar.cc/150?u=mentor_alex_123' 
            },
            lastMessage: 'Sure! Let\'s schedule a talk about the System Design.',
            lastMessageAt: Timestamp.now(),
            lastSenderId: alexId,
            unreadCount: { [uid]: 1, [alexId]: 0 },
            createdAt: Timestamp.now(),
          });

          // Add some messages to the conversation
          const messagesRef = collection(db, 'conversations', convId, 'messages');
          await addDoc(messagesRef, {
            senderId: uid,
            senderName: 'Demo Student',
            senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
            content: 'Hi Alex! I saw your profile and I am interested in learning more about System Design. Can you help me?',
            type: 'text',
            createdAt: new Timestamp(Timestamp.now().seconds - 3600, 0),
          });
          await addDoc(messagesRef, {
            senderId: alexId,
            senderName: 'Alex Rivera',
            senderAvatar: 'https://i.pravatar.cc/150?u=mentor_alex_123',
            content: 'Hello! I would love to help. System Design is a vast topic, but we can start with the basics of horizontal scaling and load balancing.',
            type: 'text',
            createdAt: new Timestamp(Timestamp.now().seconds - 1800, 0),
          });
          await addDoc(messagesRef, {
            senderId: uid,
            senderName: 'Demo Student',
            senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
            content: 'That sounds great. I am specifically struggling with how to choose between SQL and NoSQL for high-write loads.',
            type: 'text',
            createdAt: new Timestamp(Timestamp.now().seconds - 900, 0),
          });
          await addDoc(messagesRef, {
            senderId: alexId,
            senderName: 'Alex Rivera',
            senderAvatar: 'https://i.pravatar.cc/150?u=mentor_alex_123',
            content: 'Sure! Let\'s schedule a talk about the System Design.',
            type: 'text',
            createdAt: Timestamp.now(),
          });

          await setDoc(doc(collection(db, 'doubts'), 'demo-doubt-x1'), {
            authorId: uid,
            authorName: 'Demo Student',
            authorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
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
          });
        } else {
          // Mentor Seed
          await setDoc(doc(db, 'users', uid), {
            uid: uid,
            name: 'Alex Rivera (Mentor)',
            email: 'alex@skillsbridge.com',
            avatarUrl: 'https://i.pravatar.cc/150?u=mentor_alex_123',
            role: 'mentor',
            college: 'MIT',
            expertise: ['Web Development', 'Architecture'],
            bio: 'I specialize in large-scale Distributed Systems.',
            reputation: 600,
            badges: ['mentor'],
            mentorApproved: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          await setDoc(doc(db, 'mentors', uid), {
            id: uid,
            userId: uid,
            name: 'Alex Rivera',
            avatarUrl: 'https://i.pravatar.cc/150?u=mentor_alex_123',
            college: 'MIT',
            headline: 'Senior Full Stack Engineer @ Google',
            bio: 'I specialize in large-scale Distributed Systems and modern React ecosystems. Happy to help!',
            subjects: ['System Design', 'React', 'Node.js'],
            expertise: ['Web Development', 'Architecture'],
            fee: 500,
            averageRating: 4.8,
            totalRatings: 120,
            sessionCount: 230,
            mentorApproved: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }

        // Try to create a sample conversation between Demo User and Alex
        try {
          const otherEmail = type === 'student' ? 'alex@skillsbridge.com' : 'demo@skillsbridge.com';
          const q = query(collection(db, 'users'), where('email', '==', otherEmail));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const otherUser = querySnapshot.docs[0].data();
            const otherUid = otherUser.uid;
            
            // deterministic convo ID
            const convId = [uid, otherUid].sort().join('_');
            const convRef = doc(db, 'conversations', convId);
            
            await setDoc(convRef, {
              participants: [uid, otherUid],
              participantNames: {
                [uid]: type === 'student' ? 'Demo Student' : 'Alex Rivera',
                [otherUid]: type === 'student' ? 'Alex Rivera' : 'Demo Student'
              },
              participantAvatars: {
                [uid]: type === 'student' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo' : 'https://i.pravatar.cc/150?u=mentor_alex_123',
                [otherUid]: type === 'student' ? 'https://i.pravatar.cc/150?u=mentor_alex_123' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
              },
              lastMessage: 'Let\'s jump on a video call to discuss your block!',
              lastMessageAt: Timestamp.now(),
              lastSenderId: type === 'student' ? otherUid : uid,
              unreadCount: { [uid]: 1, [otherUid]: 0 },
              createdAt: Timestamp.now(),
            });

            // Sample Message
            const msgRef = collection(db, 'conversations', convId, 'messages');
            await setDoc(doc(msgRef, 'sample_msg_1'), {
              senderId: type === 'student' ? otherUid : uid,
              senderName: type === 'student' ? 'Alex Rivera' : 'Alex Rivera',
              senderAvatar: 'https://i.pravatar.cc/150?u=mentor_alex_123',
              content: 'Hey Demo! Let\'s jump on a video call to discuss your system design block. You can hit the video call icon at the top.',
              type: 'text',
              createdAt: Timestamp.now(),
            });
          }
        } catch (e) {
          console.error("Could not seed conversation", e);
        }

        toast.success(`Demo ${type === 'student' ? 'Student' : 'Mentor'} Environment Ready!`, { id: 'demo-init' });
      };

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await seedDatabase(cred.user.uid);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await seedDatabase(cred.user.uid);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error(error.message || 'Failed to login to demo.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col items-center mb-8 z-10">
        <div className="bg-brand-500/20 p-4 rounded-2xl mb-4 border border-brand-500/30">
          <BookOpenCheck className="w-10 h-10 text-brand-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to SkillBridge</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          The premium peer learning and doubt resolution platform for students.
        </p>
      </div>

      <Card className="w-full max-w-md bg-surface-card border-border/50 shadow-2xl z-10">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Choose your preferred sign in method for the prototype
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<Loader2 className="w-5 h-5 animate-spin text-brand-500 mx-auto" />}>
            <GoogleButton mode="login" />
          </Suspense>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button 
              variant="outline" 
              onClick={() => handleDemoLogin('student')} 
              disabled={isDemoLoading}
              className="w-full bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border-brand-500/30 font-semibold"
            >
              {isDemoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <User className="w-4 h-4 mr-2"/>}
              Demo Student
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleDemoLogin('mentor')} 
              disabled={isDemoLoading}
              className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-semibold"
            >
              {isDemoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2"/>}
              Demo Mentor
            </Button>
          </div>

          <p className="text-[12px] text-muted-foreground text-center pt-2">
            Tip: Log into "Demo Student" on one window and "Demo Mentor" on another to test real-time chat and video calls!
          </p>

          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); /* Email auth placeholder */}}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required className="bg-surface-elevated" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="/forgot-password" className="text-xs text-brand-500 hover:text-brand-400 font-medium">
                  Forgot password?
                </a>
              </div>
              <Input id="password" type="password" required className="bg-surface-elevated" />
            </div>
            <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium" disabled>
              Sign In
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Email signup is disabled in manual mode. Use Quick Demo modes above.
            </p>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground z-10">
        Don&apos;t have an account? <a href="/register" className="text-brand-500 font-medium hover:underline">Sign up</a>
      </p>
    </div>
  );
}
