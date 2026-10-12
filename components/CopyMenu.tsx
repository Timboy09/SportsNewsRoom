"use client";

import { useEffect, useRef, useState } from "react";
import { COPY_FORMATS, formatMatch, type CopyFormat } from "@/lib/format";
import type { Match } from "@/lib/types";
import { copyText, useOrigin } from "./clipboard";
import { useToast } from "./Toast";

export function CopyMenu({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const origin = useOrigin();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  const copy = async (fmt: CopyFormat) => {
    const ok = await copyText(formatMatch(match, fmt, origin));
    const label = COPY_FORMATS.find((f) => f.id === fmt)?.label;
    toast(ok ? `Copied ${label}` : "Copy failed — select manually");
    setOpen(false);
  };

  return (
    <div className="copy" ref={ref}>
      <button className="btn btn--copy" onClick={() => copy("text")} title="Copy match details as text">
        <CopyIcon /> Copy
      </button>
      <button className="btn btn--more" aria-haspopup="menu" aria-expanded={open} onClick={(e) => {
          // Fixed positioning escapes scroll containers like the live ticker.
          const r = e.currentTarget.getBoundingClientRect();
          const right = Math.max(8, window.innerWidth - r.right);
          setPos(r.bottom + 360 < window.innerHeight ? { top: r.bottom + 6, right } : { bottom: window.innerHeight - r.top + 6, right });
          setOpen((o) => !o);
        }} title="More code formats">
        ▾
      </button>
      {open && (
        <div className="copy__menu" role="menu" style={pos}>
          {COPY_FORMATS.map((f) => (
            <button key={f.id} role="menuitem" onClick={() => copy(f.id)}>
              <strong>{f.label}</strong>
              <span>{f.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
