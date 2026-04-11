'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createDoubt } from '@/features/doubts/api/doubts';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Loader2, X, Bot, Sparkles, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AskPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
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

      setAiAnswer(data.answer);
      toast.success('AI has answered your doubt!');
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
          title,
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-tr from-[#ddb7ff]/10 to-[#4fdbc8]/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(79,219,200,0.1)] relative">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
            <MessageSquarePlus className="w-4 h-4" />
            Community Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ask a Doubt
          </h1>
          <p className="text-[15px] text-[#8899b8] mt-3 leading-relaxed">
            Get help from peers, alumni, or our AI Assistant. Be highly specific with your question to receive the best answers.
          </p>
        </div>
      </div>

      <div className="glass-card shadow-2xl relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4fdbc8] via-[#ddb7ff] to-[#4fdbc8] opacity-80" />
        <div className="p-6 sm:p-10 space-y-8 relative z-10">
          
          <div className="space-y-3">
            <label htmlFor="title" className="text-sm font-extrabold text-[#dae2fd] uppercase tracking-wider block">Title</label>
            <input 
              id="title"
              placeholder="e.g. How does React Server Components hydration work under the hood?" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-all duration-300 placeholder:text-[#8899b8]/50"
              style={{ 
                background: 'rgba(19, 27, 46, 0.5)', 
                border: '1px solid rgba(79, 219, 200, 0.15)',
                color: '#dae2fd',
                fontFamily: "'Manrope', sans-serif",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(79, 219, 200, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              maxLength={120}
            />
            <p className="text-[11px] text-[#8899b8] text-right font-medium">{title.length}/120</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-extrabold text-[#dae2fd] uppercase tracking-wider block">Description</label>
            <div className="rounded-xl overflow-hidden border border-[rgba(79,219,200,0.15)] focus-within:border-[rgba(79,219,200,0.5)] focus-within:shadow-[0_0_20px_rgba(79,219,200,0.1)] transition-all bg-[rgba(19,27,46,0.5)]">
              <RichTextEditor 
                content={content} 
                onChange={setContent} 
                placeholder="Include code snippets, stack traces, and specifically what you've already tried to solve this..." 
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="tags" className="text-sm font-extrabold text-[#dae2fd] uppercase tracking-wider block">Tags (Max 5)</label>
              <button 
                className="h-8 px-3 rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center bg-[rgba(221,183,255,0.08)] text-[#ddb7ff] hover:bg-[rgba(221,183,255,0.15)] border border-[rgba(221,183,255,0.2)]"
                onClick={handleSuggestTags}
                disabled={isGeneratingTags}
                type="button"
              >
                {isGeneratingTags ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                Auto-Suggest Tags
              </button>
            </div>
            <input 
              id="tags"
              placeholder="e.g. react, typescript (press Enter to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-300 placeholder:text-[#8899b8]/50"
              style={{ 
                background: 'rgba(19, 27, 46, 0.5)', 
                border: '1px solid rgba(79, 219, 200, 0.15)',
                color: '#dae2fd',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(79, 219, 200, 0.15)'}
            />
            <div className="flex flex-wrap gap-2 pt-3">
              {tags.map((tag) => (
                <span key={tag} className="badge-purple font-semibold text-sm py-1.5 px-3 flex items-center pr-2">
                  #{tag}
                  <button 
                    className="ml-1.5 p-0.5 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── AI Answer Block ── */}
      {aiAnswer && (
        <div className="relative overflow-hidden rounded-2xl bg-[rgba(19,27,46,0.8)] border border-[#ddb7ff]/30 shadow-[0_0_30px_rgba(221,183,255,0.1)] animate-fade-in p-6 sm:p-8">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#ddb7ff] to-[#4fdbc8]" />
          <div className="flex items-center gap-3 mb-6 ml-2">
            <div className="w-10 h-10 rounded-xl bg-[rgba(221,183,255,0.1)] flex items-center justify-center border border-[#ddb7ff]/20">
              <Bot className="w-5 h-5 text-[#ddb7ff]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Assistant Answer</h2>
          </div>
          
          <div className="ml-2 prose prose-sm sm:prose-base dark:prose-invert max-w-none 
            prose-pre:bg-[#0b1326] prose-pre:border prose-pre:border-[rgba(221,183,255,0.1)] 
            prose-p:leading-relaxed prose-headings:font-['Plus_Jakarta_Sans'] prose-a:text-[#4fdbc8]"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiAnswer}
            </ReactMarkdown>
          </div>
          
          <div className="mt-8 pt-5 border-t border-[rgba(255,255,255,0.05)] ml-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[13px] font-bold text-[#8899b8] uppercase tracking-wider">Did this solve your problem?</p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => router.push('/feed')} 
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)] hover:bg-[rgba(79,219,200,0.2)] transition-all"
              >
                Yes, cancel post
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-bold flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                No, post to community anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!aiAnswer && (
        <div className="flex flex-wrap justify-end gap-4 pt-4">
          <button 
            onClick={() => router.back()} 
            disabled={isSubmitting || isAskingAI}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-[#8899b8] hover:text-[#dae2fd] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleAskAI} 
            disabled={isSubmitting || isAskingAI} 
            className="flex items-center px-5 py-2.5 rounded-lg text-sm font-bold bg-[rgba(221,183,255,0.08)] text-[#ddb7ff] border border-[rgba(221,183,255,0.2)] hover:bg-[rgba(221,183,255,0.15)] hover:shadow-[0_0_15px_rgba(221,183,255,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAskingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
            Ask AI First
          </button>
          
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isAskingAI} 
            className="btn-gradient flex items-center px-8 py-2.5 rounded-lg text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,219,200,0.15)]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Post to Feed
          </button>
        </div>
      )}
    </div>
  );
}
