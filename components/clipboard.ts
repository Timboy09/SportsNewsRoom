"use client";

import { useSyncExternalStore } from "react";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for http:// or iframes without clipboard permission.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

const noop = () => () => {};

/** This site's origin: the configured URL during SSR/hydration, then the real one. */
export function useOrigin(): string {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => process.env.NEXT_PUBLIC_SITE_URL ?? "",
  );
}
