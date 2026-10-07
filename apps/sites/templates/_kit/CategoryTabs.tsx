"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  categories: { anchor: string; name: string }[];
  className?: string;
  tabClassName?: string;
  activeClassName?: string;
  label: string;
};

/** Sticky category links that follow the visitor's scroll. They are plain anchors, so they work without JavaScript. */
export function CategoryTabs({ categories, className, tabClassName, activeClassName, label }: Props) {
  const [active, setActive] = useState(categories[0]?.anchor);
  const nav = useRef<HTMLElement>(null);

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
    const tab = nav.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (tab && nav.current) nav.current.scrollTo({ left: tab.offsetLeft - 20, behavior: "smooth" });
  }, [active]);

  return (
    <nav ref={nav} className={className} aria-label={label}>
      {categories.map((c) => (
        <a
          key={c.anchor}
          href={`#${c.anchor}`}
          data-tab={c.anchor}
          className={[tabClassName, c.anchor === active ? activeClassName : ""].filter(Boolean).join(" ")}
          aria-current={c.anchor === active ? "true" : undefined}
          onClick={() => setActive(c.anchor)}
        >
          {c.name}
        </a>
      ))}
    </nav>
  );
}
