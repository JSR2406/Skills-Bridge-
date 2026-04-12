'use client';

import { AIStudyPlan, StudyBlock } from '../types';
import { 
  Sparkles, 
  Clock, 
  BookOpen, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AIStudyPlanViewProps {
  plan: AIStudyPlan;
  onCreateTask: (block: StudyBlock) => void;
  isLoading?: boolean;
}

export function AIStudyPlanView({ plan, onCreateTask, isLoading }: AIStudyPlanViewProps) {
  const [createdBlocks, setCreatedBlocks] = useState<Set<number>>(new Set());

  const handleCreateTask = (block: StudyBlock, index: number) => {
    onCreateTask(block);
    setCreatedBlocks(prev => new Set(prev).add(index));
  };

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl border border-brand-500/20 bg-brand-500/5 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded bg-brand-500/20" />
          <div className="h-4 w-48 bg-brand-500/20 rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-xl border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 relative overflow-hidden group">
        <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-brand-500/10 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">AI Study Insights</h3>
          </div>
          <p className="text-[#8899b8] leading-relaxed">
            {plan.summary}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {plan.focusAreas.map((area, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-surface/50 border border-brand-500/20 text-[11px] font-bold text-brand-400 uppercase tracking-wider">
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Suggested Study Blocks</h4>
          <span className="text-[10px] text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded tracking-widest uppercase">
            Data Driven
          </span>
        </div>

        <div className="grid gap-4">
          {plan.studyBlocks.map((block, index) => (
            <div 
              key={index}
              className="group p-5 rounded-xl border border-border bg-surface hover:border-brand-500/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-brand-400 uppercase tracking-widest px-2 py-0.5 rounded bg-brand-500/10">
                      {block.subject || 'Special Activity'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <Clock className="w-3 h-3" />
                      {block.durationMinutes}m
                    </div>
                  </div>
                  <h5 className="font-bold text-foreground group-hover:text-brand-400 transition-colors">
                    {block.title}
                  </h5>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {block.description}
                  </p>
                </div>

                <button
                  disabled={createdBlocks.has(index)}
                  onClick={() => handleCreateTask(block, index)}
                  className={cn(
                    "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                    createdBlocks.has(index)
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-surface border border-border text-muted-foreground hover:border-brand-500 hover:text-brand-400 hover:scale-105 active:scale-95 shadow-sm"
                  )}
                  title={createdBlocks.has(index) ? "Task added to planner" : "Add to Study Planner"}
                >
                  {createdBlocks.has(index) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Follow-ups */}
      <div className="p-5 rounded-xl border border-border bg-surface/50 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
          <AlertCircle className="w-4 h-4 text-brand-400" />
          Pro-Tips & Follow-ups
        </div>
        <ul className="space-y-2.5">
          {plan.followUps.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-[#8899b8] leading-relaxed">
              <ArrowRight className="w-4 h-4 text-brand-500/50 shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
