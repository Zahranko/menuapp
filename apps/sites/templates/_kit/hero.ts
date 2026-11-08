import { choice, flag, image, list } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import heroSettings from "./hero-settings.json";

/*
 * The owner's hero slider options, shared by every template (fields in hero-settings.json, added by
 * scripts/build-registry.mjs for the template's kind of opening: "backdrop", "panel" or "band"). One photo shows exactly
 * as before; two or more become a slider (HeroPhotos / HeroSlider.tsx, styled by _kit/hero.css). Height, darkening and
 * text position are data attributes on the template's root (heroAttributes), read by _kit/hero.css for the elements a
 * template marks .kit-hero (the opening), .kit-hero-media (its photo box) and .kit-hero-text (its text).
 */

const field = (key: string) => heroSettings.fields.find((f) => f.key === key) as { options?: string[] };
const options = <T extends string>(key: string) => field(key).options as T[];

export type HeroTransition = "slide" | "fade" | "zoom";
export type HeroSpeed = "slow" | "normal" | "fast";
export type HeroHeight = "auto" | "short" | "medium" | "full";
export type HeroOverlay = "auto" | "light" | "medium" | "strong";
export type HeroTextPosition = "auto" | "start" | "center" | "bottom";

export const HERO_TRANSITIONS = options<HeroTransition>("hero.transition");
export const HERO_SPEEDS = options<HeroSpeed>("hero.speed");
export const HERO_HEIGHTS = options<HeroHeight>("hero.height");
export const HERO_OVERLAYS = options<HeroOverlay>("hero.overlay");
export const HERO_TEXT_POSITIONS = options<HeroTextPosition>("hero.textPosition");

/** Milliseconds on each photo. */
export const HERO_INTERVALS: Record<HeroSpeed, number> = { slow: 8000, normal: 5000, fast: 3000 };

/** The most photos a slider shows: the main photo and five more (or six in a photo strip). */
export const MAX_SLIDES = 6;

export type HeroOptions = {
  transition: HeroTransition;
  autoplay: boolean;
  interval: number;
  dots: boolean;
  arrows: boolean;
  height: HeroHeight;
  overlay: HeroOverlay;
  textPosition: HeroTextPosition;
};

const defaults = heroSettings.defaults;

/** The options, with `own` as the template's own defaults for a site saved before they existed (see heroSlider.defaults). */
export function heroOptions(settings: Settings, own: { transition?: HeroTransition; controls?: string[] } = {}): HeroOptions {
  const controls = Array.isArray(settings["hero.controls"]) ? list(settings, "hero.controls") : (own.controls ?? defaults["hero.controls"]);
  return {
    transition: choice(settings, "hero.transition", HERO_TRANSITIONS, own.transition ?? (defaults["hero.transition"] as HeroTransition)),
    autoplay: flag(settings, "hero.autoplay", defaults["hero.autoplay"]),
    interval: HERO_INTERVALS[choice(settings, "hero.speed", HERO_SPEEDS, defaults["hero.speed"] as HeroSpeed)],
    dots: controls.includes("dots"),
    arrows: controls.includes("arrows"),
    height: choice(settings, "hero.height", HERO_HEIGHTS, "auto"),
    overlay: choice(settings, "hero.overlay", HERO_OVERLAYS, "auto"),
    textPosition: choice(settings, "hero.textPosition", HERO_TEXT_POSITIONS, "auto"),
  };
}

const pictures = (values: string[]) => values.map((v) => image(v)).filter((v): v is string => v !== null);

/**
 * The hero's photos in order. "hero.image": the main photo, then "hero.slides" (the extra photos). "hero.images": the
 * template's own list. No source (a photo strip): "hero.slides" alone. `fallback` is the template's own picture when
 * the owner has none (a product photo, for example). Duplicates are dropped; at most MAX_SLIDES.
 */
export function heroPhotos(settings: Settings, source: "hero.image" | "hero.images" | null, fallback: string | null = null): string[] {
  const own =
    source === "hero.image"
      ? pictures([typeof settings["hero.image"] === "string" ? settings["hero.image"] : "", ...list(settings, "hero.slides")])
      : pictures(list(settings, source ?? "hero.slides"));
  const all = own.length === 0 && fallback ? [fallback] : own;
  return [...new Set(all)].slice(0, MAX_SLIDES);
}

/** Data attributes for the template's root element that switch on the hero options in _kit/hero.css. Empty for the defaults. */
export function heroAttributes(settings: Settings): Record<string, string> {
  const o = heroOptions(settings);
  const attrs: Record<string, string> = {};
  if (o.height !== "auto") attrs["data-hero-height"] = o.height;
  if (o.overlay !== "auto") attrs["data-hero-overlay"] = o.overlay;
  if (o.textPosition !== "auto") attrs["data-hero-text"] = o.textPosition;
  return attrs;
}

export type SliderLabels = { carousel: string; slideRole: string; region: string; slide: string; previous: string; next: string; show: string; pause: string; play: string };

const LABELS: Record<"en" | "ar", SliderLabels> = {
  en: { carousel: "carousel", slideRole: "slide", region: "Photos", slide: "Photo {n} of {total}", previous: "Previous photo", next: "Next photo", show: "Show photo {n}", pause: "Pause the photos", play: "Play the photos" },
  ar: { carousel: "عرض صور", slideRole: "صورة", region: "الصور", slide: "الصورة {n} من {total}", previous: "الصورة السابقة", next: "الصورة التالية", show: "اعرض الصورة {n}", pause: "أوقف تبديل الصور", play: "شغّل تبديل الصور" },
};

export const sliderLabels = (locale: string): SliderLabels => LABELS[locale === "ar" ? "ar" : "en"];

/** "{n} of {total}" with the numbers filled in. */
export const fillLabel = (label: string, values: Record<string, number>) => label.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
