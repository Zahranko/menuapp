"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search } from "../_kit/icons";

export type FinderDepartment = { name: string; href: string; parent: string | null; count: string };
export type FinderProduct = { id: string; name: string; department: string; price: string };

type Props = {
  departments: FinderDepartment[];
  products: FinderProduct[];
  labels: { placeholder: string; label: string; empty: string; departments: string; products: string };
  /** A search button that opens the field, for the shared headers of the "Page layout" options. */
  compact?: boolean;
};

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/**
 * The search field in the Atlas header. It filters the shop's departments (links to their pages) and products
 * (buttons that open the quick view) as the visitor types. Nothing is fetched: everything is already on the page.
 */
export function Finder({ departments, products, labels, compact = false }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const popId = useId();

  // The compact search opens under its button, across the screen, with the cursor in the field.
  useEffect(() => {
    if (!compact || !open) return;
    setTop(Math.round(root.current?.getBoundingClientRect().bottom ?? 0) + 8);
    input.current?.focus();
  }, [compact, open]);

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
      className={compact ? "finder finder-compact" : "finder"}
      data-open={open || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          if (compact) toggle.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {compact && (
        <button ref={toggle} type="button" className="finder-toggle" aria-label={labels.label} aria-expanded={open} aria-controls={popId} onClick={() => setOpen(!open)}>
          <Search />
        </button>
      )}
      <Pop compact={compact} id={popId} open={open} top={top}>
        <label className="finder-field">
          <Search />
          <span className="sr-only">{labels.label}</span>
          <input
            ref={input}
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
      </Pop>
    </div>
  );
}

/**
 * The compact search's field and results, in a box under the button (in the top layer where the browser has popovers,
 * so a see-through header around it can't clip or move it); the plain search shows them as they are.
 */
function Pop({ compact, id, open, top, children }: { compact: boolean; id: string; open: boolean; top: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (open) el.showPopover();
      else el.hidePopover();
    } catch {
      // Already in that state.
    }
  }, [open]);
  if (!compact) return <>{children}</>;
  return (
    <div ref={box} id={id} className="finder-pop" popover="manual" hidden={!open} style={{ top }}>
      {children}
    </div>
  );
}
