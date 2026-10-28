"use client";

import { useRef, type ReactNode } from "react";
import { Burger, Close } from "../_kit/icons";

type Props = { openLabel: string; closeLabel: string; title: string; children: ReactNode };

/**
 * Atlas phone navigation: a panel that slides in from the start edge. A native modal <dialog>, so focus stays inside,
 * Escape closes it and the page behind cannot be scrolled or tapped. A tap on a link or the backdrop closes it too.
 */
export function SideDrawer({ openLabel, closeLabel, title, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="a-icon nav-burger" aria-label={openLabel} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <Burger />
      </button>
      <dialog
        ref={dialog}
        className="side"
        aria-label={title}
        onClick={(e) => {
          if (e.target === dialog.current || (e.target as Element).closest("a")) dialog.current?.close();
        }}
      >
        <div className="side-in">
          <div className="side-top">
            <p className="side-title">{title}</p>
            <button type="button" className="a-icon" aria-label={closeLabel} onClick={() => dialog.current?.close()}>
              <Close />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
