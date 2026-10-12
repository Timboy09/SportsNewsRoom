import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlocks } from "@/components/CodeBlocks";
import { LocalTime } from "@/components/LocalTime";
import { MatchCard } from "@/components/MatchCard";
import { RefreshTimer } from "@/components/RefreshTimer";
import { getAllMatches, getMatch } from "@/lib/espn";
import { SPORT_LABELS } from "@/lib/sources";

export const revalidate = 900;

// Pages are generated on first request, then cached and refreshed every 15 min.
export async function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ league: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { league, id } = await params;
  const m = await getMatch(decodeURIComponent(league), id);
  if (!m) return { title: "Match not found" };
  const score = m.headToHead && m.state !== "pre" ? m.competitors.map((c) => `${c.name} ${c.score ?? ""}`).join(" – ") : m.name;
  return { title: `${score} · ${m.league}`, description: `${m.status} — ${m.league}${m.venue ? ` at ${m.venue}` : ""}` };
}

export default async function MatchPage({ params }: Params) {
  const { league, id } = await params;
  const m = await getMatch(decodeURIComponent(league), id);
  if (!m) notFound();
  const { updatedAt, items } = await getAllMatches();
  const related = items.filter((x) => x.leagueSlug === m.leagueSlug && x.id !== m.id).slice(0, 6);

  const facts: [string, React.ReactNode][] = [
    ["Competition", `${SPORT_LABELS[m.sport].icon} ${m.league} (${m.region})`],
    ["Stage", m.stage],
    ["Start", <LocalTime key="t" iso={m.date} />],
    ["Status", m.status],
    ["Venue", [m.venue, m.location].filter(Boolean).join(", ") || undefined],
    ["Broadcast", m.broadcasts.join(", ") || undefined],
    ["Odds", m.odds],
  ];

  return (
    <div className="detail">
      <div className="crumbs">
        <Link href="/">← Live desk</Link> <RefreshTimer updatedAt={updatedAt} />
      </div>

      <div className="detail__grid">
        <div>
          <MatchCard m={m} />
          <dl className="facts card">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {m.events.length > 0 && (
            <div className="card timeline">
              <h3>Key events</h3>
              <ol>
                {m.events.map((e, i) => (
                  <li key={i}>
                    <span className="mono">{e.clock}</span> <b>{e.type}</b> {e.text}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {m.headline && <p className="card headline">{m.headline}</p>}
          {m.link && (
            <p>
              <a href={m.link} target="_blank" rel="noopener noreferrer">Full match centre on ESPN ↗</a>
            </p>
          )}
        </div>

        <div>
          <h2 className="section-title">Copy match codes</h2>
          <CodeBlocks match={m} />
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2 className="section-title">More from {m.league}</h2>
          <div className="grid">
            {related.map((r) => (
              <MatchCard key={r.id} m={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
