"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { fillLabel, type HeroTransition, type SliderLabels } from "./hero";

type Props = {
  /** The photos, already rendered (by HeroPhotos, on the server): the first is the page's priority image. */
  slides: ReactNode[];
  transition: HeroTransition;
  autoplay: boolean;
  /** Milliseconds on each photo. */
  interval: number;
  dots: boolean;
  arrows: boolean;
  labels: SliderLabels;
  rtl: boolean;
  /** Where the buttons sit: centered at the foot of the photo, or in its bottom corner (where text sits on the photo). */
  placement: "center" | "corner";
};

const SWIPE = 40;

/** Visitors who prefer less motion get no autoplay and no animation. The server render assumes so: it never moves. */
const MOTION = "(prefers-reduced-motion: reduce)";
const prefersStill = () => window.matchMedia(MOTION).matches;
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The hero's photos taking turns. Fills its positioned parent (the template's own photo box), so nothing on the page
 * moves. Only the first photo loads with the page; the next one loads once the page has finished loading, the others
 * just before they show. Autoplay stops for visitors who prefer less motion, while the pointer or keyboard focus is on
 * it, while it is off screen, and for good with the pause button. Swipe on touch screens, arrow keys once a button has
 * focus. Right-to-left pages run the other way.
 */
export function HeroSlider({ slides, transition, autoplay, interval, dots, arrows, labels, rtl, placement }: Props) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  // Photos that have been shown (their images stay in place); the next one is added once the page has loaded.
  const [seen, setSeen] = useState<boolean[]>(() => slides.map((_, i) => i === 0));
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const still = useSyncExternalStore(subscribeMotion, prefersStill, () => true);
  const [onScreen, setOnScreen] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const done = () => setPageLoaded(true);
    if (document.readyState === "complete") {
      const timer = window.setTimeout(done, 0);
      return () => window.clearTimeout(timer);
    }
    window.addEventListener("load", done, { once: true });
    return () => window.removeEventListener("load", done);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The next photo starts loading once the page has loaded, so it is ready before its turn.
  const next = (index + 1) % count;
  const loaded = (i: number) => seen[i] || (pageLoaded && i === next);

  const go = useCallback(
    (to: number) => {
      const target = ((to % count) + count) % count;
      setSeen((was) => (was[target] ? was : was.map((on, i) => on || i === target)));
      setIndex(target);
    },
    [count],
  );

  const playing = autoplay && !paused && !still;
  useEffect(() => {
    if (!playing || held || !onScreen) return;
    const timer = window.setTimeout(() => go(index + 1), interval);
    return () => window.clearTimeout(timer);
  }, [playing, held, onScreen, index, interval, go]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const forward = (e.key === "ArrowRight") !== rtl;
    go(index + (forward ? 1 : -1));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    touch.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return;
    // Swiping toward the start of the line shows the next photo.
    const forward = (dx < 0) !== rtl;
    go(index + (forward ? 1 : -1));
  };

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
  };

  return (
    <div
      ref={root}
      className={`kit-slider is-${placement}`}
      data-transition={transition}
      data-playing={playing || undefined}
      role="region"
      aria-roledescription={labels.carousel}
      aria-label={labels.region}
      style={{ "--kit-i": index, "--kit-dir": rtl ? -1 : 1, "--kit-interval": `${interval}ms` } as CSSProperties}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (touch.current = null)}
    >
      <div className="kit-slides" aria-live={playing ? "off" : "polite"}>
        {slides.map((slide, i) => (
          <div
            key={i}
            className={i === index ? "kit-slide is-active" : "kit-slide"}
            role="group"
            aria-roledescription={labels.slideRole}
            aria-label={fillLabel(labels.slide, { n: i + 1, total: count })}
            aria-hidden={i === index ? undefined : true}
            data-slide={i}
          >
            {loaded(i) && slide}
          </div>
        ))}
      </div>
      {(arrows || dots || (autoplay && !still)) && (
        <div className="kit-slider-bar">
          {arrows && (
            <button type="button" className="kit-slider-btn kit-slider-prev" aria-label={labels.previous} onClick={() => go(index - 1)}>
              <Chevron />
            </button>
          )}
          {dots && (
            <span className="kit-slider-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="kit-slider-dot"
                  aria-label={fillLabel(labels.show, { n: i + 1 })}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                />
              ))}
            </span>
          )}
          {arrows && (
            <button type="button" className="kit-slider-btn kit-slider-next" aria-label={labels.next} onClick={() => go(index + 1)}>
              <Chevron />
            </button>
          )}
          {autoplay && !still && (
            <button type="button" className="kit-slider-btn kit-slider-pause" aria-label={paused ? labels.play : labels.pause} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play /> : <Pause />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pause() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Play() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}
