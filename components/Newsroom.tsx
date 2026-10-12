"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { formatMany } from "@/lib/format";
import { SPORT_LABELS, type SportKey } from "@/lib/sources";
import type { Match, MatchState, NewsItem } from "@/lib/types";
import { copyText, useOrigin } from "./clipboard";
import { MatchCard } from "./MatchCard";
import { NewsList } from "./NewsList";
import { useToast } from "./Toast";

type StateFilter = "all" | MatchState;
const STATE_TABS: { id: StateFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in", label: "Live" },
  { id: "pre", label: "Upcoming" },
  { id: "post", label: "Results" },
];

export function Newsroom({ matches, news }: { matches: Match[]; news: NewsItem[] }) {
  const [sport, setSport] = useState<SportKey | "all">("all");
  const [state, setState] = useState<StateFilter>("all");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());
  const toast = useToast();
  const origin = useOrigin();

  const sportCounts = useMemo(() => {
    const counts = new Map<SportKey, number>();
    for (const m of matches) counts.set(m.sport, (counts.get(m.sport) ?? 0) + 1);
    return counts;
  }, [matches]);

  const visible = useMemo(
    () =>
      matches.filter(
        (m) =>
          (sport === "all" || m.sport === sport) &&
          (state === "all" || m.state === state) &&
          (!q ||
            `${m.name} ${m.league} ${m.region} ${m.competitors.map((c) => `${c.name} ${c.abbr ?? ""}`).join(" ")}`
              .toLowerCase()
              .includes(q)),
      ),
    [matches, sport, state, q],
  );

  const groups = useMemo(() => {
    const byLeague = new Map<string, Match[]>();
    for (const m of visible) {
      const list = byLeague.get(m.league) ?? [];
      list.push(m);
      byLeague.set(m.league, list);
    }
    // Leagues with live action float to the top.
    return [...byLeague.entries()].sort(
      ([, a], [, b]) => Number(b.some((m) => m.state === "in")) - Number(a.some((m) => m.state === "in")),
    );
  }, [visible]);

  const liveCount = matches.filter((m) => m.state === "in").length;
  const visibleNews = useMemo(
    () =>
      news.filter(
        (n) => (sport === "all" || n.sport === sport) && (!q || `${n.title} ${n.summary ?? ""}`.toLowerCase().includes(q)),
      ),
    [news, sport, q],
  );

  const copyAll = async (fmt: "text" | "json" | "markdown") => {
    const ok = await copyText(formatMany(visible, fmt, origin));
    toast(ok ? `Copied ${visible.length} matches as ${fmt.toUpperCase()}` : "Copy failed");
  };

  return (
    <>
      <nav className="sports" aria-label="Sports">
        <button className={`chip ${sport === "all" ? "chip--on" : ""}`} onClick={() => setSport("all")}>
          🌍 All sports <span className="chip__n">{matches.length}</span>
        </button>
        {(Object.keys(SPORT_LABELS) as SportKey[]).map((k) => {
          const n = sportCounts.get(k) ?? 0;
          const hasNews = news.some((x) => x.sport === k);
          if (!n && !hasNews) return null;
          return (
            <button key={k} className={`chip ${sport === k ? "chip--on" : ""}`} onClick={() => setSport(k)}>
              {SPORT_LABELS[k].icon} {SPORT_LABELS[k].label} {n > 0 && <span className="chip__n">{n}</span>}
            </button>
          );
        })}
      </nav>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {STATE_TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={state === t.id} className={`tab ${state === t.id ? "tab--on" : ""}`} onClick={() => setState(t.id)}>
              {t.id === "in" && <span className="dot" />}
              {t.label}
              {t.id === "in" && liveCount > 0 && <span className="chip__n">{liveCount}</span>}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search team, league, country…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search matches and news"
        />
        <div className="copyall">
          <span>Copy {visible.length} shown:</span>
          <button className="btn btn--ghost" onClick={() => copyAll("text")} disabled={!visible.length}>Text</button>
          <button className="btn btn--ghost" onClick={() => copyAll("markdown")} disabled={!visible.length}>MD</button>
          <button className="btn btn--ghost" onClick={() => copyAll("json")} disabled={!visible.length}>JSON</button>
        </div>
      </div>

      <div className="layout">
        <section aria-label="Matches" className="matches">
          {groups.length === 0 && (
            <div className="empty card">
              <p>No matches for this filter right now.</p>
              <p className="muted">Fixtures refresh automatically every 15 minutes — check the headlines alongside.</p>
            </div>
          )}
          {groups.map(([league, list]) => (
            <div key={league} className="league">
              <h2 className="league__title">
                {SPORT_LABELS[list[0].sport].icon} {league}
                <span className="muted"> · {list[0].region}</span>
              </h2>
              <div className="grid">
                {list.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside aria-label="Headlines" className="newscol">
          <h2 className="section-title">Headlines <span className="muted">· {visibleNews.length}</span></h2>
          <NewsList items={visibleNews.slice(0, 60)} />
        </aside>
      </div>
    </>
  );
}
