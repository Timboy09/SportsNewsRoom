"use client";

import { copyText, useOrigin } from "./clipboard";
import { CopyIcon } from "./CopyMenu";
import { useToast } from "./Toast";

/** A code snippet with a copy button. `{origin}` is replaced with this site's URL. */
export function CopyBox({ code }: { code: string }) {
  const origin = useOrigin();
  const toast = useToast();
  const filled = code.replaceAll("{origin}", origin);
  return (
    <div className="copybox">
      <pre className="mono" suppressHydrationWarning>
        <code>{filled}</code>
      </pre>
      <button className="btn btn--ghost" onClick={async () => toast((await copyText(filled)) ? "Copied!" : "Copy failed")}>
        <CopyIcon /> Copy
      </button>
    </div>
  );
}
