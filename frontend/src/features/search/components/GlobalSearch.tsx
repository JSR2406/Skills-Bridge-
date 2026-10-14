'use client';

// ── FEATURE: Search — GlobalSearch (header overlay)
// Powers the top-bar search field: live grouped results (doubts / mentors /
// people) as you type, the user's recent searches when the box is empty, and
// keyboard navigation (↑ ↓ Enter Esc, plus ⌘K / Ctrl+K to focus).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  GraduationCap,
  Loader2,
  Search as SearchIcon,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { recordSearch, searchAll, searchHref, normalizeTerm } from '../api';
import type { SearchResults } from '../types';
import { RecentSearches } from './RecentSearches';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 180;
const MIN_QUERY_LENGTH = 2;

type Row =
  | { kind: 'doubt'; id: string; title: string; meta: string }
  | { kind: 'mentor'; id: string; title: string; meta: string }
  | { kind: 'person'; id: string; title: string; meta: string };

/** Flatten grouped results into a keyboard-navigable list. */
function toRows(results: SearchResults | null): Row[] {
  if (!results) return [];
  return [
    ...results.doubts.map((d) => ({
      kind: 'doubt' as const,
      id: d.id,
      title: d.title,
      meta: d.tags?.slice(0, 3).map((t) => `#${t}`).join('  ') || 'Doubt',
    })),
    ...results.mentors.map((m) => ({
      kind: 'mentor' as const,
      id: m.userId,
      title: m.name,
      meta: m.subjects?.slice(0, 3).join(' · ') || m.headline || 'Mentor',
    })),
    ...results.people.map((p) => ({
      kind: 'person' as const,
      id: p.uid,
      title: p.name,
      meta: p.role === 'mentor' ? 'Mentor' : p.role === 'admin' ? 'Admin' : 'Student',
    })),
  ];
}

function rowHref(row: Row): string {
  if (row.kind === 'doubt') return `/feed/${row.id}`;
  if (row.kind === 'mentor') return `/mentors/${row.id}`;
  // The messages page picks up "?q=" and opens the new-chat search with it.
  return `/messages?q=${encodeURIComponent(row.title)}`;
}

export function GlobalSearch() {
  const { user } = useAuth();
  const router = useRouter();

  const [term, setTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  /** Last completed lookup — keyed by the term it was run for. */
  const [lookup, setLookup] = useState<{ term: string; results: SearchResults } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastTerm, setLastTerm] = useState('');
  const [shortcutHint] = useState(() =>
    typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
      ? '⌘K'
      : 'Ctrl K',
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const trimmed = term.trim();
  const hasQuery = normalizeTerm(trimmed).length >= MIN_QUERY_LENGTH;
  const isOpen = isFocused;

  // Reset the keyboard cursor whenever the term changes (React's "adjust state
  // during render" pattern — avoids an extra effect-driven render).
  if (trimmed !== lastTerm) {
    setLastTerm(trimmed);
    setActiveIndex(0);
  }

  // ── Debounced lookup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasQuery) return;
    const timer = setTimeout(() => {
      searchAll(trimmed)
        .then((results) => setLookup({ term: trimmed, results }))
        .catch((err) => console.warn('[search] global search failed:', err));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, hasQuery]);

  // Stale = the visible lookup was for a different term — we keep showing the
// previous results (no flicker) and flag the panel as still loading.
  const isSearching = hasQuery && lookup?.term !== trimmed;
  const results = hasQuery ? lookup?.results ?? null : null;

  // ── ⌘K / Ctrl+K ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close when the user clicks anywhere else.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setIsFocused(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const rows = useMemo(() => toRows(results), [results]);
  const totalHits = rows.length;

  /** Where "Enter" lands: the richest group that matched. */
  const primaryHref = useMemo(() => {
    if (!hasQuery) return null;
    if (results?.doubts.length) return searchHref('/feed', trimmed);
    if (results?.mentors.length) return searchHref('/mentors', trimmed);
    if (results?.people.length) return searchHref('/messages', trimmed);
    return null;
  }, [hasQuery, results, trimmed]);

  const commitSearch = useCallback(
    (value: string, hits: number) => {
      if (!user) return;
      recordSearch(user.uid, value, 'global', hits).catch(console.error);
    },
    [user],
  );

  const go = useCallback(
    (href: string) => {
      setIsFocused(false);
      inputRef.current?.blur();
      router.push(href);
    },
    [router],
  );

  const handleEnter = useCallback(() => {
    if (!hasQuery) return;
    // The row list shrinks between lookups — never index past the end.
    const row = rows.length ? rows[Math.min(activeIndex, rows.length - 1)] : undefined;
    const href = row ? rowHref(row) : primaryHref;
    // Record even when nothing matched: "react hooks" finding nothing is still
    // something the user will want to retry from recent searches.
    commitSearch(trimmed, totalHits);
    if (href) go(href);
  }, [hasQuery, rows, activeIndex, trimmed, totalHits, commitSearch, go, primaryHref]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFocused(true);
        setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      }
    },
    [rows.length, handleEnter],
  );

  /** Fill the box with a recent term — the debounce re-runs the live search. */
  const selectRecent = useCallback((value: string) => {
    setTerm(value);
    setLookup(null);
    inputRef.current?.focus();
  }, []);

  const rowIcon = (kind: Row['kind']) => {
    if (kind === 'doubt') return <BookOpen className="w-3.5 h-3.5" />;
    if (kind === 'mentor') return <GraduationCap className="w-3.5 h-3.5" />;
    return <UserIcon className="w-3.5 h-3.5" />;
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-md hidden sm:block"
      // Tabbing out of the field (the mouse case is handled by the click listener)
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsFocused(false);
      }}
    >
      <div
        className="relative transition-all duration-300"
        style={{ maxWidth: isFocused ? '420px' : '320px' }}
      >
        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4fdbc8]/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={term}
          placeholder="Search doubts, mentors, tags..."
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search doubts, mentors and people"
          className="w-full h-9 pl-9 pr-16 text-sm font-[Manrope] text-[#dae2fd] placeholder:text-[#8899b8]/60 rounded-lg transition-all duration-300 outline-none"
          style={{
            background: isFocused ? 'rgba(28, 36, 64, 0.9)' : 'rgba(19, 27, 46, 0.6)',
            border: isFocused ? '1px solid rgba(79, 219, 200, 0.4)' : '1px solid rgba(79, 219, 200, 0.1)',
            boxShadow: isFocused ? '0 0 16px rgba(79, 219, 200, 0.1)' : 'none',
          }}
        />

        {term ? (
          <button
            onClick={() => {
              setTerm('');
              setLookup(null);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.1)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8899b8]/50 font-mono pointer-events-none">
            {isFocused ? shortcutHint : ''}
          </span>
        )}

        {/* ── Dropdown ── */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl overflow-hidden animate-fade-in"
            style={{
              background: 'rgba(15, 23, 37, 0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(79, 219, 200, 0.15)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 32px rgba(79,219,200,0.06)',
            }}
          >
            {!hasQuery ? (
              <RecentSearches
                userId={user?.uid}
                source="global"
                query={trimmed}
                onSelect={selectRecent}
              />
            ) : isSearching && totalHits === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-[#8899b8]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching…
              </div>
            ) : totalHits === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs font-semibold text-[#dae2fd]">
                  No matches for “{trimmed}”
                </p>
                <p className="text-[11px] text-[#8899b8] mt-0.5">
                  Try a different keyword — it will show up in your recent searches.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-[340px] overflow-y-auto py-1">
                  {rows.map((row, i) => (
                    <Link
                      key={`${row.kind}-${row.id}`}
                      href={rowHref(row)}
                      onClick={() => {
                        commitSearch(trimmed, totalHits);
                        setIsFocused(false);
                        inputRef.current?.blur();
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 transition-colors',
                        i === activeIndex
                          ? 'bg-[rgba(79,219,200,0.1)]'
                          : 'hover:bg-[rgba(79,219,200,0.05)]',
                      )}
                    >
                      <span
                        className={cn(
                          'w-7 h-7 shrink-0 rounded-lg flex items-center justify-center',
                          row.kind === 'doubt' && 'text-[#4fdbc8]',
                          row.kind === 'mentor' && 'text-[#ddb7ff]',
                          row.kind === 'person' && 'text-[#8899b8]',
                        )}
                        style={{
                          background:
                            row.kind === 'doubt'
                              ? 'rgba(79,219,200,0.1)'
                              : row.kind === 'mentor'
                                ? 'rgba(221,183,255,0.1)'
                                : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {rowIcon(row.kind)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-[#dae2fd] truncate">
                          {row.title}
                        </span>
                        <span className="block text-[10px] text-[#8899b8]/80 truncate">
                          {row.meta}
                        </span>
                      </span>
                      {i === activeIndex && <ArrowRight className="w-3.5 h-3.5 text-[#4fdbc8] shrink-0" />}
                    </Link>
                  ))}
                </div>

                <div
                  className="flex items-center justify-between px-4 py-2 border-t text-[10px] text-[#8899b8]"
                  style={{ borderColor: 'rgba(79,219,200,0.08)' }}
                >
                  <span>
                    {isSearching
                      ? 'Searching…'
                      : `${totalHits} result${totalHits === 1 ? '' : 's'} · saved to your history`}
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" />
                    {primaryHref ? 'Enter to open' : '↑ ↓ to browse'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}