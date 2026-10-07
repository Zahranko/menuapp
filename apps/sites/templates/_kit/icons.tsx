import type { SVGProps } from "react";

/** Line icons shared by the templates. They inherit the text color. */
type P = SVGProps<SVGSVGElement>;
const base = (size: number): P => ({ width: size, height: size, viewBox: `0 0 ${size} ${size}`, fill: "none", stroke: "currentColor", "aria-hidden": true, focusable: false });

export const Bean = (p: P) => (
  <svg {...base(20)} strokeWidth={1.7} {...p}>
    <ellipse cx="10" cy="10" rx="5.5" ry="7.5" transform="rotate(35 10 10)" />
    <path d="M6 14c3-2 5-6 8-8" />
  </svg>
);
export const Wheat = (p: P) => (
  <svg {...base(20)} strokeWidth={1.7} strokeLinecap="round" {...p}>
    <path d="M10 18V6M10 9c-2 0-3.5-1.5-3.5-3.5C8.5 5.5 10 7 10 9zm0 0c2 0 3.5-1.5 3.5-3.5C11.5 5.5 10 7 10 9zm0 4c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5zm0 0c2 0 3.5-1.5 3.5-3.5-2 0-3.5 1.5-3.5 3.5zM10 6V2" />
  </svg>
);
export const Clock = (p: P) => (
  <svg {...base(20)} strokeWidth={1.7} strokeLinecap="round" {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 5.5V10l3 2" />
  </svg>
);
export const Pin = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} {...p}>
    <path d="M9 16s5.5-4.8 5.5-9A5.5 5.5 0 0 0 3.5 7c0 4.2 5.5 9 5.5 9z" />
    <circle cx="9" cy="7" r="2" />
  </svg>
);
export const WhatsApp = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} strokeLinejoin="round" {...p}>
    <path d="M3 15l1-3.2A6.5 6.5 0 1 1 6.4 14z" />
    <path d="M7 6.5c0 2.5 2 4.5 4.5 4.5l.8-1.2-1.6-.8-.7.6a3 3 0 0 1-1.6-1.6l.6-.7-.8-1.6z" fill="currentColor" stroke="none" />
  </svg>
);
export const Instagram = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} {...p}>
    <rect x="2.5" y="2.5" width="13" height="13" rx="4" />
    <circle cx="9" cy="9" r="3" />
    <circle cx="13" cy="5" r=".8" fill="currentColor" />
  </svg>
);
export const Mail = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} {...p}>
    <rect x="2" y="4" width="14" height="10" rx="2" />
    <path d="m2.5 5 6.5 5 6.5-5" />
  </svg>
);
export const Search = (p: P) => (
  <svg {...base(18)} strokeWidth={1.8} strokeLinecap="round" {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="m12.5 12.5 3.5 3.5" />
  </svg>
);
export const Burger = (p: P) => (
  <svg {...base(20)} strokeWidth={1.9} strokeLinecap="round" {...p}>
    <path d="M3 6h14M3 10h14M3 14h9" />
  </svg>
);
export const Close = (p: P) => (
  <svg {...base(20)} strokeWidth={1.9} strokeLinecap="round" {...p}>
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);
export const Arrow = (p: P) => (
  <svg {...base(16)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
