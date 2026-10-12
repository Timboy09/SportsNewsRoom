import Link from "next/link";
import { CategoryBar } from "@/components/CategoryBar";
import { PosterProvider } from "@/components/PosterStudio";
import { ToastProvider } from "@/components/Toast";
import { SITE_NAME } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PosterProvider>
      <header className="masthead">
        <div className="wrap masthead__inner">
          <Link href="/" className="brand">
            <span className="brand__mark">S</span>
            <span>
              {SITE_NAME}
              <small>Global sports desk · every 15 min</small>
            </span>
          </Link>
          <nav className="masthead__nav">
            <Link href="/">Live desk</Link>
            <Link href="/developers">Codes &amp; API</Link>
          </nav>
        </div>
        <CategoryBar />
      </header>
      <main className="wrap">{children}</main>
      <footer className="wrap footer">
        <p>
          Scores &amp; fixtures via ESPN public scoreboards, TheSportsDB and Lichess broadcasts · headlines via BBC Sport, ESPN, ESPNcricinfo, The Guardian, Sky
          Sports, Yahoo, CBS Sports, Chess.com, ChessBase &amp; Google News. All rights belong to their respective owners; headlines link to the original
          publisher.
        </p>
      </footer>
      </PosterProvider>
    </ToastProvider>
  );
}
