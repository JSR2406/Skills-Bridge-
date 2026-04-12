'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';


function LoadingScreen({ message }: { message: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: '#0b1326',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79, 219, 200, 0.08) 0%, transparent 60%)',
      }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Animated logo */}
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4fdbc8, #2ec4b6)',
              boxShadow: '0 0 40px rgba(79, 219, 200, 0.3)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <BookOpenCheck className="w-8 h-8 text-[#00201c]" />
          </div>
          {/* Orbit ring */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-[rgba(79,219,200,0.2)]"
            style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
          />
        </div>

        <div className="text-center">
          <p
            className="text-lg font-bold"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'linear-gradient(135deg, #4fdbc8 0%, #ddb7ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SkillBridge
          </p>
          <p className="text-sm text-[#8899b8] mt-1 animate-pulse" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(79, 219, 200, 0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #4fdbc8, #ddb7ff)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              width: '40%',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-250%) }
          100% { transform: translateX(350%) }
        }
      `}</style>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAuthenticated, isProfileComplete, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (isAuthenticated && profile && !isProfileComplete && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (isAuthenticated && profile && user && isProfileComplete) {
        // Daily Login & Streak Processing
        if (user.uid && !(window as any).dailyLoginProcessed) {
          (window as any).dailyLoginProcessed = true;
          import('@/features/reputation/api').then(({ processDailyLogin }) => {
            processDailyLogin(user.uid);
          });
        }
      }
    }
  }, [isAuthenticated, profile, isProfileComplete, loading, router, pathname, user]);

  if (loading) return <LoadingScreen message="Loading SkillBridge..." />;

  if (!isAuthenticated || (profile && !isProfileComplete && pathname !== '/onboarding')) {
    return <LoadingScreen message="Redirecting..." />;
  }

  return <AppShell>{children}</AppShell>;
}
