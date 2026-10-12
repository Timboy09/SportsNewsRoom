import type { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { headlinePoster, posterOpts } from "@/lib/poster";
import { isSportKey } from "@/lib/sources";

/** GET /api/poster/headline?title=…&source=…&sport=cricket&image=https://…&size=portrait → PNG */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const title = p.get("title")?.trim().slice(0, 220);
  if (!title) return json({ error: "title is required" }, { status: 400 });
  const sport = p.get("sport") ?? "";
  return headlinePoster(
    {
      title,
      source: p.get("source")?.slice(0, 60) || undefined,
      sport: isSportKey(sport) ? sport : undefined,
      image: p.get("image") || undefined,
    },
    posterOpts(p),
  );
}
