'use client';

// ── FEATURE: Search — RecentSearches panel
// Dropdown of the user's recent searches, shared by the global header search and
// every page-level search box. Subscribes to `searchHistory` itself so callers
// only pass a query + an `onSelect`.
import { useCallback, useEffect, useState } from 'react';
import { Clock, Loader2, Search, Trash2, X } from 'lucide-react';
import {
  clearSearchHistory,
  recordSearch,
  removeSearchEntry,
  subscribeToSearchHistory,
} from '../api';
import { SEARCH_SOURCE_META, type SearchRecord, type SearchSource } from '../types';
import { cn } from '@/lib/utils';

export interface RecentSearchesProps {
  userId?: string;
  /** Surface the owning input lives on — recorded when a term is re-run. */
  source: SearchSource;
  /** Current input value; the panel stays hidden while the user is typing. */
  query: string;
  /** Called with the chosen term — the owner routes/filters from there. */
  onSelect: (term: string) => void;
  /** Show a spinner row while the first subscription lands. */
  showLoading?: boolean;
  className?: string;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RecentSearches({
  userId,
  source,
  query,
  onSelect,
  showLoading = true,
  className,
}: RecentSearchesProps) {
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsReady(false);
    const unsub = subscribeToSearchHistory(userId, (data) => {
      setRecords(data);
      setIsReady(true);
    });
    return unsub;
  }, [userId]);

  const handleSelect = useCallback(
    (record: SearchRecord) => {
      // Re-running a search bumps its recency — fire and forget.
      recordSearch(userId ?? '', record.term, record.lastSource ?? source).catch(console.error);
      onSelect(record.term);
    },
    [userId, source, onSelect],
  );

  const handleRemove = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!userId) return;
      try {
        await removeSearchEntry(userId, id);
      } catch (err) {
        console.error('[search] could not remove entry:', err);
      }
    },
    [userId],
  );

  const handleClearAll = useCallback(async () => {
    if (!userId) return;
    setIsClearing(true);
    try {
      await clearSearchHistory(userId);
    } catch (err) {
      console.error('[search] could not clear history:', err);
    } finally {
      setIsClearing(false);
    }
  }, [userId]);

  // While the user is typing, the caller's own results/inline filter own the space.
  if (query.trim()) return null;

  if (showLoading && !isReady) {
    return (
      <div className={cn('flex items-center justify-center gap-2 py-6 text-xs text-[#8899b8]', className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading search history…
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={cn('px-4 py-6 text-center', className)}>
        <div className="w-9 h-9 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
          style={{ background: 'rgba(79,219,200,0.06)', border: '1px solid rgba(79,219,200,0.12)' }}
        >
          <Search className="w-4 h-4 text-[#4fdbc8]/60" />
        </div>
        <p className="text-xs font-semibold text-[#dae2fd]">No searches yet</p>
        <p className="text-[11px] text-[#8899b8] mt-0.5">
          What you look for shows up here for one-tap re-runs.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8899b8]/70">
          <Clock className="w-3 h-3" />
          Recent searches
        </span>
        <button
          onClick={handleClearAll}
          disabled={isClearing}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#8899b8] hover:text-[#ff8080] disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          {isClearing ? 'Clearing…' : 'Clear all'}
        </button>
      </div>

      <div className="max-h-[260px] overflow-y-auto pb-1">
        {records.map((record) => {
          const meta = SEARCH_SOURCE_META[record.lastSource] ?? SEARCH_SOURCE_META.global;
          return (
            <div
              key={record.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(record)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(record);
                }
              }}
              className="group flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-[rgba(79,219,200,0.07)]"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-[#8899b8]/50 group-hover:text-[#4fdbc8] transition-colors" />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium text-[#dae2fd] truncate group-hover:text-[#4fdbc8] transition-colors">
                  {record.term}
                </span>
                <span className="block text-[10px] text-[#8899b8]/70 truncate">
                  {meta.label} · {relativeTime(record.lastSearchedAt)}
                  {record.timesSearched > 1 && ` · ${record.timesSearched}×`}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${record.term} from history`}
                onClick={(e) => handleRemove(e, record.id)}
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#8899b8]/0 group-hover:text-[#8899b8] hover:!text-[#ff8080] hover:bg-[rgba(255,128,128,0.1)] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}