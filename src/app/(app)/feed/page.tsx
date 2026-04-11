'use client';

import { useEffect, useState } from 'react';
import { subscribeToDoubts, voteDoubt } from '@/features/doubts/api/doubts';
import { Doubt } from '@/features/doubts/types';
import { DoubtCard } from '@/features/doubts/components/DoubtCard';

import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Plus, Search, Filter, Flame, Star, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const FILTER_TABS = [
  { label: 'Latest', icon: Clock },
  { label: 'Hot', icon: Flame },
  { label: 'Top', icon: Star },
];

const TRENDING_TAGS = ['react', 'nextjs', 'typescript', 'firebase', 'algorithms', 'css', 'python'];

const ACTIVE_MENTORS = [
  { name: 'Priya Sharma', subject: 'Data Structures', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', online: true },
  { name: 'Raj Kumar', subject: 'Web Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj', online: true },
  { name: 'Aisha Patel', subject: 'Machine Learning', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha', online: false },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Latest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToDoubts((data) => {
      setDoubts(data);
      setLoading(false);
    }, 30);
    return () => unsubscribe();
  }, []);

  const handleVote = async (doubtId: string, value: 1 | -1 | 0) => {
    if (!user) return;
    try {
      await voteDoubt(doubtId, user.uid, value);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDoubts = doubts.filter(d =>
    !searchQuery ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex gap-6 animate-fade-in pb-16">
      {/* ── Main Feed ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: 'linear-gradient(135deg, #dae2fd 0%, #4fdbc8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Doubt Feed
            </h1>
            <p className="text-[13px] text-[#8899b8] mt-1 font-[Manrope]">
              Discover peer questions and share your knowledge.
            </p>
          </div>
          <Link
            href="/ask"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4fdbc8 0%, #2ec4b6 100%)',
              color: '#00201c',
              boxShadow: '0 0 0 transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(79,219,200,0.35)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 transparent';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Plus className="w-4 h-4" />
            Ask a Doubt
          </Link>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4fdbc8]/50" />
            <input
              type="text"
              placeholder="Search doubts, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm rounded-lg outline-none transition-all duration-200"
              style={{
                background: 'rgba(19, 27, 46, 0.7)',
                border: '1px solid rgba(79, 219, 200, 0.1)',
                color: '#dae2fd',
                fontFamily: "'Manrope', sans-serif",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(79, 219, 200, 0.08)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-medium text-[#8899b8] hover:text-[#4fdbc8] transition-colors shrink-0"
            style={{
              background: 'rgba(19, 27, 46, 0.7)',
              border: '1px solid rgba(79, 219, 200, 0.1)',
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg w-fit"
          style={{ background: 'rgba(19, 27, 46, 0.6)', border: '1px solid rgba(79, 219, 200, 0.08)' }}
        >
          {FILTER_TABS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
              style={{
                background: activeFilter === label ? 'rgba(79, 219, 200, 0.12)' : 'transparent',
                color: activeFilter === label ? '#4fdbc8' : '#8899b8',
                border: activeFilter === label ? '1px solid rgba(79, 219, 200, 0.2)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Doubt list */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredDoubts.length > 0 ? (
            filteredDoubts.map((doubt, i) => (
              <Link
                key={doubt.id}
                href={`/feed/${doubt.id}`}
                className="block focus:outline-none rounded-xl"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <DoubtCard
                  doubt={doubt}
                  onVote={(id, val) => { handleVote(id, val); }}
                />
              </Link>
            ))
          ) : (
            <div
              className="py-20 text-center rounded-xl"
              style={{
                background: 'rgba(23, 31, 51, 0.5)',
                border: '1px dashed rgba(79, 219, 200, 0.15)',
              }}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(79, 219, 200, 0.08)', border: '1px solid rgba(79, 219, 200, 0.12)' }}
              >
                <TrendingUp className="w-7 h-7 text-[#4fdbc8]/50" />
              </div>
              <h3 className="text-base font-semibold text-[#dae2fd] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {searchQuery ? 'No matches found' : 'No doubts yet'}
              </h3>
              <p className="text-sm text-[#8899b8] max-w-xs mx-auto mb-6">
                {searchQuery ? 'Try a different search term.' : 'Be the first to ask a question and start the conversation.'}
              </p>
              {!searchQuery && (
                <Link
                  href="/ask"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'rgba(79, 219, 200, 0.1)', color: '#4fdbc8', border: '1px solid rgba(79, 219, 200, 0.2)' }}
                >
                  <Plus className="w-4 h-4" /> Ask a Question
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar ── */}
      <aside className="hidden xl:flex flex-col gap-4 w-[280px] shrink-0">
        {/* Active Mentors */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(23, 31, 51, 0.6)', border: '1px solid rgba(79, 219, 200, 0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#4fdbc8]" />
            <h3 className="text-sm font-bold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Active Mentors
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {ACTIVE_MENTORS.map(mentor => (
              <Link
                key={mentor.name}
                href="/mentors"
                className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-[rgba(79,219,200,0.05)] group"
              >
                <div className="relative shrink-0">
                  <img src={mentor.avatar} alt={mentor.name} className="w-8 h-8 rounded-full ring-1 ring-[rgba(79,219,200,0.2)]" />
                  <span
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#0b1326]"
                    style={{ background: mentor.online ? '#4fdbc8' : '#8899b8', boxShadow: mentor.online ? '0 0 6px rgba(79,219,200,0.5)' : 'none' }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#dae2fd] group-hover:text-[#4fdbc8] transition-colors truncate">{mentor.name}</p>
                  <p className="text-[10px] text-[#8899b8] truncate">{mentor.subject}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/mentors"
            className="flex items-center justify-center gap-1 mt-3 text-xs font-semibold text-[#4fdbc8] hover:text-[#ddb7ff] transition-colors"
          >
            View all mentors →
          </Link>
        </div>

        {/* Trending Tags */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(23, 31, 51, 0.6)', border: '1px solid rgba(79, 219, 200, 0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#ddb7ff]" />
            <h3 className="text-sm font-bold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Trending Tags
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TAGS.map((tag, i) => (
              <button
                key={tag}
                className="text-[11px] px-2.5 py-1 rounded-full font-mono transition-all duration-150 hover:border-[rgba(221,183,255,0.35)] hover:text-[#ddb7ff]"
                style={{
                  background: 'rgba(221, 183, 255, 0.06)',
                  color: i < 3 ? '#ddb7ff' : '#8899b8',
                  border: `1px solid ${i < 3 ? 'rgba(221, 183, 255, 0.2)' : 'rgba(221, 183, 255, 0.08)'}`,
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Ask CTA */}
        <Link
          href="/ask"
          className="flex flex-col items-center text-center gap-2 p-5 rounded-xl transition-all duration-200 hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, rgba(79,219,200,0.12) 0%, rgba(221,183,255,0.08) 100%)',
            border: '1px solid rgba(79, 219, 200, 0.2)',
            boxShadow: '0 0 24px rgba(79, 219, 200, 0.05)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4fdbc8, #2ec4b6)' }}
          >
            <Plus className="w-5 h-5 text-[#00201c]" />
          </div>
          <p className="text-sm font-bold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ask a Doubt
          </p>
          <p className="text-xs text-[#8899b8]">Get answers from your peers instantly</p>
        </Link>
      </aside>
    </div>
  );
}
