"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { copyText } from "./clipboard";
import { useToast } from "./Toast";

export interface PosterTarget {
  title: string;
  /** API path without size/handle/tz, e.g. /api/poster/match/eng.1/123 */
  path: string;
  caption: string;
  filename: string;
}

const SIZES = [
  { id: "portrait", label: "Portrait 4:5", hint: "Insta feed" },
  { id: "square", label: "Square 1:1", hint: "Feed / X" },
  { id: "story", label: "Story 9:16", hint: "Stories / Status" },
] as const;
type SizeId = (typeof SIZES)[number]["id"];

const PosterCtx = createContext<(t: PosterTarget) => void>(() => {});
export const usePoster = () => useContext(PosterCtx);

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k) ?? "";
    } catch {
      return "";
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

export function PosterProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PosterTarget | null>(null);
  const open = useCallback((t: PosterTarget) => setTarget(t), []);
  return (
    <PosterCtx.Provider value={open}>
      {children}
      {target && <PosterModal target={target} onClose={() => setTarget(null)} />}
    </PosterCtx.Provider>
  );
}

function PosterModal({ target, onClose }: { target: PosterTarget; onClose: () => void }) {
  const toast = useToast();
  const [size, setSize] = useState<SizeId>("portrait");
  const [handle, setHandle] = useState("");
  const [committedHandle, setCommittedHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = store.get("snr.handle");
    const s = store.get("snr.size") as SizeId;
    setHandle(h);
    setCommittedHandle(h);
    if (SIZES.some((x) => x.id === s)) setSize(s);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Debounce the handle so the preview isn't re-rendered on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setCommittedHandle(handle);
      store.set("snr.handle", handle);
    }, 600);
    return () => clearTimeout(t);
  }, [handle]);

  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const qs = new URLSearchParams({ size, tz });
  if (committedHandle.trim()) qs.set("handle", committedHandle.trim());
  const src = `${target.path}${target.path.includes("?") ? "&" : "?"}${qs}`;

  useEffect(() => setLoading(true), [src]);

  const blob = async () => {
    const res = await fetch(src);
    if (!res.ok) throw new Error(String(res.status));
    return res.blob();
  };
  const fileName = `${target.filename}-${size}.png`;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast("Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  };

  const download = () =>
    run(async () => {
      const url = URL.createObjectURL(await blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: fileName });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast("Poster downloaded");
    });

  const share = () =>
    run(async () => {
      const file = new File([await blob()], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: target.caption });
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
      toast("Poster image copied");
    });

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Poster studio" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel">
        <header className="modal__head">
          <div>
            <b>Poster studio</b>
            <div className="muted modal__sub">{target.title}</div>
          </div>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="modal__body">
          <div className={`poster-preview poster-preview--${size}`}>
            {loading && <div className="poster-preview__spin">Rendering poster…</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Poster preview" onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
          </div>

          <div className="modal__controls">
            <label className="field">
              <span>Size</span>
              <div className="tabs">
                {SIZES.map((s) => (
                  <button key={s.id} className={`tab ${size === s.id ? "tab--on" : ""}`} onClick={() => { setSize(s.id); store.set("snr.size", s.id); }} title={s.hint}>
                    {s.label}
                  </button>
                ))}
              </div>
            </label>
            <label className="field">
              <span>Your handle on the poster</span>
              <input className="search" placeholder="@yourpage" value={handle} maxLength={40} onChange={(e) => setHandle(e.target.value)} />
            </label>

            <div className="modal__actions">
              <button className="btn btn--copy btn--lg" onClick={download} disabled={busy || loading}>⬇ Download PNG</button>
              <button className="btn btn--lg" onClick={share} disabled={busy || loading}>↗ Share / copy image</button>
              <button className="btn btn--lg" onClick={async () => toast((await copyText(target.caption)) ? "Caption copied" : "Copy failed")}>
                Copy caption
              </button>
            </div>
            <details className="caption">
              <summary>Caption preview</summary>
              <pre>{target.caption}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PosterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
