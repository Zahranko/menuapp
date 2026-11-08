import { choice } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import sectionsSettings from "./sections-settings.json";

/*
 * The owner's section options, shared by every template (fields in sections-settings.json, added to every template by
 * scripts/build-registry.mjs in a "Sections" group after "Menu layout"):
 *  - "sections.order": the order of the template's sections between the opening and the footer (a field of type
 *    "order": the list of the template's section names, from its manifest's "sectionsLayout.order"). The opening always
 *    comes first and the footer last. A template renders its sections through ordered() (_kit/Sections.tsx), so with the
 *    template's own order the page is exactly as before.
 *  - one layout per kind of section the template has: highlights, story, gallery, reviews, visit and footer. "auto" keeps
 *    the template's own section untouched; any other choice swaps in the shared section of _kit/Sections.tsx, styled by
 *    _kit/sections.css with the template's own colors, fonts and corners (the --k-* variables of layout.css).
 */

type Field = (typeof sectionsSettings.fields)[number];
const field = (key: string) => sectionsSettings.fields.find((f: Field) => f.key === key)!;
const options = <T extends string>(key: string) => field(key).options as T[];

export type HighlightsLayout = "auto" | "icons" | "cards" | "numbered" | "statement" | "alternating" | "marquee";
export type StoryLayout = "auto" | "beside" | "behind" | "quote" | "timeline" | "columns" | "letter";
export type GalleryLayout = "auto" | "grid" | "masonry" | "carousel" | "polaroid" | "feature" | "strip";
export type ReviewsLayout = "auto" | "cards" | "quote" | "carousel" | "wall" | "summary";
export type VisitLayout = "auto" | "map" | "cards" | "table" | "centered" | "banner";
export type FooterLayout = "auto" | "simple" | "columns" | "big" | "centered" | "minimal";

export const HIGHLIGHTS_LAYOUTS = options<HighlightsLayout>("highlights.layout");
export const STORY_LAYOUTS = options<StoryLayout>("story.layout");
export const GALLERY_LAYOUTS = options<GalleryLayout>("gallery.layout");
export const REVIEWS_LAYOUTS = options<ReviewsLayout>("reviews.layout");
export const VISIT_LAYOUTS = options<VisitLayout>("visit.layout");
export const FOOTER_LAYOUTS = options<FooterLayout>("footer.layout");

export type SectionLayouts = {
  highlights: HighlightsLayout;
  story: StoryLayout;
  gallery: GalleryLayout;
  reviews: ReviewsLayout;
  visit: VisitLayout;
  footer: FooterLayout;
};
export type SectionKind = keyof SectionLayouts;

/** Each kind of section's layout setting key. */
export const SECTION_LAYOUT_KEYS: Record<SectionKind, string> = {
  highlights: "highlights.layout",
  story: "story.layout",
  gallery: "gallery.layout",
  reviews: "reviews.layout",
  visit: "visit.layout",
  footer: "footer.layout",
};
export const SECTION_ORDER_KEY = sectionsSettings.order.key;
export const SECTIONS_KEYS = [SECTION_ORDER_KEY, ...Object.values(SECTION_LAYOUT_KEYS)];
/** The names a template may list in "sectionsLayout.order", with their labels. */
export const SECTION_NAMES = Object.keys(sectionsSettings.order.labels);

/** The owner's section layouts; anything missing or unknown is "auto". */
export function sectionLayouts(settings: Settings): SectionLayouts {
  return {
    highlights: choice(settings, SECTION_LAYOUT_KEYS.highlights, HIGHLIGHTS_LAYOUTS, "auto"),
    story: choice(settings, SECTION_LAYOUT_KEYS.story, STORY_LAYOUTS, "auto"),
    gallery: choice(settings, SECTION_LAYOUT_KEYS.gallery, GALLERY_LAYOUTS, "auto"),
    reviews: choice(settings, SECTION_LAYOUT_KEYS.reviews, REVIEWS_LAYOUTS, "auto"),
    visit: choice(settings, SECTION_LAYOUT_KEYS.visit, VISIT_LAYOUTS, "auto"),
    footer: choice(settings, SECTION_LAYOUT_KEYS.footer, FOOTER_LAYOUTS, "auto"),
  };
}

/**
 * The template's section names (`own`, in the template's order) in the owner's order: names the owner listed come first in
 * their order, then any the saved order doesn't know yet (a section added to the template later) where the template has
 * them relative to the one before. Unknown and repeated names are ignored, so a stale or broken setting never hides a section.
 */
export function sectionOrder(settings: Settings, own: readonly string[]): string[] {
  const saved = settings[SECTION_ORDER_KEY];
  if (!Array.isArray(saved)) return [...own];
  const known = new Set(own);
  const out: string[] = [];
  for (const name of saved) if (typeof name === "string" && known.has(name) && !out.includes(name)) out.push(name);
  own.forEach((name, i) => {
    if (out.includes(name)) return;
    // A section the saved order doesn't have goes right after the section before it in the template's own order.
    const before = own.slice(0, i).reverse().find((n) => out.includes(n));
    out.splice(before === undefined ? 0 : out.indexOf(before) + 1, 0, name);
  });
  return out;
}

/** True when the owner moved any section (the order differs from the template's own). */
export const orderChanged = (settings: Settings, own: readonly string[]) => sectionOrder(settings, own).some((n, i) => n !== own[i]);

/**
 * Some templates call a section by another name in their links (#work or #lookbook for the gallery, #how for the steps). Links to
 * the sections ("#story") follow the owner's order in the shared headers and footers.
 */
const ANCHOR_ALIASES: Record<string, string> = { work: "gallery", lookbook: "gallery", street: "gallery", process: "steps", how: "steps", week: "steps", contact: "visit" };
export function sortLinks<T extends { href: string }>(settings: Settings, links: T[]): T[] {
  const saved = settings[SECTION_ORDER_KEY];
  if (!Array.isArray(saved)) return links;
  const rank = (href: string) => {
    if (!href.startsWith("#")) return -1;
    const name = ANCHOR_ALIASES[href.slice(1)] ?? href.slice(1);
    return saved.indexOf(name);
  };
  const ranked = links.filter((l) => rank(l.href) >= 0).sort((a, b) => rank(a.href) - rank(b.href));
  let i = 0;
  return links.map((l) => (rank(l.href) >= 0 ? ranked[i++] : l));
}
