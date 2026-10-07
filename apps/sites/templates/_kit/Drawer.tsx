"use client";

import { useState, type ReactNode } from "react";

type Props = {
  openLabel: string;
  closeLabel: string;
  buttonClassName?: string;
  panelClassName?: string;
  icon: ReactNode;
  closeIcon: ReactNode;
  children: ReactNode;
};

/** Mobile navigation: a button that shows the links below the header and hides them again after a tap on a link. */
export function Drawer({ openLabel, closeLabel, buttonClassName, panelClassName, icon, closeIcon, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        aria-expanded={open}
        aria-controls="site-drawer"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen(!open)}
      >
        {open ? closeIcon : icon}
      </button>
      <div
        id="site-drawer"
        className={panelClassName}
        hidden={!open}
        onClick={(e) => {
          if ((e.target as Element).closest("a")) setOpen(false);
        }}
      >
        {children}
      </div>
    </>
  );
}
