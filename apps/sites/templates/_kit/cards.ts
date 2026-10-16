import { choice, text } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import { contrast, mix } from "./color";
import cardSettings from "./card-settings.json";

/*
 * The owner's card options, shared by every template (fields in card-settings.json, added to every template by
 * scripts/build-registry.mjs in a "Cards" group). Templates mark their product cards with .kit-card (and the card's
 * photo box with .kit-card-media), their category tiles with .kit-cat (.kit-cat-media), and the lists that hold them with
 * .kit-cards; _kit/cards.css styles them from the data attributes below. "Template default" ("auto") adds nothing, so a
 * site that never touched these looks exactly as before.
 */

const options = <T extends string>(key: string) => cardSettings.fields.find((f) => f.key === key)!.options as T[];

export type CardStyle = "auto" | "flat" | "outlined" | "raised" | "glass" | "tinted" | "minimal";
export type CardBorder = "auto" | "none" | "thin" | "medium" | "thick";
export type CardCorners = "auto" | "square" | "small" | "medium" | "large";
export type CardPhoto = "auto" | "square" | "rounded" | "circle";
export type CardSpacing = "auto" | "tight" | "airy";

export const CARD_STYLES = options<CardStyle>("cards.style");
export const CARD_BORDERS = options<CardBorder>("cards.border");
export const CARD_CORNERS = options<CardCorners>("cards.corners");
export const CARD_PHOTOS = options<CardPhoto>("cards.photo");
export const CARD_SPACINGS = options<CardSpacing>("cards.spacing");

/** "auto" (the template's own border color), "accent", "ink" (the text color) or the owner's own #RRGGBB. */
export type CardBorderColor = "auto" | "accent" | "ink" | `#${string}`;

export type CardOptions = {
  style: CardStyle;
  border: CardBorder;
  borderColor: CardBorderColor;
  corners: CardCorners;
  photo: CardPhoto;
  spacing: CardSpacing;
};

export function cardOptions(settings: Settings): CardOptions {
  const color = text(settings, "cards.borderColor").trim();
  return {
    style: choice(settings, "cards.style", CARD_STYLES, "auto"),
    border: choice(settings, "cards.border", CARD_BORDERS, "auto"),
    borderColor: color === "accent" || color === "ink" ? color : /^#[0-9a-f]{6}$/i.test(color) ? (color.toUpperCase() as CardBorderColor) : "auto",
    corners: choice(settings, "cards.corners", CARD_CORNERS, "auto"),
    photo: choice(settings, "cards.photo", CARD_PHOTOS, "auto"),
    spacing: choice(settings, "cards.spacing", CARD_SPACINGS, "auto"),
  };
}

/** Data attributes for the template's root element that switch on the card options in _kit/cards.css. Empty for the defaults. */
export function cardAttributes(settings: Settings): Record<string, string> {
  const o = cardOptions(settings);
  const attrs: Record<string, string> = {};
  if (o.style !== "auto") attrs["data-card-style"] = o.style;
  if (o.border !== "auto") attrs["data-card-border"] = o.border;
  if (o.borderColor !== "auto") attrs["data-card-bc"] = o.borderColor.startsWith("#") ? "custom" : o.borderColor;
  if (o.corners !== "auto") attrs["data-card-corners"] = o.corners;
  if (o.photo !== "auto") attrs["data-card-photo"] = o.photo;
  if (o.spacing !== "auto") attrs["data-card-spacing"] = o.spacing;
  return attrs;
}

/**
 * The faint accent background of the "Soft color" style: as much accent (up to 12%) as keeps the template's text, muted
 * text and accent text at 4.5:1 on it.
 */
export function cardTint(surface: string, accent: string, inks: string[]): string {
  for (let amount = 0.12; amount > 0; amount -= 0.02) {
    const tint = mix(surface, accent, amount);
    if (inks.every((ink) => contrast(ink, tint) >= 4.5)) return tint;
  }
  return surface;
}

/** CSS variables for the template's root: the owner's own border color (--kit-bc-own) and the soft card tint (--kit-tint). */
export function cardVars(settings: Settings, palette: { surface: string; accent: string; inks: string[] }): Record<string, string> {
  const o = cardOptions(settings);
  const vars: Record<string, string> = {};
  if (o.borderColor.startsWith("#")) vars["--kit-bc-own"] = o.borderColor;
  if (o.style === "tinted") vars["--kit-tint"] = cardTint(palette.surface, palette.accent, palette.inks);
  return vars;
}
