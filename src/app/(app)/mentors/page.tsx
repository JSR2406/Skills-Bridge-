'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApprovedMentors } from '@/features/mentors/api';
import { MentorProfile } from '@/features/mentors/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Search, Star, BookOpen, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function MentorDirectoryPage() {
  const router = useRouter();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await getApprovedMentors();
        setMentors(data);
        setFilteredMentors(data);
      } catch (error) {
        console.error('Failed to load mentors:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMentors();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMentors(mentors);
      return;
    }
    const q = search.toLowerCase();
    const filtered = mentors.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.headline.toLowerCase().includes(q) ||
      m.subjects.some(s => s.toLowerCase().includes(q))
    );
    setFilteredMentors(filtered);
  }, [search, mentors]);

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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Expert Mentors
          </h1>
          <p className="text-[15px] text-[#8899b8] mt-3 leading-relaxed">
            Connect with top peers and alumni to get personalized help, crack tough subjects, and level up your skills instantly.
          </p>
        </div>
        <Link 
          href="/apply-mentor" 
          className="btn-gradient shrink-0 px-6 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(79,219,200,0.15)] relative z-10 hover:shadow-[0_0_24px_rgba(79,219,200,0.25)] hover:-translate-y-0.5"
        >
          Apply as Mentor
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4fdbc8]/50" />
        <input 
          placeholder="Search by name, subject, or expertise..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton />
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div 
              key={mentor.userId} 
              onClick={() => router.push(`/mentors/${mentor.userId}`)}
              className="group glass-card flex flex-col p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full border-[rgba(79,219,200,0.1)]"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#4fdbc8]/0 via-[#4fdbc8]/30 to-[#ddb7ff]/0 group-hover:via-[#4fdbc8] transition-all opacity-50 group-hover:opacity-100" />
              
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-[rgba(79,219,200,0.15)] shadow-[0_0_12px_rgba(79,219,200,0.1)] group-hover:ring-[rgba(79,219,200,0.4)] transition-all">
                      <AvatarImage src={mentor.avatarUrl} alt={mentor.name} className="object-cover" />
                      <AvatarFallback className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}>
                        {mentor.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0b1326] rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-[#4fdbc8] rounded-full shadow-[0_0_8px_#4fdbc8]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#dae2fd] group-hover:text-[#4fdbc8] transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {mentor.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#8899b8] uppercase tracking-wider mt-0.5">{mentor.college}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 bg-[rgba(255,184,77,0.1)] border border-[rgba(255,184,77,0.2)] px-2 py-0.5 rounded-[6px]">
                    <Star className="w-3 h-3 text-[#ffb84d] fill-[#ffb84d]" />
                    <span className="text-xs font-bold text-[#ffb84d]">{mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-[13px] font-bold text-[#dae2fd] mb-1.5 leading-snug line-clamp-1">{mentor.headline}</p>
                <p className="text-[13px] text-[#8899b8] leading-relaxed line-clamp-3">{mentor.bio}</p>
              </div>
              
              <div className="mt-auto pt-5 space-y-4">
                <div className="flex flex-wrap gap-1.5">
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
                
                <div className="flex items-center justify-between pt-4 border-t border-[rgba(79,219,200,0.08)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#8899b8] font-bold uppercase tracking-widest mb-0.5">Session Fee</span>
                    <div className="text-[15px] font-extrabold text-[#4fdbc8]">
                      ₹{mentor.fee}
                    </div>
                  </div>
                  <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(79,219,200,0.08)] text-[#4fdbc8] group-hover:bg-[#4fdbc8] group-hover:text-[#00201c] transition-colors shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-card border-dashed">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(79, 219, 200, 0.05)', border: '1px solid rgba(79, 219, 200, 0.1)' }}>
            <BookOpen className="w-7 h-7 text-[#4fdbc8]/60" />
          </div>
          <h3 className="text-lg font-bold text-[#dae2fd] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No mentors found</h3>
          <p className="text-sm text-[#8899b8] max-w-sm mx-auto">
            We couldn't find any mentors matching your search criteria. Try a different subject or keyword.
          </p>
        </div>
      )}
    </div>
  );
}
