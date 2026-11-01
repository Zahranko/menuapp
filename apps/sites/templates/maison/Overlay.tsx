"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  /** Visible word on the button ("Menu"). */
  word: string;
  openLabel: string;
  closeLabel: string;
  /** Accessible name of the full-screen menu. */
  label: string;
  /** The top row of the open menu (the house name). */
  head: ReactNode;
  children: ReactNode;
};

/**
 * Maison's navigation: a quiet "Menu" button that opens a full-screen menu.
 * A native modal <dialog>, so focus stays inside, Escape closes it and the page behind is inert.
 * A tap on any link closes it.
 */
export function Overlay({ word, openLabel, closeLabel, label, head, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  // Keep the page from scrolling behind the open menu.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const sync = () => document.documentElement.classList.toggle("mx-locked", d.open);
    d.addEventListener("close", sync);
    return () => {
      d.removeEventListener("close", sync);
      document.documentElement.classList.remove("mx-locked");
    };
  }, []);

  const open = () => {
    dialog.current?.showModal();
    document.documentElement.classList.add("mx-locked");
  };

  return (
    <>
      <button type="button" className="mx-toggle" aria-haspopup="dialog" aria-label={openLabel} onClick={open}>
        <span className="mx-toggle-lines" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="mx-toggle-word" aria-hidden="true">
          {word}
        </span>
      </button>
      <dialog
        ref={dialog}
        className="mx-overlay"
        aria-label={label}
        onClick={(e) => {
          if ((e.target as Element).closest("a")) dialog.current?.close();
        }}
      >
        <div className="mx-overlay-top">
          {head}
          <button type="button" className="mx-close" onClick={() => dialog.current?.close()}>
            <span>{closeLabel}</span>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}

/**
 * Watches the home page's opening image: while it fills the top of the screen the header floats over it in light type;
 * once it scrolls away the header turns solid and the reserve bar slides up. An IntersectionObserver, not a scroll listener.
 */
export function HeroWatch() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-template='maison']");
    const hero = root?.querySelector(".mx-hero, .kit-hv");
    const head = root?.querySelector<HTMLElement>(".mx-head");
    if (!root || !hero) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-past", !entry.isIntersecting), {
      rootMargin: `-${head?.offsetHeight ?? 64}px 0px 0px 0px`,
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return null;
}
