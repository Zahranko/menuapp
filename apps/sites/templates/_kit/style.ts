import { choice } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import styleSettings from "./style-settings.json";

/*
 * The owner's page style, shared by every template (fields in style-settings.json, added to every template by
 * scripts/build-registry.mjs in a "Page style" group after "Cards"): text size, heading style and letter spacing, space
 * between sections, buttons, the shape of photos, section dividers, a background texture and motion on scroll.
 * styleAttributes() puts one data attribute on the template's root per option that differs from "Template default"
 * ("auto"); _kit/style.css styles them. A site that never touched these looks exactly as before.
 *
 * What templates mark for it (see _kit/style.css):
 *   data-k="btn"     a call-to-action link or button (not the floating order button, which has its own shape option)
 *   data-k="photo"   a photo box in a section (story, gallery...); product photos use .kit-card-media / .kit-cat-media
 *   data-k="overlay" a photo box with text laid over it: it keeps a full (rounded) box instead of a circle, arch or blob
 *   data-k="fill"    a gallery tile: it keeps its place in the grid, so a circle may be oval
 *   data-k="boxed"   a section drawn as a box of its own: it gets no divider band
 *   calc(<n>px * var(--kit-space, 1)) in the vertical padding and margins of the template's sections
 */

const options = <T extends string>(key: string) => styleSettings.fields.find((f) => f.key === key)!.options as T[];

export type TextSize = "auto" | "smaller" | "larger" | "big";
export type HeadingStyle = "auto" | "normal" | "uppercase" | "italic" | "condensed" | "outlined";
export type Tracking = "auto" | "tight" | "normal" | "wide";
export type Spacing = "auto" | "compact" | "airy";
export type ButtonStyle = "auto" | "pill" | "rounded" | "square" | "outline" | "underline" | "shadow";
export type PhotoShape = "auto" | "rounded" | "square" | "soft" | "arch" | "circle" | "blob";
export type Divider = "auto" | "none" | "line" | "wave" | "slant" | "zigzag" | "dots";
export type Texture = "auto" | "none" | "dots" | "grain" | "paper" | "grid" | "stripes";
export type Motion = "auto" | "none" | "fade" | "rise" | "playful";

export type PageStyle = {
  textSize: TextSize;
  headings: HeadingStyle;
  tracking: Tracking;
  spacing: Spacing;
  buttons: ButtonStyle;
  photos: PhotoShape;
  dividers: Divider;
  texture: Texture;
  motion: Motion;
};

/** Each option's setting key and the root data attribute it sets. */
const FIELDS: { [K in keyof PageStyle]: { key: string; attr: string } } = {
  textSize: { key: "style.textSize", attr: "data-ps-text" },
  headings: { key: "style.headings", attr: "data-ps-head" },
  tracking: { key: "style.tracking", attr: "data-ps-track" },
  spacing: { key: "style.spacing", attr: "data-ps-space" },
  buttons: { key: "style.buttons", attr: "data-ps-btn" },
  photos: { key: "style.photos", attr: "data-ps-photo" },
  dividers: { key: "style.dividers", attr: "data-ps-div" },
  texture: { key: "style.texture", attr: "data-ps-tex" },
  motion: { key: "style.motion", attr: "data-ps-motion" },
};

export const PAGE_STYLE_KEYS = Object.values(FIELDS).map((f) => f.key);
export const PAGE_STYLE_ATTRIBUTES = Object.values(FIELDS).map((f) => f.attr);

/** The owner's page style; anything missing or unknown is "auto". */
export function pageStyle(settings: Settings): PageStyle {
  const read = <T extends string>(key: string) => choice<T>(settings, key, options<T>(key), "auto" as T);
  return {
    textSize: read<TextSize>(FIELDS.textSize.key),
    headings: read<HeadingStyle>(FIELDS.headings.key),
    tracking: read<Tracking>(FIELDS.tracking.key),
    spacing: read<Spacing>(FIELDS.spacing.key),
    buttons: read<ButtonStyle>(FIELDS.buttons.key),
    photos: read<PhotoShape>(FIELDS.photos.key),
    dividers: read<Divider>(FIELDS.dividers.key),
    texture: read<Texture>(FIELDS.texture.key),
    motion: read<Motion>(FIELDS.motion.key),
  };
}

/** Data attributes for the template's root element that switch on the page style in _kit/style.css. Empty for the defaults. */
export function styleAttributes(settings: Settings): Record<string, string> {
  const style = pageStyle(settings);
  const attrs: Record<string, string> = {};
  for (const [name, { attr }] of Object.entries(FIELDS) as [keyof PageStyle, { attr: string }][]) {
    if (style[name] !== "auto") attrs[attr] = style[name];
  }
  return attrs;
}
