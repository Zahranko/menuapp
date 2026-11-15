"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/** Copy the share link, or open the phone's share sheet where there is one. */
export function ShareActions({ url, title, labels }: { url: string; title: string; labels: { copy: string; copied: string; share: string } }) {
  const [copied, setCopied] = useState(false);
  // Only the browser knows; the server renders without the button so both markups match.
  const canShare = useSyncExternalStore(noSubscribe, () => typeof navigator.share === "function", () => false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(labels.copy, url);
    }
  };

  return (
    <div className="mk-cm-share">
      <button type="button" className="mk-btn mk-btn-dark mk-btn-sm" onClick={copy}>
        {copied ? labels.copied : labels.copy}
      </button>
      {canShare && (
        <button type="button" className="mk-btn mk-btn-sm mk-cm-ghost" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          {labels.share}
        </button>
      )}
      <span className="mk-sr" aria-live="polite">
        {copied ? labels.copied : ""}
      </span>
    </div>
  );
}
