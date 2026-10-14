'use client';

// ── APP: /sessions — My Sessions
// Split into Upcoming vs Past so a user can see, at a glance, both what is
// coming up and everything they have already booked/attended. Past entries are
// the "appointment history": rating prompts, payment status and a re-book link.
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { subscribeToUserSessions } from '@/features/mentors/api';
import { SessionBooking } from '@/features/mentors/types';
import { SessionCard } from '@/features/mentors/components/SessionCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { RateSessionModal } from '@/features/mentors/components/RateSessionModal';
import {
  Calendar,
  CalendarClock,
  History,
  IndianRupee,
  Timer,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'upcoming' | 'past';

export default function MySessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingSession, setRatingSession] = useState<SessionBooking | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');
  // Snapshot of "now" — refreshed whenever the realtime feed delivers, so the
  // upcoming/past split never reads an impure clock during render.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = subscribeToUserSessions(user.uid, (data) => {
      setSessions(data);
      setNow(Date.now());
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  /** A booking is "upcoming" until its start time passes; everything else is history. */
  const { upcoming, past, stats } = useMemo(() => {
    const up: SessionBooking[] = [];
    const done: SessionBooking[] = [];

    for (const s of sessions) {
      const startsAt = new Date(s.startTime as Date).getTime();
      const isLiveOrFuture = startsAt > now && s.bookingStatus !== 'cancelled';
      (isLiveOrFuture ? up : done).push(s);
    }

    const attended = done.filter((s) => s.bookingStatus !== 'cancelled');
    const seconds = attended.reduce((acc, s) => {
      const start = new Date(s.startTime as Date).getTime();
      const end = new Date(s.endTime as Date).getTime();
      return acc + Math.max(0, end - start);
    }, 0);

    return {
      upcoming: up.sort((a, b) => new Date(a.startTime as Date).getTime() - new Date(b.startTime as Date).getTime()),
      past: done.sort((a, b) => new Date(b.startTime as Date).getTime() - new Date(a.startTime as Date).getTime()),
      stats: {
        upcomingCount: up.length,
        attendedCount: attended.length,
        hours: Math.round((seconds / 3_600_000) * 10) / 10,
        spent: attended.reduce((acc, s) => (s.paymentStatus === 'paid' ? acc + (s.amount || 0) : acc), 0),
      },
    };
  }, [sessions, now]);

  const visible = tab === 'upcoming' ? upcoming : past;
  const isMentorView = user?.uid ? sessions.some((s) => s.mentorId === user.uid) : false;

  if (isLoading) return <div className="max-w-4xl mx-auto mt-10"><LoadingSkeleton /></div>;

  const STAT_CARDS = [
    { key: 'upcoming', label: 'Upcoming', value: stats.upcomingCount, icon: CalendarClock, colour: '#4fdbc8', tab: 'upcoming' as Tab },
    { key: 'attended', label: isMentorView ? 'Sessions taught' : 'Attended', value: stats.attendedCount, icon: Trophy, colour: '#ddb7ff', tab: 'past' as Tab },
    { key: 'hours', label: 'Hours learned', value: `${stats.hours}h`, icon: Timer, colour: '#a5f3fc', tab: 'past' as Tab },
    { key: 'spent', label: 'Total paid', value: `₹${stats.spent.toLocaleString('en-IN')}`, icon: IndianRupee, colour: '#fbbf24', tab: 'past' as Tab },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 relative">
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#ddb7ff]/10 to-[#4fdbc8]/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(79,219,200,0.1)] relative">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            1-on-1 Guidance
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            My Sessions
          </h1>
          <p className="text-[15px] text-[#8899b8] mt-3 leading-relaxed">
            Manage your upcoming mentorship meetings and review your past completed sessions.
          </p>
        </div>
        <Link
          href="/mentors"
          className="btn-gradient shrink-0 px-6 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(79,219,200,0.15)] relative z-10 hover:shadow-[0_0_24px_rgba(79,219,200,0.25)] hover:-translate-y-0.5 inline-flex items-center gap-2"
        >
          Book New Session
        </Link>
      </div>

      {/* ── Stats ── */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {STAT_CARDS.map(({ key, label, value, icon: Icon, colour, tab: target }) => (
            <button
              key={key}
              onClick={() => setTab(target)}
              className="text-left rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(19, 27, 46, 0.6)',
                border: `1px solid ${tab === target ? `${colour}44` : 'rgba(79,219,200,0.08)'}`,
                boxShadow: tab === target ? `0 0 20px ${colour}18` : 'none',
              }}
            >
              <Icon className="w-4 h-4 mb-2" style={{ color: colour }} />
              <p className="text-xl font-extrabold text-[#dae2fd] leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {value}
              </p>
              <p className="text-[11px] text-[#8899b8] mt-1">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      {sessions.length > 0 && (
        <div
          className="flex items-center gap-1 p-1 rounded-lg w-fit relative z-10"
          style={{ background: 'rgba(19, 27, 46, 0.6)', border: '1px solid rgba(79, 219, 200, 0.08)' }}
        >
          {(
            [
              { id: 'upcoming' as Tab, label: 'Upcoming', count: upcoming.length, icon: CalendarClock },
              { id: 'past' as Tab, label: 'Past', count: past.length, icon: History },
            ]
          ).map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all duration-200"
              style={{
                background: tab === id ? 'rgba(79, 219, 200, 0.12)' : 'transparent',
                color: tab === id ? '#4fdbc8' : '#8899b8',
                border: tab === id ? '1px solid rgba(79, 219, 200, 0.2)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── List ── */}
      {sessions.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(79, 219, 200, 0.05)', border: '1px solid rgba(79, 219, 200, 0.1)' }}
          >
            <Calendar className="w-8 h-8 text-[#4fdbc8]/60" />
          </div>
          <h3
            className="text-xl font-extrabold text-[#dae2fd] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            No sessions booked yet
          </h3>
          <p className="text-sm text-[#8899b8] mb-8 max-w-sm mx-auto">
            Find an expert mentor and book a 1-on-1 session to overcome your blockers and accelerate your learning.
          </p>
          <Link href="/mentors" className="btn-gradient px-6 py-3 rounded-lg text-sm font-bold inline-flex items-center gap-2">
            Browse Mentors
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(79, 219, 200, 0.05)', border: '1px solid rgba(79, 219, 200, 0.1)' }}
          >
            {tab === 'upcoming' ? (
              <CalendarClock className="w-7 h-7 text-[#4fdbc8]/60" />
            ) : (
              <History className="w-7 h-7 text-[#4fdbc8]/60" />
            )}
          </div>
          <h3
            className="text-lg font-extrabold text-[#dae2fd] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {tab === 'upcoming' ? 'Nothing scheduled' : 'No past sessions yet'}
          </h3>
          <p className="text-sm text-[#8899b8] mb-6 max-w-sm mx-auto">
            {tab === 'upcoming'
              ? 'Your booked mentorship sessions will appear here once you schedule one.'
              : 'Completed and cancelled sessions show up here as your appointment history.'}
          </p>
          {tab === 'upcoming' && (
            <Link href="/mentors" className="btn-gradient px-6 py-3 rounded-lg text-sm font-bold inline-flex items-center gap-2">
              Browse Mentors
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map((session, i) => (
            <SessionCard
              key={session.id}
              session={session}
              index={i}
              isMentor={session.mentorId === user?.uid}
              onRate={setRatingSession}
            />
          ))}
        </div>
      )}

      {/* ── Rating Modal ── */}
      {ratingSession && user && (
        <RateSessionModal
          sessionId={ratingSession.id}
          mentorId={ratingSession.mentorId}
          mentorName={ratingSession.mentorName}
          studentId={user.uid}
          onClose={() => setRatingSession(null)}
          onSuccess={() => {
            setRatingSession(null);
            setSessions((prev) =>
              prev.map((s) => (s.id === ratingSession.id ? { ...s, ratingSubmitted: true } : s)),
            );
          }}
        />
      )}
    </div>
  );
}