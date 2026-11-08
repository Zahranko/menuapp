import registry from "../templates/registry.json";

/**
 * Random design combinations for the QA checks in combinations.spec.ts. A combination starts from one of the template's
 * looks (or its defaults), then changes most design fields of its schema to a random value: colors (a listed one or any
 * color), fonts, themes, every shared group (cards, page style, page layout, menu layout, sections and their order) and
 * the template's signature options, plus some content variations an owner could have (a logo, many photos, long labels,
 * a long name, the least content). The generator is seeded, so a failing combination always comes back the same.
 *
 * A combination becomes a fixture preview address: "f<n>_<value>" sets the n-th field of the schema (lib/fixtures.ts,
 * applyField), "look_<id>" applies a look first.
 */

type Field = { key: string; type: string; options?: string[]; min?: number; max?: number; step?: number; custom?: boolean; group?: string };
export type Template = (typeof registry.templates)[number] & { looks?: { id: string }[] };

export type Combination = {
  template: string;
  /** Index of this combination for the template, part of its seed. */
  index: number;
  locale: "en" | "ar";
  look: string | null;
  /** The chosen values, by field key (for failure messages and to rebuild the page by hand). */
  values: Record<string, unknown>;
  /** Fixture options that are content, not settings: "logo", "slides_4", "gal_7", "labels", "longname", "sparse". */
  extras: string[];
  /** The page of a multi-page site ("" is the home page). */
  page: string;
  /** The preview address. */
  path: string;
};

/** Settings that hold the owner's words, photos or hours: never changed here. */
const CONTENT_TYPES = new Set(["text", "textarea", "image", "images", "hours"]);
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
const INNER_PAGES = ["/menu", "/gallery", "/visit"];

/** A small seeded random generator (mulberry32). */
export function random(seed: string) {
  let a = [...seed].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (n: number) => Math.floor(n * 256).toString(16).padStart(2, "0");

/** A random value for one field, as a fixture token value, with the value it stands for. */
function pick(field: Field, rnd: () => number): [string, unknown] | null {
  const options = field.options ?? [];
  const index = () => Math.floor(rnd() * options.length);
  switch (field.type) {
    case "choice":
    case "palette": {
      if (!options.length) return null;
      const i = index();
      return [String(i), options[i]];
    }
    case "color": {
      if (field.custom !== false && (rnd() < 0.3 || !options.length)) {
        const color = `${hex(rnd())}${hex(rnd())}${hex(rnd())}`.toUpperCase();
        return [`c${color}`, `#${color}`];
      }
      const i = index();
      return [String(i), options[i]];
    }
    case "toggle": {
      const on = rnd() < 0.5;
      return [on ? "1" : "0", on];
    }
    case "range": {
      const min = field.min ?? 0;
      const step = field.step ?? 1;
      const steps = Math.floor(((field.max ?? min) - min) / step);
      const value = min + Math.round(rnd() * steps) * step;
      return [String(value), value];
    }
    case "order": {
      const order = options.map((o, i) => [i, o] as const).sort(() => rnd() - 0.5);
      return [order.map(([i]) => i).join("+"), order.map(([, o]) => o)];
    }
    case "toggles": {
      // Sections mostly stay on, so the page has something to show; other sets are any mix.
      const keep = field.key === "sections" ? 0.8 : 0.5;
      const chosen = options.map((o, i) => [i, o] as const).filter(() => rnd() < keep);
      return [chosen.length ? chosen.map(([i]) => i).join("+") : "n", chosen.map(([, o]) => o)];
    }
    default:
      return null;
  }
}

/** One random combination for a template. `index` and the template id seed it; even and odd indexes take turns in Arabic. */
export function combination(template: Template, index: number, project = ""): Combination {
  const rnd = random(`${template.id}:${index}:${project}`);
  const looks = template.looks ?? [];
  const look = looks.length && rnd() < 0.8 ? looks[Math.floor(rnd() * looks.length)].id : null;
  const tokens: string[] = look ? [`look_${look}`] : [];
  const values: Record<string, unknown> = {};
  (template.schema as Field[]).forEach((field, n) => {
    if (CONTENT_TYPES.has(field.type) || rnd() > 0.65) return;
    const value = pick(field, rnd);
    if (!value) return;
    tokens.push(`f${n}_${value[0]}`);
    values[field.key] = value[1];
  });
  const extras: string[] = [];
  if (rnd() < 0.3) extras.push("logo");
  if (rnd() < 0.25) extras.push(`slides_${2 + Math.floor(rnd() * 5)}`);
  if (rnd() < 0.25) extras.push(`gal_${1 + Math.floor(rnd() * 12)}`);
  if (rnd() < 0.25) extras.push("labels");
  if (rnd() < 0.15) extras.push(rnd() < 0.5 ? "longname" : "longword");
  if (rnd() < 0.12) extras.push("sparse");
  const locale = (index + (random(template.id)() < 0.5 ? 0 : 1)) % 2 === 0 ? "ar" : "en";
  const page = MULTI_PAGE.has(template.id) && rnd() < 0.35 ? INNER_PAGES[Math.floor(rnd() * INNER_PAGES.length)] : "";
  const options = [...extras, ...tokens].join("-");
  return {
    template: template.id,
    index,
    locale,
    look,
    values,
    extras,
    page,
    path: `/_preview/fixture.${template.id}.default.${locale}.${options}${page}`,
  };
}

/** How many combinations each template gets: COMBOS=1 runs the full set (12), COMBOS=<n> runs n, CI runs 2. */
export function combinationCount(): number {
  const value = process.env.COMBOS;
  if (!value) return 2;
  if (value === "1") return 12;
  return Math.max(1, Number(value) || 2);
}

export const templates = registry.templates as Template[];
