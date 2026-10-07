import type { CSSProperties } from "react";
import { choice, flag, text } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import { accentTokens, isDark, readable } from "./color";
import { fontPairs, forLocale, type FontName } from "./fonts";

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
  const palette = o.palettes[choice(settings, "theme", names, names[0])];
  const font = forLocale(fontPairs[choice(settings, "font", o.fonts, o.fonts[0])], locale);
  const accent = accentTokens(text(settings, "accent", o.defaultAccent ?? "#D9542C"), palette.bg, palette.surf, palette.ink);
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
  vars["--muted"] = readable(palette.muted, [palette.bg, palette.surf], palette.ink);
  return vars as CSSProperties;
}

export const textured = (settings: Settings, key = "texture") => flag(settings, key);
