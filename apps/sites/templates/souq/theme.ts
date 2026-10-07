import type { CSSProperties } from "react";
import { accentTokens, isDark, readable } from "../_kit/color";
import { fontPairs, forLocale } from "../_kit/fonts";
import { choice, flag, text } from "@/lib/settings";
import type { Settings } from "@/lib/types";

/** Souq's four color themes, from the prototype. */
export const THEMES = {
  cream: { bg: "#FBF7EE", surf: "#F4EEE1", ink: "#1E1A14", muted: "#6A6358", line: "#E6DECD", dot: "#1E1A1414", foot: "#1E1A14", footInk: "#F4EEE1" },
  sage: { bg: "#EEF2EA", surf: "#E2E9DC", ink: "#17231B", muted: "#55665A", line: "#CFDACA", dot: "#17231B16", foot: "#17231B", footInk: "#E2E9DC" },
  blush: { bg: "#FBF1EE", surf: "#F5E3DD", ink: "#2A1714", muted: "#78605A", line: "#EBD3CB", dot: "#2A171414", foot: "#2A1714", footInk: "#F5E3DD" },
  night: { bg: "#121714", surf: "#1B221E", ink: "#F2EFE6", muted: "#A0ABA3", line: "#2B3530", dot: "#F2EFE612", foot: "#0A0D0B", footInk: "#F2EFE6" },
} as const;

export type ThemeName = keyof typeof THEMES;
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/** The prototype's siteVars(): every color, font and radius as a CSS variable on the site's root element. */
export function souqVars(settings: Settings, locale: string): CSSProperties {
  const theme = THEMES[choice(settings, "theme", THEME_NAMES, "cream")];
  const font = forLocale(fontPairs[choice(settings, "font", ["modern", "elegant", "bold"] as const, "modern")], locale);
  const accent = accentTokens(text(settings, "accent", "#D9542C"), theme.bg, theme.surf, theme.ink);
  const dark = isDark(theme.bg);
  return {
    "--sbg": theme.bg,
    "--ssurf": theme.surf,
    "--sink": theme.ink,
    "--smuted": readable(theme.muted, [theme.bg, theme.surf], theme.ink),
    "--sline": theme.line,
    "--sdot": theme.dot,
    "--sfoot": theme.foot,
    "--sfootink": theme.footInk,
    "--sacc": accent.fill,
    "--saccink": accent.onFill,
    "--sacctext": accent.text,
    "--saccsoft": accent.soft,
    "--sgold": dark ? "#E8B24A" : "#9A6A00",
    "--sdisp": font.display,
    "--sbody": font.body,
    "--sdw": font.weight,
    "--sdls": font.tracking,
    "--sds": font.scale,
    "--srad": choice(settings, "corners", ["rounded", "sharp"] as const, "rounded") === "sharp" ? "4px" : "22px",
    colorScheme: dark ? "dark" : "light",
  } as CSSProperties;
}

export const dotted = (settings: Settings) => flag(settings, "texture");
