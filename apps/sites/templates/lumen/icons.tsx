import type { SVGProps } from "react";

/* Tab bar glyphs for Lumen, drawn in the same 20px line style as templates/_kit/icons.tsx so they sit next to its icons. */
type P = SVGProps<SVGSVGElement>;
const base: P = { width: 22, height: 22, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false };

export const HomeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 9.2 10 3.5l7 5.7V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="6" height="6" rx="1.6" />
    <rect x="11" y="3" width="6" height="6" rx="3" />
    <rect x="3" y="11" width="6" height="6" rx="3" />
    <rect x="11" y="11" width="6" height="6" rx="1.6" />
  </svg>
);
export const StarIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m10 2.8 2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L2.8 8l5-.6z" />
  </svg>
);
export const PhotoIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="2.8" y="4" width="14.4" height="12" rx="2.4" />
    <circle cx="7.4" cy="8.4" r="1.4" />
    <path d="m4 15 4.4-4 3 2.6 2.2-1.8L17 14.6" />
  </svg>
);
export const PinIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 17.5s5.6-4.9 5.6-9.3a5.6 5.6 0 0 0-11.2 0c0 4.4 5.6 9.3 5.6 9.3z" />
    <circle cx="10" cy="8.2" r="2" />
  </svg>
);
