import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { HEADER_LAYOUTS, HERO_VARIANTS, PAGE_LAYOUT_ATTRIBUTES, PAGE_LAYOUT_KEYS } from "./_kit/layout";
import layoutSettings from "./_kit/layout-settings.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared "Page layout" options (_kit/layout.ts, Top.tsx, layout.css) on every template. */

const ids = Object.keys(templates);
type Field = { key: string; type: string; label: string; group?: string; groupAr?: string; options?: string[]; previews?: Record<string, string> };
const schemaOf = (id: string) => registry.templates.find((t) => t.id === id)!.schema as Field[];
const defaultsOf = (id: string) => registry.templates.find((t) => t.id === id)!.defaults as Record<string, unknown>;
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
/** Templates whose header is also their opening (SiteMasthead). */
const MASTHEAD = new Set(["bistro", "chalkboard", "linen", "monogrid", "neondiner", "polaroid", "spiceroute", "ticket"]);
/** Templates with their own versions of the opening ("hero.layout"), which move into the Page layout group. */
const OWN_HERO_LAYOUT = new Set(["souq", "atlas", "bloom", "ember", "lumen", "maison"]);

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const root = (doc: Document, id: string) => doc.querySelector(`[data-template="${id}"]`)!;
const withLayout = (id: string, settings: Record<string, string>, arabic = false) => {
  const site = fixtureFor(id);
  site.settings = { ...site.settings, ...settings };
  if (arabic) site.business = { ...site.business, locale: "ar" };
  return site;
};

describe.each(ids)("page layout in template %s", (id) => {
  it("looks exactly as before with the defaults, saved or not", () => {
    const saved = fixtureFor(id);
    const old = fixtureFor(id);
    for (const key of PAGE_LAYOUT_KEYS) delete old.settings[key];
    expect(html(saved)).toBe(html(old));
    const doc = parse(html(saved));
    for (const attr of PAGE_LAYOUT_ATTRIBUTES) expect(root(doc, id).hasAttribute(attr), attr).toBe(false);
    expect(doc.querySelector(".kit-hd, .kit-hv")).toBeNull();
  });

  it("has the Page layout group right after Page style, every option on Template default, with pictures", () => {
    const schema = schemaOf(id);
    const fields = schema.filter((f) => f.group === "Page layout");
    const keys = fields.map((f) => f.key);
    const expected = [...PAGE_LAYOUT_KEYS];
    if (OWN_HERO_LAYOUT.has(id)) expected.splice(expected.indexOf("hero.variant") + 1, 0, "hero.layout");
    expect(keys).toEqual(expected);
    const first = schema.findIndex((f) => f.group === "Page layout");
    expect(schema[first - 1].group).toBe("Page style");
    for (const field of fields) {
      expect(field.groupAr, field.key).toBe(layoutSettings.groupAr);
      if (field.key === "hero.layout") {
        expect(field.label).toBe(layoutSettings.ownHeroLayout.label);
        continue;
      }
      expect(defaultsOf(id)[field.key], field.key).toBe("auto");
      expect(Object.keys(field.previews ?? {}), field.key).toEqual(field.options);
    }
  });

  it.each(HEADER_LAYOUTS.filter((l) => l !== "auto"))("renders the %s header with the template's links, its own opening kept", (layout) => {
    for (const arabic of [false, true]) {
      const doc = parse(html(withLayout(id, { "header.layout": layout }, arabic)));
      const header = doc.querySelectorAll('[data-section="header"]');
      expect(header.length, "one header").toBe(1);
      expect(header[0].matches(`.kit-hd[data-hd="${layout}"]`)).toBe(true);
      expect(header[0].querySelector(".kit-hd-brand .kit-name")?.textContent).toBe(doc.querySelector(".kit-hd .kit-name")?.textContent);
      expect(header[0].querySelectorAll("#site-drawer a").length, "the menu panel lists the links").toBeGreaterThan(0);
      expect(doc.querySelector(".kit-hv"), "the opening stays the template's own").toBeNull();
      expect(doc.querySelectorAll("h1").length, "one main heading").toBe(1);
      expect(root(doc, id).getAttribute("data-ly-head")).toBe(layout);
    }
  });

  it.each(HERO_VARIANTS.filter((v) => v !== "auto"))("renders the %s opening in place of its own, in English and Arabic", (variant) => {
    for (const arabic of [false, true]) {
      const doc = parse(html(withLayout(id, { "hero.variant": variant }, arabic)));
      const hero = doc.querySelectorAll('[data-section="hero"]');
      expect(hero.length, "one opening").toBe(1);
      expect(hero[0].matches(`.kit-hv[data-hv="${variant}"]`)).toBe(true);
      expect(doc.querySelectorAll("h1").length, "one main heading").toBe(1);
      expect(hero[0].querySelector("h1#kit-hv-title")?.textContent?.trim()).not.toBe("");
      expect(hero[0].querySelectorAll("a[data-k~='btn']").length, "buttons").toBeGreaterThan(0);
      expect(doc.querySelectorAll('[data-section="header"]').length, "one header").toBe(1);
      if (MASTHEAD.has(id)) expect(doc.querySelector('.kit-hd[data-section="header"]'), "the masthead gives way to a shared header").not.toBeNull();
      if (variant === "menu") expect(hero[0].querySelectorAll("[data-item-id]").length).toBeGreaterThan(0);
    }
  });

  it("falls back gracefully without any photo", () => {
    const site = withLayout(id, { "hero.variant": "split" });
    site.settings = { ...site.settings, "hero.image": "", "hero.images": [], "hero.slides": [] };
    site.categories = site.categories.map((c) => ({ ...c, products: c.products.map((p) => ({ ...p, imageUrl: null })) }));
    for (const variant of HERO_VARIANTS.filter((v) => v !== "auto")) {
      site.settings["hero.variant"] = variant;
      const doc = parse(html(site));
      const hero = doc.querySelector(".kit-hv")!;
      expect(hero.querySelector("img"), variant).toBeNull();
      expect(hero.hasAttribute("data-photo"), variant).toBe(false);
    }
  });

  it("puts a shared header over the template's own masthead and keeps the masthead as the opening", () => {
    if (!MASTHEAD.has(id)) return;
    const doc = parse(html(withLayout(id, { "header.layout": "classic" })));
    expect(doc.querySelectorAll('[data-section="header"]').length).toBe(1);
    expect(doc.querySelector('[data-k~="masthead"]')?.getAttribute("data-section")).toBe("hero");
  });

  it("shows the shared opening only on the home page of a multi-page site", () => {
    if (!MULTI_PAGE.has(id)) return;
    const site = withLayout(id, { "header.layout": "split", "hero.variant": "poster" });
    const inner = parse(html(site, ["menu"]));
    expect(inner.querySelector(".kit-hv")).toBeNull();
    expect(inner.querySelector('.kit-hd [aria-current="page"]')?.getAttribute("href")).toBe("/x/menu");
  });
});

describe("page layout fields", () => {
  it("lets a template leave out fields and options", () => {
    const fields = layoutSettings.fields.map((f) => f.key);
    expect(fields).toEqual(PAGE_LAYOUT_KEYS);
    for (const f of layoutSettings.fields) {
      expect(f.options[0]).toBe("auto");
      expect(Object.keys(f.optionLabelsAr)).toEqual(f.options);
    }
  });
});

describe("Atlas's department search with a shared header", () => {
  it.each(HEADER_LAYOUTS.filter((l) => l !== "auto"))("keeps a search button in the %s header, on every page", (layout) => {
    for (const page of [[], ["menu"], ["visit"]]) {
      for (const arabic of [false, true]) {
        const doc = parse(html(withLayout("atlas", { "header.layout": layout }, arabic), page));
        const label = `${layout} /${page.join("/")}${arabic ? " (ar)" : ""}`;
        const toggle = doc.querySelector(".kit-hd .kit-hd-tools .finder-toggle");
        expect(toggle, label).not.toBeNull();
        expect(toggle!.getAttribute("aria-label"), label).toBeTruthy();
        expect(toggle!.getAttribute("aria-expanded"), label).toBe("false");
        const pop = doc.getElementById(toggle!.getAttribute("aria-controls")!);
        expect(pop?.querySelector('input[type="search"]'), `${label}: the field it opens`).not.toBeNull();
        expect(pop?.querySelectorAll(".finder-depts a").length, `${label}: the departments`).toBeGreaterThan(0);
        expect(doc.querySelectorAll(".finder").length, `${label}: one search`).toBe(1);
      }
    }
  });

  it("keeps its own search field with its own header", () => {
    const doc = parse(html(fixtureFor("atlas")));
    expect(doc.querySelector(".a-head .finder input[type=search]")).not.toBeNull();
    expect(doc.querySelector(".finder-toggle, .finder-pop")).toBeNull();
  });
});
