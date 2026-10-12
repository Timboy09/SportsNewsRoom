"use client";

import { useEffect, useState } from "react";

type Mode = "time" | "datetime" | "relative";

function render(iso: string, mode: Mode, now: number): string {
  const d = new Date(iso);
  if (mode === "relative") {
    const diff = Math.round((now - d.getTime()) / 60000);
    if (Math.abs(diff) < 1) return "just now";
    const abs = Math.abs(diff);
    const unit = abs < 60 ? `${abs}m` : abs < 1440 ? `${Math.round(abs / 60)}h` : `${Math.round(abs / 1440)}d`;
    return diff > 0 ? `${unit} ago` : `in ${unit}`;
  }
  const opts: Intl.DateTimeFormatOptions =
    mode === "time"
      ? { hour: "2-digit", minute: "2-digit" }
      : { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  return d.toLocaleString(undefined, opts);
}

/** Renders in the viewer's own timezone after hydration (UTC on the server). */
export function LocalTime({ iso, mode = "datetime" }: { iso: string; mode?: Mode }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (mode !== "relative") return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [mode]);
  const text = now === null ? new Date(iso).toISOString().slice(11, 16) + " UTC" : render(iso, mode, now);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
