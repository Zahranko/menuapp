"use client";

import { useState, type ReactNode } from "react";

type Props = {
  /** id of the element holding the menu; items carry data-q, categories data-menu-cat. */
  menuId: string;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  icon?: ReactNode;
};

/** Filters the server-rendered menu as the visitor types. Without JavaScript the full menu stays visible. */
export function MenuSearch({ menuId, placeholder, className, inputClassName, icon }: Props) {
  const [query, setQuery] = useState("");

  function filter(value: string) {
    setQuery(value);
    const root = document.getElementById(menuId);
    if (!root) return;
    const q = value.trim().toLowerCase();
    let any = false;
    root.querySelectorAll<HTMLElement>("[data-menu-cat]").forEach((cat) => {
      let shown = 0;
      cat.querySelectorAll<HTMLElement>("[data-q]").forEach((item) => {
        const match = !q || (item.dataset.q ?? "").includes(q);
        item.hidden = !match;
        if (match) shown++;
      });
      cat.hidden = shown === 0;
      if (shown) any = true;
    });
    root.querySelectorAll<HTMLElement>("[data-menu-empty]").forEach((el) => (el.hidden = any));
  }

  return (
    <label className={className}>
      {icon}
      <input
        type="search"
        className={inputClassName}
        placeholder={placeholder}
        aria-label={placeholder}
        value={query}
        onChange={(e) => filter(e.target.value)}
      />
    </label>
  );
}
