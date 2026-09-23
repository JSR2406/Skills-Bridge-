'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

/**
 * Main /profile page simply redirects to the user's specific dynamic profile URL.
 * This ensures consistency with the public profile system.
 */
export default function ProfileRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.uid}`);
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSkeleton />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Loading your profile...</p>
      </div>
    </div>
  );
}
