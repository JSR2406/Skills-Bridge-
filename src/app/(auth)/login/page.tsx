'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BookOpenCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { toast } from 'sonner';

// ── Email / password form (needs useSearchParams so wrapped in Suspense) ──────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/feed';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      router.replace(redirectTo);
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please wait a moment.'
          : err.message || 'Failed to sign in.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /** Fill demo credentials with one click */
  const fillDemo = (role: 'student' | 'mentor' | 'admin') => {
    const map = {
      student: { email: 'demo.student@skillsbridge.app', password: 'Demo@1234' },
      mentor:  { email: 'demo.mentor@skillsbridge.app',  password: 'Demo@1234' },
      admin:   { email: 'demo.admin@skillsbridge.app',   password: 'Admin@1234' },
    };
    setEmail(map[role].email);
    setPassword(map[role].password);
    toast.info(`Demo ${role} credentials filled — click Sign In`);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bg-surface-elevated"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-surface-elevated pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold"
        disabled={isLoading || !email || !password}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Sign In
      </Button>

      {/* Quick-fill demo credentials */}
      <div className="pt-1">
        <p className="text-[11px] text-muted-foreground text-center mb-2">
          Quick-fill demo credentials:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['student', 'mentor', 'admin'] as const).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => fillDemo(role)}
              className="text-[11px] py-1.5 rounded-lg font-semibold capitalize transition-colors"
              style={{
                background: 'rgba(79,219,200,0.07)',
                border: '1px solid rgba(79,219,200,0.15)',
                color: '#4fdbc8',
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
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
            Use Google or your email to log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth */}
          <Suspense fallback={<Loader2 className="w-5 h-5 animate-spin text-brand-500 mx-auto" />}>
            <GoogleButton mode="login" />
          </Suspense>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-card px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>

          {/* Email / password form */}
          <Suspense fallback={<Loader2 className="w-5 h-5 animate-spin text-brand-500 mx-auto" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground z-10">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-brand-500 font-medium hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
