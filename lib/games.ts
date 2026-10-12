// Major multi-sport Games calendar. Live results for these have no free API,
// so the desk shows status + countdown here and pulls coverage via news feeds.

export interface MultiSportEvent {
  slug: string;
  name: string;
  short: string;
  host: string;
  start: string; // YYYY-MM-DD (local start date)
  end: string;
  url: string;
  /** Dates not yet confirmed — shown as "dates TBC", no countdown. */
  tbc?: boolean;
}

export const MULTI_SPORT_EVENTS: MultiSportEvent[] = [
  { slug: "milano-cortina-2026", name: "Winter Olympics 2026", short: "Winter Olympics", host: "Milano Cortina, Italy", start: "2026-02-06", end: "2026-02-22", url: "https://www.olympics.com/en/olympic-games/milano-cortina-2026" },
  { slug: "glasgow-2026", name: "Commonwealth Games 2026", short: "Commonwealth Games", host: "Glasgow, Scotland", start: "2026-07-23", end: "2026-08-02", url: "https://www.glasgow2026.com" },
  { slug: "aichi-nagoya-2026", name: "Asian Games 2026", short: "Asian Games", host: "Aichi-Nagoya, Japan", start: "2026-09-19", end: "2026-10-04", url: "https://www.aichi-nagoya2026.org/en/" },
  { slug: "aichi-nagoya-para-2026", name: "Asian Para Games 2026", short: "Asian Para Games", host: "Aichi-Nagoya, Japan", start: "2026-10-18", end: "2026-10-24", url: "https://www.aichi-nagoya2026.org/en/" },
  { slug: "dakar-2026", name: "Youth Olympic Games 2026", short: "Youth Olympics", host: "Dakar, Senegal", start: "2026-10-31", end: "2026-11-13", url: "https://www.olympics.com/en/olympic-games/dakar-2026" },
  { slug: "la-2028", name: "Olympic Games 2028", short: "Olympics", host: "Los Angeles, USA", start: "2028-07-14", end: "2028-07-30", url: "https://la28.org" },
  { slug: "la-2028-para", name: "Paralympic Games 2028", short: "Paralympics", host: "Los Angeles, USA", start: "2028-08-15", end: "2028-08-27", url: "https://la28.org" },
  { slug: "ahmedabad-2030", name: "Commonwealth Games 2030", short: "Commonwealth Games", host: "Ahmedabad, India", start: "2030-07-01", end: "2030-07-31", url: "https://thecgf.com", tbc: true },
  { slug: "doha-2030", name: "Asian Games 2030", short: "Asian Games", host: "Doha, Qatar", start: "2030-11-30", end: "2030-12-15", url: "https://www.ocasia.org" },
];

export type GamesState = "live" | "upcoming" | "finished";

export interface GamesStatus {
  state: GamesState;
  /** Whole days until start (upcoming), day number (live) or days since end (finished). */
  days: number;
  label: string;
}

const DAY = 86400_000;

export function gamesStatus(e: MultiSportEvent, now = Date.now()): GamesStatus {
  const start = Date.parse(`${e.start}T00:00:00Z`);
  if (e.tbc && now < start) return { state: "upcoming", days: Math.ceil((start - now) / DAY), label: "Dates TBC" };
  const end = Date.parse(`${e.end}T23:59:59Z`);
  if (now < start) {
    const days = Math.ceil((start - now) / DAY);
    return { state: "upcoming", days, label: days === 1 ? "Starts tomorrow" : `${days} days to go` };
  }
  if (now <= end) {
    const day = Math.floor((now - start) / DAY) + 1;
    const total = Math.round((end - start) / DAY) + 1;
    return { state: "live", days: day, label: `Day ${day} of ${total}` };
  }
  const days = Math.floor((now - end) / DAY);
  return { state: "finished", days, label: days < 1 ? "Ended today" : `Ended ${days} days ago` };
}

/** Live first, then soonest upcoming, then most recently finished (within ~2 months). */
export function relevantGames(now = Date.now()) {
  const withStatus = MULTI_SPORT_EVENTS.map((e) => ({ ...e, status: gamesStatus(e, now) }));
  const order = { live: 0, upcoming: 1, finished: 2 } as const;
  return withStatus
    .filter((e) => e.status.state !== "finished" || e.status.days <= 60)
    .sort((a, b) => order[a.status.state] - order[b.status.state] || (a.status.state === "finished" ? a.status.days - b.status.days : a.start.localeCompare(b.start)));
}

export const formatRange = (e: MultiSportEvent) => {
  if (e.tbc) return `${e.start.slice(0, 4)} · dates TBC`;
  const f = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${f(e.start)} – ${f(e.end)}`;
};
