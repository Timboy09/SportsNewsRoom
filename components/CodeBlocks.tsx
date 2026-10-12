"use client";

import { useState } from "react";
import { COPY_FORMATS, formatMatch, type CopyFormat } from "@/lib/format";
import type { Match } from "@/lib/types";
import { copyText, useOrigin } from "./clipboard";
import { CopyIcon } from "./CopyMenu";
import { useToast } from "./Toast";

/** Every copy-code format for one match, with tabs and a big copy button. */
export function CodeBlocks({ match }: { match: Match }) {
  const [fmt, setFmt] = useState<CopyFormat>("text");
  const origin = useOrigin();
  const toast = useToast();
  const code = formatMatch(match, fmt, origin);

  return (
    <div className="codes card">
      <div className="codes__tabs" role="tablist">
        {COPY_FORMATS.map((f) => (
          <button key={f.id} role="tab" aria-selected={fmt === f.id} className={`tab ${fmt === f.id ? "tab--on" : ""}`} onClick={() => setFmt(f.id)} title={f.hint}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="codes__body">
        <button className="btn btn--copy codes__copy" onClick={async () => toast((await copyText(code)) ? "Copied!" : "Copy failed")}>
          <CopyIcon /> Copy code
        </button>
        <pre className="mono" suppressHydrationWarning>
          <code>{code}</code>
        </pre>
      </div>
      {fmt === "html" && (
        <div className="codes__preview">
          <div className="muted">Preview</div>
          <div dangerouslySetInnerHTML={{ __html: code }} />
        </div>
      )}
    </div>
  );
}
