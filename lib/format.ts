// Copy-ready "codes" for a match. Pure functions, shared by server + client.
import { SPORT_LABELS } from "./sources";
import type { Match } from "./types";

export type CopyFormat = "text" | "social" | "markdown" | "json" | "html" | "embed" | "api";

export const COPY_FORMATS: { id: CopyFormat; label: string; hint: string }[] = [
  { id: "text", label: "Plain text", hint: "Full match details" },
  { id: "social", label: "Social post", hint: "WhatsApp / X / Instagram" },
  { id: "markdown", label: "Markdown", hint: "Docs, Notion, GitHub" },
  { id: "json", label: "JSON", hint: "Raw structured data" },
  { id: "html", label: "HTML card", hint: "Paste into any web page" },
  { id: "embed", label: "Live embed", hint: "<iframe> that auto-updates" },
  { id: "api", label: "API call", hint: "fetch() snippet for apps" },
];

const scoreLine = (m: Match): string => {
  if (!m.headToHead) return m.name;
  const [a, b] = m.competitors;
  if (!b) return a?.name ?? m.name;
  if (m.state === "pre" || m.competitors.every((c) => c.score === undefined && !c.linescores)) return `${a.name} vs ${b.name}`;
  if (!a.score && !b.score && a.linescores && b.linescores)
    return `${a.name} ${a.linescores.join(" ")} – ${b.linescores.join(" ")} ${b.name}`;
  return `${a.name} ${a.score ?? "-"} – ${b.score ?? "-"} ${b.name}`;
};

const when = (m: Match) => new Date(m.date).toISOString().slice(0, 16).replace("T", " ") + " UTC";

const statusLabel = (m: Match) =>
  m.state === "in" ? `🔴 LIVE · ${m.status}` : m.state === "post" ? `✅ ${m.status}` : `🕒 ${m.status}`;

const fieldLines = (m: Match) =>
  m.competitors.map((c, i) => `${c.position ?? i + 1}. ${c.name}${c.score ? ` — ${c.score}` : ""}`);

function detailLines(m: Match): string[] {
  const lines: string[] = [];
  if (m.stage) lines.push(`Stage: ${m.stage}`);
  lines.push(`Kick-off: ${when(m)}`);
  if (m.venue) lines.push(`Venue: ${m.venue}${m.location ? `, ${m.location}` : ""}`);
  if (m.broadcasts.length) lines.push(`TV: ${m.broadcasts.join(", ")}`);
  if (m.odds) lines.push(`Odds: ${m.odds}`);
  if (m.headToHead) {
    for (const c of m.competitors) {
      const extra = [c.record && `record ${c.record}`, c.form && `form ${c.form}`, c.linescores && `sets/periods ${c.linescores.join(" ")}`]
        .filter(Boolean)
        .join(" · ");
      if (extra) lines.push(`${c.name}: ${extra}`);
    }
  }
  return lines;
}

export function formatMatch(m: Match, fmt: CopyFormat, origin: string): string {
  const sport = SPORT_LABELS[m.sport];
  const apiUrl = `${origin}/api/match/${encodeURIComponent(m.leagueSlug)}/${m.eventId}`;
  const embedUrl = `${origin}/embed/${encodeURIComponent(m.leagueSlug)}/${m.eventId}`;
  const pageUrl = `${origin}/match/${encodeURIComponent(m.leagueSlug)}/${m.eventId}`;

  switch (fmt) {
    case "text":
      return [
        `${sport.icon} ${m.league} (${m.region})`,
        scoreLine(m),
        statusLabel(m),
        ...(m.headToHead ? [] : fieldLines(m)),
        ...detailLines(m),
        ...(m.events.length ? ["Key events:", ...m.events.map((e) => `  ${e.clock} ${e.type} – ${e.text}`)] : []),
        m.headline ? `Report: ${m.headline}` : "",
        `More: ${pageUrl}`,
      ].filter(Boolean).join("\n");

    case "social": {
      const tag = (s: string) => "#" + s.replace(/[^A-Za-z0-9]/g, "");
      const tags = [tag(m.league), ...(m.headToHead ? m.competitors.map((c) => tag(c.abbr ?? c.name)) : []), tag(sport.label)];
      return [
        m.state === "in" ? "🚨 LIVE NOW" : m.state === "post" ? "🏁 FULL TIME" : "📅 COMING UP",
        `${sport.icon} ${scoreLine(m)}`,
        ...(m.headToHead ? [] : fieldLines(m).slice(0, 3)),
        `🏆 ${m.league}${m.stage ? ` · ${m.stage}` : ""}`,
        m.state === "pre" ? `🕒 ${when(m)}` : `📊 ${m.status}`,
        m.venue ? `📍 ${m.venue}` : "",
        "",
        [...new Set(tags)].join(" "),
      ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "").join("\n").trim();
    }

    case "markdown":
      return [
        `### ${sport.icon} ${scoreLine(m)}`,
        `**${m.league}** · ${statusLabel(m)}`,
        "",
        ...(m.headToHead
          ? ["| Team | Score |", "|---|---|", ...m.competitors.map((c) => `| ${c.name}${c.winner ? " 🏆" : ""} | ${c.score ?? "-"} |`)]
          : ["| Pos | Name | Result |", "|---|---|---|", ...m.competitors.map((c, i) => `| ${c.position ?? i + 1} | ${c.name} | ${c.score ?? "-"} |`)]),
        "",
        ...detailLines(m).map((l) => `- ${l}`),
        ...(m.events.length ? ["", "**Key events**", ...m.events.map((e) => `- \`${e.clock}\` ${e.type} – ${e.text}`)] : []),
        "",
        `[Match centre](${pageUrl})`,
      ].join("\n");

    case "json":
      return JSON.stringify(m, null, 2);

    case "html": {
      const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
      const rows = m.competitors
        .map((c) => `    <tr><td style="padding:4px 8px">${esc(c.name)}</td><td style="padding:4px 8px;text-align:right;font-weight:700">${esc(c.score ?? "-")}</td></tr>`)
        .join("\n");
      return [
        `<div style="font-family:system-ui,sans-serif;border:1px solid #ddd;border-radius:12px;padding:12px 16px;max-width:360px">`,
        `  <div style="font-size:12px;color:#666">${sport.icon} ${esc(m.league)}${m.stage ? ` · ${esc(m.stage)}` : ""}</div>`,
        `  <table style="width:100%;border-collapse:collapse;margin:8px 0">`,
        rows,
        `  </table>`,
        `  <div style="font-size:12px;color:${m.state === "in" ? "#d32f2f" : "#666"}">${esc(m.status)}${m.venue ? ` · ${esc(m.venue)}` : ""}</div>`,
        `</div>`,
      ].join("\n");
    }

    case "embed":
      return `<iframe src="${embedUrl}" width="100%" height="190" style="border:0;border-radius:12px;max-width:420px" loading="lazy" title="${scoreLine(m).replace(/"/g, "&quot;")}"></iframe>`;

    case "api":
      return [
        `// Live JSON for this match — refreshed every 15 minutes`,
        `const res = await fetch("${apiUrl}");`,
        `const match = await res.json();`,
        `console.log(match.status, match.competitors.map(c => \`\${c.name} \${c.score ?? ""}\`));`,
        ``,
        `// curl ${apiUrl}`,
      ].join("\n");
  }
}

export function formatMany(matches: Match[], fmt: "text" | "json" | "markdown", origin: string): string {
  if (fmt === "json") return JSON.stringify(matches, null, 2);
  const sep = fmt === "markdown" ? "\n\n---\n\n" : "\n\n";
  return matches.map((m) => formatMatch(m, fmt, origin)).join(sep);
}
