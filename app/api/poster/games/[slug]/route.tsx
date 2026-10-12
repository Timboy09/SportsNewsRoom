import type { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { MULTI_SPORT_EVENTS, gamesStatus } from "@/lib/games";
import { gamesPoster, posterOpts } from "@/lib/poster";

/** GET /api/poster/games/aichi-nagoya-para-2026?size=story → countdown / live / wrap-up PNG */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = MULTI_SPORT_EVENTS.find((x) => x.slug === slug);
  if (!e) return json({ error: "Unknown event" }, { status: 404 });
  return gamesPoster(e, gamesStatus(e), posterOpts(req.nextUrl.searchParams));
}
