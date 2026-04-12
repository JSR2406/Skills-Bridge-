'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTest, getTestAttempt } from '@/features/tests/api';
import { PracticeTest, TestAttempt } from '@/features/tests/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { CheckCircle2, XCircle, Clock, Trophy, ChevronRight, BarChart3, RotateCcw, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { QuickAddTaskButton } from '@/features/productivity/components/QuickAddTaskButton';

export default function TestResultPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [test, setTest] = useState<PracticeTest | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const attemptData = await getTestAttempt(params.id);
        if (attemptData) {
          setAttempt(attemptData);
          const testData = await getTest(attemptData.testId);
          setTest(testData);
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (isLoading) return <div className="max-w-3xl mx-auto mt-10"><LoadingSkeleton /></div>;
  if (!test || !attempt) return <div className="text-center py-20">Result not found.</div>;

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const isGood = percentage >= 70;
  
  const m = Math.floor(attempt.timeTakenSeconds / 60);
  const s = attempt.timeTakenSeconds % 60;
  const timeStr = `${m}m ${s}s`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Test Result</h1>
          <p className="text-sm text-brand-400 font-medium mt-1">{attempt.topic} • {attempt.subject}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="bg-surface-elevated">
            <Link href="/tests"><BarChart3 className="w-4 h-4 mr-2" /> All Tests</Link>
          </Button>
          <Button className="bg-brand-500 hover:bg-brand-600" onClick={() => router.push(`/tests/${test.id}`)}>
            <RotateCcw className="w-4 h-4 mr-2" /> Retake Test
          </Button>
          <QuickAddTaskButton 
            title={`Revise: ${attempt.topic}`}
            description={`I scored ${percentage}% on this test. Need to focus on weak areas and read explanations.`}
            type="revision"
            subject={attempt.subject}
            relatedTestId={test.id}
            buttonText="Schedule Revision"
            variant="outline"
            className="border-brand-500/20 text-brand-400 hover:bg-brand-500/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-surface-card border-border overflow-hidden relative group">
          <div className={`absolute top-0 left-0 w-full h-2 ${isGood ? 'bg-[#4fdbc8]' : 'bg-[#ffb84d]'}`}/>
          
          {/* Points Payout Floating Badge */}
          <div className="absolute top-6 right-6 animate-bounce-slow">
            <div className="bg-[#4fdbc8]/10 border border-[#4fdbc8]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(79,219,200,0.1)]">
              <Sparkles className="w-4 h-4 text-[#4fdbc8]" />
              <span className="text-sm font-black text-[#4fdbc8]">+15 Pts</span>
            </div>
          </div>

          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isGood ? 'bg-[#4fdbc8]/10 text-[#4fdbc8] border border-[#4fdbc8]/20' : 'bg-[#ffb84d]/10 text-[#ffb84d] border border-[#ffb84d]/20'}`}>
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <div className="text-6xl font-black tracking-tighter text-[#dae2fd]">{percentage}<span className="text-2xl text-[#8899b8] ml-1">%</span></div>
              <p className="text-[10px] font-black text-[#8899b8] uppercase tracking-widest mt-2">{attempt.score} out of {attempt.totalQuestions} correct</p>
            </div>
            <div className="w-full pt-6 mt-4 border-t border-[rgba(255,255,255,0.05)] text-xs flex justify-between">
              <span className="text-[#8899b8] font-bold uppercase tracking-wider flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#4fdbc8]"/> Efficiency</span>
              <span className="font-extrabold text-[#dae2fd]">{timeStr}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-surface-card border-border">
          <CardHeader className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,37,0.3)]">
            <div className="flex items-center gap-2 mb-1">
               <BarChart3 className="w-4 h-4 text-[#ddb7ff]" />
               <CardTitle className="text-lg text-[#dae2fd]">Performance Analysis</CardTitle>
            </div>
            <CardDescription className="text-[#8899b8] text-xs">Review individual responses and AI-generated reasonings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[rgba(255,255,255,0.05)]">
              {test.questions.map((q, idx) => {
                const userAns = attempt.answers[idx];
                const isCorrect = userAns === q.correctIndex;
                const isUnanswered = userAns === undefined;

                return (
                  <div key={idx} className="p-6 space-y-5 hover:bg-[rgba(255,255,255,0.02)] transition-colors relative group">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${isCorrect ? 'bg-[#4fdbc8]/10 text-[#4fdbc8] border-[#4fdbc8]/20' : 'bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20'}`}>
                        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[10px] font-black text-[#8899b8] uppercase tracking-[0.2em]">Question {idx + 1}</span>
                           <span className="px-2 py-0.5 rounded-md bg-[rgba(221,183,255,0.05)] border border-[rgba(221,183,255,0.1)] text-[#ddb7ff] text-[9px] font-bold uppercase tracking-wider">{q.category}</span>
                        </div>
                        <h4 className="text-base font-bold leading-relaxed text-[#dae2fd] mb-5">
                          {q.text}
                        </h4>
                        
                        <div className="grid sm:grid-cols-2 gap-3">
                           {q.options.map((opt, optIdx) => {
                             const isUserAns = userAns === optIdx;
                             const isActualCorrect = q.correctIndex === optIdx;
                             
                             let borderColor = "rgba(255,255,255,0.08)";
                             let bgColor = "rgba(19, 27, 46, 0.4)";
                             let textColor = "#8899b8";

                             if (isActualCorrect) {
                               borderColor = "rgba(79, 219, 200, 0.3)";
                               bgColor = "rgba(79, 219, 200, 0.05)";
                               textColor = "#4fdbc8";
                             } else if (isUserAns && !isCorrect) {
                               borderColor = "rgba(255, 107, 107, 0.3)";
                               bgColor = "rgba(255, 107, 107, 0.05)";
                               textColor = "#ff6b6b";
                             }

                             return (
                               <div key={optIdx} className="p-4 rounded-xl border text-sm transition-all flex items-start gap-3" style={{ borderColor, backgroundColor: bgColor }}>
                                 <span className="font-black text-[11px] mt-0.5 opacity-40" style={{ color: textColor }}>{['A','B','C','D'][optIdx]}</span>
                                 <span className="font-medium leading-snug flex-1" style={{ color: textColor }}>{opt}</span>
                                 {isActualCorrect && <CheckCircle2 className="w-4 h-4 text-[#4fdbc8] shrink-0" />}
                                 {isUserAns && !isCorrect && <XCircle className="w-4 h-4 text-[#ff6b6b] shrink-0" />}
                               </div>
                             )
                           })}
                        </div>
                        
                        {isUnanswered && (
                          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[#ffb84d]/5 border border-[#ffb84d]/10 text-[#ffb84d] text-[11px] font-bold uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" /> Item was skipped during assessment
                          </div>
                        )}

                        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-[rgba(15,23,37,0.8)] to-[rgba(10,14,24,0.8)] border border-[rgba(221,183,255,0.1)] relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                             <Zap className="w-12 h-12 text-[#ddb7ff]" />
                          </div>
                          <p className="text-[10px] font-black text-[#ddb7ff] uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Sparkles className="w-3.5 h-3.5" /> AI Learning Insight
                          </p>
                          <p className="text-sm text-[#dae2fd] leading-relaxed relative z-10">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
