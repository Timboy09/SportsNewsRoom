import type { NextRequest } from "next/server";
import { json, text } from "@/lib/api";
import { getAllMatches } from "@/lib/espn";
import { formatMany } from "@/lib/format";

/**
 * GET /api/matches
 *   ?sport=soccer|cricket|basketball|…   ?league=eng.1   ?state=in|pre|post
 *   ?q=arsenal   ?limit=50   ?format=json|text|markdown
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const snap = await getAllMatches();
  const q = p.get("q")?.toLowerCase();
  const limit = Math.min(Number(p.get("limit")) || 500, 500);

  const items = snap.items
    .filter((m) => !p.get("sport") || m.sport === p.get("sport"))
    .filter((m) => !p.get("league") || m.leagueSlug === p.get("league"))
    .filter((m) => !p.get("state") || m.state === p.get("state"))
    .filter((m) => !q || `${m.name} ${m.league} ${m.region}`.toLowerCase().includes(q))
    .slice(0, limit);

  const format = p.get("format");
  if (format === "text") return text(formatMany(items, "text", req.nextUrl.origin));
  if (format === "markdown") return text(formatMany(items, "markdown", req.nextUrl.origin), "text/markdown");
  return json({ updatedAt: snap.updatedAt, nextUpdateAt: snap.nextUpdateAt, count: items.length, items });
}
