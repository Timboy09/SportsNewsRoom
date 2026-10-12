/* Poster rendering for social media (Instagram, X, WhatsApp, Stories).
 * Rendered server-side to PNG with next/og (Satori): every element with more
 * than one child needs display:flex, and only inline styles are supported. */
import { ImageResponse } from "next/og";
import type { MultiSportEvent, GamesStatus } from "./games";
import { formatRange } from "./games";
import { SPORT_LABELS, type SportKey } from "./sources";
import type { Competitor, Match } from "./types";

export const POSTER_SIZES = {
  square: { w: 1080, h: 1080, label: "Square 1:1", hint: "Instagram / X feed" },
  portrait: { w: 1080, h: 1350, label: "Portrait 4:5", hint: "Instagram feed" },
  story: { w: 1080, h: 1920, label: "Story 9:16", hint: "Stories / Reels / Status" },
} as const;
export type PosterSize = keyof typeof POSTER_SIZES;

export interface PosterOpts {
  size: PosterSize;
  handle?: string;
  tz: string;
}

export function posterOpts(params: URLSearchParams): PosterOpts {
  const size = params.get("size");
  const tz = params.get("tz") ?? "Asia/Kolkata";
  let validTz = "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    validTz = tz;
  } catch {}
  return {
    size: size && size in POSTER_SIZES ? (size as PosterSize) : "portrait",
    handle: params.get("handle")?.slice(0, 40) || undefined,
    tz: validTz,
  };
}

const C = {
  bg: "#0b0f17",
  panel: "#141b2b",
  line: "#26304a",
  ink: "#f2f5fa",
  muted: "#93a0b8",
  accent: "#c6ff3d",
  live: "#ff3b45",
};

/* ---------- Assets (fonts + remote images), all with graceful fallback ---------- */

type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700 | 800; style: "normal" };
let fontsPromise: Promise<Font[]> | null = null;

async function googleFont(family: string, weight: number): Promise<ArrayBuffer> {
  // No browser UA → Google serves TrueType, which Satori can read.
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, { signal: AbortSignal.timeout(4000) })).text();
  const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error("font url not found");
  return (await fetch(url, { signal: AbortSignal.timeout(4000) })).arrayBuffer();
}

function loadFonts(): Promise<Font[]> {
  fontsPromise ??= Promise.allSettled([
    googleFont("Barlow Condensed", 700).then((data) => ({ name: "Display", data, weight: 700 as const, style: "normal" as const })),
    googleFont("Inter", 600).then((data) => ({ name: "Body", data, weight: 600 as const, style: "normal" as const })),
    googleFont("Inter", 800).then((data) => ({ name: "Body", data, weight: 800 as const, style: "normal" as const })),
  ]).then((rs) => {
    const ok = rs.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    if (ok.length < rs.length) fontsPromise = null; // retry next time
    return ok;
  });
  return fontsPromise;
}

/** Fetch a remote image as a data URI (Satori can't fetch reliably itself). */
export async function imageData(url?: string): Promise<string | undefined> {
  if (!url || !/^https:\/\//.test(url)) return undefined;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(png|jpe?g|gif|svg\+xml)/.test(type)) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 3_000_000) return undefined;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/* ---------- Shared frame ---------- */

const sportName = (s: SportKey) => SPORT_LABELS[s].label.toUpperCase();

function Frame(props: { opts: PosterOpts; sport?: SportKey; kicker?: string; kickerColor?: string; children: React.ReactNode; bgImage?: string }) {
  const { w, h } = POSTER_SIZES[props.opts.size];
  const pad = props.opts.size === "story" ? 80 : 64;
  return (
    <div style={{ width: w, height: h, display: "flex", flexDirection: "column", background: C.bg, color: C.ink, fontFamily: "Body", position: "relative", padding: pad }}>
      {props.bgImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.bgImage} width={w} height={h} style={{ position: "absolute", top: 0, left: 0, width: w, height: h, objectFit: "cover" }} alt="" />
      )}
      <div
        style={{
          position: "absolute", top: 0, left: 0, width: w, height: h, display: "flex",
          background: props.bgImage
            ? "linear-gradient(180deg, rgba(11,15,23,0.55) 0%, rgba(11,15,23,0.75) 45%, rgba(11,15,23,0.97) 75%)"
            : `radial-gradient(circle at 85% 8%, rgba(198,255,61,0.22), transparent 45%), radial-gradient(circle at 0% 100%, rgba(80,120,255,0.18), transparent 50%)`,
        }}
      />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.accent, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Display", fontSize: 40 }}>S</div>
          <div style={{ display: "flex", fontFamily: "Display", fontSize: 34, letterSpacing: 2 }}>SPORTSNEWSROOM</div>
        </div>
        {props.sport && (
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: `2px solid ${C.line}`, background: "rgba(20,27,43,0.8)", fontSize: 24, letterSpacing: 2, color: C.muted }}>
            {sportName(props.sport)}
          </div>
        )}
      </div>

      {props.kicker && (
        <div style={{ display: "flex", marginTop: 48, position: "relative" }}>
          <div style={{ display: "flex", padding: "12px 26px", background: props.kickerColor ?? C.accent, color: props.kickerColor === C.live ? "#fff" : C.bg, fontFamily: "Display", fontSize: 40, letterSpacing: 3, borderRadius: 12 }}>
            {props.kicker}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>{props.children}</div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${C.line}`, paddingTop: 26, fontSize: 26, color: C.muted, position: "relative" }}>
        <div style={{ display: "flex" }}>{props.opts.handle ? props.opts.handle : "sportsnewsroom.vercel.app"}</div>
        <div style={{ display: "flex", color: C.accent }}>#SportsUpdate</div>
      </div>
    </div>
  );
}

async function render(node: React.ReactElement, opts: PosterOpts) {
  const { w, h } = POSTER_SIZES[opts.size];
  const fonts = await loadFonts();
  return new ImageResponse(node, {
    width: w,
    height: h,
    fonts: fonts.length ? fonts : undefined,
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
  });
}

/* ---------- Match poster ---------- */

function TeamBlock({ c, logo, big }: { c: Competitor; logo?: string; big: number }) {
  const initials = (c.abbr ?? c.name).replace(/[^A-Za-z0-9 ]/g, "").split(" ").map((x) => x[0]).join("").slice(0, 3).toUpperCase();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "36%", gap: 22 }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} width={big} height={big} style={{ objectFit: "contain" }} alt="" />
      ) : (
        <div style={{ width: big, height: big, borderRadius: big, background: C.panel, border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Display", fontSize: big * 0.36, color: C.accent }}>
          {initials || "?"}
        </div>
      )}
      <div style={{ display: "flex", textAlign: "center", justifyContent: "center", fontFamily: "Display", fontSize: c.name.length > 18 ? 46 : 58, lineHeight: 1.05, textTransform: "uppercase", color: c.winner === false ? C.muted : C.ink }}>
        {c.name}
      </div>
      {c.record && <div style={{ display: "flex", fontSize: 24, color: C.muted }}>{c.record}</div>}
    </div>
  );
}

function kickerFor(m: Match): [string, string] {
  if (m.state === "in") return [`LIVE${m.clock ? ` ${m.clock}` : ""}`, C.live];
  if (m.state === "post") return [m.sport === "soccer" ? "FULL TIME" : "RESULT", C.accent];
  return [m.sport === "chess" ? "UP NEXT" : "MATCH DAY", "#ffffff"];
}

const fmtTime = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));

export async function matchPoster(m: Match, opts: PosterOpts) {
  const [kicker, kColor] = kickerFor(m);
  const tall = opts.size !== "square";
  const logoSize = tall ? 220 : 170;
  const logos = await Promise.all(m.competitors.slice(0, 2).map((c) => imageData(c.logo)));

  const scoreText = (c?: Competitor) => (c?.score ?? c?.linescores?.join(" ") ?? "0");
  const center =
    m.state === "pre" || m.competitors.every((c) => c.score === undefined && !c.linescores) ? (
      <div style={{ display: "flex", fontFamily: "Display", fontSize: 110, color: C.accent }}>VS</div>
    ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "Display", fontSize: m.sport === "tennis" || m.sport === "cricket" ? 90 : 170, lineHeight: 1 }}>
        <div style={{ display: "flex" }}>{scoreText(m.competitors[0])}</div>
        <div style={{ display: "flex", color: C.muted, fontSize: 90 }}>–</div>
        <div style={{ display: "flex" }}>{scoreText(m.competitors[1])}</div>
      </div>
    );

  const detail = [
    m.state === "pre" ? fmtTime(m.date, opts.tz) : m.status,
    m.venue,
  ].filter(Boolean) as string[];

  const body = m.headToHead ? (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 36, gap: 6 }}>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 52, textTransform: "uppercase", lineHeight: 1.05 }}>{m.league}</div>
        {m.stage && <div style={{ display: "flex", fontSize: 28, color: C.muted }}>{m.stage}</div>}
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between" }}>
        <TeamBlock c={m.competitors[0]} logo={logos[0]} big={logoSize} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28%" }}>{center}</div>
        {m.competitors[1] && <TeamBlock c={m.competitors[1]} logo={logos[1]} big={logoSize} />}
      </div>
      {tall && m.events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, padding: "22px 28px", background: "rgba(20,27,43,0.85)", borderRadius: 20, border: `2px solid ${C.line}` }}>
          {m.events.filter((e) => /goal|red/i.test(e.type)).slice(0, opts.size === "story" ? 8 : 4).map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 18, fontSize: 28 }}>
              <div style={{ display: "flex", color: C.accent, width: 80 }}>{e.clock}</div>
              <div style={{ display: "flex" }}>{`${/red/i.test(e.type) ? "Red card · " : ""}${e.text}`}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 40, gap: 8 }}>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 76, textTransform: "uppercase", lineHeight: 1 }}>{m.name}</div>
        <div style={{ display: "flex", fontSize: 30, color: C.muted }}>{[m.league, m.stage].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 18 }}>
        {m.competitors.slice(0, tall ? 6 : 4).map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, padding: "18px 28px", background: i === 0 ? "rgba(198,255,61,0.12)" : "rgba(20,27,43,0.85)", borderRadius: 18, border: `2px solid ${i === 0 ? C.accent : C.line}` }}>
            <div style={{ display: "flex", fontFamily: "Display", fontSize: 54, color: i === 0 ? C.accent : C.muted, width: 60 }}>{c.position ?? i + 1}</div>
            <div style={{ display: "flex", flex: 1, fontFamily: "Display", fontSize: 50, textTransform: "uppercase" }}>{c.name}</div>
            {c.score && <div style={{ display: "flex", fontSize: 30, color: C.muted }}>{c.score}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  return render(
    <Frame opts={opts} sport={m.sport} kicker={kicker} kickerColor={kColor}>
      {body}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 30, fontSize: 30, color: C.muted }}>
        {detail.map((d, i) => (
          <div key={i} style={{ display: "flex", color: i === 0 ? C.ink : C.muted }}>{d}</div>
        ))}
      </div>
    </Frame>,
    opts,
  );
}

/* ---------- Headline poster ---------- */

export async function headlinePoster(n: { title: string; source?: string; sport?: SportKey; image?: string }, opts: PosterOpts) {
  const bg = await imageData(n.image);
  const len = n.title.length;
  const size = opts.size === "story" ? (len > 110 ? 70 : 88) : len > 110 ? 58 : len > 70 ? 70 : 84;
  return render(
    <Frame opts={opts} sport={n.sport} kicker="BREAKING" kickerColor={C.live} bgImage={bg}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end", paddingBottom: 40, gap: 26 }}>
        <div style={{ display: "flex", width: 90, height: 8, background: C.accent, borderRadius: 4 }} />
        <div style={{ display: "flex", fontFamily: "Display", fontSize: size, lineHeight: 1.04, textTransform: "uppercase" }}>{n.title}</div>
        {n.source && <div style={{ display: "flex", fontSize: 28, color: C.muted }}>{`Source: ${n.source}`}</div>}
      </div>
    </Frame>,
    opts,
  );
}

/* ---------- Multi-sport Games poster ---------- */

export async function gamesPoster(e: MultiSportEvent, status: GamesStatus, opts: PosterOpts) {
  const kicker = status.state === "live" ? "LIVE NOW" : status.state === "upcoming" ? "COUNTDOWN" : "THAT'S A WRAP";
  const bigNum = e.tbc ? "TBC" : status.state === "live" ? `DAY ${status.days}` : status.state === "upcoming" ? String(status.days) : "FINAL";
  const sub = e.tbc ? "DATES TO BE CONFIRMED" : status.state === "upcoming" ? (status.days === 1 ? "DAY TO GO" : "DAYS TO GO") : status.state === "live" ? "OF COMPETITION" : "THANK YOU, " + e.host.split(",")[0].toUpperCase();
  return render(
    <Frame opts={opts} sport="games" kicker={kicker} kickerColor={status.state === "live" ? C.live : C.accent}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: status.state === "upcoming" && !e.tbc ? 320 : 200, color: C.accent, lineHeight: 0.9 }}>{bigNum}</div>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 54, letterSpacing: 6 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 84, textTransform: "uppercase", lineHeight: 1 }}>{e.name}</div>
        <div style={{ display: "flex", fontSize: 32, color: C.muted }}>{`${e.host}  ·  ${formatRange(e)}`}</div>
      </div>
    </Frame>,
    opts,
  );
}
