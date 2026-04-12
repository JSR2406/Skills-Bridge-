'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BADGES } from '@/lib/badges';
import { AwardBadgeToast } from '@/components/ui/AwardBadgeToast';
import { AnimatePresence } from 'framer-motion';

export function BadgeManager() {
  const { profile } = useAuth();
  const [activeBadge, setActiveBadge] = useState<any>(null);
  const previousBadges = useRef<string[]>([]);

  useEffect(() => {
    if (!profile?.badges) return;

    // First load, just sync
    if (previousBadges.current.length === 0) {
      previousBadges.current = profile.badges;
      return;
    }

    // Check for new badges
    const newBadgeId = profile.badges.find(id => !previousBadges.current.includes(id));
    if (newBadgeId) {
      const badge = BADGES.find(b => b.id === newBadgeId);
      if (badge) {
        setActiveBadge(badge);
      }
    }

    previousBadges.current = profile.badges;
  }, [profile?.badges]);

  return (
    <AnimatePresence>
      {activeBadge && (
        <AwardBadgeToast 
          badge={activeBadge} 
          onClose={() => setActiveBadge(null)} 
        />
      )}
    </AnimatePresence>
  );
}
