'use client';

import { formatDistanceToNow } from 'date-fns';
import { Doubt } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, ArrowBigDown, MessageCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';


interface DoubtCardProps {
  doubt: Doubt;
  onVote?: (doubtId: string, value: 1 | -1 | 0) => void;
  userVote?: 1 | -1 | 0;
}

export function DoubtCard({ doubt, onVote, userVote = 0 }: DoubtCardProps) {
  const isUpvoted = userVote === 1;
  const isDownvoted = userVote === -1;

  const handleVote = (val: 1 | -1) => {
    if (!onVote) return;
    onVote(doubt.id, userVote === val ? 0 : val);
  };

  const timeAgo = formatDistanceToNow(
    doubt.createdAt instanceof Date ? doubt.createdAt : new Date(),
    { addSuffix: true }
  );

  return (
    <div
      className="flex gap-3 p-4 sm:p-5 rounded-xl transition-all duration-200 group cursor-pointer"
      style={{
        background: 'rgba(23, 31, 51, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(79, 219, 200, 0.08)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(28, 36, 64, 0.75)';
        el.style.borderColor = 'rgba(79, 219, 200, 0.2)';
        el.style.boxShadow = '0 0 20px rgba(79, 219, 200, 0.07), 0 4px 24px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(23, 31, 51, 0.6)';
        el.style.borderColor = 'rgba(79, 219, 200, 0.08)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <button
          onClick={(e) => { e.preventDefault(); handleVote(1); }}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
            isUpvoted
              ? "text-[#4fdbc8] bg-[rgba(79,219,200,0.15)]"
              : "text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)]"
          )}
        >
          <ArrowBigUp className={cn("w-5 h-5", isUpvoted && "fill-current")} />
        </button>

        <span
          className={cn(
            "text-sm font-bold leading-none tabular-nums",
            isUpvoted && "text-[#4fdbc8]",
            isDownvoted && "text-[#ff6b6b]",
            !isUpvoted && !isDownvoted && "text-[#8899b8]"
          )}
        >
          {doubt.voteScore}
        </span>

        <button
          onClick={(e) => { e.preventDefault(); handleVote(-1); }}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
            isDownvoted
              ? "text-[#ff6b6b] bg-[rgba(255,107,107,0.15)]"
              : "text-[#8899b8] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.08)]"
          )}
        >
          <ArrowBigDown className={cn("w-5 h-5", isDownvoted && "fill-current")} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2.5">
          <Link href={`/profile/${doubt.authorId}`} className="flex items-center gap-2 group/author">
            <Avatar className="w-5 h-5 ring-1 ring-[rgba(79,219,200,0.2)] group-hover/author:ring-[#4fdbc8] transition-all">
              <AvatarImage src={doubt.authorAvatarUrl} alt={doubt.authorName} />
              <AvatarFallback
                className="text-[9px] font-bold"
                style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}
              >
                {doubt.authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-[#dae2fd] group-hover/author:text-[#4fdbc8] transition-colors">{doubt.authorName}</span>
          </Link>
          <span className="text-[#8899b8]/40 text-xs">·</span>
          <span className="text-xs text-[#8899b8]">{timeAgo}</span>


          {doubt.isResolved && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[#4fdbc8] bg-[rgba(79,219,200,0.1)] px-2 py-0.5 rounded-full border border-[rgba(79,219,200,0.2)]">
              <CheckCircle2 className="w-3 h-3" />
              Resolved
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[15px] sm:text-base font-semibold text-[#dae2fd] mb-1.5 line-clamp-2 leading-snug group-hover:text-white transition-colors"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.01em' }}
        >
          {doubt.title}
        </h3>

        {/* Content preview */}
        <div
          className="text-sm text-[#8899b8] line-clamp-2 mb-3 leading-relaxed"
          style={{ fontFamily: "'Manrope', sans-serif" }}
          dangerouslySetInnerHTML={{ __html: doubt.content }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {doubt.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(221, 183, 255, 0.08)',
                  color: '#ddb7ff',
                  border: '1px solid rgba(221, 183, 255, 0.15)',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Answers count */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#8899b8] hover:text-[#4fdbc8] transition-colors ml-3 shrink-0">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{doubt.responsesCount} {doubt.responsesCount === 1 ? 'Answer' : 'Answers'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
