import type { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { getMatch } from "@/lib/espn";
import { matchPoster, posterOpts } from "@/lib/poster";

/** GET /api/poster/match/eng.1/704321?size=square|portrait|story&handle=@you&tz=Asia/Kolkata → PNG */
export async function GET(req: NextRequest, { params }: { params: Promise<{ league: string; id: string }> }) {
  const { league, id } = await params;
  const m = await getMatch(decodeURIComponent(league), id);
  if (!m) return json({ error: "Match not found on current scoreboards" }, { status: 404 });
  return matchPoster(m, posterOpts(req.nextUrl.searchParams));
}
