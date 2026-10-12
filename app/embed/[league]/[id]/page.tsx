import { notFound } from "next/navigation";
import { getMatch } from "@/lib/espn";
import { SITE_NAME } from "@/lib/site";
import { SPORT_LABELS } from "@/lib/sources";

export const revalidate = 900;

// Pages are generated on first request, then cached and refreshed every 15 min.
export async function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ league: string; id: string }> };

/** Minimal, dependency-free widget for <iframe> embeds. Reloads itself every 15 min. */
export default async function Embed({ params }: Params) {
  const { league, id } = await params;
  const m = await getMatch(decodeURIComponent(league), id);
  if (!m) notFound();

  return (
    <>
      <meta httpEquiv="refresh" content="900" />
      <div className="embed">
        <div className="embed__head">
          <span>{SPORT_LABELS[m.sport].icon} {m.league}</span>
          <span className={m.state === "in" ? "embed__live" : ""}>{m.state === "in" ? `● LIVE ${m.clock ?? ""}` : m.status}</span>
        </div>
        {m.competitors.slice(0, m.headToHead ? 2 : 3).map((c, i) => (
          <div key={c.name + i} className={`embed__row ${c.winner ? "row--win" : ""}`}>
            {c.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logo} alt="" width={20} height={20} />
            ) : (
              <span className="mono">{c.position ?? i + 1}</span>
            )}
            <span className="embed__name">{c.name}</span>
            <b className="mono">{m.state === "pre" ? "" : (c.score ?? "")}</b>
          </div>
        ))}
        <a className="embed__foot" href={`/match/${encodeURIComponent(m.leagueSlug)}/${m.eventId}`} target="_blank" rel="noopener">
          {m.venue ?? m.region} · {SITE_NAME} ↗
        </a>
      </div>
    </>
  );
}
