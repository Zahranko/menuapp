import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applySiteOptions, fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { SECTION_LAYOUT_KEYS, SECTIONS_KEYS, sectionOrder, sortLinks } from "./_kit/sections";
import sectionsSettings from "./_kit/sections-settings.json";
import signatures from "./_kit/signatures.generated.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared "Sections" options (_kit/sections.ts, Sections.tsx, sections.css) on every template. */

const ids = Object.keys(templates);
type Field = { key: string; type: string; group?: string; groupAr?: string; options?: string[]; previews?: Record<string, string> };
const schemaOf = (id: string) => registry.templates.find((t) => t.id === id)!.schema as Field[];
const defaultsOf = (id: string) => registry.templates.find((t) => t.id === id)!.defaults as Record<string, unknown>;
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
/** Section names whose data-section differs (the clothing stores' picks are marked as highlights). */
const DATA_SECTION: Record<string, Record<string, string>> = { folio: { picks: "highlights" }, drop: { picks: "highlights" } };
/** The id each kind of shared section keeps, so links to it keep working. */
const ANCHORS: Record<string, Record<string, string>> = { folio: { gallery: "lookbook" }, drop: { gallery: "street" }, agency: { gallery: "work", visit: "contact" } };

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const withOptions = (id: string, settings: Record<string, unknown>, arabic = false, options = "") => {
  const site = fixtureFor(id, {}, undefined, arabic);
  site.settings = { ...site.settings, ...settings };
  if (arabic) site.business = { ...site.business, locale: "ar" };
  if (options) applySiteOptions(site, options);
  return site;
};
const layoutFields = (id: string) => schemaOf(id).filter((f) => f.group === "Sections" && f.key.endsWith(".layout"));
const orderOf = (id: string) => schemaOf(id).find((f) => f.key === "sections.order")!.options!;
/** The top-level sections on the page, in order (sections inside sections, like social links in the footer, and the floating order button left out). */
const sectionNames = (doc: Document) =>
  [...doc.querySelectorAll("[data-section]")]
    .filter((e) => !e.parentElement?.closest("[data-section]"))
    .map((e) => e.getAttribute("data-section")!)
    .filter((n) => n !== "order");
/** The section a link's anchor names (#work is the gallery, #how the steps). */
const ALIASES: Record<string, string> = { work: "gallery", lookbook: "gallery", street: "gallery", process: "steps", how: "steps", week: "steps", contact: "visit" };
const sortName = (anchor: string) => ALIASES[anchor] ?? anchor;
const checkPage = (doc: Document, label: string) => {
  expect(doc.querySelectorAll("h1").length, `${label}: one main heading`).toBe(1);
  const all = [...doc.querySelectorAll("[id]")].map((e) => e.id);
  expect(new Set(all).size, `${label}: ids are unique`).toBe(all.length);
  for (const el of doc.querySelectorAll(".kit-sc[aria-labelledby], .kit-sc [aria-labelledby]")) {
    for (const ref of el.getAttribute("aria-labelledby")!.split(" ")) expect(doc.getElementById(ref), `${label}: #${ref}`).not.toBeNull();
  }
};

describe.each(ids)("sections in template %s", (id) => {
  it("looks exactly as before with the defaults, saved or not", () => {
    for (const page of MULTI_PAGE.has(id) ? [[], ["visit"]] : [[]]) {
      const saved = fixtureFor(id);
      const old = fixtureFor(id);
      for (const key of SECTIONS_KEYS) delete old.settings[key];
      expect(html(saved, page)).toBe(html(old, page));
      const doc = parse(html(saved, page));
      expect(doc.querySelector(".kit-sc, .kit-sc-ft"), "no shared section").toBeNull();
    }
  });

  it("has the Sections group right after Menu layout: the order, then a layout per kind of section, with pictures", () => {
    const schema = schemaOf(id);
    const first = schema.findIndex((f) => f.group === "Sections");
    expect(schema[first - 1].group).toBe("Menu layout");
    const fields = schema.filter((f) => f.group === "Sections");
    expect(schema.slice(first, first + fields.length).every((f) => f.group === "Sections"), "one group").toBe(true);
    expect(fields[0].key).toBe("sections.order");
    expect(fields[0].type).toBe("order");
    expect(defaultsOf(id)["sections.order"]).toEqual(fields[0].options);
    expect(fields[0].options).toContain("menu");
    for (const field of layoutFields(id)) {
      expect(field.groupAr, field.key).toBe(sectionsSettings.groupAr);
      expect(defaultsOf(id)[field.key], field.key).toBe("auto");
      expect(Object.keys(field.previews ?? {}), field.key).toEqual(field.options);
    }
    expect(layoutFields(id).map((f) => f.key)).toContain("footer.layout");
    expect(layoutFields(id).map((f) => f.key)).toContain("visit.layout");
  });

  it("renders its sections in the template's own order", () => {
    const names = sectionNames(parse(html(fixtureFor(id))));
    const own = orderOf(id).map((n) => DATA_SECTION[id]?.[n] ?? n).filter((n) => names.includes(n));
    expect(own.length, "most sections show in the sample").toBeGreaterThan(1);
    expect(names.filter((n) => own.includes(n))).toEqual(own);
  });

  it("follows the owner's order, with the opening first and the footer last", () => {
    const order = [...orderOf(id)].reverse();
    for (const arabic of [false, true]) {
      const doc = parse(html(withOptions(id, { "sections.order": order }, arabic)));
      const names = sectionNames(doc);
      const expected = order.map((n) => DATA_SECTION[id]?.[n] ?? n).filter((n) => names.includes(n));
      expect(names.filter((n) => expected.includes(n))).toEqual(expected);
      expect(names[names.length - 1]).toBe("footer");
      const hero = names.indexOf("hero");
      if (hero >= 0) for (const n of expected) expect(names.indexOf(n), n).toBeGreaterThan(hero);
      checkPage(doc, `reversed${arabic ? " (ar)" : ""}`);
    }
  });

  it("puts the shared header's links to sections in the owner's order", () => {
    const order = [...orderOf(id)].reverse();
    const doc = parse(html(withOptions(id, { "sections.order": order, "header.layout": "classic" })));
    const hrefs = [...doc.querySelectorAll(".kit-hd-drawer-nav a")].map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("#"));
    const rank = (h: string) => order.indexOf(sortName(h.slice(1)));
    const ranked = hrefs.filter((h) => rank(h) >= 0);
    expect(ranked.map(rank)).toEqual([...ranked.map(rank)].sort((a, b) => a - b));
    for (const h of hrefs) expect(doc.getElementById(h.slice(1)), `${h} goes somewhere`).not.toBeNull();
  });

  for (const field of layoutFields(id)) {
    const kind = field.key.split(".")[0];
    it.each(field.options!.filter((o) => o !== "auto"))(`shows the ${field.key} %s in English and Arabic`, (layout) => {
      for (const arabic of [false, true]) {
        const doc = parse(html(withOptions(id, { [field.key]: layout }, arabic)));
        const label = `${field.key}=${layout}${arabic ? " (ar)" : ""}`;
        const shared = doc.querySelectorAll(kind === "footer" ? ".kit-sc-ft" : `.kit-sc[data-section="${kind}"]`);
        expect(shared.length, `${label}: one shared section`).toBe(1);
        // A template's own (signature) layout draws on a shared one and marks itself with data-sig.
        const base = (signatures as Record<string, Record<string, Record<string, string>>>)[id]?.[field.key]?.[layout];
        expect(shared[0].getAttribute("data-sc")).toBe(base ?? layout);
        if (base) expect(shared[0].getAttribute("data-sig")?.split(" "), `${label}: marks the signature`).toContain(layout);
        expect(doc.querySelectorAll(`[data-section="${kind}"]`).length, `${label}: replaces the template's own`).toBe(1);
        const anchor = ANCHORS[id]?.[kind] ?? kind;
        if (kind !== "footer" && kind !== "highlights") expect(shared[0].id, `${label}: keeps its id`).toBe(anchor);
        if (kind === "footer") expect(shared[0].querySelector(".kit-credits a[href]"), "made with").not.toBeNull();
        checkPage(doc, label);
      }
    });
  }

  it("leaves out what has nothing to show and copes with one of each", () => {
    const all = Object.fromEntries(layoutFields(id).map((f) => [f.key, f.options![1]]));
    const empty = withOptions(id, all);
    for (const n of [1, 2, 3, 4, 5, 6]) {
      empty.settings[`reviews.${n}.quote`] = "";
      empty.settings[`highlights.${n}.title`] = "";
    }
    empty.settings.gallery = [];
    empty.settings["gallery.products"] = false;
    let doc = parse(html(empty));
    expect(doc.querySelector('.kit-sc[data-section="reviews"]'), "no reviews").toBeNull();
    expect(doc.querySelector('.kit-sc[data-section="highlights"]'), "no highlights").toBeNull();
    checkPage(doc, "empty");

    for (const layouts of [1, 2, 3, 4, 5].map((i) => Object.fromEntries(layoutFields(id).map((f) => [f.key, f.options![1 + (i % (f.options!.length - 1))]])))) {
      for (const arabic of [false, true]) {
        doc = parse(html(withOptions(id, layouts, arabic, "sparse")));
        checkPage(doc, `sparse ${JSON.stringify(layouts)}`);
        expect(doc.querySelectorAll(".kit-sc-ft").length).toBe(1);
        const gallery = doc.querySelector('.kit-sc[data-section="gallery"]');
        if (gallery && !MULTI_PAGE.has(id)) expect(gallery.querySelectorAll(".kit-sc-gal-pic").length).toBe(1);
        const reviews = doc.querySelector('.kit-sc[data-section="reviews"]');
        if (reviews) expect(reviews.querySelectorAll("blockquote").length).toBe(1);
      }
    }
  });

  it("puts the shared story, reviews and visit sections on a multi-page site's visit page too", () => {
    if (!MULTI_PAGE.has(id)) return;
    const doc = parse(html(withOptions(id, { "story.layout": "letter", "visit.layout": "cards", "reviews.layout": "wall", "footer.layout": "columns" }), ["visit"]));
    expect(doc.querySelector('.kit-sc[data-section="story"]')).not.toBeNull();
    expect(doc.querySelector('.kit-sc[data-section="visit"]')).not.toBeNull();
    expect(doc.querySelector(".kit-sc-ft")).not.toBeNull();
    checkPage(doc, "visit page");
  });
});

describe("section options", () => {
  it("lists every layout with Arabic labels and pictures, auto first", () => {
    for (const f of sectionsSettings.fields) {
      expect(f.options[0]).toBe("auto");
      expect(Object.keys(f.optionLabels)).toEqual(f.options);
      expect(Object.keys(f.optionLabelsAr)).toEqual(f.options);
      expect(Object.keys(f.previews)).toEqual(f.options);
      expect(SECTION_LAYOUT_KEYS[f.section as keyof typeof SECTION_LAYOUT_KEYS]).toBe(f.key);
    }
    expect(Object.keys(sectionsSettings.order.labelsAr)).toEqual(Object.keys(sectionsSettings.order.labels));
  });

  it("works out the owner's order, whatever was saved", () => {
    const own = ["highlights", "menu", "story", "gallery", "visit"];
    expect(sectionOrder({}, own)).toEqual(own);
    expect(sectionOrder({ "sections.order": ["visit", "menu"] }, own)).toEqual(["highlights", "visit", "menu", "story", "gallery"]);
    expect(sectionOrder({ "sections.order": ["story", "nope", "story", 3, "menu"] }, own)).toEqual(["highlights", "story", "gallery", "visit", "menu"]);
    expect(sectionOrder({ "sections.order": "menu" }, own)).toEqual(own);
    expect(sectionOrder({ "sections.order": [...own].reverse() }, own)).toEqual([...own].reverse());
  });

  it("puts the links to sections in the owner's order", () => {
    const links = [{ href: "#menu" }, { href: "/x/menu" }, { href: "#story" }, { href: "#work" }, { href: "#visit" }];
    expect(sortLinks({ "sections.order": ["visit", "gallery", "story", "menu"] }, links).map((l) => l.href)).toEqual(["#visit", "/x/menu", "#work", "#story", "#menu"]);
    expect(sortLinks({}, links)).toEqual(links);
  });
});
