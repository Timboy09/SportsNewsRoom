import { json } from "@/lib/api";
import { getAllMatches } from "@/lib/espn";
import { getAllNews } from "@/lib/news";

/** Which upstream sources answered on the last refresh. */
export async function GET() {
  const [m, n] = await Promise.all([getAllMatches(), getAllNews()]);
  const sources = [...m.sources, ...n.sources];
  return json({
    updatedAt: m.updatedAt,
    ok: sources.filter((s) => s.ok).length,
    total: sources.length,
    matches: m.items.length,
    headlines: n.items.length,
    sources,
  });
}
