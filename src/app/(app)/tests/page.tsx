'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserAttempts, saveGeneratedTest, getAvailableTests } from '@/features/tests/api';
import { TestAttempt, PracticeTest } from '@/features/tests/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { BrainCircuit, BookCheck, Clock, Loader2, Sparkles, TrendingUp, X, Trophy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PracticeTestsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [availableTests, setAvailableTests] = useState<PracticeTest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Generate Test Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [historyData, availableData] = await Promise.all([
          getUserAttempts(user!.uid),
          getAvailableTests()
        ]);
        setHistory(historyData);
        setAvailableTests(availableData);
      } catch (err) {
        console.error('Failed to load tests:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    load();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic) {
      toast.error('Subject and Topic are required');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty, questionCount: 5 })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.questions && data.questions.length > 0) {
        // save test
        const testId = await saveGeneratedTest({
          subject,
          topic,
          difficulty,
          durationMinutes: 10,
          createdByAI: true,
          questions: data.questions
        });
        
        toast.success('Test generated successfully!');
        setIsModalOpen(false);
        router.push(`/tests/${testId}`);
      } else {
        toast.error('AI generated an empty test');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate test');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 relative">
      <div className="absolute top-20 left-0 w-72 h-72 bg-gradient-to-tr from-[#ddb7ff]/5 to-[#4fdbc8]/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(79,219,200,0.1)] relative">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
            <BrainCircuit className="w-4 h-4" />
            AI-Powered Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Practice Tests
          </h1>
          <p className="text-[15px] text-[#8899b8] mt-3 leading-relaxed">
            Generate custom AI-powered MCQs on any topic instantly. Identify your weak points, earn reputation points, and conquer the subjects you're learning.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-gradient shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(79,219,200,0.15)] relative z-10 hover:shadow-[0_0_24px_rgba(79,219,200,0.25)] hover:-translate-y-0.5"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Test
        </button>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0b1326]/80 backdrop-blur-md" onClick={() => !isGenerating && setIsModalOpen(false)} />
          <div className="relative z-50 w-full max-w-md glass-card shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#4fdbc8] to-[#ddb7ff]" />
            <form onSubmit={handleGenerate} className="flex flex-col h-full relative">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#dae2fd] font-extrabold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <BrainCircuit className="w-5 h-5 text-[#ddb7ff]" />
                    AI Test Generator
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#8899b8] hover:text-[#4fdbc8] transition-colors p-1" disabled={isGenerating}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-[#8899b8]">Define the subject and specific topic you want to test your knowledge on.</p>
              </div>

              <div className="px-6 py-4 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#dae2fd] uppercase tracking-wider">Subject Area</label>
                  <input 
                    placeholder="e.g. Computer Science, Physics" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-300"
                    style={{ 
                      background: 'rgba(19, 27, 46, 0.7)', 
                      border: '1px solid rgba(79, 219, 200, 0.1)',
                      color: '#dae2fd',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.1)'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#dae2fd] uppercase tracking-wider">Specific Topic</label>
                  <input 
                    placeholder="e.g. Dynamic Programming, Newton's Laws" 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-300"
                    style={{ 
                      background: 'rgba(19, 27, 46, 0.7)', 
                      border: '1px solid rgba(79, 219, 200, 0.1)',
                      color: '#dae2fd',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.1)'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#dae2fd] uppercase tracking-wider">Difficulty Level</label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 h-10 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${
                          difficulty === d 
                            ? 'bg-[rgba(79,219,200,0.15)] text-[#4fdbc8] border border-[rgba(79,219,200,0.3)] shadow-[0_0_12px_rgba(79,219,200,0.1)]' 
                            : 'bg-transparent text-[#8899b8] border border-[rgba(79,219,200,0.1)] hover:border-[rgba(79,219,200,0.2)] hover:text-[#dae2fd]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 mt-2 bg-[rgba(15,23,37,0.5)] border-t border-[rgba(79,219,200,0.08)] flex justify-end gap-3 rounded-b-2xl">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-bold text-[#8899b8] hover:text-[#dae2fd] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isGenerating} 
                  className="btn-gradient px-6 py-2 rounded-lg text-sm flex items-center min-w-[140px] justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Build Test
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Stats Overview ── */}
      {!isLoadingHistory && history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-[rgba(79,219,200,0.1)] flex items-center justify-center mb-1">
              <Trophy className="w-5 h-5 text-[#4fdbc8]" />
            </div>
            <div className="text-2xl font-black text-[#dae2fd]">{history.length}</div>
            <div className="text-[10px] font-bold text-[#8899b8] uppercase tracking-wider">Tests Taken</div>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-[rgba(221,183,255,0.1)] flex items-center justify-center mb-1">
              <Sparkles className="w-5 h-5 text-[#ddb7ff]" />
            </div>
            <div className="text-2xl font-black text-[#dae2fd]">
              {Math.round(history.reduce((acc, h) => acc + (h.score / h.totalQuestions) * 100, 0) / history.length)}%
            </div>
            <div className="text-[10px] font-bold text-[#8899b8] uppercase tracking-wider">Avg. Score</div>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-[rgba(79,219,200,0.1)] flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5 text-[#4fdbc8]" />
            </div>
            <div className="text-2xl font-black text-[#dae2fd]">
              {history.reduce((acc, h) => acc + h.score, 0)}
            </div>
            <div className="text-[10px] font-bold text-[#8899b8] uppercase tracking-wider">Correct Answers</div>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-[rgba(221,183,255,0.1)] flex items-center justify-center mb-1">
              <TrendingUp className="w-5 h-5 text-[#ddb7ff]" />
            </div>
            <div className="text-2xl font-black text-[#dae2fd]">
              {history.length * 15}
            </div>
            <div className="text-[10px] font-bold text-[#8899b8] uppercase tracking-wider">Reputation Earned</div>
          </div>
        </div>
      )}

      <div className="pt-4 pb-8">
        <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3 text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-10 h-10 rounded-xl bg-[rgba(79,219,200,0.08)] border border-[rgba(79,219,200,0.2)] flex items-center justify-center">
            <BookCheck className="w-5 h-5 text-[#4fdbc8]" />
          </div>
          Available Practice Tests
        </h2>
        {isLoadingHistory ? (
          <div className="grid md:grid-cols-2 gap-5"><LoadingSkeleton /><LoadingSkeleton /></div>
        ) : availableTests.length === 0 ? (
          <div className="text-center py-10 glass-card border-dashed">
            <p className="text-sm text-[#8899b8]">No practice tests available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableTests.map((test, i) => (
              <div 
                key={test.id} 
                onClick={() => router.push(`/tests/${test.id}`)}
                className="glass-card group flex flex-col cursor-pointer hover:-translate-y-1 transition-all duration-300 relative overflow-hidden p-5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="px-2 py-1 bg-[rgba(221,183,255,0.1)] text-[#ddb7ff] text-[10px] font-bold rounded uppercase tracking-wider">
                    {test.difficulty}
                  </div>
                  <div className="text-[#8899b8] text-xs flex items-center"><Clock className="w-3 h-3 mr-1"/> {test.durationMinutes}m</div>
                </div>
                <h4 className="font-extrabold text-[#dae2fd] text-lg mb-1 group-hover:text-[#4fdbc8] transition-colors">{test.topic}</h4>
                <p className="text-xs text-[#8899b8] mb-4">{test.subject}</p>
                <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                  <span className="text-xs text-[#8899b8]">{test.questions?.length || 0} Questions</span>
                  <span className="text-[#4fdbc8] font-bold text-sm bg-[rgba(79,219,200,0.1)] px-3 py-1 rounded-lg flex items-center group-hover:bg-[#4fdbc8] group-hover:text-black transition-all">
                    Start Test <TrendingUp className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── History Section ── */}
      <div className="pt-4">
        <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3 text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-10 h-10 rounded-xl bg-[rgba(221,183,255,0.08)] border border-[rgba(221,183,255,0.2)] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#ddb7ff]" />
          </div>
          Your Test History
        </h2>
        
        {isLoadingHistory ? (
          <div className="grid md:grid-cols-2 gap-5"><LoadingSkeleton /><LoadingSkeleton /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 glass-card border-dashed">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[rgba(79,219,200,0.05)] border border-[rgba(79,219,200,0.1)]">
              <BookCheck className="w-8 h-8 text-[#4fdbc8]/60" />
            </div>
            <h3 className="text-lg font-bold text-[#dae2fd] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No tests taken yet</h3>
            <p className="text-sm text-[#8899b8] max-w-sm mx-auto mb-6">
              Generate an AI test to start practicing, mastering subjects, and tracking your progress.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold">
              <Sparkles className="w-4 h-4" /> Generate First Test
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {history.map((attempt, i) => {
              const dateStr = new Date(attempt.submittedAt as Date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
              const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
              const isGood = percentage >= 70;
              const isPerfect = percentage === 100;
              const isPoor = percentage < 40;
              
              const scoreColor = isGood ? '#4fdbc8' : isPoor ? '#ff6b6b' : '#ffb84d';
              const scoreBg = isGood ? 'rgba(79,219,200,0.1)' : isPoor ? 'rgba(255,107,107,0.1)' : 'rgba(255,184,77,0.1)';
              
              return (
                <div 
                  key={attempt.id} 
                  onClick={() => router.push(`/tests/results/${attempt.id}`)}
                  className="glass-card group flex items-stretch cursor-pointer hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Left accent bar */}
                  <div className="w-1.5 shrink-0 bg-opacity-80 transition-all duration-300 group-hover:w-2" style={{ background: scoreColor }} />
                  
                  <div className="flex-1 p-5 sm:p-6 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-[#dae2fd] line-clamp-1 mb-1.5 group-hover:text-[#4fdbc8] transition-colors text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {attempt.topic}
                      </h4>
                      <p className="text-xs font-bold text-[#ddb7ff] uppercase tracking-wider mb-3">
                        {attempt.subject}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#8899b8] font-medium">
                        <span className="flex items-center bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 mr-1.5 text-[#4fdbc8]"/>{Math.ceil(attempt.timeTakenSeconds/60)}m</span>
                        <span className="opacity-50">•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4 shrink-0 flex flex-col items-end">
                      <div 
                        className="text-2xl font-black tracking-tight mb-1" 
                        style={{ color: scoreColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {percentage}%
                      </div>
                      <div className="text-[10px] font-bold text-[#8899b8] uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {attempt.score}/{attempt.totalQuestions}
                      </div>
                      {isPerfect && (
                        <div className="text-[10px] text-[#ffb84d] font-bold mt-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Flawless
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover glow effect behind content */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
