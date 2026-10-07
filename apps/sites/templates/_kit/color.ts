/** Color helpers so every template meets 4.5:1 text contrast whatever accent the owner picks. */

type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mixes `amount` (0..1) of `b` into `a`. */
export function mix(a: string, b: string, amount: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * amount) as Rgb);
}

export const isDark = (hex: string) => luminance(hex) < 0.2;

/** Moves `color` toward `toward` until it reaches `ratio` against every background. */
export function readable(color: string, backgrounds: string[], toward: string, ratio = 4.5): string {
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(color, toward, step / 20);
    if (backgrounds.every((bg) => contrast(candidate, bg) >= ratio)) return candidate;
  }
  return toward;
}

export type AccentTokens = {
  /** Button and badge fill. */
  fill: string;
  /** Text on the fill. */
  onFill: string;
  /** Accent used as text on the page backgrounds. */
  text: string;
  /** Faint accent background for chips and icons. */
  soft: string;
};

/**
 * Accent colors for a page with background `bg`, surface `surf` and text color `ink`.
 * The fill keeps the owner's color when either white or the ink reads well on it, otherwise it is darkened slightly.
 */
export function accentTokens(accent: string, bg: string, surf: string, ink: string): AccentTokens {
  const dark = isDark(bg);
  const lightInk = dark ? ink : bg;
  const darkInk = dark ? bg : ink;
  const best = (fill: string) => (contrast("#FFFFFF", fill) >= contrast(darkInk, fill) ? "#FFFFFF" : darkInk);
  let fill = accent;
  for (let step = 0; step <= 20 && contrast(best(fill), fill) < 4.5; step++) fill = mix(accent, "#000000", step / 40);
  const soft = mix(bg, accent, dark ? 0.22 : 0.14);
  const text = readable(accent, [bg, surf, soft], dark ? lightInk : darkInk);
  return { fill, onFill: best(fill), text, soft };
}
