'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTest, getTestAttempt } from '@/features/tests/api';
import { PracticeTest, TestAttempt } from '@/features/tests/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { CheckCircle2, XCircle, Clock, Trophy, ChevronRight, BarChart3, RotateCcw } from 'lucide-react';
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
        <Card className="md:col-span-1 bg-surface-card border-border overflow-hidden relative">
          <div className={`absolute top-0 left-0 w-full h-2 ${isGood ? 'bg-green-500' : 'bg-yellow-500'}`}/>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isGood ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <div className="text-5xl font-black">{percentage}%</div>
              <p className="text-sm font-medium text-muted-foreground mt-2">{attempt.score} out of {attempt.totalQuestions} correct</p>
            </div>
            <div className="w-full pt-4 mt-2 border-t border-border/50 text-sm flex justify-between">
              <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-1"/> Time taken</span>
              <span className="font-semibold">{timeStr}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-surface-card border-border">
          <CardHeader className="border-b border-border/50 bg-surface-elevated/30">
            <CardTitle className="text-lg">Detailed Review</CardTitle>
            <CardDescription>Review your answers and read explanations.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {test.questions.map((q, idx) => {
                const userAns = attempt.answers[idx];
                const isCorrect = userAns === q.correctIndex;
                const isUnanswered = userAns === undefined;

                return (
                  <div key={idx} className="p-6 space-y-4 hover:bg-surface-elevated/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold leading-relaxed text-foreground">
                          {idx + 1}. {q.text}
                        </h4>
                        
                        <div className="mt-4 space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isUserAns = userAns === optIdx;
                            const isActualCorrect = q.correctIndex === optIdx;
                            let style = "border-border text-muted-foreground bg-surface";
                            let prefix = "";

                            if (isActualCorrect) {
                              style = "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400";
                              prefix = "✓ ";
                            } else if (isUserAns && !isCorrect) {
                              style = "border-destructive/50 bg-destructive/10 text-destructive";
                              prefix = "✗ ";
                            }

                            return (
                              <div key={optIdx} className={`p-3 rounded-lg border text-sm ${style}`}>
                                <span className="font-medium mr-2">{['A','B','C','D'][optIdx]}.</span>
                                {prefix}{opt}
                              </div>
                            )
                          })}
                        </div>
                        
                        {isUnanswered && (
                          <div className="mt-3 text-sm text-yellow-500 font-medium">
                            You didn't answer this question.
                          </div>
                        )}

                        <div className="mt-4 p-4 rounded-lg bg-brand-500/5 border border-brand-500/20">
                          <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">Explanation</p>
                          <p className="text-sm text-brand-100">{q.explanation}</p>
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
