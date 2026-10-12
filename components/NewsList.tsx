"use client";

import { SPORT_LABELS } from "@/lib/sources";
import type { NewsItem } from "@/lib/types";
import { copyText } from "./clipboard";
import { CopyIcon } from "./CopyMenu";
import { LocalTime } from "./LocalTime";
import { useToast } from "./Toast";

export function NewsList({ items }: { items: NewsItem[] }) {
  const toast = useToast();
  if (!items.length) return <p className="muted">No headlines for this filter yet.</p>;
  return (
    <ol className="news">
      {items.map((n) => (
        <li key={n.id} className="news__item">
          {n.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="news__img" src={n.image} alt="" loading="lazy" />
          )}
          <div className="news__body">
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="news__title">
              {n.title}
            </a>
            <div className="news__meta">
              {n.sport && <span>{SPORT_LABELS[n.sport].icon}</span>}
              <span>{n.source}</span>
              <span>·</span>
              <LocalTime iso={n.published} mode="relative" />
              <button
                className="news__copy"
                title="Copy headline + link"
                onClick={async () => toast((await copyText(`${n.title}\n${n.summary ? n.summary + "\n" : ""}${n.url}`)) ? "Copied headline" : "Copy failed")}
              >
                <CopyIcon />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
