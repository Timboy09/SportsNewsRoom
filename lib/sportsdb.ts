/* eslint-disable @typescript-eslint/no-explicit-any */
import { cachedFetch } from "./fetcher";
import { SPORTSDB_BASE, type SportKey } from "./sources";
import type { Competitor, Match, MatchState } from "./types";

const FINISHED = /^(ft|aet|pen|aot|ap|match finished|finished|ended|after (extra time|penalties)|abandoned|cancelled|canceled|postponed|awarded|walkover)$/i;
const NOT_STARTED = /^(ns|not started|tbd|scheduled|time to be defined)$/i;

const num = (v: any): string | undefined => (v === null || v === undefined || v === "" ? undefined : String(v));

/** TheSportsDB timestamps are UTC without a zone suffix. */
function utc(e: any): string {
  const raw: string | undefined = e.strTimestamp ?? (e.dateEvent && `${e.dateEvent}T${e.strTime ?? "00:00:00"}`);
  if (!raw) return new Date().toISOString();
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}Z`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function stateOf(e: any, date: string, hasScore: boolean): MatchState {
  const s = String(e.strStatus ?? "").trim();
  if (FINISHED.test(s)) return "post";
  if (s && !NOT_STARTED.test(s)) return "in"; // 1H, HT, 2H, "Innings 2", …
  const age = Date.now() - new Date(date).getTime();
  if (age < 0) return "pre";
  // No status field: infer from kick-off time.
  if (!hasScore) return age < 4 * 3600_000 ? "pre" : "post";
  return age < 3 * 3600_000 ? "in" : "post";
}

export function normalizeSportsDbEvent(sport: SportKey, e: any): Match | null {
  if (!e?.idEvent || !e.strHomeTeam || !e.strAwayTeam) return null;
  const date = utc(e);
  const homeScore = num(e.intHomeScore ?? e.strHomeScore);
  const awayScore = num(e.intAwayScore ?? e.strAwayScore);
  const state = stateOf(e, date, homeScore !== undefined);
  const hs = Number(homeScore);
  const as = Number(awayScore);
  const decided = state === "post" && !isNaN(hs) && !isNaN(as) && hs !== as;

  const competitors: Competitor[] = [
    { name: e.strHomeTeam, logo: e.strHomeTeamBadge || undefined, score: homeScore, homeAway: "home", winner: decided ? hs > as : undefined },
    { name: e.strAwayTeam, logo: e.strAwayTeamBadge || undefined, score: awayScore, homeAway: "away", winner: decided ? as > hs : undefined },
  ];
  const status =
    state === "pre"
      ? "Scheduled"
      : state === "in"
        ? [e.strStatus, e.strProgress && `${e.strProgress}'`].filter(Boolean).join(" · ") || "In progress"
        : e.strStatus && !/^match finished$/i.test(e.strStatus) ? e.strStatus : "FT";

  return {
    id: `tsdb.${e.idLeague ?? "x"}~${e.idEvent}`,
    eventId: String(e.idEvent),
    sport,
    leagueSlug: `tsdb.${e.idLeague ?? "x"}`,
    league: e.strLeague ?? "Other",
    region: e.strCountry || "World",
    name: `${e.strHomeTeam} vs ${e.strAwayTeam}`,
    stage: [e.intRound && `Round ${e.intRound}`, e.strGroup].filter(Boolean).join(" · ") || undefined,
    date,
    state,
    status,
    clock: state === "in" && e.strProgress ? `${e.strProgress}'` : undefined,
    headToHead: true,
    competitors,
    venue: e.strVenue || undefined,
    location: [e.strCity, e.strCountry].filter(Boolean).join(", ") || undefined,
    broadcasts: [],
    headline: e.strResult || e.strDescriptionEN?.slice(0, 200) || undefined,
    events: [],
    link: undefined,
  };
}

const ymd = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10);

/** Yesterday → tomorrow (UTC), so every timezone's "today" is covered. */
export async function fetchSportsDb(name: string, sport: SportKey): Promise<Match[]> {
  const days = [-1, 0, 1].map(ymd);
  const results = await Promise.allSettled(
    days.map(async (d) => {
      const res = await cachedFetch(`${SPORTSDB_BASE}/eventsday.php?d=${d}&s=${encodeURIComponent(name)}`);
      return ((await res.json())?.events ?? []) as any[];
    }),
  );
  if (results.every((r) => r.status === "rejected")) throw (results[0] as PromiseRejectedResult).reason;
  return results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .map((e) => normalizeSportsDbEvent(sport, e))
    .filter((m): m is Match => m !== null);
}

/** Loose fixture key so the same game from ESPN and TheSportsDB is shown once. */
export function fixtureKey(m: Match): string {
  const word = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\b(fc|cf|afc|sc|ac|club|de|the)\b/g, "")
      .replace(/[^a-z]/g, "").slice(0, 5);
  return [m.sport, m.date.slice(0, 10), ...m.competitors.map((c) => word(c.name)).sort()].join("|");
}
