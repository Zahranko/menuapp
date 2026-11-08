import { choice } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import layoutSettings from "./layout-settings.json";

/*
 * The owner's page layout, shared by every template (fields in layout-settings.json, added to every template by
 * scripts/build-registry.mjs in a "Page layout" group after "Page style"): the header's layout, its look and whether it
 * stays on screen, and the layout of the top of the page (the opening, "hero.variant"). "auto" keeps the template's own
 * header and opening exactly as they were. Any other choice swaps in a shared header or opening from _kit/Top.tsx,
 * styled by _kit/layout.css with the template's own colors, fonts and corners (--bg --surf --ink --muted --line --acc
 * --acc-ink --acc-text --acc-soft --fd --fb --fw --ft --r), so it reads as part of the template.
 * layoutAttributes() puts one data attribute on the template's root per option that differs from "auto".
 */

const options = <T extends string>(key: string) => layoutSettings.fields.find((f) => f.key === key)!.options as T[];

export type HeaderLayout = "auto" | "classic" | "centered" | "split" | "pill" | "big" | "minimal" | "drawer";
export type HeaderStyle = "auto" | "solid" | "transparent" | "glass" | "accent";
export type HeaderSticky = "auto" | "on" | "off";
export type HeroVariant = "auto" | "full" | "split" | "framed" | "poster" | "collage" | "arch" | "stacked" | "menu" | "type" | "circle";

export const HEADER_LAYOUTS = options<HeaderLayout>("header.layout");
export const HEADER_STYLES = options<HeaderStyle>("header.style");
export const HEADER_STICKY = options<HeaderSticky>("header.sticky");
export const HERO_VARIANTS = options<HeroVariant>("hero.variant");

export type PageLayout = { header: HeaderLayout; headerStyle: HeaderStyle; sticky: HeaderSticky; hero: HeroVariant };

/** Each option's setting key and the root data attribute it sets. */
const FIELDS: { [K in keyof PageLayout]: { key: string; attr: string } } = {
  header: { key: "header.layout", attr: "data-ly-head" },
  headerStyle: { key: "header.style", attr: "data-ly-hstyle" },
  sticky: { key: "header.sticky", attr: "data-ly-sticky" },
  hero: { key: "hero.variant", attr: "data-ly-hero" },
};

export const PAGE_LAYOUT_KEYS = Object.values(FIELDS).map((f) => f.key);
export const PAGE_LAYOUT_ATTRIBUTES = Object.values(FIELDS).map((f) => f.attr);

/** The owner's page layout; anything missing or unknown is "auto". */
export function pageLayout(settings: Settings): PageLayout {
  return {
    header: choice(settings, FIELDS.header.key, HEADER_LAYOUTS, "auto"),
    headerStyle: choice(settings, FIELDS.headerStyle.key, HEADER_STYLES, "auto"),
    sticky: choice(settings, FIELDS.sticky.key, HEADER_STICKY, "auto"),
    hero: choice(settings, FIELDS.hero.key, HERO_VARIANTS, "auto"),
  };
}

/** Data attributes for the template's root element (read by _kit/layout.css). Empty for the defaults. */
export function layoutAttributes(settings: Settings): Record<string, string> {
  const layout = pageLayout(settings);
  const attrs: Record<string, string> = {};
  for (const [name, { attr }] of Object.entries(FIELDS) as [keyof PageLayout, { attr: string }][]) {
    if (layout[name] !== "auto") attrs[attr] = layout[name];
  }
  return attrs;
}

/** Openings built around one photo box (the hero slider takes turns in it when the owner adds more photos). */
export const PHOTO_VARIANTS: ReadonlySet<HeroVariant> = new Set(["full", "split", "framed", "poster", "arch", "stacked", "circle"]);
