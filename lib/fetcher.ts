import { REFRESH_SECONDS } from "./sources";

// A normal browser UA: some sports CDNs reject bot-like or unknown agents.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/**
 * Fetch with a hard timeout and Next.js data-cache revalidation, so every
 * upstream is hit at most once per 15 minutes no matter how much traffic
 * the site gets.
 */
export async function cachedFetch(
  url: string,
  accept = "application/json, text/plain, */*",
  timeoutMs = 8000,
): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: REFRESH_SECONDS },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  return res;
}

/** Try each URL in turn; resolve with the first JSON body that parses. */
export async function fetchJsonWithFallback(urls: string[]): Promise<unknown> {
  let lastErr: unknown;
  for (const url of urls) {
    try {
      return await (await cachedFetch(url)).json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export function errorText(e: unknown): string {
  if (e instanceof Error) {
    const cause = (e as Error & { cause?: unknown }).cause;
    return cause instanceof Error ? `${e.message}: ${cause.message}` : e.message;
  }
  return String(e);
}

export function nextUpdate(from = new Date()): string {
  return new Date(from.getTime() + REFRESH_SECONDS * 1000).toISOString();
}
