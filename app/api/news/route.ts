import type { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { getAllNews } from "@/lib/news";

/** GET /api/news?sport=cricket&q=india&limit=20 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const snap = await getAllNews();
  const q = p.get("q")?.toLowerCase();
  const limit = Math.min(Number(p.get("limit")) || 150, 150);
  const items = snap.items
    .filter((n) => !p.get("sport") || n.sport === p.get("sport"))
    .filter((n) => !p.get("source") || n.source.toLowerCase() === p.get("source")!.toLowerCase())
    .filter((n) => !q || `${n.title} ${n.summary ?? ""}`.toLowerCase().includes(q))
    .slice(0, limit);
  return json({ updatedAt: snap.updatedAt, nextUpdateAt: snap.nextUpdateAt, count: items.length, items });
}
