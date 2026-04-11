'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BookOpenCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { getFirestore, doc, setDoc, Timestamp, collection } from 'firebase/firestore';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      
      const seedDatabase = async (uid: string) => {
        toast.loading('Initializing Demo Data...', { id: 'demo-init' });
        const db = getFirestore();
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

        await setDoc(doc(collection(db, 'doubts'), 'demo-doubt-x1'), {
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
        });
        toast.success('Demo Environment Ready!', { id: 'demo-init' });
      };

      try {
        const cred = await signInWithEmailAndPassword(auth, 'demo@skillsbridge.com', 'password123');
        await seedDatabase(cred.user.uid);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          const cred = await createUserWithEmailAndPassword(auth, 'demo@skillsbridge.com', 'password123');
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
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <GoogleButton mode="login" />
          
          <Button 
            variant="outline" 
            onClick={handleDemoLogin} 
            disabled={isDemoLoading}
            className="w-full bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border-brand-500/30"
          >
            {isDemoLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Quick Demo Login
          </Button>

          <div className="relative">
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
              Email signup is currently disabled in this preview. Use Google Sign In.
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
