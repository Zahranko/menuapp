"use client";

import { useEffect, useRef, useState } from "react";
import { whatsappLink } from "@/lib/format";
import { Close, WhatsApp } from "../_kit/icons";

export type FashionItem = {
  id: string;
  name: string;
  /** The description without its sizes and colors (see details.ts). */
  text: string;
  sizes: string[];
  colors: string[];
  price: string;
  image: string | null;
  tint: string;
  initial: string;
  label: string | null;
  soldOut: boolean;
  /** The collection it belongs to. */
  category: string | null;
  /** The start of the WhatsApp message ("Hello, I would like to order: …"), or null when the shop has no WhatsApp. */
  message: string | null;
};

type Props = {
  items: FashionItem[];
  /** The shop's WhatsApp number. */
  phone: string | null;
  labels: { close: string; soldOut: string; inStock: string; order: string; chooseSize: string; colors: string; sizeMessage: string };
};

/**
 * Product details for the fashion templates, in a native <dialog> (focus stays inside, Escape closes it): a large
 * portrait photo, the price, colors, size buttons and "Order on WhatsApp" with the chosen size in the message.
 * Any element with data-item-id="<product id>" opens it. Each template styles the .fs-* classes its own way.
 */
export function ProductSheet({ items, phone, labels }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [item, setItem] = useState<FashionItem | null>(null);
  const [size, setSize] = useState<string | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>("[data-item-id]");
      if (!trigger) return;
      const found = items.find((i) => i.id === trigger.dataset.itemId);
      if (!found) return;
      event.preventDefault();
      setItem(found);
      setSize(null);
      if (!dialog.current?.open) dialog.current?.showModal();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [items]);

  const close = () => dialog.current?.close();
  const order = item && phone && item.message && !item.soldOut ? whatsappLink(phone, item.message + (size ? labels.sizeMessage.replace("{size}", size) : "")) : null;

  return (
    <dialog
      ref={dialog}
      className="fs-sheet"
      aria-labelledby="fs-title"
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      {item && (
        <div className="fs-in">
          <div className="fs-media" style={{ background: item.tint }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- owner photos come from any storage host */}
            {item.image ? <img src={item.image} alt="" /> : <span className="fs-initial" aria-hidden="true">{item.initial}</span>}
          </div>
          <div className="fs-body">
            {item.category && <p className="fs-cat">{item.category}</p>}
            <h2 id="fs-title" className="fs-title">
              {item.name}
            </h2>
            <p className="fs-price">{item.price}</p>
            {(item.label || item.soldOut) && (
              <p className="fs-tags">
                {item.label && <span className="tag">{item.label}</span>}
                {item.soldOut && <span className="tag tag-out">{labels.soldOut}</span>}
              </p>
            )}
            {item.text && <p className="fs-text">{item.text}</p>}
            {item.colors.length > 0 && (
              <p className="fs-colors">
                <span>{labels.colors}</span> {item.colors.join(" · ")}
              </p>
            )}
            {item.sizes.length > 0 && (
              <div className="fs-sizes" role="group" aria-label={labels.chooseSize}>
                <p className="fs-sizes-title" aria-hidden="true">
                  {labels.chooseSize}
                </p>
                <div className="fs-size-row">
                  {item.sizes.map((s) => (
                    <button key={s} type="button" className="fs-size" aria-pressed={size === s} disabled={item.soldOut} onClick={() => setSize(size === s ? null : s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!item.soldOut && <p className="fs-stock">{labels.inStock}</p>}
            <div className="fs-actions">
              {order && (
                <a className="fs-order" href={order} target="_blank" rel="noopener noreferrer">
                  <WhatsApp />
                  <span>{labels.order}</span>
                </a>
              )}
            </div>
          </div>
          <button type="button" className="fs-close" aria-label={labels.close} title={labels.close} onClick={close} autoFocus>
            <Close />
          </button>
        </div>
      )}
    </dialog>
  );
}
