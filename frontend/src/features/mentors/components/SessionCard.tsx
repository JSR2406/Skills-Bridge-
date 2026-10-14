'use client';

// ── FEATURE: Mentor Core — SessionCard
// One booking rendered as a card. Upcoming bookings get the live meeting panel
// (join / message / copy link); finished ones get the post-session actions
// (view mentor, message, rate, book again).
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Star,
  User,
  Video,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getOrCreateConversation } from '@/features/messages/api';
import type { SessionBooking } from '@/features/mentors/types';

/** Returns true if session starts within 15 min from now OR is currently running */
function isCallJoinable(startTime: Date, endTime: Date): boolean {
  const now = Date.now();
  const start = startTime.getTime();
  const end = endTime.getTime();
  const fifteenMin = 15 * 60 * 1000;
  return now >= start - fifteenMin && now <= end;
}

/** Public Jitsi direct link (mirrors the in-app /call route). */
function buildJitsiLink(sessionId: string): string {
  return `https://meet.jit.si/skillsbridge-${sessionId}`;
}

interface SessionCardProps {
  session: SessionBooking;
  /** True when the signed-in user is the mentor on this booking. */
  isMentor: boolean;
  onRate: (session: SessionBooking) => void;
  index?: number;
}

export function SessionCard({ session, isMentor, onRate, index = 0 }: SessionCardProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const start = new Date(session.startTime as Date);
  const end = new Date(session.endTime as Date);
  const isUpcoming = start > new Date();
  const counterpartName = isMentor ? session.studentName : session.mentorName;
  const counterpartId = isMentor ? session.studentId : session.mentorId;

  const dateStr = start.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const handleCopyLink = useCallback(async () => {
    const link = buildJitsiLink(session.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Meeting link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy — link: ' + link);
    }
  }, [session.id]);

  const handleJoinCall = useCallback(() => {
    const name = profile?.name || user?.displayName || 'Student';
    router.push(`/call?session=${session.id}&name=${encodeURIComponent(name)}`);
  }, [profile, user, router, session.id]);

  const handleMessage = useCallback(async () => {
    if (!user || (!session.mentorName && !session.studentName)) return;
    await getOrCreateConversation(
      user.uid,
      profile?.name || user.displayName || 'Me',
      profile?.avatarUrl || '',
      counterpartId,
      counterpartName,
      isMentor ? '' : (session.mentorAvatar || ''),
    );
    router.push('/messages');
  }, [user, profile, session, counterpartId, counterpartName, isMentor, router]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
        isUpcoming
          ? 'glass-card border-[rgba(79,219,200,0.2)] shadow-[0_0_24px_rgba(79,219,200,0.05)] hover:border-[#4fdbc8]/40'
          : 'bg-[rgba(19,27,46,0.5)] border border-[rgba(255,255,255,0.05)] opacity-80 hover:opacity-100'
      }`}
      style={{ animationDelay: `${index * 50}ms`, animationName: 'fade-in', animationFillMode: 'both' }}
    >
      {isUpcoming && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#4fdbc8] to-[#ddb7ff]" />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 ml-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-2.5 py-1 text-xs font-bold uppercase tracking-widest rounded-md ${
                isUpcoming
                  ? 'bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#8899b8]'
              }`}
            >
              {session.bookingStatus === 'cancelled' ? 'Cancelled' : isUpcoming ? 'Scheduled' : 'Completed'}
            </span>
            {session.paymentStatus === 'paid' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4fdbc8] bg-[rgba(79,219,200,0.05)] rounded-md border border-[rgba(79,219,200,0.1)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
              </span>
            )}
            {session.paymentStatus === 'refunded' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#ddb7ff] bg-[rgba(221,183,255,0.05)] rounded-md border border-[rgba(221,183,255,0.15)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Refunded
              </span>
            )}
          </div>

          <div>
            <h3
              className="text-xl sm:text-2xl font-extrabold text-[#dae2fd] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Session with <span className="text-[#4fdbc8]">{counterpartName}</span>
            </h3>
            <div className="flex flex-wrap gap-4 items-center pl-1">
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#8899b8]">
                <div className="w-6 h-6 rounded bg-[rgba(221,183,255,0.1)] flex items-center justify-center border border-[rgba(221,183,255,0.2)]">
                  <Calendar className="w-3.5 h-3.5 text-[#ddb7ff]" />
                </div>
                {dateStr}
              </div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#8899b8]">
                <div className="w-6 h-6 rounded bg-[rgba(79,219,200,0.1)] flex items-center justify-center border border-[rgba(79,219,200,0.2)]">
                  <Clock className="w-3.5 h-3.5 text-[#4fdbc8]" />
                </div>
                {timeStr}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 md:min-w-[220px]">
          {isUpcoming ? (
            <div
              className="rounded-xl flex flex-col items-center text-center space-y-3 p-4"
              style={{
                background: 'rgba(15,23,37,0.7)',
                border: isCallJoinable(start, end)
                  ? '1px solid rgba(79,219,200,0.3)'
                  : '1px solid rgba(79,219,200,0.1)',
                boxShadow: isCallJoinable(start, end) ? '0 0 20px rgba(79,219,200,0.08)' : 'none',
              }}
            >
              <span className="text-[10px] text-[#ddb7ff] font-bold uppercase tracking-widest block">
                Meeting Details
              </span>

              {isCallJoinable(start, end) ? (
                <button
                  onClick={handleJoinCall}
                  className="w-full btn-gradient py-2.5 rounded-lg text-[13px] font-bold shadow-[0_0_15px_rgba(79,219,200,0.25)] flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
                >
                  <Video className="w-4 h-4" /> Join Call
                </button>
              ) : (
                <div className="w-full text-center">
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    style={{ background: 'rgba(79,219,200,0.08)', border: '1px solid rgba(79,219,200,0.1)', color: '#4fdbc8' }}
                    title="Available 15 minutes before session starts"
                  >
                    <Video className="w-4 h-4" /> Join Call
                  </button>
                  <p className="text-[10px] text-[#556780] mt-1.5">Opens 15 min before session</p>
                </div>
              )}

              <button
                onClick={handleMessage}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-bold transition-all hover:bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)]"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Message
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all hover:text-[#dae2fd]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: copied ? '#4fdbc8' : '#8899b8',
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Meeting Link
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {!isMentor && (
                <Link
                  href={`/mentors/${session.mentorId}`}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold text-[#8899b8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#dae2fd] transition-colors"
                >
                  <User className="w-4 h-4" /> View Mentor <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              )}
              <button
                onClick={handleMessage}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all hover:bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Message
              </button>

              {/* Rate Session — student only, one time */}
              {!isMentor && !session.ratingSubmitted && session.bookingStatus !== 'cancelled' && (
                <button
                  onClick={() => onRate(session)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all hover:-translate-y-0.5 border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(221,183,255,0.08))',
                    borderColor: 'rgba(251,191,36,0.25)',
                    color: '#fbbf24',
                  }}
                >
                  <Star className="w-4 h-4" /> Rate this session
                </button>
              )}
              {!isMentor && session.ratingSubmitted && (
                <div
                  className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-[12px] font-bold text-[#8899b8]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> Rated
                </div>
              )}
              {/* Book again */}
              {!isMentor && (
                <Link
                  href={`/mentors/${session.mentorId}`}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-[12px] font-bold text-[#8899b8] hover:text-[#4fdbc8] transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book another session
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}