import { choice, text } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import { contrast, isDark, mix, readable } from "./color";
import tickerSettings from "./ticker-settings.json";

/*
 * The owner's moving strip, shared by the templates that have one (manifest "ticker": true; fields in
 * ticker-settings.json, added by scripts/build-registry.mjs in a "Moving strip" group after "Sections"): Ember's ticker
 * of specials, Drop's announcement ticker, Agency's marquee of names, Lumen's word ticker, and the shared highlights
 * marquee (_kit/Sections.tsx) on those templates. Every option starts on "auto", which keeps the template's own strip:
 * with all of them on "auto" nothing here adds a single attribute, so the page is exactly as before.
 *
 * What it gives:
 *   tickerAttributes()  one data attribute on the template's root per option that is not "auto" (via optionAttributes)
 *   tickerColors()      --tk-bg (the band), --tk-ink (text on the band) and --tk-line (text and lines straight on the
 *                       page, for the see-through shapes), worked out by themeVars from the theme, always readable
 *   tickerMarks()       the marks a template puts on the parts of its strip, only once the owner changed something:
 *     "strip" the band, "track" the part that moves, "item" one special or word, "sep" the template's own separator
 *     (hidden once the owner picks one), "copy" a repeat that only fills the loop (hidden when the strip stands still).
 * _kit/ticker.css styles them.
 */

const field = (key: string) => tickerSettings.fields.find((f) => f.key === key)!;
const options = <T extends string>(key: string) => field(key).options as T[];

export type TickerStyle = "auto" | "solid" | "outline" | "tilted" | "torn" | "tags" | "neon" | "double";
export type TickerColor = "auto" | "accent" | "ink" | "paper" | "custom";
export type TickerSeparator = "auto" | "diamond" | "star" | "dot" | "flame" | "slash" | "none";
export type TickerSpeed = "auto" | "slow" | "normal" | "fast" | "still";
export type TickerEdge = "auto" | "flames" | "none" | "zigzag" | "waves";

export type Ticker = { style: TickerStyle; color: TickerColor; separator: TickerSeparator; speed: TickerSpeed; edge: TickerEdge; bg: string | null };

/** Each option's setting key and the root data attribute it sets. */
const FIELDS = {
  style: { key: "ticker.style", attr: "data-tk-style" },
  color: { key: "ticker.color", attr: "data-tk-color" },
  separator: { key: "ticker.separator", attr: "data-tk-sep" },
  speed: { key: "ticker.speed", attr: "data-tk-speed" },
  edge: { key: "ticker.edge", attr: "data-tk-edge" },
} as const;

export const TICKER_KEYS = tickerSettings.fields.map((f) => f.key);
export const TICKER_ATTRIBUTES = Object.values(FIELDS).map((f) => f.attr);

const HEX = /^#[0-9a-f]{6}$/i;

/** The owner's strip options; anything missing or unknown is "auto". "custom" without a color of its own is "auto". */
export function tickerOptions(settings: Settings): Ticker {
  const read = <T extends string>(key: string) => choice<T>(settings, key, options<T>(key), "auto" as T);
  const own = text(settings, "ticker.bg").trim();
  const bg = HEX.test(own) ? own.toUpperCase() : null;
  const color = read<TickerColor>(FIELDS.color.key);
  return {
    style: read<TickerStyle>(FIELDS.style.key),
    color: color === "custom" && !bg ? "auto" : color,
    separator: read<TickerSeparator>(FIELDS.separator.key),
    speed: read<TickerSpeed>(FIELDS.speed.key),
    edge: read<TickerEdge>(FIELDS.edge.key),
    bg,
  };
}

/** Data attributes for the template's root that switch on _kit/ticker.css. Empty for the defaults. */
export function tickerAttributes(settings: Settings): Record<string, string> {
  const t = tickerOptions(settings);
  const attrs: Record<string, string> = {};
  for (const name of Object.keys(FIELDS) as (keyof typeof FIELDS)[]) {
    if (t[name] !== "auto") attrs[FIELDS[name].attr] = t[name] as string;
  }
  return attrs;
}

/** Whether the owner changed anything about the strip (the template then marks its parts). */
export const tickerChanged = (settings: Settings) => Object.keys(tickerAttributes(settings)).length > 0;

type Theme = { bg: string; surf: string; ink: string };
type Accent = { fill: string; onFill: string };

/**
 * The strip's colors for the owner's choice, or nothing for "auto" (the template's own). "Dark" and "Light" are the
 * theme's own dark and light colors, kept apart from the page when it is the same color. The text on the band is the
 * theme's own dark or light color when it reads at 4.5:1 there, else black or white (one of them always does); text set
 * straight on the page (outline and neon) is the band color moved until it reads on the page.
 */
export function tickerColors(settings: Settings, theme: Theme, accent: Accent): Record<string, string> {
  const t = tickerOptions(settings);
  if (t.color === "auto") return {};
  const [dark, light] = isDark(theme.bg) ? [theme.bg, theme.ink] : [theme.ink, theme.bg];
  let band = t.color === "accent" ? accent.fill : t.color === "ink" ? dark : t.color === "paper" ? light : t.bg!;
  // "Dark" on a dark page (or "Light" on a light one) would be the page itself: the band moves a little toward the
  // other side, so the strip still shows as a band.
  if ((t.color === "ink" || t.color === "paper") && contrast(band, theme.bg) < 1.25) band = mix(band, band === dark ? light : dark, 0.16);
  const ink = t.color === "accent" ? accent.onFill : onBand(band, [dark, light]);
  const line = readable(band, [theme.bg, theme.surf], isDark(theme.bg) ? "#FFFFFF" : "#000000");
  return { "--tk-bg": band, "--tk-ink": ink, "--tk-line": line };
}

/** The text color for a band: one of the theme's own when it reads well, else black or white, whichever reads better. */
export function onBand(band: string, own: string[]): string {
  const best = [...own].sort((a, b) => contrast(b, band) - contrast(a, band))[0];
  if (best && contrast(best, band) >= 4.5) return best;
  return contrast("#FFFFFF", band) >= contrast("#000000", band) ? "#FFFFFF" : "#000000";
}

export type TickerPart = "strip" | "track" | "item" | "sep" | "copy";

/**
 * The marks for the parts of a template's strip: tk("strip") gives { "data-k": "ticker" }, tk("item", hidden && "copy")
 * gives { "data-k": "ticker-item ticker-copy" }, and nothing at all while every option is "auto".
 */
export function tickerMarks(settings: Settings): (...parts: (TickerPart | false | null | undefined)[]) => Record<string, string> {
  const on = tickerChanged(settings);
  return (...parts) => {
    const names = parts.filter((p): p is TickerPart => !!p);
    const marks: Record<string, string> = {};
    if (on && names.length) marks["data-k"] = names.map((p) => (p === "strip" ? "ticker" : `ticker-${p}`)).join(" ");
    return marks;
  };
}
