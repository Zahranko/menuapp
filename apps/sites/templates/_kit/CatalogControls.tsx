"use client";

import { useEffect, useRef, useState } from "react";
import { itemCount } from "@/lib/i18n";

type Props = {
  /** id of the element holding the products; each product element has data-product, data-cat, data-q, data-price, data-order. */
  gridId: string;
  categories: { id: string; name: string }[];
  labels: { all: string; search: string; sort: string; featured: string; priceLow: string; priceHigh: string; filter: string };
  locale: string;
  className?: string;
};

type Sort = "featured" | "low" | "high";

/** Search, category filter and price sort for a product grid. Without JavaScript every product is shown in menu order. */
export function CatalogControls({ gridId, categories, labels, locale, className }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const q = query.trim().toLowerCase();
    let count = 0;
    grid.querySelectorAll<HTMLElement>("[data-product]").forEach((el) => {
      const match = (category === "all" || el.dataset.cat === category) && (!q || (el.dataset.q ?? "").includes(q));
      el.hidden = !match;
      if (match) count++;
      const price = Number(el.dataset.price);
      el.style.order = sort === "featured" ? (el.dataset.order ?? "0") : String(Math.round((sort === "low" ? price : -price) * 1000));
    });
    grid.parentElement?.querySelectorAll<HTMLElement>("[data-catalog-empty]").forEach((el) => (el.hidden = count > 0));
    if (countRef.current) countRef.current.textContent = itemCount(count, locale);
  }, [gridId, query, category, sort, locale]);

  return (
    <div className={className}>
      <label className="catalog-search">
        <span className="sr-only">{labels.search}</span>
        <input type="search" placeholder={labels.search} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="catalog-chips" role="group" aria-label={labels.filter}>
        {[{ id: "all", name: labels.all }, ...categories].map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="catalog-meta">
        <span aria-live="polite" ref={countRef} />
        <label>
          <span>{labels.sort}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="featured">{labels.featured}</option>
            <option value="low">{labels.priceLow}</option>
            <option value="high">{labels.priceHigh}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
