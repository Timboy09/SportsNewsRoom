"use client";

import Link from "next/link";
import { formatRange, relevantGames } from "@/lib/games";
import { PosterButton } from "./PosterButton";

const tag = (s: string) => "#" + s.replace(/[^A-Za-z0-9]/g, "");

/** Multi-sport Games calendar with live countdowns + poster buttons. */
export function GamesBoard({ limit, compact }: { limit?: number; compact?: boolean }) {
  const games = relevantGames().slice(0, limit);
  return (
    <section className="games" aria-label="Multi-sport Games">
      <h2 className="section-title">
        🏅 Major Games {compact && <Link href="/sport/games" className="muted small">· see all →</Link>}
      </h2>
      <div className="grid">
        {games.map((g) => (
          <article key={g.slug} className={`card games__card games__card--${g.status.state}`}>
            <div className="games__count">
              <span className="games__num">
                {g.tbc ? "TBC" : g.status.state === "upcoming" ? g.status.days : g.status.state === "live" ? `D${g.status.days}` : "✓"}
              </span>
              <span className="games__label" suppressHydrationWarning>{g.status.label}</span>
            </div>
            <div className="games__info">
              <b>{g.name}</b>
              <span className="muted">{g.host}</span>
              <span className="muted small">{formatRange(g)}</span>
            </div>
            <PosterButton
              target={{
                title: g.name,
                path: `/api/poster/games/${g.slug}`,
                caption: `🏅 ${g.name}\n📍 ${g.host}\n🗓️ ${formatRange(g)}\n⏳ ${g.status.label}\n\n${tag(g.short)} ${tag(g.host.split(",")[0])} #SportsUpdate`,
                filename: g.slug,
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
