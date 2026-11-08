import type { CSSProperties, SVGProps } from "react";

/*
 * Bloom's hand-drawn bits: dock icons, sprinkles, hearts, swashes and wavy section edges.
 * Everything inherits currentColor or the palette variables, so it follows the owner's theme.
 */

type P = SVGProps<SVGSVGElement>;
const line = (p: P): P => ({ viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false, ...p });

export const HomeIcon = (p: P) => (
  <svg {...line(p)}>
    <path d="M4 11.5 12 5l8 6.5" />
    <path d="M6.5 10v8.5h11V10" />
    <path d="M10 18.5v-4.2a2 2 0 0 1 4 0v4.2" />
  </svg>
);
export const CupcakeIcon = (p: P) => (
  <svg {...line(p)}>
    <path d="M6 12.5h12l-1.6 7H7.6z" />
    <path d="M9.5 12.5l.5 7M14.5 12.5l-.5 7" />
    <path d="M5.5 12.5a3 3 0 0 1 1.7-5.4A4.8 4.8 0 0 1 12 4a4.8 4.8 0 0 1 4.8 3.1 3 3 0 0 1 1.7 5.4" />
    <circle cx="12" cy="3" r=".6" fill="currentColor" />
  </svg>
);
export const HeartIcon = (p: P) => (
  <svg {...line(p)}>
    <path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z" />
  </svg>
);
export const CameraIcon = (p: P) => (
  <svg {...line(p)}>
    <rect x="3.5" y="7" width="17" height="12" rx="3.5" />
    <path d="M9 7l1.2-2h3.6L15 7" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);
export const PinIcon = (p: P) => (
  <svg {...line(p)}>
    <path d="M12 20.5s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0c0 4.9 6.5 10.5 6.5 10.5z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
export const ChevronIcon = (p: P) => (
  <svg {...line({ width: 18, height: 18, strokeWidth: 2.2, ...p })}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </svg>
);
export const BackIcon = (p: P) => (
  <svg {...line({ width: 18, height: 18, strokeWidth: 2.2, ...p })}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </svg>
);
export const PauseIcon = (p: P) => (
  <svg {...line({ width: 16, height: 16, strokeWidth: 2.4, ...p })}>
    <path d="M9 6v12M15 6v12" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg {...line({ width: 16, height: 16, strokeWidth: 2, ...p })}>
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </svg>
);

/** A filled heart for little accents. */
export const Heart = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true" focusable="false">
    <path d="M12 21s-8.5-5.2-8.5-11.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6C20.5 15.8 12 21 12 21z" fill="currentColor" />
  </svg>
);

/** The hand-drawn underline under a headline. */
export const Swash = ({ className = "swash" }: { className?: string }) => (
  <svg viewBox="0 0 220 18" className={className} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M3 12c38-8 74-9 110-5s70 5 104-4" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M40 15c30-4 62-4 92-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
  </svg>
);

/** A wavy edge between two sections. `to` is the color of the next section. */
export const Wave = ({ to, flip = false, className }: { to: string; flip?: boolean; className?: string }) => (
  <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className={["wave", flip && "wave-flip", className].filter(Boolean).join(" ")} style={{ color: to }} aria-hidden="true" focusable="false">
    <path d="M0 34c120-26 240-26 360 0s240 26 360 0 240-26 360 0 240 26 360 0V64H0z" fill="currentColor" />
  </svg>
);

/**
 * Scattered sprinkles, hearts and sparkles. Positions are fixed per "set" so the server and browser agree,
 * and so every page keeps the same composition.
 */
const SETS: Record<string, { k: "s" | "h" | "t" | "d"; x: number; y: number; r: number; c: 1 | 2 | 3 }[]> = {
  hero: [
    { k: "s", x: 4, y: 12, r: 30, c: 1 },
    { k: "t", x: 90, y: 6, r: 0, c: 3 },
    { k: "s", x: 93, y: 36, r: -40, c: 2 },
    { k: "h", x: 3, y: 58, r: -14, c: 1 },
    { k: "d", x: 96, y: 20, r: 0, c: 2 },
    { k: "s", x: 92, y: 90, r: 70, c: 3 },
    { k: "s", x: 5, y: 86, r: -20, c: 2 },
    { k: "h", x: 89, y: 66, r: 12, c: 1 },
    { k: "d", x: 2, y: 34, r: 0, c: 3 },
  ],
  head: [
    { k: "s", x: 5, y: 22, r: 30, c: 1 },
    { k: "t", x: 91, y: 18, r: 0, c: 3 },
    { k: "h", x: 90, y: 66, r: 14, c: 1 },
    { k: "s", x: 4, y: 72, r: -45, c: 2 },
    { k: "d", x: 96, y: 42, r: 0, c: 2 },
  ],
  foot: [
    { k: "s", x: 10, y: 20, r: 25, c: 1 },
    { k: "h", x: 90, y: 16, r: -12, c: 1 },
    { k: "s", x: 80, y: 60, r: -50, c: 3 },
    { k: "t", x: 6, y: 66, r: 0, c: 2 },
  ],
};

export function Doodles({ set }: { set: keyof typeof SETS }) {
  return (
    <span className="doodles" aria-hidden="true">
      {SETS[set].map((d, i) => (
        <span key={i} className={`dd dd-${d.k} c${d.c}`} style={{ insetInlineStart: `${d.x}%`, top: `${d.y}%`, "--rot": `${d.r}deg`, "--i": i } as CSSProperties}>
          {d.k === "h" && <Heart />}
          {d.k === "t" && (
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 2c.8 5.2 4.8 9.2 10 10-5.2.8-9.2 4.8-10 10-.8-5.2-4.8-9.2-10-10 5.2-.8 9.2-4.8 10-10z" fill="currentColor" />
            </svg>
          )}
        </span>
      ))}
    </span>
  );
}
