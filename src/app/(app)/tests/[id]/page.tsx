'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getTest, saveTestAttempt } from '@/features/tests/api';
import { PracticeTest } from '@/features/tests/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Clock, LayoutList, ChevronRight, ChevronLeft, Flag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TestAttemptPage() {
  const params = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [test, setTest] = useState<PracticeTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(600); // Default 10 mins in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTest(params.id);
        if (data) {
          setTest(data);
          setTimeLeft(data.durationMinutes * 60);
        } else {
          toast.error('Test not found');
          router.push('/tests');
        }
      } catch (err) {
        console.error('Failed to load test:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  useEffect(() => {
    if (isLoading || !test || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, test, isSubmitting]);

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentIdx]: optIndex
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!test || !user) return;
    if (!autoSubmit && Object.keys(answers).length < test.questions.length) {
      const confirmSubmit = window.confirm('You have unanswered questions. Are you sure you want to submit?');
      if (!confirmSubmit) return;
    }

    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      let score = 0;
      test.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) {
          score += 1;
        }
      });

      const attemptId = await saveTestAttempt({
        testId: test.id,
        userId: user.uid,
        subject: test.subject,
        topic: test.topic,
        answers,
        score,
        totalQuestions: test.questions.length,
        timeTakenSeconds: (test.durationMinutes * 60) - timeLeft
      });

      toast.success(autoSubmit ? 'Time is up! Test submitted.' : 'Test submitted successfully!');
      router.replace(`/tests/results/${attemptId}`);
    } catch (err) {
      console.error('Failed to submit attempt:', err);
      toast.error('Failed to submit test. Please try again.');
      setIsSubmitting(false);
      // Restart timer if submission failed
      timerRef.current = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    }
  };

  if (isLoading) return <div className="max-w-3xl mx-auto mt-10"><LoadingSkeleton /></div>;
  if (!test) return null;

  const currentQ = test.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in relative h-[calc(100vh-4rem-64px)] flex flex-col">
      {/* Test Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{test.topic}</h1>
          <p className="text-sm text-brand-400 font-medium">{test.subject}</p>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold shadow-sm ${timeLeft < 60 ? 'bg-destructive/10 text-destructive border border-destructive/20 animate-pulse' : 'bg-surface-elevated text-foreground border border-border'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-6 mt-6">
        {/* Main Question Area */}
        <div className="flex-grow flex flex-col space-y-6">
          <Card className="bg-surface-card border-border shadow-sm flex-grow">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                <span>Question {currentIdx + 1} of {test.questions.length}</span>
                <span className="flex items-center gap-1"><Flag className="w-4 h-4"/> Mark for review</span>
              </div>
              <CardTitle className="text-lg leading-relaxed pt-2">
                {currentQ.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-[0_0_0_1px_theme(colors.brand.500)]' 
                      : 'border-border bg-surface hover:bg-surface-elevated hover:border-border/80 text-foreground'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${
                        isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-border text-muted-foreground'
                      }`}>
                        {['A','B','C','D'][optIdx]}
                      </div>
                      <span className="leading-snug">{opt}</span>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <Card className="bg-surface-card border-border sticky top-24">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-surface-elevated/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-brand-500" />
                Question Navigator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_, i) => {
                  const isAnswered = answers[i] !== undefined;
                  const isCurrent = currentIdx === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`w-10 h-10 rounded-md text-sm font-medium flex items-center justify-center transition-all ${
                        isCurrent ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-card bg-surface-elevated text-foreground' :
                        isAnswered ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' :
                        'bg-surface border border-border text-muted-foreground hover:bg-surface-elevated'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium text-foreground flex justify-between">
                  <span>Progress</span>
                  <span className="text-brand-500">{answeredCount}/{test.questions.length}</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${(answeredCount/test.questions.length)*100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-surface-card/80 backdrop-blur-md border-t border-border z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="border-border bg-surface hover:bg-surface-elevated"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          {currentIdx === test.questions.length - 1 ? (
            <Button 
              onClick={() => handleSubmit()} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          ) : (
            <Button 
              onClick={() => setCurrentIdx(p => Math.min(test.questions.length - 1, p + 1))}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
