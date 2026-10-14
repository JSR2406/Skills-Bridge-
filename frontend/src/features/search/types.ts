// ── FEATURE: Search — Domain types
// `SearchRecord` is one persisted search-history entry (one doc per unique term
// per user in the `searchHistory` collection). `SearchResults` is the grouped
// payload the global header search renders.
import type { Doubt } from '@/features/doubts/types';
import type { MentorProfile } from '@/features/mentors/types';

/** Which surface issued the search — used to re-run it in the right context. */
export type SearchSource = 'global' | 'feed' | 'mentors' | 'messages';

/** Human label + landing route per source, for chips and "re-run" actions. */
export const SEARCH_SOURCE_META: Record<SearchSource, { label: string; href: string }> = {
  global: { label: 'Search', href: '/feed' },
  feed: { label: 'Doubts', href: '/feed' },
  mentors: { label: 'Mentors', href: '/mentors' },
  messages: { label: 'Messages', href: '/messages' },
};

/** A directory entry returned when a term matches a user profile. */
export interface PersonResult {
  uid: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

/** Grouped, ranked results for the header overlay. */
export interface SearchResults {
  term: string;
  doubts: Doubt[];
  mentors: MentorProfile[];
  people: PersonResult[];
}

export interface SearchRecord {
  id: string;
  userId: string;
  /** Original casing as typed, trimmed. */
  term: string;
  /** Lower-cased + whitespace-collapsed term — the dedupe key. */
  normalizedTerm: string;
  /** Surface the term was last searched from. */
  lastSource: SearchSource;
  /** Every surface this term has been searched from. */
  sources: SearchSource[];
  /** How many hits the last run of this term returned. */
  resultCount: number;
  /** How many times the user has run this term. */
  timesSearched: number;
  createdAt: Date;
  lastSearchedAt: Date;
}