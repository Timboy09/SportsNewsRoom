"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LocalTime } from "./LocalTime";

const INTERVAL_MS = 15 * 60 * 1000;

/** Counts down to the next 15-minute refresh and pulls fresh server data in place. */
export function RefreshTimer({ updatedAt }: { updatedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const deadline = useRef(0);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    deadline.current = Date.now() + INTERVAL_MS;
  }, [updatedAt]);

  useEffect(() => {
    const tick = () => {
      const ms = deadline.current - Date.now();
      if (ms <= 0) {
        deadline.current = Date.now() + INTERVAL_MS;
        startTransition(() => router.refresh());
      }
      setLeft(Math.max(0, deadline.current - Date.now()));
    };
    tick();
    const t = setInterval(tick, 1000);
    // Coming back to a backgrounded tab after a while → refresh right away.
    const onVis = () => {
      if (document.visibilityState === "visible" && Date.now() - new Date(updatedAt).getTime() > INTERVAL_MS) {
        deadline.current = Date.now();
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router, updatedAt]);

  const mm = left === null ? "15" : String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = left === null ? "00" : String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="refresh">
      <span className={`pulse ${pending ? "pulse--busy" : ""}`} aria-hidden />
      <span>
        Updated <LocalTime iso={updatedAt} mode="relative" />
      </span>
      <span className="refresh__sep">·</span>
      <span>
        next in <b className="mono">{mm}:{ss}</b>
      </span>
      <button
        className="btn btn--ghost"
        disabled={pending}
        onClick={() => {
          deadline.current = Date.now() + INTERVAL_MS;
          startTransition(() => router.refresh());
        }}
      >
        {pending ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
