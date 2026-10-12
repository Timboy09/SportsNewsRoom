/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import { XMLParser } from "fast-xml-parser";
import { cachedFetch, nextUpdate } from "./fetcher";
import { ESPN_API_BASE, ESPN_NEWS, NEWS_FEEDS, type NewsFeed, type SportKey } from "./sources";
import type { NewsItem, Snapshot, SourceHealth } from "./types";

const MAX_ITEMS = 150;
const MAX_AGE_MS = 3 * 24 * 3600 * 1000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
  htmlEntities: true,
});

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, raw: string) => {
    const e = raw.toLowerCase();
    if (e[0] !== "#") return ENTITIES[e] ?? m;
    const code = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });

const text = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object") return text(v["#text"] ?? v["@_href"]);
  const s = decodeEntities(String(v).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return s || undefined;
};

const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function imageOf(item: any): string | undefined {
  const media = asArray(item["media:thumbnail"]).concat(asArray(item["media:content"]));
  for (const m of media) if (m?.["@_url"]) return m["@_url"];
  const enc = asArray(item.enclosure).find((e: any) => String(e?.["@_type"] ?? "").startsWith("image"));
  return enc?.["@_url"];
}

const SPORT_HINTS: [SportKey, RegExp][] = [
  ["cricket", /cricket|ipl|test match|odi|t20|ashes|wicket/i],
  ["soccer", /football|soccer|premier league|la ?liga|serie a|bundesliga|champions league|uefa|fifa|mls/i],
  ["basketball", /\bnba\b|basketball|wnba/i],
  ["football", /\bnfl\b|super bowl|quarterback|touchdown/i],
  ["baseball", /\bmlb\b|baseball|world series/i],
  ["hockey", /\bnhl\b|hockey|stanley cup/i],
  ["tennis", /tennis|\batp\b|\bwta\b|wimbledon|roland garros|us open|australian open/i],
  ["racing", /formula 1|\bf1\b|grand prix|verstappen|hamilton/i],
  ["golf", /golf|\bpga\b|ryder cup|masters/i],
  ["mma", /\bufc\b|\bmma\b/i],
];

function guessSport(feed: NewsFeed, title: string, link: string): SportKey | undefined {
  if (feed.sport) return feed.sport;
  const hay = `${title} ${link}`;
  return SPORT_HINTS.find(([, re]) => re.test(hay))?.[0];
}

export function parseFeed(feed: NewsFeed, xml: string): NewsItem[] {
  const doc = parser.parse(xml);
  const rssItems = asArray(doc?.rss?.channel?.item);
  const atomItems = asArray(doc?.feed?.entry);
  const out: NewsItem[] = [];

  for (const it of [...rssItems, ...atomItems]) {
    const title = text(it.title);
    const linkRaw = it.link;
    const url =
      typeof linkRaw === "string"
        ? linkRaw
        : (asArray(linkRaw).find((l: any) => !l["@_rel"] || l["@_rel"] === "alternate")?.["@_href"] ?? text(it.guid));
    if (!title || !url || !/^https?:\/\//.test(url)) continue;
    const published = new Date(text(it.pubDate) ?? text(it.published) ?? text(it.updated) ?? text(it["dc:date"]) ?? Date.now());
    out.push({
      id: url,
      title,
      summary: text(it.description ?? it.summary)?.slice(0, 280),
      url,
      source: feed.source,
      sport: guessSport(feed, title, url),
      image: imageOf(it),
      published: isNaN(published.getTime()) ? new Date().toISOString() : published.toISOString(),
    });
  }
  return out;
}

export function parseEspnNews(sport: SportKey, data: any): NewsItem[] {
  return asArray(data?.articles).flatMap((a: any) => {
    const url = a.links?.web?.href;
    if (!a.headline || !url) return [];
    return [{
      id: url,
      title: a.headline,
      summary: a.description,
      url,
      source: "ESPN",
      sport,
      image: a.images?.[0]?.url,
      published: a.published ?? a.lastModified ?? new Date().toISOString(),
    }];
  });
}

/** Normalise a URL/title so the same story from two feeds is shown once. */
const dedupeKey = (n: NewsItem) => n.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);

export const getAllNews = cache(async (): Promise<Snapshot<NewsItem>> => {
  const jobs: { name: string; run: () => Promise<NewsItem[]> }[] = [
    ...NEWS_FEEDS.map((f) => ({
      name: `${f.source}${f.sport ? ` (${f.sport})` : ""}`,
      run: async () => parseFeed(f, await (await cachedFetch(f.url, "application/rss+xml, application/xml, text/xml")).text()),
    })),
    ...ESPN_NEWS.map((e) => ({
      name: `ESPN ${e.slug}`,
      run: async () => parseEspnNews(e.sport, await (await cachedFetch(`${ESPN_API_BASE}/${e.sport}/${e.slug}/news`)).json()),
    })),
  ];

  const results = await Promise.allSettled(jobs.map((j) => j.run()));
  const sources: SourceHealth[] = [];
  const byKey = new Map<string, NewsItem>();
  const cutoff = Date.now() - MAX_AGE_MS;

  results.forEach((r, i) => {
    const list = r.status === "fulfilled" ? r.value : [];
    sources.push({ name: jobs[i].name, ok: r.status === "fulfilled", count: list.length });
    for (const n of list) {
      if (new Date(n.published).getTime() < cutoff) continue;
      const k = dedupeKey(n);
      const prev = byKey.get(k);
      // Prefer the copy that carries an image / sport tag.
      if (!prev || (!prev.image && n.image) || (!prev.sport && n.sport)) byKey.set(k, { ...n, id: k, image: n.image ?? prev?.image, sport: n.sport ?? prev?.sport });
    }
  });

  const items = [...byKey.values()]
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, MAX_ITEMS);
  const now = new Date();
  return { updatedAt: now.toISOString(), nextUpdateAt: nextUpdate(now), items, sources };
});
