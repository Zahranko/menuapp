"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  photos: string[];
  labels: { close: string; prev: string; next: string; photo: string };
};

/**
 * The gallery's full-screen viewer for the fashion templates: photos only, no names or captions. Any element with
 * data-photo="<index>" opens it at that photo. Arrow keys (following the reading direction) and swipes move between
 * photos; Escape, the close button or a tap on the backdrop closes it. Styled by each template (.fs-viewer).
 */
export function PhotoViewer({ photos, labels }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>("[data-photo]");
      if (!trigger) return;
      const n = Number(trigger.dataset.photo);
      if (!Number.isInteger(n) || !photos[n]) return;
      event.preventDefault();
      setIndex(n);
      if (!dialog.current?.open) dialog.current?.showModal();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [photos]);

  const rtl = () => document.documentElement.dir === "rtl";
  const go = (step: number) => setIndex((i) => (i + step + photos.length) % photos.length);
  const photo = photos[index];

  return (
    <dialog
      ref={dialog}
      className="fs-viewer"
      aria-label={labels.photo.replace("{n}", String(index + 1))}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current.close();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(rtl() ? -1 : 1);
        if (e.key === "ArrowLeft") go(rtl() ? 1 : -1);
      }}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 40) go((dx < 0 ? 1 : -1) * (rtl() ? -1 : 1));
      }}
    >
      {photo && (
        <figure className="fs-viewer-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- owner photos come from any storage host */}
          <img src={photo} alt="" />
          <figcaption className="fs-viewer-count" aria-hidden="true">
            {index + 1} / {photos.length}
          </figcaption>
        </figure>
      )}
      {photos.length > 1 && (
        <>
          <button type="button" className="fs-viewer-btn fs-viewer-prev" aria-label={labels.prev} onClick={() => go(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="flip">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="fs-viewer-btn fs-viewer-next" aria-label={labels.next} onClick={() => go(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="flip">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
      <button type="button" className="fs-viewer-btn fs-viewer-close" aria-label={labels.close} onClick={() => dialog.current?.close()} autoFocus>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
