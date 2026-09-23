'use client';

import { useEffect, useState } from 'react';
import { subscribeToLeaderboard } from '@/features/reputation/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Trophy, TrendingUp, Sparkles, Medal, Award } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToLeaderboard((users) => {
      setLeaders(users);
      setIsLoading(false);
    }, 50); // Get top 50
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="glass-card shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ddb7ff]/20 to-[#4fdbc8]/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="p-8 sm:p-10 relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border border-[#ddb7ff]/30 glow-purple"
            style={{
              background: 'linear-gradient(135deg, rgba(221,183,255,0.1) 0%, rgba(79,219,200,0.05) 100%)',
            }}
          >
            <Trophy className="w-10 h-10 text-[#ddb7ff]" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Global Leaderboard
            </h1>
            <p className="text-[#8899b8] max-w-lg">
              The most active and helpful community members across all of SkillBridge. Earn reputation points by asking questions, providing answers, and keeping up your login streak!
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="glass-card p-2 sm:p-4 border-[#ddb7ff]/10">
          <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="hidden sm:flex items-center px-4 py-2 text-xs font-bold text-[#8899b8] tracking-wider uppercase border-b border-[rgba(79,219,200,0.08)] mb-2">
              <div className="w-16 text-center">Rank</div>
              <div className="flex-1">Member</div>
              <div className="w-32 text-center">Badges</div>
              <div className="w-24 text-right">Reputation</div>
            </div>

            {/* Rows */}
            {leaders.map((user, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              
              let RankIcon = null;
              let rankColor = '';
              if (rank === 1) { RankIcon = Trophy; rankColor = 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'; }
              else if (rank === 2) { RankIcon = Medal; rankColor = 'text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]'; }
              else if (rank === 3) { RankIcon = Award; rankColor = 'text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]'; }

              return (
                <Link
                  key={user.uid}
                  href={`/profile/${user.uid}`}
                  className="group flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 rounded-xl transition-all duration-300 hover:bg-[rgba(221,183,255,0.04)] relative overflow-hidden"
                >
                  {isTop3 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[rgba(221,183,255,0.02)] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* Rank */}
                  <div className="flex items-center sm:justify-center w-full sm:w-16 mb-3 sm:mb-0 shrink-0">
                    {isTop3 && RankIcon ? (
                      <RankIcon className={`w-6 h-6 ${rankColor}`} />
                    ) : (
                      <span className="text-lg font-extrabold text-[#4fdbc8]/50 w-8 text-center">{rank}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0 pr-4">
                    <Avatar className={`w-10 h-10 ring-2 ${isTop3 ? 'ring-[#ddb7ff]/40 shadow-[0_0_12px_rgba(221,183,255,0.2)]' : 'ring-transparent'} group-hover:ring-[#4fdbc8]/30 transition-all`}>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="font-bold text-[#00201c]" style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}>
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className={`font-bold truncate text-[15px] ${isTop3 ? 'text-[#dae2fd]' : 'text-[#8899b8] group-hover:text-[#dae2fd] transition-colors'} font-['Plus_Jakarta_Sans']`}>
                        {user.name}
                      </span>
                      {user.role === 'mentor' && (
                        <span className="text-[10px] font-semibold text-[#4fdbc8] tracking-wider uppercase">Mentor</span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1 sm:justify-center w-full sm:w-32 my-2 sm:my-0">
                    {user.badges && user.badges.length > 0 ? (
                      <div className="flex -space-x-1">
                        {user.badges.slice(0, 3).map((badgeMsg: string, i: number) => (
                           <div key={i} className="w-6 h-6 rounded-full bg-[rgba(19,27,46,0.9)] border border-[#ddb7ff]/30 flex items-center justify-center text-[10px] z-10" title={badgeMsg}>
                              ✨
                           </div>
                        ))}
                        {user.badges.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-[#131b2e] border border-[#ddb7ff]/20 flex items-center justify-center text-[9px] font-bold text-[#8899b8] z-0">
                            +{user.badges.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#8899b8]/40 font-medium">No basic badges</span>
                    )}
                  </div>

                  {/* Reputation */}
                  <div className="flex items-center sm:justify-end gap-1.5 w-full sm:w-24 mt-2 sm:mt-0 font-bold text-base sm:text-lg tracking-tight">
                     <Sparkles className={`w-4 h-4 ${isTop3 ? 'text-[#ddb7ff]' : 'text-[#4fdbc8]'}`} />
                     <span className={isTop3 ? 'text-[#ddb7ff]' : 'text-[#4fdbc8]'}>
                        {user.reputation || 0}
                     </span>
                  </div>
                </Link>
              );
            })}
            
            {leaders.length === 0 && (
               <div className="text-center py-10">
                  <p className="text-[#8899b8]">No ranks calculated yet.</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
