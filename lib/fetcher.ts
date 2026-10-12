import { REFRESH_SECONDS } from "./sources";

const UA =
  "Mozilla/5.0 (compatible; SportsNewsRoom/1.0; +https://vercel.com) AppleWebKit/537.36";

/**
 * Fetch with a hard timeout and Next.js data-cache revalidation, so every
 * upstream is hit at most once per 15 minutes no matter how much traffic
 * the site gets.
 */
export async function cachedFetch(
  url: string,
  accept = "application/json",
  timeoutMs = 8000,
): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: accept },
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: REFRESH_SECONDS },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

export function nextUpdate(from = new Date()): string {
  return new Date(from.getTime() + REFRESH_SECONDS * 1000).toISOString();
}
