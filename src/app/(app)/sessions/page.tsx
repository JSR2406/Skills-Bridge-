'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { subscribeToUserSessions } from '@/features/mentors/api';
import { SessionBooking } from '@/features/mentors/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Calendar, Clock, Video, CheckCircle2, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { QuickAddTaskButton } from '@/features/productivity/components/QuickAddTaskButton';

export default function MySessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = subscribeToUserSessions(user.uid, (data) => {
      setSessions(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (isLoading) return <div className="max-w-4xl mx-auto mt-10"><LoadingSkeleton /></div>;

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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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

      {sessions.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(79, 219, 200, 0.05)', border: '1px solid rgba(79, 219, 200, 0.1)' }}>
            <Calendar className="w-8 h-8 text-[#4fdbc8]/60" />
          </div>
          <h3 className="text-xl font-extrabold text-[#dae2fd] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No sessions booked yet</h3>
          <p className="text-sm text-[#8899b8] mb-8 max-w-sm mx-auto">
            Find an expert mentor and book a 1-on-1 session to overcome your blockers and accelerate your learning.
          </p>
          <Link href="/mentors" className="btn-gradient px-6 py-3 rounded-lg text-sm font-bold inline-flex items-center gap-2">
            Browse Mentors
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, i) => {
            const start = new Date(session.startTime as Date);
            const isUpcoming = start > new Date();
            const dateStr = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(session.endTime as Date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

            return (
              <div 
                key={session.id} 
                className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                  isUpcoming 
                    ? 'glass-card border-[rgba(79,219,200,0.2)] shadow-[0_0_24px_rgba(79,219,200,0.05)] hover:border-[#4fdbc8]/40' 
                    : 'bg-[rgba(19,27,46,0.5)] border border-[rgba(255,255,255,0.05)] opacity-80'
                }`}
                style={{ animationDelay: `${i * 50}ms`, animationName: 'fade-in', animationFillMode: 'both' }}
              >
                {isUpcoming && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#4fdbc8] to-[#ddb7ff]" />}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 ml-2">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-widest rounded-md ${
                        isUpcoming
                          ? 'bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)]'
                          : 'bg-[rgba(255,255,255,0.05)] text-[#8899b8]'
                      }`}>
                        {isUpcoming ? 'Scheduled' : 'Completed'}
                      </span>
                      {session.paymentStatus === 'paid' && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4fdbc8] bg-[rgba(79,219,200,0.05)] rounded-md border border-[rgba(79,219,200,0.1)]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#dae2fd] tracking-tight mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Session with <span className="text-[#4fdbc8]">{session.mentorName}</span>
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

                  <div className="shrink-0 md:min-w-[200px]">
                    {isUpcoming ? (
                      <div className="bg-[rgba(15,23,37,0.7)] border border-[rgba(79,219,200,0.1)] p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[10px] text-[#ddb7ff] font-bold uppercase tracking-widest block">Meeting Details</span>
                        <a 
                          href={session.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full btn-gradient py-2.5 rounded-lg text-[13px] font-bold shadow-[0_0_15px_rgba(79,219,200,0.15)] flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" /> Join Call
                        </a>
                        <QuickAddTaskButton 
                          title={`Prep: ${session.mentorName} Session`}
                          description={`Prepare specific questions and list the doubts I want to discuss with ${session.mentorName}.`}
                          type="exam-prep"
                          relatedSessionId={session.id}
                          buttonText="Schedule Prep"
                          variant="ghost"
                          className="w-full text-[12px] text-[#8899b8] hover:text-[#dae2fd] h-8"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link 
                          href={`/mentors/${session.mentorId}`}
                          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold text-[#8899b8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#dae2fd] transition-colors"
                        >
                          <User className="w-4 h-4" /> View Mentor <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                        <QuickAddTaskButton 
                          title={`Review notes from ${session.mentorName}`}
                          description={`Follow up on the advice and resources shared during my 1-on-1 session.`}
                          type="follow-up"
                          relatedSessionId={session.id}
                          buttonText="Schedule Follow-up"
                          variant="ghost"
                          className="w-full text-[12px] text-[#8899b8] hover:text-[#dae2fd] h-8"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
