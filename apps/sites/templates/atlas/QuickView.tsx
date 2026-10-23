"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsApp } from "../_kit/icons";

export type QuickItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  tint: string;
  initial: string;
  label: string | null;
  soldOut: boolean;
  department: string | null;
  /** WhatsApp link with the product in the message, or null when the shop has no WhatsApp. */
  order: string | null;
};

type Props = {
  items: QuickItem[];
  labels: { close: string; soldOut: string; inStock: string; order: string };
};

/**
 * Atlas quick view: product details in a native <dialog>, a bottom sheet on phones and a side-by-side panel on wide
 * screens, with an "Order on WhatsApp" button. Any element with data-item-id="<product id>" opens it.
 */
export function QuickView({ items, labels }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [item, setItem] = useState<QuickItem | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>("[data-item-id]");
      if (!trigger) return;
      const found = items.find((i) => i.id === trigger.dataset.itemId);
      if (!found) return;
      event.preventDefault();
      setItem(found);
      if (!dialog.current?.open) dialog.current?.showModal();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [items]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      className="qv"
      aria-labelledby="qv-title"
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      {item && (
        <div className="qv-in">
          <span className="qv-grip" aria-hidden="true" />
          <div className="qv-media" style={{ background: item.tint }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- owner photos come from any storage host */}
            {item.image ? <img src={item.image} alt="" /> : <span className="qv-initial" aria-hidden="true">{item.initial}</span>}
          </div>
          <div className="qv-body">
            {item.department && <p className="qv-dept">{item.department}</p>}
            <h2 id="qv-title" className="qv-title">
              {item.name}
            </h2>
            <p className="qv-price">{item.price}</p>
            {item.label && (
              <p className="qv-tags">
                <span className="tag">{item.label}</span>
              </p>
            )}
            {item.description && <p className="qv-text">{item.description}</p>}
            <p className={item.soldOut ? "qv-stock out" : "qv-stock"}>{item.soldOut ? labels.soldOut : labels.inStock}</p>
            <div className="qv-actions">
              {item.order && !item.soldOut && (
                <a className="a-btn a-btn-solid qv-order" href={item.order} target="_blank" rel="noopener noreferrer">
                  <WhatsApp />
                  {labels.order}
                </a>
              )}
              <button type="button" className="a-btn a-btn-line" onClick={close} autoFocus>
                {labels.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
