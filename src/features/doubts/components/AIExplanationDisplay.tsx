import React from 'react';
import { AIExplanation } from '../types';
import { Bot, CheckCircle2, AlertCircle, Bookmark, Lightbulb, ArrowRight } from 'lucide-react';
import { QuickAddTaskButton } from '../../productivity/components/QuickAddTaskButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIExplanationDisplayProps {
  explanation: AIExplanation;
  onAccept: () => void;
  onPostAnyway: () => void;
  isSubmitting: boolean;
}

export const AIExplanationDisplay: React.FC<AIExplanationDisplayProps> = ({ 
  explanation, 
  onAccept, 
  onPostAnyway,
  isSubmitting 
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[rgba(19,27,46,0.8)] border border-[rgba(221,183,255,0.2)] shadow-[0_0_50px_rgba(221,183,255,0.05)] animate-fade-in p-1 sm:p-1 mt-10">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Bot size={120} className="text-[#ddb7ff]" />
      </div>
      
      <div className="glass-card !bg-transparent !border-0 p-6 sm:p-10 space-y-10 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ddb7ff] to-[#4fdbc8] p-[1px]">
            <div className="w-full h-full rounded-2xl bg-[#0b1326] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#ddb7ff]" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#dae2fd] tracking-tight">AI Diagnostic Result</h2>
            <p className="text-sm text-[#8899b8] font-medium">Scaffolded explanation for your doubt</p>
          </div>
        </div>

        {/* Restated Question */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
            <CheckCircle2 size={14} />
            Understanding check
          </div>
          <div className="p-4 rounded-xl bg-[rgba(79,219,200,0.05)] border border-[rgba(79,219,200,0.1)]">
            <p className="text-[#dae2fd] font-medium italic">"{explanation.restatedQuestion}"</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-[#ddb7ff] font-bold text-xs uppercase tracking-widest">
            <Lightbulb size={14} />
            Step-by-Step Resolution
          </div>
          <div className="space-y-4">
            {explanation.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(221,183,255,0.1)] border border-[rgba(221,183,255,0.2)] flex items-center justify-center text-[#ddb7ff] font-black text-sm group-hover:bg-[#ddb7ff] group-hover:text-[#0b1326] transition-all duration-300">
                  {idx + 1}
                </div>
                <div className="pt-1.5 flex-1 prose prose-sm dark:prose-invert prose-p:text-[#dae2fd] prose-pre:bg-[#0b1326] prose-pre:border prose-pre:border-[rgba(255,255,255,0.1)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{step}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Mistakes */}
        {explanation.commonMistakes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#ff9d9d] font-bold text-xs uppercase tracking-widest">
              <AlertCircle size={14} />
              What to watch out for
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {explanation.commonMistakes.map((mistake, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[rgba(255,157,157,0.03)] border border-[rgba(255,157,157,0.1)] text-[#ff9d9d] text-sm font-medium flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9d9d] mt-1.5 shrink-0" />
                  {mistake}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#8899b8] font-bold text-xs uppercase tracking-widest">
            <Bookmark size={14} />
            Cheat Sheet
          </div>
          <div className="p-5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
            <p className="text-[#8899b8] text-sm leading-relaxed">{explanation.summaryNotes}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-[#dae2fd]">Still need human help?</p>
            <p className="text-xs text-[#8899b8]">You can post this to the community feed if the AI wasn't enough.</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <QuickAddTaskButton 
              title={`Review AI Answer: ${explanation.restatedQuestion.slice(0, 30)}...`}
              description={`I used AI to solve this doubt. Need to revisit the steps: ${explanation.summaryNotes}`}
              type="revision"
              variant="outline"
              className="flex-1 sm:flex-none border-[rgba(221,183,255,0.3)] text-[#ddb7ff] hover:bg-[rgba(221,183,255,0.05)] px-6"
            />
            <button 
              onClick={onPostAnyway}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold border border-[rgba(79,219,200,0.2)] text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.05)] transition-all flex items-center justify-center gap-2"
            >
              Post to Community
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={onAccept}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-bold bg-[#4fdbc8] text-[#0b1326] hover:shadow-[0_0_20px_rgba(79,219,200,0.3)] transition-all shadow-lg"
            >
              Solved! Thanks Bot.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
