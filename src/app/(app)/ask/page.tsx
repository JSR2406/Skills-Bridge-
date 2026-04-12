'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createDoubt } from '@/features/doubts/api/doubts';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Loader2, X, Bot, Sparkles, MessageSquarePlus, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AIExplanationDisplay } from '@/features/doubts/components/AIExplanationDisplay';
import { AIExplanation } from '@/features/doubts/types';

type AskStep = 'draft' | 'ai-check' | 'community';

export default function AskPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<AskStep>('draft');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (val && !tags.includes(val) && tags.length < 5) {
        setTags([...tags, val]);
        setTagInput('');
      } else if (tags.length >= 5) {
        toast.error('Maximum 5 tags allowed');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSuggestTags = async () => {
    if (title.length < 10 && content.length < 10) {
      toast.error('Add more title or description first');
      return;
    }
    
    try {
      setIsGeneratingTags(true);
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.tags && Array.isArray(data.tags)) {
        const newTags = Array.from(new Set([...tags, ...data.tags])).slice(0, 5);
        setTags(newTags);
        toast.success('Tags suggested!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to suggest tags');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleAskAI = async () => {
    if (title.length < 10 || content.length < 20 || content === '<p></p>') {
      toast.error('Please provide a detailed title and description first.');
      return;
    }

    try {
      setIsAskingAI(true);
      const res = await fetch('/api/ai/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAiExplanation(data);
      setStep('ai-check');
      
      // Auto-populate tags/title if AI suggested them
      if (data.titleSuggestion && !title) setTitle(data.titleSuggestion);
      if (data.tagSuggestions && tags.length === 0) setTags(data.tagSuggestions.slice(0, 5));

      toast.success('AI has resolved your doubt!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to get an answer from AI.');
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast.error('You must be logged in to ask a doubt.');
      return;
    }
    
    if (title.length < 10) {
      toast.error('Title is too short. Please be more descriptive.');
      return;
    }

    if (content.length < 20 || content === '<p></p>') {
      toast.error('Please provide more details in the description.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createDoubt(
        {
          authorId: user.uid,
          title: aiExplanation?.titleSuggestion || title,
          content,
          tags,
        }, 
        profile.name,
        profile.avatarUrl
      );
      
      toast.success('Doubt posted successfully!');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error creating doubt:', error);
      toast.error('Failed to post your doubt. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleResolveLocally = () => {
    toast.success('Great! Doubt resolved by AI. Returning to feed.');
    router.push('/feed');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-tr from-[#ddb7ff]/10 to-[#4fdbc8]/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* Hero Progress Indicator */}
      <div className="flex items-center justify-between px-4 max-w-2xl mx-auto mb-10">
        <div className="flex flex-col items-center gap-2 group">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${step === 'draft' ? 'bg-[#4fdbc8] text-[#0b1326] shadow-[0_0_15px_rgba(79,219,200,0.5)] scale-110' : 'bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] opacity-60'}`}>
            <HelpCircle size={20} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${step === 'draft' ? 'text-[#4fdbc8]' : 'text-[#8899b8]'}`}>Draft</span>
        </div>
        <div className={`h-[2px] flex-1 mx-4 transition-all duration-700 ${step !== 'draft' ? 'bg-[#4fdbc8]' : 'bg-[rgba(255,255,255,0.05)]'}`} />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${step === 'ai-check' ? 'bg-[#ddb7ff] text-[#0b1326] shadow-[0_0_15px_rgba(221,183,255,0.5)] scale-110' : 'bg-[rgba(221,183,255,0.1)] text-[#ddb7ff] opacity-60'}`}>
            <Bot size={20} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${step === 'ai-check' ? 'text-[#ddb7ff]' : 'text-[#8899b8]'}`}>AI Check</span>
        </div>
        <div className={`h-[2px] flex-1 mx-4 transition-all duration-700 ${step === 'community' ? 'bg-[#4fdbc8]' : 'bg-[rgba(255,255,255,0.05)]'}`} />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${step === 'community' ? 'bg-[#dae2fd] text-[#0b1326] shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110' : 'bg-[rgba(255,255,255,0.05)] text-[#dae2fd] opacity-60'}`}>
            <ShieldCheck size={20} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${step === 'community' ? 'text-[#dae2fd]' : 'text-[#8899b8]'}`}>Community</span>
        </div>
      </div>

      {/* ── Header ── */}
      {step === 'draft' && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(79,219,200,0.1)] relative">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[rgba(79,219,200,0.2)]">Phase 1</span>
              <div className="flex items-center gap-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
                <MessageSquarePlus className="w-4 h-4" />
                Input Protocol
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Define Your <span className="text-gradient">Doubt.</span>
            </h1>
            <p className="text-[15px] text-[#8899b8] mt-4 leading-relaxed max-w-xl">
              Be highly specific. Our AI first tries to solve it in under 5 seconds. If that fails, the world's best student community has your back.
            </p>
          </div>
        </div>
      )}

      {step === 'draft' && (
        <div className="glass-card shadow-2xl relative overflow-hidden transition-all duration-500">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4fdbc8] via-[#ddb7ff] to-[#4fdbc8] opacity-80" />
          <div className="p-6 sm:p-10 space-y-8 relative z-10">
            
            <div className="space-y-3">
              <label htmlFor="title" className="text-xs font-black text-[#8899b8] uppercase tracking-widest block pl-1">Question Title</label>
              <input 
                id="title"
                placeholder="e.g. How does React Server Components hydration work under the hood?" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl text-base outline-none transition-all duration-300 placeholder:text-[#8899b8]/50"
                style={{ 
                  background: 'rgba(19, 27, 46, 0.5)', 
                  border: '1px solid rgba(79, 219, 200, 0.15)',
                  color: '#dae2fd',
                  fontFamily: "'Manrope', sans-serif",
                }}
              />
              <p className="text-[10px] text-[#8899b8] text-right font-bold tracking-widest opacity-60 uppercase">{title.length}/120 characters</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-[#8899b8] uppercase tracking-widest block pl-1">Detailed Description</label>
              <div className="rounded-2xl overflow-hidden border border-[rgba(79,219,200,0.15)] focus-within:border-[rgba(79,219,200,0.5)] focus-within:shadow-[0_0_40px_rgba(79,219,200,0.1)] transition-all bg-[rgba(19,27,46,0.5)]">
                <RichTextEditor 
                  content={content} 
                  onChange={setContent} 
                  placeholder="Include code snippets, stack traces, and specifically what you've already tried to solve this..." 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="tags" className="text-xs font-black text-[#8899b8] uppercase tracking-widest block pl-1">Contextual Tags (Max 5)</label>
                <button 
                  className="h-9 px-4 rounded-xl text-xs font-black transition-all disabled:opacity-50 flex items-center bg-[rgba(221,183,255,0.08)] text-[#ddb7ff] hover:bg-[rgba(221,183,255,0.15)] border border-[rgba(221,183,255,0.2)] uppercase tracking-tighter"
                  onClick={handleSuggestTags}
                  disabled={isGeneratingTags}
                  type="button"
                >
                  {isGeneratingTags ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2 text-[#4fdbc8]" />}
                  Auto-Suggest
                </button>
              </div>
              <input 
                id="tags"
                placeholder="e.g. react, typescript (press Enter or comma to add)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full h-12 px-5 rounded-2xl text-sm outline-none transition-all duration-300 placeholder:text-[#8899b8]/50"
                style={{ 
                  background: 'rgba(19, 27, 46, 0.5)', 
                  border: '1px solid rgba(79, 219, 200, 0.15)',
                  color: '#dae2fd',
                }}
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <span key={tag} className="bg-[rgba(79,219,200,0.05)] text-[#4fdbc8] border border-[rgba(79,219,200,0.1)] font-sans font-black text-[11px] uppercase tracking-widest py-1.5 px-4 rounded-full flex items-center pr-2 transition-all hover:scale-105">
                    #{tag}
                    <button 
                      className="ml-2 p-1 rounded-full hover:bg-[rgba(255,157,157,0.2)] hover:text-[#ff9d9d] transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-6">
              <div className="flex justify-end gap-4 w-full">
                <button 
                  onClick={() => router.back()} 
                  className="px-6 py-3 rounded-xl text-sm font-bold text-[#8899b8] hover:text-[#dae2fd] transition-colors"
                >
                  Go Back
                </button>
                <button 
                  onClick={handleAskAI} 
                  disabled={isAskingAI || isSubmitting}
                  className="flex items-center px-10 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-[#4fdbc8] to-[#ddb7ff] text-[#0b1326] transition-all hover:shadow-[0_0_30px_rgba(79,219,200,0.3)] disabled:opacity-50 hover:scale-[1.02] active:scale-95 uppercase tracking-tight"
                >
                  {isAskingAI ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Bot className="w-5 h-5 mr-2" />}
                  Analyze with Smart AI
                </button>
              </div>
              
              <button 
                onClick={() => setStep('community')}
                className="text-[11px] font-black uppercase tracking-widest text-[#8899b8] hover:text-[#4fdbc8] transition-colors flex items-center gap-2 group"
              >
                Skip AI Check & Post to Community
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Structured AI Answer Block */}
      {step === 'ai-check' && aiExplanation && (
        <AIExplanationDisplay 
          explanation={aiExplanation}
          onAccept={handleResolveLocally}
          onPostAnyway={() => {
            setStep('community');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Confirmation Step (Final Post) */}
      {step === 'community' && (
        <div className="glass-card shadow-2xl p-10 space-y-8 animate-fade-in text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#4fdbc8]/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 rounded-3xl bg-[rgba(79,219,200,0.1)] border border-[rgba(79,219,200,0.2)] flex items-center justify-center mx-auto mb-6 text-[#4fdbc8]">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-4xl font-black text-[#dae2fd]">Ready to post?</h2>
          <p className="text-[#8899b8] max-w-lg mx-auto leading-relaxed">
            AI couldn't fully solve it? No worries. Your doubt will now be visible to thousands of expert developers and peers in the community feed.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => setStep('ai-check')} 
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold border border-[rgba(255,255,255,0.05)] text-[#8899b8] hover:text-[#dae2fd] transition-colors"
            >
              Back to AI Explanation
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-12 py-3.5 rounded-2xl text-sm font-black bg-[#dae2fd] text-[#0b1326] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
              Publish to Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
