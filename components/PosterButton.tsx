"use client";

import { formatMatch } from "@/lib/format";
import { SPORT_LABELS } from "@/lib/sources";
import type { Match, NewsItem } from "@/lib/types";
import { useOrigin } from "./clipboard";
import { PosterIcon, usePoster, type PosterTarget } from "./PosterStudio";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
const tag = (s: string) => "#" + s.replace(/[^A-Za-z0-9]/g, "");

export function PosterButton({ target, compact }: { target: PosterTarget; compact?: boolean }) {
  const open = usePoster();
  return (
    <button className={compact ? "news__copy" : "btn btn--poster"} onClick={() => open(target)} title="Make a social media poster">
      <PosterIcon /> {!compact && "Poster"}
    </button>
  );
}

export function MatchPosterButton({ m }: { m: Match }) {
  const origin = useOrigin();
  return (
    <PosterButton
      target={{
        title: m.name,
        path: `/api/poster/match/${encodeURIComponent(m.leagueSlug)}/${m.eventId}`,
        caption: formatMatch(m, "social", origin),
        filename: slugify(m.name),
      }}
    />
  );
}

export function headlineTarget(n: NewsItem): PosterTarget {
  const qs = new URLSearchParams({ title: n.title, source: n.source });
  if (n.sport) qs.set("sport", n.sport);
  if (n.image) qs.set("image", n.image);
  const tags = [n.sport && tag(SPORT_LABELS[n.sport].label), "#SportsNews", "#SportsUpdate"].filter(Boolean).join(" ");
  return {
    title: n.title,
    path: `/api/poster/headline?${qs}`,
    caption: `📰 ${n.title}\n\n${n.summary ? n.summary + "\n\n" : ""}Source: ${n.source}\n\n${tags}`,
    filename: slugify(n.title),
  };
}
