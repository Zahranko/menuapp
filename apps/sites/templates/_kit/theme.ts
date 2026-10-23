import type { CSSProperties } from "react";
import { choice, flag, text } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import { onBackground, pageBackground } from "./background";
import { accentTokens, isDark, readable } from "./color";
import { fontPairs, forLocale, type FontName } from "./fonts";
import { cardVars } from "./cards";
import { typeface } from "./options";

/** A color theme. Extra keys become CSS variables too (`stripe` → `--stripe`). */
export type Palette = { bg: string; surf: string; ink: string; muted: string; line: string; [extra: string]: string };

type Options<T extends string> = {
  palettes: Record<T, Palette>;
  fonts: readonly FontName[];
  /** Radius for "rounded" and "sharp" corners. */
  radius?: { rounded: string; sharp: string };
  defaultAccent?: string;
};

/**
 * The standard design variables every new template uses in its styles.css:
 * --bg --surf --ink --muted --line (theme), --acc --acc-ink --acc-text --acc-soft (accent, contrast-safe),
 * --fd --fb --fw --ft --fs (display font, body font, heading weight, tracking, size scale), --r (corner radius).
 */
export function themeVars<T extends string>(settings: Settings, locale: string, o: Options<T>): CSSProperties {
  const names = Object.keys(o.palettes) as T[];
  const chosen = o.palettes[choice(settings, "theme", names, names[0])];
  // The owner's background color recolors the theme (_kit/background.ts); "Template default" keeps it as designed.
  const background = pageBackground(settings);
  const { palette, panels: onPanels } = background ? onBackground(chosen, Object.values<Palette>(o.palettes), background) : { palette: chosen, panels: panels(chosen) };
  const font = typeface(settings, locale) ?? forLocale(fontPairs[choice(settings, "font", o.fonts, o.fonts[0])], locale);
  const accent = accentTokens(accentColor(settings, o.defaultAccent ?? "#D9542C"), palette.bg, palette.surf, palette.ink, onPanels);
  const radius = o.radius ?? { rounded: "18px", sharp: "2px" };
  const vars: Record<string, string | number> = {
    "--acc": accent.fill,
    "--acc-ink": accent.onFill,
    "--acc-text": accent.text,
    "--acc-soft": accent.soft,
    "--fd": font.display,
    "--fb": font.body,
    "--fw": font.weight,
    "--ft": font.tracking,
    "--fs": font.scale,
    "--r": choice(settings, "corners", ["rounded", "sharp"] as const, "rounded") === "sharp" ? radius.sharp : radius.rounded,
    colorScheme: isDark(palette.bg) ? "dark" : "light",
  };
  for (const [key, value] of Object.entries(palette)) vars[`--${key}`] = value;
  vars["--muted"] = readable(palette.muted, [palette.bg, palette.surf, ...onPanels], palette.ink);
  Object.assign(vars, cardVars(settings, { surface: palette.card ?? palette.surf, accent: accent.fill, inks: [palette.ink, vars["--muted"] as string, accent.text] }));
  return vars as CSSProperties;
}

/** Extra panel colors in a palette (such as `card`) that text sits on, so contrast is checked against them too. */
const panels = (p: Palette) => (p.card ? [p.card] : []);

/** The owner's accent color (a preset or their own #RRGGBB), or the template's default when it is not a color. */
export function accentColor(settings: Settings, fallback: string): string {
  const value = text(settings, "accent").trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export const textured = (settings: Settings, key = "texture") => flag(settings, key);
