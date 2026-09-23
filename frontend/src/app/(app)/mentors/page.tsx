'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getApprovedMentors, getMentorSlots } from '@/features/mentors/api';
import { MentorProfile, MentorSlot } from '@/features/mentors/types';
import {
  rankMentors,
  buildRecommendationContext,
  writeShadowLog,
  isInShadowMode,
} from '@/features/mentors/recommendation';
import type { ScoredMentor } from '@/features/mentors/recommendation';
import { useAuthStore } from '@/features/auth/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  Search, Star, BookOpen, ChevronRight, Zap, Sparkles,
  Eye, TrendingUp, Clock, Wallet, BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StudentActivity {
  testAttempts: Array<{ topic: string; score: number; total: number }>;
  doubts: Array<{ subject?: string; isResolved: boolean }>;
  bookings: Array<{ mentorId: string }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Signal → icon + colour mapping for match reason chips */
const REASON_META: Record<string, { icon: React.ElementType; colour: string }> = {
  'Covers your weak areas':    { icon: TrendingUp,  colour: '#4fdbc8' },
  'Highly rated':              { icon: Star,         colour: '#ffb84d' },
  'Has a slot open':           { icon: Clock,        colour: '#a5f3fc' },
  'first session':             { icon: BadgeCheck,   colour: '#ddb7ff' },
  'sessions taught':           { icon: BookOpen,     colour: '#ddb7ff' },
  'Within budget':             { icon: Wallet,       colour: '#86efac' },
  'Above your budget':         { icon: Wallet,       colour: '#f87171' },
  'New mentor':                { icon: Sparkles,     colour: '#ddb7ff' },
  // fallback
  default:                     { icon: Zap,          colour: '#8899b8' },
};

function getReasonMeta(reason: string) {
  for (const [key, meta] of Object.entries(REASON_META)) {
    if (reason.includes(key)) return meta;
  }
  return REASON_META.default;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MentorDirectoryPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [mentors, setMentors]               = useState<MentorProfile[]>([]);
  const [scoredMentors, setScoredMentors]   = useState<ScoredMentor[]>([]);
  const [slotsMap, setSlotsMap]             = useState<Record<string, MentorSlot[]>>({});
  const [search, setSearch]                 = useState('');
  const [isLoading, setIsLoading]           = useState(true);
  const [isRanking, setIsRanking]           = useState(false);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [inShadow]                          = useState(isInShadowMode());

  // ── Load mentors + slots ───────────────────────────────────────────────────
  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await getApprovedMentors();
        setMentors(data);

        // Pre-fetch all slots in parallel — avoids N+1 reads inside scorer
        const slotResults = await Promise.allSettled(
          data.map(m => getMentorSlots(m.userId)),
        );
        const map: Record<string, MentorSlot[]> = {};
        data.forEach((m, i) => {
          const r = slotResults[i];
          map[m.userId] = r.status === 'fulfilled' ? r.value : [];
        });
        setSlotsMap(map);
      } catch (err) {
        console.error('Failed to load mentors:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMentors();
  }, []);

  // ── Build recommendation context + rank ────────────────────────────────────
  useEffect(() => {
    if (!user || mentors.length === 0) return;

    async function buildAndRank() {
      setIsRanking(true);
      try {
        // Gather student activity — reuse the same Firestore reads as productivity page
        const activity = await fetchStudentActivity(user!.uid);

        const context = buildRecommendationContext(
          activity.testAttempts,
          activity.doubts,
          activity.bookings,
          // Read budgetCeiling from the student's saved profile (null stored as null — treat as undefined)
          profile?.budgetCeiling ?? undefined,
        );

        const ranked = rankMentors(mentors, slotsMap, context);
        setScoredMentors(ranked);

        // Shadow log — fire and forget, never blocks UI
        writeShadowLog(user!.uid, context, ranked);
      } catch (err) {
        console.warn('[Recommendation] Context fetch failed, falling back to unranked:', err);
        // Graceful fallback: wrap unranked mentors with zero scores
        const fallback: ScoredMentor[] = mentors.map(m => ({
          mentor: m,
          totalScore: 0,
          breakdown: { topicMatchScore: 0, ratingScore: 0, availabilityScore: 0, noveltyScore: 0, budgetScore: 0 },
          matchReasons: [],
        }));
        setScoredMentors(fallback);
      } finally {
        setIsRanking(false);
      }
    }

    buildAndRank();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mentors, slotsMap]);

  // ── Filtered display list ──────────────────────────────────────────────────
  const displayList = useMemo((): ScoredMentor[] => {
    // If ranking unavailable yet, wrap raw mentors
    const source: ScoredMentor[] = scoredMentors.length > 0
      ? scoredMentors
      : mentors.map(m => ({
          mentor: m,
          totalScore: 0,
          breakdown: { topicMatchScore: 0, ratingScore: 0, availabilityScore: 0, noveltyScore: 0, budgetScore: 0 },
          matchReasons: [],
        }));

    if (!search.trim()) return source;

    const q = search.toLowerCase();
    return source.filter(({ mentor: m }) =>
      m.name.toLowerCase().includes(q) ||
      m.headline.toLowerCase().includes(q) ||
      m.subjects.some(s => s.toLowerCase().includes(q)) ||
      m.expertise.some(e => e.toLowerCase().includes(q)),
    );
  }, [search, scoredMentors, mentors]);

  const toggleReason = useCallback((uid: string) => {
    setExpandedReason(prev => (prev === uid ? null : uid));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(79,219,200,0.1)] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-[#ddb7ff]/5 to-transparent blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-[#ddb7ff] font-bold text-xs uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            1-on-1 Guidance
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Expert Mentors
          </h1>
          <p className="text-[15px] text-[#8899b8] mt-3 leading-relaxed">
            Connect with top peers and alumni to get personalised help, crack tough subjects, and level up your skills instantly.
          </p>
        </div>
        <Link
          href="/apply-mentor"
          className="btn-gradient shrink-0 px-6 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(79,219,200,0.15)] relative z-10 hover:shadow-[0_0_24px_rgba(79,219,200,0.25)] hover:-translate-y-0.5"
        >
          Apply as Mentor
        </Link>
      </div>

      {/* ── Shadow-mode banner ── */}
      {inShadow && !isLoading && scoredMentors.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(221,183,255,0.05)',
            border: '1px solid rgba(221,183,255,0.15)',
            color: '#ddb7ff',
          }}
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span>
            <strong>Recommendation engine is in shadow mode</strong> — rankings are computed and
            logged but the list is shown unranked. Set{' '}
            <code
              className="px-1 py-0.5 rounded text-[11px]"
              style={{ background: 'rgba(221,183,255,0.1)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              NEXT_PUBLIC_RECOMMENDATION_SHADOW_MODE=false
            </code>{' '}
            to enable ranked results.
          </span>
        </div>
      )}

      {/* ── AI-ranked badge (live mode) ── */}
      {!inShadow && !isLoading && scoredMentors.length > 0 && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: 'rgba(79,219,200,0.08)',
            border: '1px solid rgba(79,219,200,0.2)',
            color: '#4fdbc8',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Personalised for you — sorted by match score
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4fdbc8]/50" />
        <input
          placeholder="Search by name, subject, or expertise..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all duration-300"
          style={{
            background: 'rgba(19, 27, 46, 0.7)',
            border: '1px solid rgba(79, 219, 200, 0.1)',
            color: '#dae2fd',
            fontFamily: "'Manrope', sans-serif",
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(79, 219, 200, 0.08)';
            e.currentTarget.style.background = 'rgba(28, 36, 64, 0.9)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'rgba(19, 27, 46, 0.7)';
          }}
        />
      </div>

      {/* ── Grid ── */}
      {isLoading || isRanking ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton />
        </div>
      ) : displayList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map(({ mentor, totalScore, breakdown, matchReasons }, idx) => {
            const isExpanded = expandedReason === mentor.userId;
            const showRank   = !inShadow && totalScore > 0;
            const isTopPick  = showRank && idx === 0;

            return (
              <div
                key={mentor.userId}
                className={cn(
                  'group glass-card flex flex-col p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full',
                  isTopPick
                    ? 'border-[rgba(79,219,200,0.35)]'
                    : 'border-[rgba(79,219,200,0.1)]',
                )}
              >
                {/* Top shimmer line */}
                <div
                  className={cn(
                    'absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r transition-all',
                    isTopPick
                      ? 'from-[#4fdbc8]/60 via-[#4fdbc8] to-[#ddb7ff]/60 opacity-100'
                      : 'from-[#4fdbc8]/0 via-[#4fdbc8]/30 to-[#ddb7ff]/0 group-hover:via-[#4fdbc8] opacity-50 group-hover:opacity-100',
                  )}
                />

                {/* #1 pick badge */}
                {isTopPick && (
                  <div
                    className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, rgba(79,219,200,0.15), rgba(221,183,255,0.1))',
                      border: '1px solid rgba(79,219,200,0.3)',
                      color: '#4fdbc8',
                    }}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    Top Match
                  </div>
                )}

                {/* ── Card body — click navigates ── */}
                <div
                  onClick={() => router.push(`/mentors/${mentor.userId}`)}
                  className="flex flex-col flex-1"
                >
                  {/* Avatar + name row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-14 w-14 ring-2 ring-[rgba(79,219,200,0.15)] shadow-[0_0_12px_rgba(79,219,200,0.1)] group-hover:ring-[rgba(79,219,200,0.4)] transition-all">
                          <AvatarImage src={mentor.avatarUrl} alt={mentor.name} className="object-cover" />
                          <AvatarFallback
                            className="text-xl font-bold"
                            style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}
                          >
                            {mentor.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0b1326] rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-[#4fdbc8] rounded-full shadow-[0_0_8px_#4fdbc8]" />
                        </div>
                      </div>
                      <div>
                        <h3
                          className="text-base font-bold text-[#dae2fd] group-hover:text-[#4fdbc8] transition-colors"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {mentor.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-[#8899b8] uppercase tracking-wider mt-0.5">
                          {mentor.college}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 bg-[rgba(255,184,77,0.1)] border border-[rgba(255,184,77,0.2)] px-2 py-0.5 rounded-[6px]">
                        <Star className="w-3 h-3 text-[#ffb84d] fill-[#ffb84d]" />
                        <span className="text-xs font-bold text-[#ffb84d]">
                          {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}
                        </span>
                      </div>

                      {/* Score pill (live mode only) */}
                      {showRank && (
                        <div
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-[5px]"
                          style={{
                            background: 'rgba(79,219,200,0.07)',
                            border: '1px solid rgba(79,219,200,0.15)',
                            color: '#4fdbc8',
                          }}
                        >
                          {totalScore}/100
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Headline + bio */}
                  <div className="mb-4">
                    <p className="text-[13px] font-bold text-[#dae2fd] mb-1.5 leading-snug line-clamp-1">
                      {mentor.headline}
                    </p>
                    <p className="text-[13px] text-[#8899b8] leading-relaxed line-clamp-3">
                      {mentor.bio}
                    </p>
                  </div>

                  {/* Subject chips */}
                  <div className="mt-auto mb-4 flex flex-wrap gap-1.5">
                    {mentor.subjects.slice(0, 3).map(sub => (
                      <span key={sub} className="badge-purple font-semibold text-[10px] lowercase px-2">
                        #{sub}
                      </span>
                    ))}
                    {mentor.subjects.length > 3 && (
                      <span className="badge-purple font-semibold text-[10px] lowercase px-2 bg-[rgba(221,183,255,0.02)] border-dashed border-[rgba(221,183,255,0.2)] text-[#8899b8]">
                        +{mentor.subjects.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Footer: fee + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(79,219,200,0.08)]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#8899b8] font-bold uppercase tracking-widest mb-0.5">
                        Session Fee
                      </span>
                      <div className="text-[15px] font-extrabold text-[#4fdbc8]">
                        ₹{mentor.fee}
                      </div>
                    </div>
                    <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(79,219,200,0.08)] text-[#4fdbc8] group-hover:bg-[#4fdbc8] group-hover:text-[#00201c] transition-colors shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── "Why recommended?" panel ── */}
                {matchReasons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[rgba(79,219,200,0.06)]">
                    <button
                      onClick={e => {
                        e.stopPropagation(); // don't navigate
                        toggleReason(mentor.userId);
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors w-full"
                      style={{ color: isExpanded ? '#4fdbc8' : '#8899b8' }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Why recommended?
                      <span
                        className="ml-auto transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        ▾
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-1.5 animate-fade-in">
                        {matchReasons.map((reason, i) => {
                          const { icon: Icon, colour } = getReasonMeta(reason);
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-[12px] leading-snug"
                            >
                              <Icon
                                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                style={{ color: colour }}
                              />
                              <span style={{ color: '#b8c8e8' }}>{reason}</span>
                            </div>
                          );
                        })}

                        {/* Score breakdown mini-bar (live mode) */}
                        {showRank && (
                          <div className="mt-3 space-y-1">
                            {(
                              [
                                ['Topic match', breakdown.topicMatchScore, 40, '#4fdbc8'],
                                ['Rating',      breakdown.ratingScore,     25, '#ffb84d'],
                                ['Availability',breakdown.availabilityScore,20, '#a5f3fc'],
                                ['Novelty',     breakdown.noveltyScore,    10, '#ddb7ff'],
                                ['Budget',      breakdown.budgetScore,      5, '#86efac'],
                              ] as [string, number, number, string][]
                            ).map(([label, score, max, colour]) => (
                              <div key={label} className="flex items-center gap-2">
                                <span
                                  className="text-[10px] w-24 shrink-0 font-medium"
                                  style={{ color: '#8899b8' }}
                                >
                                  {label}
                                </span>
                                <div
                                  className="flex-1 h-1 rounded-full overflow-hidden"
                                  style={{ background: 'rgba(255,255,255,0.05)' }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${(score / max) * 100}%`,
                                      background: colour,
                                      opacity: score === 0 ? 0.2 : 1,
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-[10px] w-10 text-right font-bold shrink-0"
                                  style={{ color: colour }}
                                >
                                  {score}/{max}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 glass-card border-dashed">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(79, 219, 200, 0.05)', border: '1px solid rgba(79, 219, 200, 0.1)' }}
          >
            <BookOpen className="w-7 h-7 text-[#4fdbc8]/60" />
          </div>
          <h3
            className="text-lg font-bold text-[#dae2fd] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            No mentors found
          </h3>
          <p className="text-sm text-[#8899b8] max-w-sm mx-auto">
            We couldn&apos;t find any mentors matching your search criteria. Try a different subject or keyword.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Data fetcher ───────────────────────────────────────────────────────────────

/**
 * Fetch the student's recent activity needed for building the RecommendationContext.
 * Deliberately cheap: 3 Firestore reads total (same data already fetched by
 * the productivity page — could be lifted to a shared context in a future refactor).
 *
 * Scores < 60% → weak topics.
 * Unresolved doubts → unresolvedSubjects.
 * Past bookings → bookedMentorIds (novelty signal).
 */
async function fetchStudentActivity(userId: string): Promise<StudentActivity> {
  const [attemptsSnap, doubtsSnap, bookingsSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'testAttempts'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc'),
        limit(20),
      ),
    ),
    getDocs(
      query(
        collection(db, 'doubts'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20),
      ),
    ),
    getDocs(
      query(collection(db, 'bookings'), where('studentId', '==', userId)),
    ),
  ]);

  return {
    testAttempts: attemptsSnap.docs.map(d => ({
      topic: d.data().topic ?? '',
      score: d.data().score ?? 0,
      total: d.data().totalQuestions ?? 1,
    })),
    doubts: doubtsSnap.docs.map(d => ({
      subject: d.data().subject,
      isResolved: d.data().isResolved ?? false,
    })),
    bookings: bookingsSnap.docs.map(d => ({
      mentorId: d.data().mentorId,
    })),
  };
}
