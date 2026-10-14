// ── FEATURE: Doubts — AIExplanationDisplay
// Server component rendering the DOUBT_AI flow's explanation stream: reasoning
// trace, confidence, structured steps, a worked example, a copy-to-notes action,
// and pitch-deck generation.
import React from 'react';
import { AIExplanation } from '../types';
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Lightbulb,
  ArrowRight,
  Brain,
  FlaskConical,
  Tags,
  ShieldCheck,
} from 'lucide-react';
import { QuickAddTaskButton } from '../../productivity/components/QuickAddTaskButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIExplanationDisplayProps {
  explanation: AIExplanation;
  onAccept: () => void;
  onPostAnyway: () => void;
  isSubmitting: boolean;
}

/** Confidence → chip colour + copy. Calibrated honesty, not a percentage. */
const CONFIDENCE_META = {
  high: { label: 'High confidence', colour: '#4fdbc8', hint: 'Verified across the steps below.' },
  medium: { label: 'Medium confidence', colour: '#fbbf24', hint: 'Worth double-checking the details.' },
  low: { label: 'Low confidence', colour: '#ff8080', hint: 'Ambiguous or under-specified question — consider asking a mentor.' },
} as const;

export const AIExplanationDisplay: React.FC<AIExplanationDisplayProps> = ({
  explanation,
  onAccept,
  onPostAnyway,
  isSubmitting
}) => {
  const confidence = explanation.confidence
    ? CONFIDENCE_META[explanation.confidence]
    : null;

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

        {/* Confidence */}
        {confidence && (
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3"
            style={{
              background: `${confidence.colour}0d`,
              border: `1px solid ${confidence.colour}33`,
            }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: confidence.colour }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: confidence.colour }}>
              {confidence.label}
            </span>
            <span className="text-xs text-[#8899b8]">{confidence.hint}</span>
          </div>
        )}

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

        {/* Reasoning trace */}
        {explanation.reasoning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#ddb7ff] font-bold text-xs uppercase tracking-widest">
              <Brain size={14} />
              How this was reasoned
            </div>
            <div className="p-5 rounded-2xl bg-[rgba(221,183,255,0.04)] border border-[rgba(221,183,255,0.12)]">
              <p className="text-sm text-[#c8d4f0] leading-relaxed">{explanation.reasoning}</p>
            </div>
          </div>
        )}

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

        {/* Worked example */}
        {explanation.workedExample && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
              <FlaskConical size={14} />
              Worked example
            </div>
            <div className="p-5 rounded-2xl bg-[rgba(79,219,200,0.04)] border border-[rgba(79,219,200,0.12)] prose prose-sm dark:prose-invert prose-p:text-[#dae2fd] prose-pre:bg-[#0b1326] prose-pre:border prose-pre:border-[rgba(255,255,255,0.1)] max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation.workedExample}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Key concepts */}
        {explanation.keyConcepts && explanation.keyConcepts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#8899b8] font-bold text-xs uppercase tracking-widest">
              <Tags size={14} />
              Key concepts
            </div>
            <div className="flex flex-wrap gap-2">
              {explanation.keyConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c8d4f0',
                  }}
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* Self-verification */}
        {explanation.verification && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#a5f3fc] font-bold text-xs uppercase tracking-widest">
              <ShieldCheck size={14} />
              Self-check
            </div>
            <div className="p-4 rounded-xl bg-[rgba(165,243,252,0.03)] border border-[rgba(165,243,252,0.1)]">
              <p className="text-sm text-[#a5f3fc]/80 leading-relaxed">{explanation.verification}</p>
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
