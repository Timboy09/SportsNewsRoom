import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamesBoard } from "@/components/GamesBoard";
import { Newsroom } from "@/components/Newsroom";
import { RefreshTimer } from "@/components/RefreshTimer";
import { getAllMatches } from "@/lib/espn";
import { getAllNews } from "@/lib/news";
import { SPORT_KEYS, SPORT_LABELS, isSportKey } from "@/lib/sources";

export const revalidate = 900;
export const dynamicParams = false;

export function generateStaticParams() {
  return SPORT_KEYS.map((sport) => ({ sport }));
}

type Params = { params: Promise<{ sport: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { sport } = await params;
  if (!isSportKey(sport)) return {};
  const { label } = SPORT_LABELS[sport];
  return { title: `${label} live scores, results & news`, description: `${label} scores, fixtures, results and headlines — updated every 15 minutes, with ready-to-post posters.` };
}

export default async function SportPage({ params }: Params) {
  const { sport } = await params;
  if (!isSportKey(sport)) notFound();
  const [matches, news] = await Promise.all([getAllMatches(), getAllNews()]);
  const items = matches.items.filter((m) => m.sport === sport);
  const headlines = news.items.filter((n) => n.sport === sport);
  const { label, icon } = SPORT_LABELS[sport];
  const live = items.filter((m) => m.state === "in").length;

  return (
    <>
      <section className="hero hero--sport">
        <div>
          <h1>
            {icon} {label}
          </h1>
          <p className="muted">
            {items.length} matches · {live} live · {headlines.length} headlines. Tap <b>Poster</b> on anything to make a ready-to-post image.
          </p>
        </div>
        <RefreshTimer updatedAt={matches.updatedAt} />
      </section>
      {sport === "games" && <GamesBoard />}
      <Newsroom matches={items} news={headlines} fixedSport={sport} />
    </>
  );
}
