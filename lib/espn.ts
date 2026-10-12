/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import { errorText, fetchJsonWithFallback, nextUpdate } from "./fetcher";
import { ESPN_API_BASES, LEAGUES, SPORTSDB_SPORTS, type League } from "./sources";
import { fetchSportsDb, fixtureKey } from "./sportsdb";
import type { Competitor, Match, MatchEvent, MatchState, Snapshot, SourceHealth } from "./types";

const MAX_UNITS_PER_EVENT = 40;
const FIELD_TOP_N = 10;

const str = (v: any): string | undefined =>
  v === undefined || v === null || v === "" ? undefined : String(v);

function scoreOf(c: any): string | undefined {
  if (c?.score && typeof c.score === "object") return str(c.score.displayValue ?? c.score.value);
  return str(c?.score);
}

function competitorOf(c: any): Competitor {
  const team = c.team ?? {};
  const athlete = c.athlete ?? (Array.isArray(c.athletes) ? c.athletes[0]?.athlete : undefined) ?? {};
  const linescores = Array.isArray(c.linescores)
    ? c.linescores.map((l: any) => str(l.displayValue ?? l.value)).filter(Boolean)
    : undefined;
  return {
    name:
      team.displayName ?? athlete.displayName ?? athlete.fullName ?? c.roster?.displayName ?? "TBD",
    abbr: team.abbreviation ?? athlete.shortName,
    logo: team.logo ?? team.logos?.[0]?.href ?? athlete.flag?.href ?? athlete.headshot?.href,
    score: scoreOf(c),
    linescores: linescores?.length ? linescores : undefined,
    winner: typeof c.winner === "boolean" ? c.winner : undefined,
    homeAway: c.homeAway === "home" || c.homeAway === "away" ? c.homeAway : undefined,
    record: c.records?.[0]?.summary,
    form: str(c.form),
    position: typeof c.order === "number" ? c.order : undefined,
  };
}

function eventsOf(unit: any, competitors: any[]): MatchEvent[] {
  if (!Array.isArray(unit.details)) return [];
  const abbrById = new Map<string, string>(
    competitors.map((c: any) => [String(c.team?.id ?? c.id), c.team?.abbreviation ?? ""]),
  );
  return unit.details.slice(0, 30).map((d: any) => {
    const who = (d.athletesInvolved ?? []).map((a: any) => a.displayName).join(", ");
    const team = abbrById.get(String(d.team?.id)) ?? "";
    const type = d.type?.text ?? (d.scoringPlay ? "Goal" : d.redCard ? "Red Card" : d.yellowCard ? "Yellow Card" : "Event");
    return {
      clock: d.clock?.displayValue ?? "",
      type,
      text: [who, team && `(${team})`].filter(Boolean).join(" ") || type,
    };
  });
}

function broadcastsOf(unit: any): string[] {
  const names = new Set<string>();
  for (const b of unit.broadcasts ?? []) for (const n of b.names ?? []) names.add(n);
  for (const g of unit.geoBroadcasts ?? []) if (g.media?.shortName) names.add(g.media.shortName);
  return [...names].slice(0, 6);
}

function normalizeUnit(league: League, event: any, unit: any, stage?: string): Match | null {
  const rawCompetitors: any[] = unit.competitors ?? [];
  if (!rawCompetitors.length) return null;

  const statusObj = unit.status ?? event.status ?? {};
  const type = statusObj.type ?? {};
  const state: MatchState = type.state === "in" || type.state === "post" ? type.state : "pre";
  const headToHead = rawCompetitors.length <= 2;

  let competitors = rawCompetitors.map(competitorOf);
  if (headToHead) {
    // Convention: home team listed first, like a scoreboard.
    competitors.sort((a, b) => (a.homeAway === "home" ? -1 : b.homeAway === "home" ? 1 : 0));
  } else if (state === "pre") {
    // Entry order before a race/round starts is not a standing — don't show it.
    competitors = [];
  } else {
    competitors = competitors
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
      .slice(0, FIELD_TOP_N);
  }

  const venue = unit.venue ?? event.venue ?? {};
  const address = venue.address ?? {};
  const eventId = String(unit.id ?? event.id);
  const link =
    (event.links ?? []).find((l: any) => (l.rel ?? []).includes("summary"))?.href ??
    event.links?.[0]?.href;

  const stageParts = [
    stage,
    unit.type?.abbreviation && !headToHead ? unit.type.abbreviation : undefined,
    unit.notes?.[0]?.headline,
  ].filter(Boolean);

  return {
    id: `${league.slug}~${eventId}`,
    eventId,
    sport: league.sport,
    leagueSlug: league.slug,
    league: league.name,
    region: league.region,
    name: headToHead
      ? competitors.map((c) => c.name).join(" vs ")
      : (event.name ?? event.shortName ?? league.name),
    stage: stageParts.length ? stageParts.join(" · ") : undefined,
    date: unit.date ?? event.date,
    state,
    status: type.shortDetail ?? type.detail ?? type.description ?? "Scheduled",
    clock: state === "in" ? str(statusObj.displayClock) : undefined,
    headToHead,
    competitors,
    venue: venue.fullName,
    location: [address.city, address.state ?? address.country].filter(Boolean).join(", ") || undefined,
    broadcasts: broadcastsOf(unit),
    headline: unit.headlines?.[0]?.description ?? unit.headlines?.[0]?.shortLinkText,
    odds: unit.odds?.[0]?.details,
    events: eventsOf(unit, rawCompetitors),
    link,
  };
}

/** Turn one ESPN scoreboard payload into flat matches. Handles team sports,
 *  tennis (groupings), MMA cards (many 1v1 bouts) and field events (F1, golf). */
export function normalizeScoreboard(league: League, data: any): Match[] {
  const out: Match[] = [];
  for (const event of data?.events ?? []) {
    const units: { unit: any; stage?: string }[] = [];
    if (Array.isArray(event.groupings) && event.groupings.length) {
      for (const g of event.groupings)
        for (const c of g.competitions ?? []) units.push({ unit: c, stage: g.grouping?.displayName });
    } else {
      for (const c of event.competitions ?? []) units.push({ unit: c });
    }

    let picked = units;
    // Field events with many sessions (F1 practice/quali/race): keep the live one,
    // otherwise the latest finished plus the next upcoming.
    if (units.length > 1 && (units[0].unit.competitors?.length ?? 0) > 2) {
      const live = units.filter((u) => u.unit.status?.type?.state === "in");
      const done = units.filter((u) => u.unit.status?.type?.state === "post");
      const next = units.find((u) => u.unit.status?.type?.state === "pre");
      picked = live.length ? live : [done.at(-1), next].filter(Boolean) as typeof units;
    }

    for (const { unit, stage } of picked.slice(0, MAX_UNITS_PER_EVENT)) {
      // MMA cards: tag each bout with the card name ("UFC 310: …").
      const m = normalizeUnit(league, event, unit, stage ?? (league.sport === "mma" ? event.name : undefined));
      if (m) out.push(m);
    }
  }
  return out;
}

async function fetchLeague(league: League): Promise<Match[]> {
  const data = await fetchJsonWithFallback(ESPN_API_BASES.map((b) => `${b}/${league.sport}/${league.slug}/scoreboard`));
  return normalizeScoreboard(league, data);
}

const STATE_ORDER: Record<MatchState, number> = { in: 0, pre: 1, post: 2 };

export function sortMatches(matches: Match[]): Match[] {
  return matches.sort((a, b) => {
    const s = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (s) return s;
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    // Upcoming: soonest first. Finished: most recent first.
    return a.state === "post" ? tb - ta : ta - tb;
  });
}

/** Every source in parallel; a slow or broken one never takes the page down.
 *  ESPN is primary (richer detail); TheSportsDB fills gaps (cricket, rugby,
 *  extra leagues) and keeps scores flowing if ESPN is unreachable. */
export const getAllMatches = cache(async (): Promise<Snapshot<Match>> => {
  const jobs: { name: string; run: () => Promise<Match[]> }[] = [
    ...LEAGUES.map((l) => ({ name: l.name, run: () => fetchLeague(l) })),
    ...SPORTSDB_SPORTS.map((s) => ({ name: `TheSportsDB ${s.name}`, run: () => fetchSportsDb(s.name, s.sport) })),
  ];
  const results = await Promise.allSettled(jobs.map((j) => j.run()));
  const sources: SourceHealth[] = [];
  const seenIds = new Set<string>();
  const seenFixtures = new Set<string>();
  const items: Match[] = [];

  results.forEach((r, i) => {
    const ok = r.status === "fulfilled";
    const list = ok ? r.value : [];
    let added = 0;
    for (const m of list) {
      const fk = m.headToHead ? fixtureKey(m) : m.id;
      if (seenIds.has(m.id) || seenFixtures.has(fk)) continue;
      seenIds.add(m.id);
      seenFixtures.add(fk);
      items.push(m);
      added++;
    }
    sources.push({ name: jobs[i].name, ok, count: added, error: ok ? undefined : errorText(r.reason) });
  });

  const now = new Date();
  return { updatedAt: now.toISOString(), nextUpdateAt: nextUpdate(now), items: sortMatches(items), sources };
});

export async function getMatch(leagueSlug: string, eventId: string): Promise<Match | undefined> {
  const { items } = await getAllMatches();
  return items.find((m) => m.leagueSlug === leagueSlug && m.eventId === eventId);
}
