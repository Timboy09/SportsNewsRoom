/* eslint-disable @typescript-eslint/no-explicit-any */
import { cachedFetch } from "./fetcher";
import { LICHESS_BASE } from "./sources";
import type { Competitor, Match, MatchState } from "./types";

const MAX_TOURS = 6;
const MAX_GAMES_PER_ROUND = 16;

/** Pull the [Tag "value"] headers out of each game in a multi-game PGN. */
export function parsePgnHeaders(pgn: string): Record<string, string>[] {
  return pgn
    .split(/\n\s*\n(?=\[Event )/)
    .map((game) => {
      const tags: Record<string, string> = {};
      for (const m of game.matchAll(/^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/gm)) tags[m[1]] = m[2];
      return tags;
    })
    .filter((t) => t.White && t.Black);
}

const SCORE: Record<string, [string, string]> = {
  "1-0": ["1", "0"],
  "0-1": ["0", "1"],
  "1/2-1/2": ["½", "½"],
};

function player(name: string, title?: string, elo?: string, fed?: string): Competitor {
  return {
    name: name.replace(/,\s*/, " ").trim(),
    record: [title, elo && elo !== "?" ? elo : undefined, fed].filter(Boolean).join(" · ") || undefined,
  };
}

export function chessRoundToMatches(tour: any, round: any, pgn: string): Match[] {
  const roundState: MatchState = round.finished ? "post" : round.ongoing ? "in" : "pre";
  return parsePgnHeaders(pgn)
    .slice(0, MAX_GAMES_PER_ROUND)
    .map((t, i) => {
      const result = SCORE[t.Result ?? ""];
      const state: MatchState = result ? "post" : roundState === "pre" ? "pre" : "in";
      const white = { ...player(t.White, t.WhiteTitle, t.WhiteElo, t.WhiteFed), score: result?.[0] };
      const black = { ...player(t.Black, t.BlackTitle, t.BlackElo, t.BlackFed), score: result?.[1] };
      if (result && result[0] !== result[1]) {
        white.winner = result[0] === "1";
        black.winner = result[1] === "1";
      }
      const date = round.startsAt ? new Date(round.startsAt).toISOString() : new Date().toISOString();
      return {
        id: `chess.${tour.id}~${round.id}g${i + 1}`,
        eventId: `${round.id}g${i + 1}`,
        sport: "chess" as const,
        leagueSlug: `chess.${tour.id}`,
        league: tour.name,
        region: "World",
        name: `${white.name} vs ${black.name}`,
        stage: [round.name, t.Board && `Board ${t.Board}`].filter(Boolean).join(" · ") || undefined,
        date,
        state,
        status: result ? (t.Result === "1/2-1/2" ? "Draw" : t.Result === "1-0" ? "White wins" : "Black wins") : state === "in" ? "In play" : "Scheduled",
        headToHead: true,
        competitors: [white, black],
        venue: t.Site && !/lichess/i.test(t.Site) ? t.Site : undefined,
        broadcasts: ["Lichess"],
        events: [],
        link: t.ChapterURL ?? t.GameURL ?? round.url ?? tour.url,
      } satisfies Match;
    });
}

function upcomingTour(tour: any, round: any): Match {
  return {
    id: `chess.${tour.id}~${round.id}`,
    eventId: String(round.id),
    sport: "chess",
    leagueSlug: `chess.${tour.id}`,
    league: tour.name,
    region: "World",
    name: tour.name,
    stage: round.name,
    date: new Date(round.startsAt ?? tour.dates?.[0] ?? Date.now()).toISOString(),
    state: "pre",
    status: "Scheduled",
    headToHead: false,
    competitors: [],
    broadcasts: ["Lichess"],
    headline: tour.description ?? tour.info?.format,
    events: [],
    link: round.url ?? tour.url,
  };
}

/** Live top-tier chess: ongoing official broadcasts and their current round's games. */
export async function fetchChess(): Promise<Match[]> {
  const top: any = await (await cachedFetch(`${LICHESS_BASE}/api/broadcast/top`)).json();
  const active: any[] = (top?.active ?? [])
    .filter((b: any) => b?.tour && b?.round)
    .sort((a: any, b: any) => (b.tour.tier ?? 0) - (a.tour.tier ?? 0))
    .slice(0, MAX_TOURS);

  const rounds = await Promise.allSettled(
    active.map(async (b) => {
      const pgn = await (await cachedFetch(`${LICHESS_BASE}/api/broadcast/round/${b.round.id}.pgn`, "application/x-chess-pgn, text/plain")).text();
      const games = chessRoundToMatches(b.tour, b.round, pgn);
      return games.length ? games : [upcomingTour(b.tour, b.round)];
    }),
  );
  const upcoming = (top?.upcoming ?? [])
    .filter((b: any) => b?.tour && b?.round)
    .slice(0, 4)
    .map((b: any) => upcomingTour(b.tour, b.round));

  return [...rounds.flatMap((r) => (r.status === "fulfilled" ? r.value : [])), ...upcoming];
}
