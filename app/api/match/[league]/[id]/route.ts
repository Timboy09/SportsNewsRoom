import type { NextRequest } from "next/server";
import { json, text } from "@/lib/api";
import { getMatch } from "@/lib/espn";
import { COPY_FORMATS, formatMatch, type CopyFormat } from "@/lib/format";

/** GET /api/match/eng.1/704321?format=json|text|social|markdown|html|embed|api */
export async function GET(req: NextRequest, { params }: { params: Promise<{ league: string; id: string }> }) {
  const { league, id } = await params;
  const m = await getMatch(decodeURIComponent(league), id);
  if (!m) return json({ error: "Match not found on current scoreboards" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") as CopyFormat | null;
  if (format && format !== "json" && COPY_FORMATS.some((f) => f.id === format)) {
    return text(formatMatch(m, format, req.nextUrl.origin), format === "html" || format === "embed" ? "text/html" : "text/plain");
  }
  return json(m);
}
