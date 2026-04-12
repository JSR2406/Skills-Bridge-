'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/lib/badges';

interface AwardBadgeToastProps {
  badge: Badge;
  onClose: () => void;
}

export function AwardBadgeToast({ badge, onClose }: AwardBadgeToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed bottom-8 right-8 z-[100] bg-surface-card border-2 border-brand-500/50 p-6 rounded-2xl shadow-2xl max-w-sm overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Award className="w-24 h-24 text-brand-500" />
      </div>

      <div className="relative flex items-start gap-4">
        <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center text-3xl">
          {badge.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">New Badge Earned!</h3>
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
          </div>
          <p className="text-brand-300 font-semibold mb-2">{badge.name}</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {badge.description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Awesome!
        </button>
      </div>

      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-brand-500"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 5 }}
        onAnimationComplete={onClose}
      />
    </motion.div>
  );
}
