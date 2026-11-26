import { choice, text } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import { contrast, isDark, mix, readable } from "./color";
import tuneSettings from "./tune-settings.json";

/*
 * The owner's fine tuning, shared by every template (fields in tune-settings.json, added by scripts/build-registry.mjs):
 *   "Motion"           motion.intro (how the top of the page appears), motion.hover (what products and buttons do when a
 *                      visitor points at them) and motion.speed (slower or quicker motion, also for "Motion when scrolling")
 *   "Your own section" a section the owner writes (extra.*): title, text, photo and a button, shown where they choose
 *   "Fine tuning"      the text color (tune.text), the color of section titles (tune.headings) and the owner's own CSS (tune.css)
 * tuneAttributes() puts data attributes on the template's root for the motion options that are not the default, and
 * _kit/tune.css styles them. The title color is the --tn-head variable on the root, set only when a readable color exists;
 * tune.css finds it in the root's style attribute. ownInk() and titleColor() feed the theme variables, always moved until they read at 4.5:1 on the page.
 * The owner's CSS goes through ownerCss() (lib/owner-css.ts) before it reaches the page. A site that never touched these
 * looks exactly as before.
 */

const fields = [...tuneSettings.motion.fields, ...tuneSettings.extra.fields, ...tuneSettings.tune.fields];
const options = <T extends string>(key: string) => fields.find((f) => f.key === key)!.options as T[];

export type Intro = "auto" | "none" | "fade" | "rise" | "zoom" | "blur" | "slide";
export type Hover = "auto" | "none" | "lift" | "zoom" | "glow" | "tilt" | "press";
export type Speed = "auto" | "slow" | "normal" | "fast";
export type ExtraPlace = "off" | "top" | "middle" | "bottom";
export type ExtraLayout = "beside" | "card" | "band" | "centered";

export const TUNE_KEYS = fields.map((f) => f.key);

const read = <T extends string>(settings: Settings, key: string, fallback: T) => choice<T>(settings, key, options<T>(key), fallback);

const HEX = /^#[0-9a-f]{6}$/i;

/** Data attributes for the template's root that switch on _kit/tune.css. Empty for the defaults. */
export function tuneAttributes(settings: Settings): Record<string, string> {
  const attrs: Record<string, string> = {};
  const intro = read<Intro>(settings, "motion.intro", "auto");
  const hover = read<Hover>(settings, "motion.hover", "auto");
  const speed = read<Speed>(settings, "motion.speed", "auto");
  if (intro !== "auto") attrs["data-mo-intro"] = intro;
  if (hover !== "auto") attrs["data-mo-hover"] = hover;
  if (speed !== "auto") attrs["data-mo-speed"] = speed;
  return attrs;
}

/** The owner's text color choice: #RRGGBB, or null for the template's own. */
function inkChoice(settings: Settings): string | null {
  const value = text(settings, "tune.text").trim();
  return HEX.test(value) ? value.toUpperCase() : null;
}

/** The owner's title color choice: "accent", #RRGGBB, or null for the template's own. */
function titleChoice(settings: Settings): string | null {
  const value = text(settings, "tune.headings").trim();
  if (value === "accent") return value;
  return HEX.test(value) ? value.toUpperCase() : null;
}

/**
 * Templates soften their text in places (descriptions at 80% opacity, muted lines mixed from the ink), so the owner's text
 * color needs room above 4.5:1 to stay readable there too.
 */
const INK_RATIO = 7;

/**
 * The text color for the page: the theme's `ink`, or the owner's color moved toward black or white until it reads at
 * 7:1 on the page and its panels (`backgrounds`), so text the template softens still reads at 4.5:1.
 */
export function ownInk(settings: Settings, ink: string, backgrounds: string[]): string {
  const chosen = inkChoice(settings);
  if (!chosen) return ink;
  const toward = isDark(backgrounds[0] ?? "#FFFFFF") ? "#FFFFFF" : "#000000";
  return readable(chosen, backgrounds, toward, INK_RATIO);
}

/** The theme's accent: its fill (some templates set a section title on it) and its text color on the page. */
export type AccentPair = { fill: string; text: string };

/**
 * The color of section titles, or null for the template's own: the accent text color or the owner's color, moved toward
 * black or white until it reads at 4.5:1 on the page and its panels (titles can be small on a phone) and at 3:1 on the
 * accent fill (some templates set a title on an accent panel). Null when no color reaches both.
 */
export function titleColor(settings: Settings, backgrounds: string[], accent: AccentPair): string | null {
  const chosen = titleChoice(settings);
  if (chosen === null) return null;
  const start = chosen === "accent" ? accent.text : chosen;
  const toward = isDark(backgrounds[0] ?? "#FFFFFF") ? "#FFFFFF" : "#000000";
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(start, toward, step / 20);
    if (backgrounds.every((bg) => contrast(candidate, bg) >= 4.5) && contrast(candidate, accent.fill) >= 3) return candidate;
  }
  return null;
}

/** CSS variables for the theme: the title color, when the owner picked one that can be read. */
export function tuneVars(settings: Settings, backgrounds: string[], accent: AccentPair): Record<string, string> {
  const title = titleColor(settings, backgrounds, accent);
  return title ? { "--tn-head": title } : {};
}


/* ---------- the owner's own section ---------- */

export type ExtraSection = {
  place: Exclude<ExtraPlace, "off">;
  layout: ExtraLayout;
  eyebrow: string;
  title: string;
  text: string;
  button: { label: string; href: string } | null;
};

/** Where the owner's own section shows, or null when it is off or has nothing to show. */
export function extraSection(settings: Settings): ExtraSection | null {
  const place = read<ExtraPlace>(settings, "extra.place", "off");
  if (place === "off") return null;
  const get = (key: string) => text(settings, key).trim();
  const title = get("extra.title");
  const body = get("extra.text");
  if (!title && !body) return null;
  const label = get("extra.button");
  const href = safeLink(get("extra.link"));
  return {
    place,
    layout: read<ExtraLayout>(settings, "extra.layout", "beside"),
    eyebrow: get("extra.eyebrow"),
    title,
    text: body,
    button: label && href ? { label, href } : null,
  };
}

/**
 * A link the owner typed, made safe for an href: web addresses (https added when left out), WhatsApp, phone and email
 * links, and links to a section of the page (#menu). Anything else (javascript:, data:...) is no link at all.
 */
export function safeLink(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  if (/^#[a-z][a-z0-9-]{0,40}$/i.test(value)) return value;
  if (/^(mailto|tel):[^<>"']+$/i.test(value)) return value;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** The owner's own CSS as they typed it (cleaned by ownerCss() in lib/owner-css.ts before it reaches the page). */
export const ownCssText = (settings: Settings) => text(settings, "tune.css");
