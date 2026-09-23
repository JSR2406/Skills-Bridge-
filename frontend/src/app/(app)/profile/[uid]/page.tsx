'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { BADGES } from '@/features/reputation/api';
import { Trophy, Flame, Target, UserCircle2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProfilePage() {
  const { uid } = useParams();
  const { user, profile: currentUserProfile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isOwner = user?.uid === uid;

  useEffect(() => {
    if (!uid) return;
    
    async function load() {
      setIsLoading(true);
      try {
        // Fetch user basic profile
        const userSnap = await getDoc(doc(db, 'users', uid as string));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setTargetProfile({
            uid,
            ...data
          });
          setStats({
            reputation: data.reputation || 0,
            streakDays: data.streakDays || 0,
            answersCount: data.answersCount || 0,
            badges: data.badges || [],
            testsCompletedCount: data.testsCompletedCount || 0,
            college: data.college || 'N/A',
            role: data.role || 'Student'
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [uid]);

  if (isLoading) return <div className="p-8 text-center"><LoadingSkeleton /></div>;
  if (!targetProfile) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-fade-in space-y-8">
      {/* Header Profile Section */}
      <div className="relative">
        <div className="h-40 bg-gradient-to-r from-[#1c2440] via-[#0b1326] to-[#1c2440] rounded-2xl border border-[rgba(79,219,200,0.1)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] to-transparent"></div>
        </div>
        <div className="absolute -bottom-10 left-8 flex items-end gap-6">
          <div className="w-24 h-24 rounded-3xl border-4 border-[#0b1326] bg-[#1c2440] shadow-xl flex items-center justify-center overflow-hidden">
             {targetProfile.avatarUrl ? (
               <img src={targetProfile.avatarUrl} alt={targetProfile.name} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-[#4fdbc8] to-[#ddb7ff] flex items-center justify-center text-[#00201c] text-3xl font-black">
                 {targetProfile.name.charAt(0)}
               </div>
             )}
          </div>
          <div className="mb-2">
            <h1 className="text-3xl font-black tracking-tight text-[#dae2fd]">{targetProfile.name}</h1>
            <p className="text-sm font-bold text-[#4fdbc8] uppercase tracking-widest">{targetProfile.role || 'Student'}</p>
          </div>
        </div>
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Link href="/settings">
              <Button variant="secondary" size="sm" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md">
                <Settings className="w-4 h-4 mr-2" /> settings
              </Button>
            </Link>
          </div>
        )}
      </div>


      <div className="pt-12"></div>

      {isLoading ? <LoadingSkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Stats column */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-surface-card border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Reputation</span>
                  </div>
                  <span className="font-bold text-foreground">{stats?.reputation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Day Streak</span>
                  </div>
                  <span className="font-bold text-foreground">{stats?.streakDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Tests Taken</span>
                  </div>
                  <span className="font-bold text-foreground">{stats?.testsCompletedCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-card border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm">Rank</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20 mb-3">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-foreground">
                  {stats?.reputation >= 500 ? 'Master' : stats?.reputation >= 100 ? 'Scholar' : 'Rising Star'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Keep contributing to rank up!</p>
              </CardContent>
            </Card>
          </div>

          {/* Badges and Activity Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-surface-card border-border">
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Badges you've earned through participation.</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.badges?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No badges yet. Start answering doubts to earn them!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {stats?.badges.map((bId: string) => {
                      const badge = BADGES[bId as keyof typeof BADGES];
                      if (!badge) return null;
                      return (
                        <div key={bId} className="flex flex-col items-center text-center p-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-surface-elevated border border-border mb-3 ${badge.color}`}>
                            {/* We just use Trophy everywhere generically for now since dynamic lucide resolution requires a mapping */}
                            <Trophy className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-bold text-foreground">{badge.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{badge.description}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
