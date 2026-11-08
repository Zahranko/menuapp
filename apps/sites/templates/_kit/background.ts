import { text } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import { contrast, isDark, mix, readable } from "./color";

/*
 * The owner's background color ("colors.background" in site-options.json, added to every template by
 * scripts/build-registry.mjs). It recolors the template's theme: the page, its panels and lines take the new color, and
 * the text turns light or dark so it stays easy to read. "Template default" (or anything that is not a color) changes
 * nothing.
 */

type Colors = { bg: string; surf: string; ink: string; muted: string; line: string; [extra: string]: string };

const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
/** Text reaches at least this contrast with black or white on the page background (custom colors move until it does). */
const CLEAR = 10;
/** A palette color closer than this to the page background is a panel or a line: it moves with the background. */
const NEAR = 1.6;

/** The owner's page background as #RRGGBB, or null for the template's own. Middle tones move lighter or darker so text reads well. */
export function pageBackground(settings: Settings): string | null {
  const value = text(settings, "colors.background").trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(value)) return null;
  if (contrast(value, "#000000") >= CLEAR || contrast(value, "#FFFFFF") >= CLEAR) return value;
  const lighter = contrast(value, "#000000") >= contrast(value, "#FFFFFF");
  const toward = lighter ? "#FFFFFF" : "#000000";
  for (let step = 1; step <= 20; step++) {
    const candidate = mix(value, toward, step / 20);
    if (contrast(candidate, lighter ? "#000000" : "#FFFFFF") >= CLEAR) return candidate;
  }
  return toward;
}

/**
 * The theme recolored for the page background `bg`, and the panel colors text sits on (for contrast checks).
 * It starts from the chosen theme, or from the template's first theme of the same lightness when the background
 * turns a light theme dark (or a dark one light), so the template's own accents and pairings still fit.
 * Panels and lines keep how far they were from the old background; colors that matched the old background or text
 * follow the new ones; other colors (stickers, highlights) stay as designed.
 */
export function onBackground<P extends Colors>(chosen: P, all: readonly P[], bg: string): { palette: P; panels: string[] } {
  const dark = isDark(bg);
  const base = isDark(chosen.bg) === dark ? chosen : (all.find((p) => isDark(p.bg) === dark) ?? chosen);
  const away = dark ? "#FFFFFF" : "#000000";

  /** A panel color moved with the background: the same offset, or the same contrast when the offset runs out. */
  const panel = (hex: string) => {
    const before = contrast(hex, base.bg);
    const shifted = offset(hex, base.bg, bg);
    if (contrast(shifted, bg) - 1 >= (before - 1) / 2) return shifted;
    for (let step = 1; step <= 40; step++) {
      const candidate = mix(bg, away, step / 80);
      if (contrast(candidate, bg) >= before) return candidate;
    }
    return mix(bg, away, 0.5);
  };

  const keys = Object.keys(base).filter((k) => k !== "bg" && k !== "ink" && k !== "muted");
  const isNear = (value: string) => HEX.test(value) && !same(value, base.ink) && contrast(value.slice(0, 7), base.bg) < NEAR;
  const panels = keys.filter((k) => k !== "line" && value6(base[k]) && isNear(base[k])).map((k) => panel(base[k]));
  const ink = readable(base.ink, [bg, ...panels], away, 7);

  // Colors that stay as designed, and the ones among them a color reads well on (text drawn in the page color on a sticker).
  const kept = keys.map((k) => base[k]).filter((v) => value6(v) && !same(v, base.ink) && !same(v, base.bg) && contrast(v, base.bg) >= NEAR);
  const keepsReading = (color: string, value: string) => readable(value, kept.filter((k) => contrast(k, color) >= 4.5), color);

  const out: Record<string, string> = { ...base, bg, ink };
  for (const key of keys) {
    const value = base[key];
    if (!HEX.test(value)) continue;
    const alpha = value.slice(7);
    const color = value.slice(0, 7);
    if (same(color, base.ink)) out[key] = keepsReading(color, ink) + alpha;
    else if (same(color, base.bg)) out[key] = keepsReading(color, bg) + alpha;
    else if (contrast(color, base.bg) < NEAR) out[key] = panel(color) + alpha;
  }
  // A little above the 4.5:1 minimum, for templates that lay muted text over a see-through panel.
  out.muted = readable(base.muted, [bg, ...panels], ink, 5);
  return { palette: out as P, panels };
}

const same = (a: string, b: string) => a.slice(0, 7).toUpperCase() === b.slice(0, 7).toUpperCase();
const value6 = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

/** `hex` moved by the difference between `from` and `to`, per channel. */
function offset(hex: string, from: string, to: string): string {
  const channel = (c: string, i: number) => Number.parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.max(0, Math.min(255, channel(hex, i) + channel(to, i) - channel(from, i))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
