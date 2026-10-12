// Every data source the newsroom pulls from. Add a league or feed here and it
// shows up everywhere (UI, filters, JSON API) on the next 15-minute refresh.

export const REFRESH_SECONDS = 900; // 15 minutes

/** ESPN serves the same JSON from two hosts; the second is a fallback. */
export const ESPN_API_BASES = process.env.ESPN_API_BASE
  ? [process.env.ESPN_API_BASE]
  : ["https://site.api.espn.com/apis/site/v2/sports", "https://site.web.api.espn.com/apis/site/v2/sports"];

/** TheSportsDB — independent second source; adds live cricket & rugby. "3" is the public free key. */
export const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${process.env.THESPORTSDB_KEY ?? "3"}`;
export const SPORTSDB_SPORTS: { name: string; sport: SportKey }[] = [
  { name: "Cricket", sport: "cricket" },
  { name: "Soccer", sport: "soccer" },
  { name: "Rugby", sport: "rugby" },
  { name: "Basketball", sport: "basketball" },
  { name: "Ice Hockey", sport: "hockey" },
];

export type SportKey =
  | "soccer"
  | "basketball"
  | "football"
  | "baseball"
  | "hockey"
  | "tennis"
  | "mma"
  | "racing"
  | "golf"
  | "cricket"
  | "rugby"
  | "chess"
  | "games"
  | "badminton"
  | "athletics"
  | "kabaddi";

export interface League {
  sport: SportKey;
  /** ESPN league slug, e.g. "eng.1" */
  slug: string;
  name: string;
  region: string;
}

/** Display order = category bar order. */
export const SPORT_LABELS: Record<SportKey, { label: string; icon: string }> = {
  soccer: { label: "Football", icon: "⚽" },
  cricket: { label: "Cricket", icon: "🏏" },
  games: { label: "Multi-sport Games", icon: "🏅" },
  chess: { label: "Chess", icon: "♟️" },
  tennis: { label: "Tennis", icon: "🎾" },
  basketball: { label: "Basketball", icon: "🏀" },
  badminton: { label: "Badminton", icon: "🏸" },
  kabaddi: { label: "Kabaddi", icon: "🤼" },
  athletics: { label: "Athletics", icon: "🏃" },
  racing: { label: "Formula 1", icon: "🏎️" },
  rugby: { label: "Rugby", icon: "🏉" },
  hockey: { label: "Ice Hockey", icon: "🏒" },
  football: { label: "American Football", icon: "🏈" },
  baseball: { label: "Baseball", icon: "⚾" },
  mma: { label: "MMA", icon: "🥊" },
  golf: { label: "Golf", icon: "⛳" },
};

export const SPORT_KEYS = Object.keys(SPORT_LABELS) as SportKey[];
export const isSportKey = (s: string): s is SportKey => s in SPORT_LABELS;

export const LEAGUES: League[] = [
  // Football (soccer) — Europe
  { sport: "soccer", slug: "uefa.champions", name: "UEFA Champions League", region: "Europe" },
  { sport: "soccer", slug: "uefa.europa", name: "UEFA Europa League", region: "Europe" },
  { sport: "soccer", slug: "uefa.europa.conf", name: "UEFA Conference League", region: "Europe" },
  { sport: "soccer", slug: "uefa.nations", name: "UEFA Nations League", region: "Europe" },
  { sport: "soccer", slug: "eng.1", name: "Premier League", region: "England" },
  { sport: "soccer", slug: "eng.2", name: "EFL Championship", region: "England" },
  { sport: "soccer", slug: "esp.1", name: "LaLiga", region: "Spain" },
  { sport: "soccer", slug: "ita.1", name: "Serie A", region: "Italy" },
  { sport: "soccer", slug: "ger.1", name: "Bundesliga", region: "Germany" },
  { sport: "soccer", slug: "fra.1", name: "Ligue 1", region: "France" },
  { sport: "soccer", slug: "ned.1", name: "Eredivisie", region: "Netherlands" },
  { sport: "soccer", slug: "por.1", name: "Primeira Liga", region: "Portugal" },
  { sport: "soccer", slug: "sco.1", name: "Scottish Premiership", region: "Scotland" },
  { sport: "soccer", slug: "tur.1", name: "Süper Lig", region: "Turkey" },
  // Football — rest of the world
  { sport: "soccer", slug: "fifa.worldq.uefa", name: "World Cup Qualifying – UEFA", region: "World" },
  { sport: "soccer", slug: "fifa.friendly", name: "International Friendly", region: "World" },
  { sport: "soccer", slug: "usa.1", name: "MLS", region: "USA" },
  { sport: "soccer", slug: "mex.1", name: "Liga MX", region: "Mexico" },
  { sport: "soccer", slug: "bra.1", name: "Brasileirão", region: "Brazil" },
  { sport: "soccer", slug: "arg.1", name: "Liga Profesional", region: "Argentina" },
  { sport: "soccer", slug: "conmebol.libertadores", name: "Copa Libertadores", region: "South America" },
  { sport: "soccer", slug: "ksa.1", name: "Saudi Pro League", region: "Saudi Arabia" },
  { sport: "soccer", slug: "ind.1", name: "Indian Super League", region: "India" },
  { sport: "soccer", slug: "jpn.1", name: "J1 League", region: "Japan" },
  { sport: "soccer", slug: "aus.1", name: "A-League", region: "Australia" },
  { sport: "soccer", slug: "afc.champions", name: "AFC Champions League", region: "Asia" },
  // Basketball
  { sport: "basketball", slug: "nba", name: "NBA", region: "USA" },
  { sport: "basketball", slug: "wnba", name: "WNBA", region: "USA" },
  { sport: "basketball", slug: "mens-college-basketball", name: "NCAA Men's Basketball", region: "USA" },
  // American football
  { sport: "football", slug: "nfl", name: "NFL", region: "USA" },
  { sport: "football", slug: "college-football", name: "NCAA Football", region: "USA" },
  // Baseball / hockey
  { sport: "baseball", slug: "mlb", name: "MLB", region: "USA" },
  { sport: "hockey", slug: "nhl", name: "NHL", region: "North America" },
  // Individual sports
  { sport: "tennis", slug: "atp", name: "ATP Tour", region: "World" },
  { sport: "tennis", slug: "wta", name: "WTA Tour", region: "World" },
  { sport: "mma", slug: "ufc", name: "UFC", region: "World" },
  { sport: "racing", slug: "f1", name: "Formula 1", region: "World" },
  { sport: "golf", slug: "pga", name: "PGA Tour", region: "World" },
];

export interface NewsFeed {
  source: string;
  url: string;
  sport?: SportKey;
  /** Google News search feed: the real publisher comes from each item. */
  aggregator?: boolean;
}

const gnews = (q: string, sport: SportKey): NewsFeed => ({
  source: "Google News",
  url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:3d&hl=en-IN&gl=IN&ceid=IN:en`,
  sport,
  aggregator: true,
});

/** RSS/Atom feeds — broad global coverage incl. cricket, rugby, athletics. */
export const NEWS_FEEDS: NewsFeed[] = [
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml", sport: "soccer" },
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/cricket/rss.xml", sport: "cricket" },
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/tennis/rss.xml", sport: "tennis" },
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml", sport: "racing" },
  { source: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  { source: "ESPNcricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", sport: "cricket" },
  { source: "The Guardian", url: "https://www.theguardian.com/sport/rss" },
  { source: "Sky Sports", url: "https://www.skysports.com/rss/12040" },
  { source: "Yahoo Sports", url: "https://sports.yahoo.com/rss/" },
  { source: "CBS Sports", url: "https://www.cbssports.com/rss/headlines/" },
  { source: "Chess.com", url: "https://www.chess.com/rss/news", sport: "chess" },
  { source: "ChessBase", url: "https://en.chessbase.com/feed", sport: "chess" },
  // Google News searches — catch sports the big outlets under-cover.
  gnews("chess tournament OR FIDE OR grandmaster", "chess"),
  gnews('"Asian Games" OR "Asian Para Games"', "games"),
  gnews('"Commonwealth Games"', "games"),
  gnews('Olympics OR "Youth Olympic Games" OR Paralympics', "games"),
  gnews("cricket match score", "cricket"),
  gnews("badminton BWF", "badminton"),
  gnews('"Pro Kabaddi" OR kabaddi', "kabaddi"),
  gnews('athletics OR "Diamond League" OR marathon', "athletics"),
  gnews("Indian Super League OR ISL football", "soccer"),
];

/** Lichess official broadcasts — free live chess from top events. */
export const LICHESS_BASE = process.env.LICHESS_BASE ?? "https://lichess.org";

/** ESPN JSON news endpoints, one per sport for clean sport tagging. */
export const ESPN_NEWS: { sport: SportKey; slug: string }[] = [
  { sport: "soccer", slug: "eng.1" },
  { sport: "soccer", slug: "uefa.champions" },
  { sport: "basketball", slug: "nba" },
  { sport: "football", slug: "nfl" },
  { sport: "baseball", slug: "mlb" },
  { sport: "hockey", slug: "nhl" },
  { sport: "tennis", slug: "atp" },
  { sport: "racing", slug: "f1" },
  { sport: "mma", slug: "ufc" },
];

/** Sports that have a live-score source (the rest are headlines-only). */
export const LIVE_SCORE_SPORTS = new Set<SportKey>([...LEAGUES.map((l) => l.sport), ...SPORTSDB_SPORTS.map((s) => s.sport), "chess"]);
