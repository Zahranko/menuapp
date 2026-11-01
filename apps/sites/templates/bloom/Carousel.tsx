"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BackIcon, ChevronIcon, PauseIcon, PlayIcon } from "./art";

type Props = {
  children: ReactNode;
  /** Slides by itself every few seconds (never with reduced motion, never after the visitor takes over). */
  autoplay: boolean;
  labels: { pause: string; play: string; prev: string; next: string };
  /** Accessible name of the scrolling list. */
  label: string;
};

const EVERY = 3800;

/** Moves the row one card forward or back; with `wrap`, the last card goes back to the first. */
function slide(el: HTMLElement, dir: 1 | -1, wrap = false) {
  const style = getComputedStyle(el);
  const rtl = style.direction === "rtl";
  const card = el.querySelector<HTMLElement>(":scope > li");
  const width = (card?.offsetWidth ?? 240) + (parseFloat(style.columnGap) || 0);
  const pos = Math.abs(el.scrollLeft);
  const max = el.scrollWidth - el.clientWidth - 4;
  if (wrap && dir === 1 && pos >= max) {
    el.scrollTo({ left: 0, behavior: "smooth" });
    return;
  }
  el.scrollBy({ left: dir * width * (rtl ? -1 : 1), behavior: "smooth" });
}

/**
 * "Today's bakes": a scroll-snap row of cards with previous / next buttons and a gentle autoplay.
 * Autoplay waits while the row is off screen, hovered or focused, stops for good once the visitor
 * moves the row themselves, and has its own pause button (WCAG 2.2.2).
 */
export function Carousel({ children, autoplay, labels, label }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const [playing, setPlaying] = useState(false);
  const hold = useRef(false);
  const visible = useRef(false);
  // True when every card fits on screen: no buttons, no autoplay, the cards sit in the middle.
  const [fits, setFits] = useState(false);

  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Autoplay starts in the browser only, after the server render; there is nothing to sync it with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(true);
  }, [autoplay]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => (visible.current = entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const ro = new ResizeObserver(() => setFits(el.scrollWidth <= el.clientWidth + 2));
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing || fits) return;
    const id = window.setInterval(() => {
      if (hold.current || !visible.current || document.hidden || !track.current) return;
      slide(track.current, 1, true);
    }, EVERY);
    return () => window.clearInterval(id);
  }, [playing, fits]);

  const step = (dir: 1 | -1) => {
    setPlaying(false);
    if (track.current) slide(track.current, dir);
  };

  return (
    <div
      className={fits ? "carousel fits" : "carousel"}
      onPointerEnter={() => (hold.current = true)}
      onPointerLeave={() => (hold.current = false)}
      onFocus={() => (hold.current = true)}
      onBlur={() => (hold.current = false)}
    >
      <ul ref={track} className="plain carousel-track" aria-label={label} onTouchStart={() => setPlaying(false)}>
        {children}
      </ul>
      <div className="carousel-controls">
        <button type="button" className="round-btn" aria-label={labels.prev} onClick={() => step(-1)}>
          <BackIcon className="flip" />
        </button>
        {autoplay && (
          <button type="button" className="round-btn round-btn-soft" aria-label={playing ? labels.pause : labels.play} onClick={() => setPlaying(!playing)}>
            {playing ? <PauseIcon /> : <PlayIcon className="flip" />}
          </button>
        )}
        <button type="button" className="round-btn" aria-label={labels.next} onClick={() => step(1)}>
          <ChevronIcon className="flip" />
        </button>
      </div>
    </div>
  );
}
