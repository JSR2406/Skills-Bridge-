'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { subscribeToDoubt, voteDoubt } from '@/features/doubts/api/doubts';
import { subscribeToAnswers, postAnswer, acceptAnswer, Answer } from '@/features/doubts/api/answers';
import { Doubt } from '@/features/doubts/types';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  CheckCircle2,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Check,
  Send,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuickAddTaskButton } from '@/features/productivity/components/QuickAddTaskButton';

export default function DoubtDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { user, profile } = useAuth();

  const [doubt, setDoubt] = useState<Doubt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoadingDoubt, setIsLoadingDoubt] = useState(true);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(true);

  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingDoubt(true);
    const unsubDoubt = subscribeToDoubt(params.id, (d) => {
      setDoubt(d);
      setIsLoadingDoubt(false);
    });
    
    setIsLoadingAnswers(true);
    const unsubAnswers = subscribeToAnswers(params.id, (a) => {
      setAnswers(a);
      setIsLoadingAnswers(false);
    });

    return () => {
      unsubDoubt();
      unsubAnswers();
    };
  }, [params.id]);

  const handlePostAnswer = async () => {
    if (!user || !profile) {
      toast.error('Please log in to post an answer.');
      return;
    }
    if (!answerContent || answerContent === '<p></p>' || answerContent.length < 20) {
      toast.error('Please write a more detailed answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postAnswer(params.id, answerContent, user.uid, profile.name, profile.avatarUrl);
      toast.success('Answer posted! +5 reputation points 🎉');
      setAnswerContent('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (value: 1 | -1) => {
    if (!user) {
      toast.error('Please log in to vote.');
      return;
    }
    
    try {
      await voteDoubt(params.id, user.uid, value);
    } catch (err: any) {
      toast.error('Failed to register vote.');
    }
  };

  const handleAcceptAnswer = async (answer: Answer) => {
    if (!user || !doubt) return;
    if (user.uid !== doubt.authorId) {
      toast.error('Only the question author can accept an answer.');
      return;
    }
    if (answer.isAccepted) {
      toast.info('This answer is already accepted.');
      return;
    }

    setAcceptingId(answer.id);
    try {
      await acceptAnswer(answer.id, params.id, answer.authorId, doubt.authorId);
      toast.success('Answer accepted! +15 reputation points awarded to the answerer 🏆');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept answer.');
    } finally {
      setAcceptingId(null);
    }
  };

  if (isLoadingDoubt) return <LoadingSkeleton />;
  if (!doubt) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center glass-card p-10">
        <h2 className="text-xl font-semibold text-[#dae2fd] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Doubt not found</h2>
        <p className="text-[#8899b8] mb-6">This doubt may have been removed or does not exist.</p>
        <Link href="/feed" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-gradient">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>
    );
  }

  const isDoubtAuthor = user?.uid === doubt.authorId;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-[#8899b8] hover:text-[#4fdbc8] transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>
        <QuickAddTaskButton 
          title={`Follow up: ${doubt.title}`}
          type="follow-up"
          subject={doubt.subject}
          relatedDoubtId={doubt.id}
          buttonText="Schedule Follow-up"
          variant="outline"
          className="border-brand-500/20 text-brand-400 hover:bg-brand-500/10"
        />
      </div>

      {/* ── Doubt Header ── */}
      <div className="glass-card shadow-lg relative overflow-hidden">
        {/* subtle gradient flare top right */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#4fdbc8]/10 to-[#ddb7ff]/10 blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="p-6 sm:p-8 relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Voting Sidebar */}
          <div className="flex sm:flex-col items-center sm:items-center shrink-0 mb-2 sm:mb-0 bg-[rgba(15,23,37,0.4)] sm:bg-transparent rounded-xl p-2 sm:p-0 w-fit">
             <button 
                onClick={() => handleVote(1)} 
                className="p-1.5 rounded-md text-[#8899b8] hover:bg-[rgba(79,219,200,0.1)] hover:text-[#4fdbc8] transition-colors"
                title="Upvote"
             >
               <ChevronUp className="w-6 h-6 sm:w-8 sm:h-8" />
             </button>
             <span className="text-lg sm:text-2xl font-bold text-[#dae2fd] mx-3 sm:mx-0 sm:my-2">{doubt.voteScore || 0}</span>
             <button 
                onClick={() => handleVote(-1)} 
                className="p-1.5 rounded-md text-[#8899b8] hover:bg-[rgba(221,183,255,0.1)] hover:text-[#ddb7ff] transition-colors"
                title="Downvote"
             >
               <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
             </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
            {doubt.isResolved && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(79, 219, 200, 0.1)', color: '#4fdbc8', border: '1px solid rgba(79, 219, 200, 0.2)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
              </span>
            )}
            {doubt.tags.map(tag => (
              <span key={tag} className="badge-purple font-semibold">#{tag}</span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#dae2fd] mb-6 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {doubt.title}
          </h1>

          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[rgba(15,23,37,0.5)] border border-[rgba(79,219,200,0.08)] w-fit">
            <Link href={`/profile/${doubt.authorId}`} className="flex items-center gap-3 group/author">
              <Avatar className="w-9 h-9 ring-1 ring-[rgba(79,219,200,0.2)] shadow-[0_0_12px_rgba(79,219,200,0.15)] group-hover/author:ring-[#4fdbc8] transition-all">
                <AvatarImage src={doubt.authorAvatarUrl} alt={doubt.authorName} />
                <AvatarFallback className="text-xs font-bold" style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}>
                  {doubt.authorName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#dae2fd] group-hover/author:text-[#4fdbc8] transition-colors">{doubt.authorName}</span>
                  <span className="text-[10px] text-[#4fdbc8] uppercase tracking-wider font-bold">Author</span>
                </div>
                <span className="text-xs text-[#8899b8] font-medium">
                  {formatDistanceToNow(doubt.createdAt instanceof Date ? doubt.createdAt : new Date(), { addSuffix: true })}
                </span>
              </div>
            </Link>
            <div className="ml-4 pl-4 border-l border-[rgba(79,219,200,0.15)] flex flex-col justify-center">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#ddb7ff] uppercase tracking-wider">
                <MessageCircle className="w-3.5 h-3.5" />
                Responses
              </div>
              <span className="text-sm font-bold text-[#dae2fd]">{doubt.responsesCount}</span>
            </div>
          </div>

          <hr className="section-divider my-6" />

          {/* Markdown Content */}
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none 
            prose-pre:bg-[#131b2e] prose-pre:border prose-pre:border-[rgba(79,219,200,0.1)] prose-pre:shadow-lg
            prose-p:leading-relaxed prose-headings:font-['Plus_Jakarta_Sans'] prose-a:text-[#4fdbc8]
            prose-code:text-[#ddb7ff] prose-code:bg-[rgba(221,183,255,0.08)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md"
            dangerouslySetInnerHTML={{ __html: doubt.content }}
          />
          </div>
        </div>
      </div>

      {/* ── Answers Section ── */}
      <div>
        <div className="flex items-center gap-3 mb-6 mt-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(79,219,200,0.1)] border border-[rgba(79,219,200,0.2)] glow-teal-sm">
            <MessageCircle className="w-5 h-5 text-[#4fdbc8]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
        </div>

        {isLoadingAnswers ? (
          <LoadingSkeleton />
        ) : answers.length === 0 ? (
          <div className="text-center py-16 glass-card border-dashed">
            <MessageCircle className="w-10 h-10 text-[#8899b8]/40 mx-auto mb-4" />
            <p className="text-[#dae2fd] font-semibold text-lg mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>It's quiet here...</p>
            <p className="text-[#8899b8] text-sm">Be the first to share your knowledge and earn reputation points.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {answers.map(answer => (
              <div
                key={answer.id}
                className={cn(
                  'relative overflow-hidden rounded-xl p-6 sm:p-8 transition-all',
                  answer.isAccepted
                    ? 'bg-[rgba(23,31,51,0.8)] border border-[#4fdbc8]/40 shadow-[0_0_24px_rgba(79,219,200,0.1)]'
                    : 'glass-card'
                )}
              >
                {answer.isAccepted && (
                  <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#4fdbc8]/10 blur-[40px] pointer-events-none" />
                    <div className="flex items-center gap-2 text-[#4fdbc8] text-[13px] font-bold tracking-wide uppercase mb-4 pb-4 border-b border-[#4fdbc8]/20">
                      <CheckCircle2 className="w-4 h-4" />
                      Accepted Answer
                    </div>
                  </>
                )}

                <div
                  className="prose prose-sm sm:prose-base dark:prose-invert max-w-none 
                  prose-pre:bg-[#131b2e] prose-pre:border prose-pre:border-[rgba(79,219,200,0.1)] prose-pre:shadow-lg
                  prose-p:leading-relaxed prose-headings:font-['Plus_Jakarta_Sans'] prose-a:text-[#4fdbc8]"
                  dangerouslySetInnerHTML={{ __html: answer.content }}
                />

                <div className="flex items-center justify-between mt-6 pt-5 border-t border-[rgba(79,219,200,0.08)]">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${answer.authorId}`} className="flex items-center gap-3 group/answerer">
                      <Avatar className="w-8 h-8 ring-1 ring-[rgba(221,183,255,0.2)] group-hover/answerer:ring-[#ddb7ff] transition-all">
                        <AvatarImage src={answer.authorAvatarUrl} alt={answer.authorName} />
                        <AvatarFallback className="text-[10px]" style={{ background: 'linear-gradient(135deg, #131b2e, #1c2440)', color: '#ddb7ff' }}>
                          {answer.authorName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#dae2fd] group-hover/answerer:text-[#ddb7ff] transition-colors">{answer.authorName}</span>
                        <span className="text-[11px] font-medium text-[#8899b8]">
                          {formatDistanceToNow(answer.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {isDoubtAuthor && !answer.isAccepted && (
                    <button
                      onClick={() => handleAcceptAnswer(answer)}
                      disabled={acceptingId === answer.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(79,219,200,0.3)] text-[#4fdbc8] text-xs font-bold transition-all hover:bg-[rgba(79,219,200,0.1)] disabled:opacity-50"
                    >
                      {acceptingId === answer.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Mark as Answer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Post Answer Section ── */}
      {user ? (
        <div className="glass-card shadow-2xl relative overflow-hidden mt-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4fdbc8] to-[#ddb7ff] opacity-80" />
          <div className="px-6 sm:px-8 pt-8 pb-5 border-b border-[rgba(79,219,200,0.08)]">
            <h3 className="text-xl font-extrabold text-[#dae2fd] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your Answer</h3>
            <p className="text-[13px] text-[#8899b8]">
              Help the community — earn <span className="text-[#ddb7ff] font-bold">+5 pts</span> for responding, and <span className="text-[#4fdbc8] font-bold">+15 pts</span> if your answer is accepted!
            </p>
          </div>
          <div className="p-6 sm:p-8 space-y-5">
            <RichTextEditor
              content={answerContent}
              onChange={setAnswerContent}
              placeholder="Write a detailed explanation... Include code snippets if helpful!"
            />
            <div className="flex justify-end pt-2">
              <button
                onClick={handlePostAnswer}
                disabled={isSubmitting}
                className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post Answer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-10 mt-8 text-center border-[#ddb7ff]/20 bg-[rgba(19,27,46,0.6)]">
          <div className="w-12 h-12 rounded-full border border-[#ddb7ff]/30 mx-auto flex items-center justify-center mb-4 bg-[rgba(221,183,255,0.05)] text-[#ddb7ff]">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-[#dae2fd] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Want to contribute?</h3>
          <p className="text-[#8899b8] text-sm mb-6 max-w-sm mx-auto">Sign in to share your knowledge with the community and earn valuable reputation points.</p>
          <Link href="/login" className="btn-gradient inline-block px-6 py-2.5 rounded-lg text-sm">
            Sign In to Answer
          </Link>
        </div>
      )}
    </div>
  );
}
