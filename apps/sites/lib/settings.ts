import type { Settings } from "./types";

export const PRESET = "preset:";

export function text(settings: Settings, key: string, fallback = ""): string {
  const value = settings[key];
  return typeof value === "string" ? value : fallback;
}

export function choice<T extends string>(settings: Settings, key: string, options: readonly T[], fallback: T): T {
  const value = settings[key];
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function number(settings: Settings, key: string, fallback = 0): number {
  const value = settings[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function flag(settings: Settings, key: string, fallback = false): boolean {
  const value = settings[key];
  return typeof value === "boolean" ? value : fallback;
}

export function list(settings: Settings, key: string): string[] {
  const value = settings[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.length > 0) : [];
}

/** Is a section switched on in the "sections" toggles? */
export function sectionOn(settings: Settings, section: string): boolean {
  return list(settings, "sections").includes(section);
}

export type Hours = Partial<Record<"sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri", string>>;

export function hours(settings: Settings, key = "hours"): Hours {
  const value = settings[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Hours) : {};
}

/**
 * Resolves an image setting: "preset:<name>" → the template's bundled picture, a URL → itself, empty → null.
 * Presets live in public/templates/<templateId>/presets/<name>.svg.
 */
export function image(value: unknown, templateId: string): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value.startsWith(PRESET)) return `/templates/${templateId}/presets/${value.slice(PRESET.length)}.svg`;
  return value;
}
