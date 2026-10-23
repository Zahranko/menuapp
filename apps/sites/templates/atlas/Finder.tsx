"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search } from "../_kit/icons";

export type FinderDepartment = { name: string; href: string; parent: string | null; count: string };
export type FinderProduct = { id: string; name: string; department: string; price: string };

type Props = {
  departments: FinderDepartment[];
  products: FinderProduct[];
  labels: { placeholder: string; label: string; empty: string; departments: string; products: string };
};

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/**
 * The search field in the Atlas header. It filters the shop's departments (links to their pages) and products
 * (buttons that open the quick view) as the visitor types. Nothing is fetched: everything is already on the page.
 */
export function Finder({ departments, products, labels }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const q = norm(query.trim());
  const depts = q ? departments.filter((d) => norm(`${d.name} ${d.parent ?? ""}`).includes(q)) : departments;
  const prods = q ? products.filter((p) => norm(`${p.name} ${p.department}`).includes(q)).slice(0, 6) : [];

  return (
    <div
      ref={root}
      className="finder"
      data-open={open || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <label className="finder-field">
        <Search />
        <span className="sr-only">{labels.label}</span>
        <input
          type="search"
          value={query}
          placeholder={labels.placeholder}
          autoComplete="off"
          enterKeyHint="search"
          aria-controls={panelId}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </label>
      <div id={panelId} className="finder-panel" hidden={!open}>
        {depts.length > 0 && (
          <>
            <p className="finder-head">{labels.departments}</p>
            <ul className="plain finder-depts">
              {depts.slice(0, 10).map((d) => (
                <li key={d.href}>
                  <a href={d.href} onClick={() => setOpen(false)}>
                    <span>
                      {d.parent && <small>{d.parent} / </small>}
                      {d.name}
                    </span>
                    <small>{d.count}</small>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        {prods.length > 0 && (
          <>
            <p className="finder-head">{labels.products}</p>
            <ul className="plain finder-prods">
              {prods.map((p) => (
                <li key={p.id}>
                  <button type="button" data-item-id={p.id} onClick={() => setOpen(false)}>
                    <span>
                      {p.name}
                      <small>{p.department}</small>
                    </span>
                    <b>{p.price}</b>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {q && depts.length === 0 && prods.length === 0 && <p className="finder-empty">{labels.empty}</p>}
      </div>
    </div>
  );
}
