import { GamesBoard } from "@/components/GamesBoard";
import { Newsroom } from "@/components/Newsroom";
import { RefreshTimer } from "@/components/RefreshTimer";
import { MatchCard } from "@/components/MatchCard";
import { getAllMatches } from "@/lib/espn";
import { getAllNews } from "@/lib/news";

// Incremental Static Regeneration: the page is rebuilt in the background at
// most every 15 minutes — fast as a static file, fresh as a live feed.
export const revalidate = 900;

export default async function Home() {
  const [matches, news] = await Promise.all([getAllMatches(), getAllNews()]);
  const live = matches.items.filter((m) => m.state === "in");
  const okSources = [...matches.sources, ...news.sources].filter((s) => s.ok).length;
  const totalSources = matches.sources.length + news.sources.length;

  return (
    <>
      <section className="hero">
        <div>
          <h1>
            The world&apos;s scoreboard, <span className="accent">refreshed every 15 minutes.</span>
          </h1>
          <p className="muted">
            {matches.items.length} matches · {live.length} live · {news.items.length} headlines · {okSources}/{totalSources}{" "}
            sources online. Hit <b>Copy</b> on any match for ready-to-paste text, JSON, HTML, embed or API code.
          </p>
        </div>
        <RefreshTimer updatedAt={matches.updatedAt} />
      </section>

      {live.length > 0 && (
        <section className="ticker" aria-label="Live now">
          <div className="ticker__label">
            <span className="dot" /> LIVE NOW
          </div>
          <div className="ticker__track">
            {live.slice(0, 12).map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      <GamesBoard limit={3} compact />

      <Newsroom matches={matches.items} news={news.items} />
    </>
  );
}
