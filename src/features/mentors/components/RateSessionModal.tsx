'use client';

import { useState } from 'react';
import { Star, Loader2, X } from 'lucide-react';
import { submitMentorRating } from '@/features/mentors/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RateSessionModalProps {
  sessionId: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RateSessionModal({
  sessionId,
  mentorId,
  mentorName,
  studentId,
  onClose,
  onSuccess,
}: RateSessionModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    try {
      setSubmitting(true);
      await submitMentorRating(sessionId, mentorId, studentId, rating, comment);
      toast.success('Thank you for your feedback! 🎉');
      onSuccess();
    } catch (err: any) {
      if (err.message === 'RATING_ALREADY_SUBMITTED') {
        toast.info('You already rated this session');
        onClose();
      } else {
        toast.error('Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const active = hovered || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,15,28,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: '#0f1726', border: '1px solid rgba(79,219,200,0.2)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 flex items-start justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(79,219,200,0.06), rgba(221,183,255,0.03))' }}
        >
          <div>
            <p className="text-[10px] font-bold text-[#4fdbc8] uppercase tracking-widest mb-1">Session Complete</p>
            <h2 className="text-xl font-extrabold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Rate your session
            </h2>
            <p className="text-sm text-[#8899b8] mt-1">How was your experience with <span className="text-[#dae2fd] font-semibold">{mentorName}</span>?</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8899b8] hover:text-[#dae2fd] transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Stars */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={cn(
                      'w-9 h-9 transition-all',
                      n <= active ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-[#556780]',
                    )}
                  />
                </button>
              ))}
            </div>
            <p className={cn(
              'text-sm font-bold transition-all',
              active > 0 ? 'text-[#dae2fd]' : 'text-[#8899b8]',
            )}>
              {active > 0 ? starLabels[active] : 'Tap to rate'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#8899b8] uppercase tracking-widest">
              Leave a comment <span className="normal-case text-[#4fdbc8]">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share what went well, or what could be improved…"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
              style={{
                background: 'rgba(19,27,46,0.7)',
                border: '1px solid rgba(79,219,200,0.2)',
                color: '#dae2fd',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#8899b8] hover:text-[#dae2fd] transition-all border border-[rgba(255,255,255,0.08)]"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#0b1326] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(79,219,200,0.25)]"
              style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
