import type { SportKey } from "./sources";

export type MatchState = "pre" | "in" | "post";

export interface Competitor {
  name: string;
  abbr?: string;
  logo?: string;
  score?: string;
  /** Per-period/per-set scores (tennis sets, innings, quarters…) */
  linescores?: string[];
  winner?: boolean;
  homeAway?: "home" | "away";
  record?: string;
  form?: string;
  /** Finishing position for field events (F1, golf) */
  position?: number;
}

export interface MatchEvent {
  clock: string;
  type: string;
  text: string;
}

export interface Match {
  /** Globally unique: `${leagueSlug}~${eventId}` */
  id: string;
  eventId: string;
  sport: SportKey;
  leagueSlug: string;
  league: string;
  region: string;
  name: string;
  /** Round, stage, grouping or session (e.g. "Men's Singles", "Qualifying") */
  stage?: string;
  date: string;
  state: MatchState;
  status: string;
  clock?: string;
  /** true for head-to-head, false for field events (racing, golf) */
  headToHead: boolean;
  competitors: Competitor[];
  venue?: string;
  location?: string;
  broadcasts: string[];
  headline?: string;
  odds?: string;
  events: MatchEvent[];
  link?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  sport?: SportKey;
  image?: string;
  published: string;
}

export interface SourceHealth {
  name: string;
  ok: boolean;
  count: number;
}

export interface Snapshot<T> {
  updatedAt: string;
  nextUpdateAt: string;
  items: T[];
  sources: SourceHealth[];
}
