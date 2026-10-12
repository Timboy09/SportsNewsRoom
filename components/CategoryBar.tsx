"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SPORT_KEYS, SPORT_LABELS } from "@/lib/sources";

/** Sticky category strip: one page per sport. */
export function CategoryBar() {
  const path = usePathname();
  return (
    <nav className="catbar" aria-label="Categories">
      <div className="wrap catbar__inner">
        <Link href="/" className={`cat ${path === "/" ? "cat--on" : ""}`}>🌍 All</Link>
        {SPORT_KEYS.map((k) => (
          <Link key={k} href={`/sport/${k}`} className={`cat ${path === `/sport/${k}` ? "cat--on" : ""}`}>
            {SPORT_LABELS[k].icon} {SPORT_LABELS[k].label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
