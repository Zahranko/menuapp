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
/* Social networks, in the same line style as Instagram and WhatsApp (brand marks drawn as outlines). */
export const Facebook = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="9" cy="9" r="7.5" />
    <path d="M11.7 5.7h-1.2a2 2 0 0 0-2 2v8.7M6.4 9.7h4.8" />
  </svg>
);
export const TikTok = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M10 2.5v8.8a2.8 2.8 0 1 1-2.8-2.8" />
    <path d="M10 2.5c.3 2.1 1.8 3.6 4 3.8" />
  </svg>
);
export const Snapchat = (p: P) => (
  <svg {...base(18)} strokeWidth={1.6} strokeLinejoin="round" {...p}>
    <path d="M9 2.4c-2.5 0-4 1.9-4 4.3v1.7l-1.3.4c-.4.2-.4.7.1.8l1 .3c-.4 1.2-1.4 2.3-2.6 2.8-.3.1-.2.5.1.6.7.2 1.3.3 1.5.7l.2.7c.1.2.3.3.5.2.6-.1 1.4-.2 2.1.2.8.5 1.3 1.1 2.4 1.1s1.6-.6 2.4-1.1c.7-.4 1.5-.3 2.1-.2.2.1.4 0 .5-.2l.2-.7c.2-.4.8-.5 1.5-.7.3-.1.4-.5.1-.6-1.2-.5-2.2-1.6-2.6-2.8l1-.3c.5-.1.5-.6.1-.8L13 8.4V6.7c0-2.4-1.5-4.3-4-4.3z" />
  </svg>
);
export const Phone = (p: P) => (
  <svg {...base(18)} strokeWidth={1.7} strokeLinejoin="round" {...p}>
    <path d="M4.6 2.5h2.5l1.3 3.3-1.6 1a8 8 0 0 0 4.4 4.4l1-1.6 3.3 1.3v2.5a1.6 1.6 0 0 1-1.7 1.6A12.6 12.6 0 0 1 3 4.2a1.6 1.6 0 0 1 1.6-1.7z" />
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
export const Spark = (p: P) => (
  <svg {...base(20)} strokeWidth={1.7} strokeLinejoin="round" {...p}>
    <path d="M10 2.5l1.9 5.6 5.6 1.9-5.6 1.9L10 17.5l-1.9-5.6L2.5 10l5.6-1.9z" />
  </svg>
);
export const Heart = (p: P) => (
  <svg {...base(20)} strokeWidth={1.7} strokeLinejoin="round" {...p}>
    <path d="M10 16.5S3 12.2 3 7.6A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 7 1.6c0 4.6-7 8.9-7 8.9z" />
  </svg>
);
export const Leaf = (p: P) => (
  <svg {...base(20)} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 16c0-7 5-12 12-12 0 7-5 12-12 12zM4 16l7-7" />
  </svg>
);
export const Check = (p: P) => (
  <svg {...base(20)} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M6.8 10.2l2.2 2.2 4.2-4.6" />
  </svg>
);
export const Star = (p: P) => (
  <svg {...base(20)} strokeWidth={1.5} strokeLinejoin="round" {...p}>
    <path d="M10 2.6l2.3 4.7 5.2.8-3.8 3.6.9 5.1L10 14.4l-4.6 2.4.9-5.1L2.5 8.1l5.2-.8z" fill="currentColor" />
  </svg>
);
