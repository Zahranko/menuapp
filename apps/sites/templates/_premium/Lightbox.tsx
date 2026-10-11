"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { src: string; caption: string | null };

type Props = {
  photos: Photo[];
  labels: { close: string; prev: string; next: string; photo: string };
};

/**
 * Full-screen photo viewer. Any element with data-photo="<index>" opens it at that photo.
 * Arrow keys and swipes move between photos; Escape or a tap on the backdrop closes it.
 */
export function Lightbox({ photos, labels }: Props) {
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
      dialog.current?.showModal();
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
      className="lightbox"
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
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- owner photos come from any storage host */}
          <img src={photo.src} alt={photo.caption ?? ""} />
          <figcaption>
            {photo.caption && <span>{photo.caption}</span>}
            <span className="lightbox-count">
              {index + 1} / {photos.length}
            </span>
          </figcaption>
        </figure>
      )}
      {photos.length > 1 && (
        <>
          <button type="button" className="lightbox-prev" aria-label={labels.prev} onClick={() => go(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="flip">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="lightbox-next" aria-label={labels.next} onClick={() => go(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="flip">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
      <button type="button" className="lightbox-close" aria-label={labels.close} onClick={() => dialog.current?.close()} autoFocus>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
