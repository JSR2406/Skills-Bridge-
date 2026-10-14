// ── FEATURE: Search — API (client)
// Two responsibilities:
//   1. Search *history* — one doc per unique term per user in `searchHistory`,
//      realtime-subscribed by the header dropdown and every page-level search box.
//   2. Global search — `searchAll()` aggregates doubts + mentors + people for the
//      header overlay.
//
// This module is the one deliberate exception to the "features never import other
// features" rule: search is cross-cutting by definition, and it only touches the
// *read* APIs of `doubts` / `mentors` (history writes stay local to this module).
import { db } from '@/lib/firebase/config';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { fetchDoubts } from '@/features/doubts/api/doubts';
import { getApprovedMentors } from '@/features/mentors/api';
import type { Doubt } from '@/features/doubts/types';
import type { MentorProfile } from '@/features/mentors/types';
import type { PersonResult, SearchRecord, SearchResults, SearchSource } from './types';

const SEARCH_HISTORY_COLLECTION = 'searchHistory';

/** Hard cap on stored terms per user — anything older than the newest N is pruned. */
export const MAX_HISTORY_ENTRIES = 50;
/** How many recent terms the realtime subscription pulls down. */
export const RECENT_HISTORY_LIMIT = 12;
/** Hits per group returned by {@link searchAll}. */
const MAX_RESULTS_PER_GROUP = 5;
/** How many recent docs are scanned client-side when matching (see `searchAll`). */
const DOUBT_SCAN_LIMIT = 80;
const USER_SCAN_LIMIT = 20;
/** Terms shorter than this are treated as noise rather than intent. */
const MIN_TERM_LENGTH = 2;
const MAX_TERM_LENGTH = 80;
/** Firestore batch writes cap at 500 ops. */
const BATCH_LIMIT = 400;
/** Pruning is background housekeeping — never run it more often than this. */
const PRUNE_THROTTLE_MS = 60_000;

// ── Local mirror ───────────────────────────────────────────────────────────────
// Search history is low-stakes personal data and the overlay must never feel
// broken. Every write is mirrored to localStorage and used as the display source
// whenever the Firestore subscription is unavailable (rules not deployed yet,
// missing composite index, offline). The live subscription always wins when it
// works, so the two never show up as duplicates.

const localKey = (userId: string) => `skillsbridge:searchHistory:${userId}`;

function readLocalHistory(userId: string): SearchRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.term === 'string')
      .map((r) => ({ ...r, createdAt: new Date(r.createdAt), lastSearchedAt: new Date(r.lastSearchedAt) }));
  } catch {
    return [];
  }
}

function writeLocalHistory(userId: string, records: SearchRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = records.slice(0, RECENT_HISTORY_LIMIT).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      lastSearchedAt: r.lastSearchedAt.toISOString(),
    }));
    window.localStorage.setItem(localKey(userId), JSON.stringify(trimmed));
  } catch {
    /* private mode / quota exceeded — the Firestore copy still stands */
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Lower-case + collapse whitespace so "  React   Hooks " and "react hooks" merge. */
export function normalizeTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Deterministic doc id per (user, term) — repeat searches update one doc
 * instead of piling up duplicates. `encodeURIComponent` keeps the id free of
 * `/`, which Firestore treats as a path separator.
 */
function entryId(userId: string, normalized: string): string {
  return `${userId}_${encodeURIComponent(normalized).slice(0, 100)}`;
}

/** Reject "a" / whitespace-only / absurdly long terms before touching Firestore. */
function isUsableTerm(raw: string): boolean {
  const t = raw.trim();
  return t.length >= MIN_TERM_LENGTH && t.length <= MAX_TERM_LENGTH;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

// ── Search history: writes ─────────────────────────────────────────────────────

/**
 * Persist a search the user just ran.
 *
 * Repeat searches of the same term merge into a single doc (bumping
 * `timesSearched` / `lastSearchedAt` and merging `sources`), so the dropdown
 * shows the N most *recent distinct* things the user looked for rather than a
 * wall of duplicates. Runs inside a transaction because two rapid searches can
 * race, and the merge is read-modify-write.
 *
 * The local mirror is written first so history survives a Firestore failure;
 * the transaction still rejects (permission-denied, offline) and callers are
 * expected to swallow that.
 */
export async function recordSearch(
  userId: string,
  term: string,
  source: SearchSource = 'global',
  resultCount = 0,
): Promise<void> {
  const normalized = normalizeTerm(term);
  if (!userId || !isUsableTerm(normalized)) return;

  const ref = doc(db, SEARCH_HISTORY_COLLECTION, entryId(userId, normalized));
  const trimmed = term.trim().slice(0, MAX_TERM_LENGTH);
  const now = new Date();

  // ── Local mirror (merge + bump, newest first) ──────────────────────────────
  const local = readLocalHistory(userId);
  const existing = local.find((r) => r.normalizedTerm === normalized);
  const mirrored: SearchRecord = {
    id: ref.id,
    userId,
    term: trimmed,
    normalizedTerm: normalized,
    lastSource: source,
    sources: existing
      ? existing.sources.includes(source)
        ? existing.sources
        : [...existing.sources, source]
      : [source],
    resultCount,
    timesSearched: (existing?.timesSearched || 0) + 1,
    createdAt: existing?.createdAt ?? now,
    lastSearchedAt: now,
  };
  writeLocalHistory(userId, [mirrored, ...local.filter((r) => r.normalizedTerm !== normalized)]);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    // serverTimestamp() is not usable inside transactions (same constraint the
    // booking transaction documents) — Timestamp.now() is the established
    // trade-off in this codebase.
    const ts = Timestamp.now();

    if (!snap.exists()) {
      tx.set(ref, {
        userId,
        term: trimmed,
        normalizedTerm: normalized,
        lastSource: source,
        sources: mirrored.sources,
        resultCount,
        timesSearched: 1,
        createdAt: ts,
        lastSearchedAt: ts,
      });
      return;
    }

    const prev = snap.data();
    const sources: SearchSource[] = Array.isArray(prev.sources) ? prev.sources : [];

    tx.update(ref, {
      lastSource: source,
      sources: sources.includes(source) ? sources : [...sources, source],
      resultCount,
      timesSearched: (prev.timesSearched || 0) + 1,
      lastSearchedAt: ts,
    });
  });

  schedulePrune(userId);
}

/** Delete one entry (the "x" on a row in the recent-searches list). */
export async function removeSearchEntry(userId: string, id: string): Promise<void> {
  writeLocalHistory(
    userId,
    readLocalHistory(userId).filter((r) => r.id !== id),
  );
  await deleteDoc(doc(db, SEARCH_HISTORY_COLLECTION, id));
}

/** Wipe the signed-in user's entire search history. */
export async function clearSearchHistory(userId: string): Promise<void> {
  writeLocalHistory(userId, []);

  const snap = await getDocs(
    query(collection(db, SEARCH_HISTORY_COLLECTION), where('userId', '==', userId)),
  );
  if (snap.empty) return;

  const chunks = chunk(snap.docs.map((d) => d.ref), BATCH_LIMIT);
  for (const refs of chunks) {
    const batch = writeBatch(db);
    refs.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/**
 * Drop entries beyond {@link MAX_HISTORY_ENTRIES}, newest kept. Exported for
 * manual use / tests; normal operation goes through the throttled
 * {@link schedulePrune}.
 */
export async function pruneSearchHistory(userId: string): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, SEARCH_HISTORY_COLLECTION),
      where('userId', '==', userId),
      orderBy('lastSearchedAt', 'desc'),
    ),
  );
  if (snap.size <= MAX_HISTORY_ENTRIES) return;

  const stale = snap.docs.slice(MAX_HISTORY_ENTRIES).map((d) => d.ref);
  for (const refs of chunk(stale, BATCH_LIMIT)) {
    const batch = writeBatch(db);
    refs.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

const lastPrunedAt = new Map<string, number>();

/** Run {@link pruneSearchHistory} at most once per user per {@link PRUNE_THROTTLE_MS}. */
function schedulePrune(userId: string): void {
  const now = Date.now();
  const last = lastPrunedAt.get(userId) || 0;
  if (now - last < PRUNE_THROTTLE_MS) return;
  lastPrunedAt.set(userId, now);
  pruneSearchHistory(userId).catch((err) => console.warn('[search] history prune failed:', err));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ── Search history: reads ──────────────────────────────────────────────────────

/**
 * Realtime list of the user's most recent distinct searches, newest first.
 * Falls back to the local mirror when Firestore rejects the query (rules not
 * deployed yet, missing composite index, offline) so the dropdown degrades to
 * "device-local history" instead of erroring the header.
 */
export function subscribeToSearchHistory(
  userId: string,
  callback: (records: SearchRecord[]) => void,
): () => void {
  const q = query(
    collection(db, SEARCH_HISTORY_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastSearchedAt', 'desc'),
    fsLimit(RECENT_HISTORY_LIMIT),
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId ?? userId,
            term: data.term ?? '',
            normalizedTerm: data.normalizedTerm ?? '',
            lastSource: data.lastSource ?? 'global',
            sources: Array.isArray(data.sources) ? data.sources : [],
            resultCount: data.resultCount ?? 0,
            timesSearched: data.timesSearched ?? 1,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            lastSearchedAt: data.lastSearchedAt?.toDate?.() ?? new Date(),
          } as SearchRecord;
        }),
      );
    },
    (err) => {
      console.warn('[search] history subscription unavailable, using local mirror:', err.message);
      callback(readLocalHistory(userId));
    },
  );
}

// ── Global search ──────────────────────────────────────────────────────────────

/**
 * Ranked matches for a term across doubts, mentors and people.
 *
 * Firestore has no full-text index, so this scans a bounded window of recent
 * docs (same approach as the feed's client-side filter) and scores in memory:
 * title/name hits outrank tag/body hits. Deliberately cheap — the header calls
 * this on a ~180ms debounce.
 */
export async function searchAll(term: string): Promise<SearchResults> {
  const normalized = normalizeTerm(term);
  if (normalized.length < MIN_TERM_LENGTH) {
    return { term: '', doubts: [], mentors: [], people: [] };
  }

  const [doubts, mentors, people] = await Promise.all([
    fetchDoubts(DOUBT_SCAN_LIMIT).catch((err) => {
      console.warn('[search] doubt scan failed:', err);
      return [] as Doubt[];
    }),
    getApprovedMentors().catch((err) => {
      console.warn('[search] mentor scan failed:', err);
      return [] as MentorProfile[];
    }),
    searchPeople(normalized),
  ]);

  return {
    term: term.trim(),
    doubts: rank(doubts, (d) => scoreDoubt(d, normalized)).slice(0, MAX_RESULTS_PER_GROUP),
    mentors: rank(mentors, (m) => scoreMentor(m, normalized)).slice(0, MAX_RESULTS_PER_GROUP),
    people: people.slice(0, MAX_RESULTS_PER_GROUP),
  };
}

/** Range query on `users.name` for prefix matches on the term. */
async function searchPeople(normalized: string): Promise<PersonResult[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('name', '>=', normalized),
      where('name', '<=', normalized + '\uf8ff'),
      fsLimit(USER_SCAN_LIMIT),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name ?? '',
        avatarUrl: data.avatarUrl ?? undefined,
        role: data.role ?? undefined,
      } as PersonResult;
    });
  } catch (err) {
    console.warn('[search] people scan failed:', err);
    return [];
  }
}

/** Keep score > 0, drop the score, and order by descending relevance. */
function rank<T>(items: T[], score: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, s: score(item) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item);
}

function scoreDoubt(d: Doubt, q: string): number {
  const title = (d.title || '').toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (d.tags?.some((t) => t.toLowerCase() === q)) return 50;
  if (d.tags?.some((t) => t.toLowerCase().includes(q))) return 40;
  if (d.subject?.toLowerCase().includes(q)) return 30;
  if (stripHtml(d.content || '').toLowerCase().includes(q)) return 20;
  return 0;
}

function scoreMentor(m: MentorProfile, q: string): number {
  const name = (m.name || '').toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 85;
  if (name.includes(q)) return 65;
  if (m.headline?.toLowerCase().includes(q)) return 50;
  if (m.subjects?.some((s) => s.toLowerCase().includes(q))) return 45;
  if (m.expertise?.some((e) => e.toLowerCase().includes(q))) return 40;
  if (m.college?.toLowerCase().includes(q)) return 25;
  return 0;
}

// ── URL helpers ────────────────────────────────────────────────────────────────

/** Build the "?q=term" link used to hand a search over to a results page. */
export function searchHref(pathname: string, term: string): string {
  return `${pathname}?q=${encodeURIComponent(term.trim())}`;
}

/** Read "?q=" straight off the URL — avoids a Suspense boundary per page. */
export function readQueryParam(name: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) ?? '';
}

/** Push/replace "?q=" without adding a history entry to the browser. */
export function replaceQueryParam(pathname: string, name: string, value: string): string {
  const params = new URLSearchParams(window.location.search);
  if (value.trim()) params.set(name, value.trim());
  else params.delete(name);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export type { SearchRecord, SearchResults, SearchSource, PersonResult };