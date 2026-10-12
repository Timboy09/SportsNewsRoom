import Link from "next/link";
import { SPORT_LABELS } from "@/lib/sources";
import type { Competitor, Match } from "@/lib/types";
import { CopyMenu } from "./CopyMenu";
import { MatchPosterButton } from "./PosterButton";
import { LocalTime } from "./LocalTime";

function Crest({ c }: { c: Competitor }) {
  if (c.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="crest" src={c.logo} alt="" width={22} height={22} loading="lazy" />;
  }
  return <span className="crest crest--blank">{(c.abbr ?? c.name).slice(0, 3)}</span>;
}

export function StatusPill({ m }: { m: Match }) {
  if (m.state === "in")
    return (
      <span className="pill pill--live">
        <span className="dot" /> LIVE {m.clock && m.clock !== "0:00" ? m.clock : ""}
      </span>
    );
  if (m.state === "post") return <span className="pill pill--done">{m.status}</span>;
  return (
    <span className="pill">
      <LocalTime iso={m.date} />
    </span>
  );
}

export function MatchCard({ m }: { m: Match }) {
  const href = `/match/${encodeURIComponent(m.leagueSlug)}/${m.eventId}`;
  return (
    <article className={`card match match--${m.state}`}>
      <header className="match__head">
        <span className="match__league">
          {SPORT_LABELS[m.sport].icon} {m.league}
          {m.stage && <em> · {m.stage}</em>}
        </span>
        <StatusPill m={m} />
      </header>

      <Link href={href} className="match__body" prefetch={false}>
        {m.headToHead ? (
          m.competitors.map((c) => (
            <div key={c.name} className={`row ${c.winner ? "row--win" : ""}`}>
              <Crest c={c} />
              <span className="row__name">{c.name}</span>
              {c.linescores && m.sport === "tennis" && <span className="row__sets mono">{c.linescores.join(" ")}</span>}
              <span className="row__score mono">{m.state === "pre" ? "" : (c.score ?? (c.linescores ? "" : "-"))}</span>
            </div>
          ))
        ) : (
          <>
            <div className="match__title">{m.name}</div>
            {m.competitors.slice(0, 3).map((c, i) => (
              <div key={c.name + i} className="row row--field">
                <span className="row__pos mono">{c.position ?? i + 1}</span>
                <span className="row__name">{c.name}</span>
                <span className="row__score mono">{c.score ?? ""}</span>
              </div>
            ))}
          </>
        )}
      </Link>

      <footer className="match__foot">
        <span className="match__meta">
          {m.state === "in" ? m.status : m.venue ?? m.location ?? m.region}
        </span>
        <div className="match__actions">
          <MatchPosterButton m={m} />
          <CopyMenu match={m} />
        </div>
      </footer>
    </article>
  );
}
