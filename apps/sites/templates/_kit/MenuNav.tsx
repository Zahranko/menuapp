"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** The shared menu's own id: the links follow its categories, and it learns how tall a header that stays on screen is. */
  menuId: string;
  categories: { anchor: string; name: string }[];
  kind: "chips" | "tabs" | "sidebar" | "dropdown";
  label: string;
  /** The drop-down's button text. */
  jump: string;
};

/**
 * The shared menu's category links (_kit/Menu.tsx): plain anchors, so they work without JavaScript. In the browser the
 * link of the category on screen is marked, a drop-down closes once a category is picked, and the links stay just under
 * a header that stays on screen (--kit-mn-top).
 */
export function MenuNav({ menuId, categories, kind, label, jump }: Props) {
  const [active, setActive] = useState(categories[0]?.anchor);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const menu = document.getElementById(menuId);
    const header = menu?.closest("[data-template]")?.querySelector<HTMLElement>('[data-section="header"]');
    if (!menu || !header) return;
    const measure = () => {
      const position = getComputedStyle(header).position;
      const stays = position === "sticky" || position === "fixed";
      menu.style.setProperty("--kit-mn-top", stays ? `${Math.round(header.getBoundingClientRect().height)}px` : "0px");
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [menuId]);

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = categories.find((c) => seen.get(c.anchor));
        if (first) setActive(first.anchor);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    for (const c of categories) {
      const el = document.getElementById(c.anchor);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const list = nav.current?.querySelector<HTMLElement>(".kit-mn-links");
    const link = list?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (list && link && list.scrollWidth > list.clientWidth) {
      const start = getComputedStyle(list).direction === "rtl" ? link.offsetLeft + link.offsetWidth - list.clientWidth + 20 : link.offsetLeft - 20;
      list.scrollTo({ left: start, behavior: "smooth" });
    }
  }, [active]);

  const links = (
    <div className="kit-mn-links">
      {categories.map((c) => (
        <a
          key={c.anchor}
          href={`#${c.anchor}`}
          data-tab={c.anchor}
          className="kit-mn-link"
          aria-current={c.anchor === active ? "true" : undefined}
          onClick={(e) => {
            setActive(c.anchor);
            e.currentTarget.closest("details")?.removeAttribute("open");
          }}
        >
          {c.name}
        </a>
      ))}
    </div>
  );

  return (
    <nav ref={nav} className="kit-mn-nav" data-nav={kind} aria-label={label}>
      {kind === "dropdown" ? (
        <details className="kit-mn-drop">
          <summary className="kit-mn-drop-btn">
            <span>{jump}</span>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          {links}
        </details>
      ) : (
        links
      )}
    </nav>
  );
}
