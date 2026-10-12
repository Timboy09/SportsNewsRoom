import type { Metadata } from "next";
import { CopyBox } from "@/components/CopyBox";
import { COPY_FORMATS } from "@/lib/format";
import { LEAGUES, SPORT_LABELS } from "@/lib/sources";

export const metadata: Metadata = { title: "Codes & API" };

const ENDPOINTS = [
  { title: "Every match (live, upcoming, results)", code: `curl "{origin}/api/matches"` },
  { title: "Only live football", code: `curl "{origin}/api/matches?sport=soccer&state=in"` },
  { title: "Premier League as copy-ready text", code: `curl "{origin}/api/matches?league=eng.1&format=text"` },
  { title: "Search a team, Markdown output", code: `curl "{origin}/api/matches?q=real%20madrid&format=markdown"` },
  { title: "Latest cricket headlines", code: `curl "{origin}/api/news?sport=cricket&limit=20"` },
  { title: "One match in any copy format", code: `curl "{origin}/api/match/<league>/<eventId>?format=social"` },
  { title: "Source health", code: `curl "{origin}/api/health"` },
];

const JS = `// Drop into any site or bot — refresh every 15 minutes
async function liveScores() {
  const res = await fetch("{origin}/api/matches?state=in");
  const { items } = await res.json();
  return items.map(m => \`\${m.league}: \${m.competitors.map(c => \`\${c.name} \${c.score ?? ""}\`).join(" – ")} (\${m.status})\`);
}
liveScores().then(console.log);
setInterval(() => liveScores().then(console.log), 15 * 60 * 1000);`;

export default function Developers() {
  const sports = [...new Set(LEAGUES.map((l) => l.sport))];
  return (
    <div className="prose">
      <h1>Codes &amp; API</h1>
      <p className="muted">
        Every match card has a <b>Copy</b> button (plain text) and a ▾ menu with {COPY_FORMATS.length} formats. Open any match for
        all codes side-by-side. Everything below is free, keyless, CORS-enabled JSON, refreshed every 15 minutes.
      </p>

      <h2>Copy formats</h2>
      <div className="grid">
        {COPY_FORMATS.map((f) => (
          <div key={f.id} className="card pad">
            <b>{f.label}</b>
            <p className="muted">{f.hint}</p>
            <code className="mono">?format={f.id}</code>
          </div>
        ))}
      </div>

      <h2>Endpoints</h2>
      {ENDPOINTS.map((e) => (
        <div key={e.title}>
          <h3>{e.title}</h3>
          <CopyBox code={e.code} />
        </div>
      ))}

      <h2>JavaScript</h2>
      <CopyBox code={JS} />

      <h2>Coverage</h2>
      {sports.map((s) => (
        <p key={s}>
          <b>{SPORT_LABELS[s].icon} {SPORT_LABELS[s].label}:</b>{" "}
          {LEAGUES.filter((l) => l.sport === s).map((l) => (
            <code key={l.slug} className="mono tag" title={l.name}>{l.slug}</code>
          ))}
        </p>
      ))}
      <p className="muted">
        🏏 Live cricket, 🏉 rugby and hundreds of extra football, basketball &amp; hockey leagues come from TheSportsDB (league slugs start with <code className="mono tag">tsdb.</code>). Headlines come from BBC Sport, ESPNcricinfo, Guardian, Sky Sports and more.
      </p>
    </div>
  );
}
