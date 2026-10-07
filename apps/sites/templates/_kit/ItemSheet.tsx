"use client";

import { useEffect, useRef, useState } from "react";

export type SheetItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  tint: string;
  label: string | null;
  soldOut: boolean;
};

type Props = {
  items: SheetItem[];
  closeLabel: string;
  soldOutLabel: string;
  /** Class names for the template's own look. */
  classes: { dialog?: string; media?: string; body?: string; title?: string; text?: string; row?: string; price?: string; close?: string; tag?: string };
};

/**
 * Product details in a dialog. Any element with data-item-id="<product id>" opens it.
 * Uses the native <dialog>, so focus is trapped, Escape closes it and the page behind is inert.
 */
export function ItemSheet({ items, closeLabel, soldOutLabel, classes }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [item, setItem] = useState<SheetItem | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>("[data-item-id]");
      if (!trigger) return;
      const found = items.find((i) => i.id === trigger.dataset.itemId);
      if (!found) return;
      event.preventDefault();
      setItem(found);
      dialog.current?.showModal();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [items]);

  return (
    <dialog
      ref={dialog}
      className={classes.dialog}
      aria-labelledby="item-sheet-title"
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current.close();
      }}
    >
      {item && (
        <>
          <div className={classes.media} style={{ background: item.tint }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- owner photos come from any storage host */}
            {item.image && <img src={item.image} alt="" />}
          </div>
          <div className={classes.body}>
            {(item.label || item.soldOut) && (
              <p>
                {item.label && <span className={classes.tag}>{item.label}</span>} {item.soldOut && <span className={classes.tag}>{soldOutLabel}</span>}
              </p>
            )}
            <h3 id="item-sheet-title" className={classes.title}>
              {item.name}
            </h3>
            {item.description && <p className={classes.text}>{item.description}</p>}
            <div className={classes.row}>
              <b className={classes.price}>{item.price}</b>
              <button type="button" className={classes.close} onClick={() => dialog.current?.close()} autoFocus>
                {closeLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
