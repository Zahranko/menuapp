import { choice, flag, image, number } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import logoSettings from "./logo-settings.json";

/*
 * The owner's logo options, shared by every template. scripts/build-registry.mjs adds their fields (logo-settings.json)
 * to every template right after "logo"; this file turns the saved values into what templates render:
 * data attributes for the template's root element (logoAttributes), read by _kit/logo.css and the template's own CSS.
 * _kit/logo.css turns data-logo-size into --logo-scale and zooms the logo with it, so every logo, frame and initial
 * scales with its template's own proportions. The defaults produce no attributes, so a site that never touched these
 * looks exactly as before.
 */

const defaults = logoSettings.defaults;
const sizeField = logoSettings.fields.find((f) => f.key === "logo.size") as { min: number; max: number; step: number };

/** The smallest and largest logo size and its step, in percent of the template's own logo size. */
export const LOGO_SIZE = { min: sizeField.min, max: sizeField.max, step: sizeField.step, default: defaults["logo.size"] } as const;

export type LogoOptions = {
  /** An uploaded (or preset) logo picture is set; without one templates show the business's initial. */
  hasLogo: boolean;
  /** Show the template's frame (tile, circle, border, shadow) around the logo. */
  frame: boolean;
  /** Logo size in percent of the template's own: clamped to LOGO_SIZE and rounded to its step (100 = as designed). */
  size: number;
  /** Logo centered in the header instead of the template's default place. */
  centered: boolean;
  /** Show the business name next to the logo in the header and footer. */
  showName: boolean;
};

export function logoOptions(settings: Settings): LogoOptions {
  const size = number(settings, "logo.size", LOGO_SIZE.default);
  const clamped = Math.min(LOGO_SIZE.max, Math.max(LOGO_SIZE.min, size));
  return {
    hasLogo: image(settings.logo) !== null,
    frame: flag(settings, "logo.frame", defaults["logo.frame"]),
    size: LOGO_SIZE.min + Math.round((clamped - LOGO_SIZE.min) / LOGO_SIZE.step) * LOGO_SIZE.step,
    centered: choice(settings, "logo.position", ["start", "center"] as const, defaults["logo.position"] as "start") === "center",
    showName: flag(settings, "logo.name", defaults["logo.name"]),
  };
}

/** The logo is shown as uploaded, without the template's frame. Only applies to a real picture; the initial keeps its tile. */
export const bareLogo = (o: LogoOptions) => o.hasLogo && !o.frame;

/** The name is hidden visually (it stays for screen readers). Only with a logo picture, so the header is never just an initial. */
export const nameHidden = (o: LogoOptions) => o.hasLogo && !o.showName;

/** Data attributes for the template's root element. Empty for the defaults. */
export function logoAttributes(o: LogoOptions): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (bareLogo(o)) attrs["data-logo-frame"] = "off";
  if (o.centered) attrs["data-logo-pos"] = "center";
  if (nameHidden(o)) attrs["data-logo-name"] = "hidden";
  if (o.size !== LOGO_SIZE.default) attrs["data-logo-size"] = String(o.size);
  return attrs;
}
