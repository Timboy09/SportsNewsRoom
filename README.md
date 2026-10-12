# SportsNewsRoom

A global sports desk with live scores, fixtures, results and headlines from around the world. It **auto-updates every 15 minutes**, and every match has **one-click copy codes**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftimboy09%2Fsportsnewsroom&project-name=sportsnewsroom)

## What you get

| Feature | Details |
|---|---|
| **Live desk** | 38 competitions: Champions League, Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, ISL, Saudi Pro League, MLS, Brasileirão, Libertadores, NBA, NFL, MLB, NHL, ATP/WTA, UFC, F1, PGA and more |
| **Headlines** | BBC Sport (incl. cricket, tennis, F1), ESPN, ESPNcricinfo, The Guardian, Sky Sports, Yahoo and CBS. Duplicate stories are removed and each one is tagged by sport |
| **Copy codes** | Every match can be copied as **plain text, social post, Markdown, JSON, HTML card, live `<iframe>` embed or `fetch()` API snippet** |
| **Bulk copy** | Copy every visible (filtered) match as Text, Markdown or JSON |
| **Auto-update** | Server: ISR `revalidate = 900` (15 min) on every page and upstream fetch. Browser: a countdown refreshes the page in place every 15 min, and right away when you return to a stale tab |
| **Filters** | Sport chips, Live / Upcoming / Results tabs, and instant search |
| **Free JSON API** | `/api/matches`, `/api/news`, `/api/match/<league>/<id>` and `/api/health`. CORS is open, no key needed. See `/developers` on the site |
| **Resilient** | Each of the ~58 sources is fetched in parallel with an 8 s timeout. A failing source is skipped, so it never breaks the page |

## Deploy to Vercel (2 minutes)

1. Click **Deploy with Vercel** above, or go to [vercel.com/new](https://vercel.com/new) and import `timboy09/sportsnewsroom`.
2. Keep the defaults (Framework: Next.js) and click **Deploy**.
3. Done. The site refreshes itself every 15 minutes. No API keys or database are needed.

Optional:
- **Custom domain:** set the env var `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` so the copied embed and API codes use it.
- **Always-fresh even with zero traffic:** add the repo variable `SITE_URL` (GitHub → Settings → Secrets and variables → Actions → Variables). The included `keep-warm` workflow then pings the site every 15 minutes. Vercel Hobby crons are limited to once a day, so this workflow is used instead.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Add a league or feed

Edit `lib/sources.ts` and add an entry to `LEAGUES` (ESPN slug) or `NEWS_FEEDS` (any RSS/Atom URL). It appears in the UI, the filters and the API automatically.

## Architecture

```
lib/sources.ts   every league + feed (single source of truth)
lib/espn.ts      ESPN scoreboards → unified Match (team sports, tennis, MMA cards, F1/golf fields)
lib/news.ts      RSS/Atom + ESPN news → deduped, sport-tagged headlines
lib/format.ts    the 7 copy-code formats (shared by UI + API)
app/(site)/      live desk, match pages (/match/<league>/<id>), developer docs
app/embed/       iframe widget
app/api/         JSON / text endpoints
```

Data © the respective publishers. Headlines link back to the original source.
