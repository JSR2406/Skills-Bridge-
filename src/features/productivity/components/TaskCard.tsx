'use client';

import { Task, TaskPriority, TaskType } from '../types';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Tag, 
  AlertCircle,
  BookOpen,
  MessageSquare,
  Users,
  Calendar,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICONS: Record<TaskType, any> = {
  study: BookOpen,
  revision: Clock,
  'follow-up': MessageSquare,
  'exam-prep': AlertCircle,
  custom: Tag
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-red-500/10 text-red-400'
};

export function TaskCard({ task, onToggleStatus, onDelete }: TaskCardProps) {
  const Icon = TYPE_ICONS[task.type];
  const isDone = task.status === 'done';

  return (
    <div className={cn(
      "group relative p-4 rounded-xl border transition-all duration-200",
      isDone 
        ? "bg-surface/30 border-border/50 grayscale-[0.5] opacity-70" 
        : "bg-surface border-border hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5"
    )}>
      <div className="flex gap-4">
        {/* Toggle Button */}
        <button 
          onClick={() => onToggleStatus(task)}
          className={cn(
            "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
            isDone 
              ? "bg-brand-500 border-brand-500 text-surface" 
              : "border-muted-foreground hover:border-brand-500"
          )}
        >
          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn(
                "font-semibold text-foreground transition-all",
                isDone && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            
            <button 
              onClick={() => onDelete(task.id)}
              className="md:opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-400 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium uppercase tracking-wider">
            {/* Type Tag */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-muted-foreground whitespace-nowrap">
              <Icon className="w-3 h-3" />
              {task.type.replace('-', ' ')}
            </div>

            {/* Priority */}
            <div className={cn("px-2 py-1 rounded whitespace-nowrap", PRIORITY_COLORS[task.priority])}>
              {task.priority}
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
              <Calendar className="w-3 h-3" />
              {format(
                task.dueDateTime instanceof Date 
                  ? task.dueDateTime 
                  : (task.dueDateTime as any).toDate?.() || new Date(task.dueDateTime as any), 
                'MMM d, h:mm a'
              )}
            </div>

            {/* Subject Tag */}
            {task.subject && (
              <div className="px-2 py-1 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {task.subject}
              </div>
            )}
          </div>

          {/* Linked Objects */}
          {(task.relatedDoubtId || task.relatedTestId || task.relatedSessionId) && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
              {task.relatedDoubtId && (
                <Link 
                  href={`/feed/${task.relatedDoubtId}`}
                  className="flex items-center gap-1.5 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  View Doubt <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
              {task.relatedTestId && (
                <Link 
                  href={`/tests/${task.relatedTestId}`}
                  className="flex items-center gap-1.5 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  Go to Test <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
              {task.relatedSessionId && (
                <Link 
                  href={`/sessions`}
                  className="flex items-center gap-1.5 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  View Session <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
