import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applySiteOptions, fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { PAGE_STYLE_ATTRIBUTES } from "./_kit/style";
import styleSettings from "./_kit/style-settings.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared page style (_kit/style.ts, style.css) on every template. */

const ids = Object.keys(templates);
type Field = { key: string; type: string; group?: string; groupAr?: string; options?: string[]; previews?: Record<string, string> };
const schemaOf = (id: string) => registry.templates.find((t) => t.id === id)!.schema as Field[];
const defaultsOf = (id: string) => registry.templates.find((t) => t.id === id)!.defaults as Record<string, unknown>;
const STYLE_KEYS = styleSettings.fields.map((f) => f.key);
/** Templates with a motion switch of their own leave out the shared one. */
const OWN_MOTION = new Set(["atlas", "bloom", "couture", "ember", "lumen", "maison"]);
/** Templates whose only actions are text links or the order button: nothing for the button style to change. */
const NO_BUTTONS = new Set(["monogrid", "zen"]);
/** Text-only templates: no photos for the photo shape to change. */
const NO_PHOTOS = new Set(["bistro", "linen", "ticket"]);
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const root = (doc: Document, id: string) => doc.querySelector(`[data-template="${id}"]`)!;

const ALL = "ts_big-hs_condensed-tr_wide-lh_relaxed-sp_airy-btn_outline-pic_arch-div_wave-tex_grain-mo_rise";

describe.each(ids)("page style in template %s", (id) => {
  it("looks exactly as before with the defaults, saved or not", () => {
    const saved = fixtureFor(id);
    const old = fixtureFor(id);
    for (const key of STYLE_KEYS) delete old.settings[key];
    expect(html(saved)).toBe(html(old));
    const el = root(parse(html(saved)), id);
    for (const attr of PAGE_STYLE_ATTRIBUTES) expect(el.hasAttribute(attr), attr).toBe(false);
  });

  it("has the Page style group right after Cards, every option on Template default, with pictures", () => {
    const schema = schemaOf(id);
    const keys = schema.filter((f) => f.group === "Page style").map((f) => f.key);
    expect(keys).toEqual(STYLE_KEYS.filter((k) => !(OWN_MOTION.has(id) && k === "style.motion")));
    const first = schema.findIndex((f) => f.group === "Page style");
    expect(schema[first - 1].group).toBe("Cards");
    for (const key of keys) {
      const field = schema.find((f) => f.key === key)!;
      expect(defaultsOf(id)[key], key).toBe("auto");
      expect(field.groupAr, key).toBe(styleSettings.groupAr);
      expect(Object.keys(field.previews ?? {}), key).toEqual(field.options);
    }
  });

  it("puts the owner's choices on the root, in English and Arabic", () => {
    for (const locale of ["en", "ar"] as const) {
      const site = fixtureFor(id);
      if (locale === "ar") site.business = { ...site.business, locale: "ar" };
      applySiteOptions(site, ALL);
      const el = root(parse(html(site)), id);
      expect(el.getAttribute("data-ps-text")).toBe("big");
      expect(el.getAttribute("data-ps-lh")).toBe("relaxed");
      expect(el.getAttribute("data-ps-btn")).toBe("outline");
      expect(el.getAttribute("data-ps-div")).toBe("wave");
      expect(el.getAttribute("data-ps-photo")).toBe("arch");
    }
  });

  it("marks its buttons and photos for the page style", () => {
    const doc = parse(html(fixtureFor(id)) + (MULTI_PAGE.has(id) ? html(fixtureFor(id), ["menu"]) : ""));
    if (!NO_BUTTONS.has(id)) expect(doc.querySelectorAll('[data-k~="btn"]').length, "buttons").toBeGreaterThan(0);
    // The floating order button has its own shape option.
    expect(doc.querySelectorAll('.kit-order[data-k~="btn"]').length).toBe(0);
    if (!NO_PHOTOS.has(id)) expect(doc.querySelectorAll('[data-k~="photo"], .kit-card-media, .kit-cat-media').length, "photos").toBeGreaterThan(0);
    expect(doc.querySelectorAll('[data-section="menu"], [data-section="story"], [data-section="visit"]').length, "sections").toBeGreaterThan(0);
  });

  it("imports the page style and lets the owner change the space between its sections", () => {
    const css = readFileSync(path.join(__dirname, id, "styles.css"), "utf8");
    expect(css).toContain('@import "../_kit/style.css";');
    expect(css).toMatch(/\* var\(--kit-space, 1\)/);
  });
});

describe("page style stylesheet", () => {
  const css = readFileSync(path.join(__dirname, "_kit", "style.css"), "utf8");

  it("moves nothing for visitors who prefer less motion", () => {
    const motion = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(motion).toContain("animation-timeline: view()");
    expect(css.slice(0, css.indexOf("@media (prefers-reduced-motion: no-preference)"))).not.toContain("animation-timeline");
  });

  it("styles every option of style-settings.json", () => {
    const attrs: Record<string, string> = {
      "style.textSize": "data-ps-text",
      "style.headings": "data-ps-head",
      "style.tracking": "data-ps-track",
      "style.lineHeight": "data-ps-lh",
      "style.spacing": "data-ps-space",
      "style.buttons": "data-ps-btn",
      "style.photos": "data-ps-photo",
      "style.dividers": "data-ps-div",
      "style.texture": "data-ps-tex",
      "style.motion": "data-ps-motion",
    };
    for (const field of styleSettings.fields) {
      for (const option of field.options.filter((o) => o !== "auto")) {
        expect(css, `${field.key} ${option}`).toContain(`[${attrs[field.key]}="${option}"]`);
      }
    }
  });

  it("never cuts a word in a display heading, and keeps big headings inside a phone screen", () => {
    expect(css).toMatch(/:is\(h1, h2\) \{\s*overflow-wrap: normal !important;\s*word-break: normal !important;\s*hyphens: manual !important;/);
    expect(css).not.toContain("overflow-wrap: anywhere");
    const phone = css.slice(css.indexOf("@media (max-width: 560px)"));
    expect(phone).toContain("min(var(--kit-text, 1), 1)");
    expect(css).toMatch(/:is\(\[data-ps-text="larger"\], \[data-ps-text="big"\]\)\[data-ps-track="wide"\] :is\(h1, h2\) \{\s*letter-spacing: 0 !important;/);
  });

  it("outlines only display headings, never Arabic ones or labels", () => {
    const rules = css.match(/\[data-ps-head="outlined"\][^{]*\{/g) ?? [];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule).toContain(":lang(ar)");
      expect(rule).toContain('[data-k~="label"]');
      expect(rule).not.toMatch(/h3|h4/);
    }
  });

  it("finds dark themes the way templates write them, for the paper texture", () => {
    expect(css).toContain('[data-ps-tex="paper"][style*="color-scheme:dark"]');
    const maison = fixtureFor("maison");
    applySiteOptions(maison, "tex_paper");
    const dark = parse(html(maison));
    expect(root(dark, "maison").getAttribute("style")).toContain("color-scheme:dark");
    expect(root(parse(html(fixtureFor("souq"))), "souq").getAttribute("style")).toContain("color-scheme:light");
  });
});
