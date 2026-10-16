import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applySiteOptions, FIXTURE_SLIDES, fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import cardSettings from "./_kit/card-settings.json";
import heroSettings from "./_kit/hero-settings.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared card options and the hero slider on every template (see _kit/cards.ts and _kit/hero.ts). */

const ids = Object.keys(templates);
type Field = { key: string; type: string; group?: string; options?: string[]; max?: number };
const schemaOf = (id: string) => registry.templates.find((t) => t.id === id)!.schema as Field[];
const defaultsOf = (id: string) => registry.templates.find((t) => t.id === id)!.defaults as Record<string, unknown>;
const SHARED_KEYS = [...cardSettings.fields.map((f) => f.key), "hero.slides", ...heroSettings.fields.map((f) => f.key)];

/** Multi-page templates show their products on the menu page; the others on their one page. */
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom"]);

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const render = (site: PublicSite, page: string[] = []) => parse(html(site, page));
const root = (doc: Document, id: string) => doc.querySelector(`[data-template="${id}"]`)!;

function siteWith(id: string, options: string, locale: "en" | "ar" = "en"): PublicSite {
  const site = fixtureFor(id);
  if (locale === "ar") site.business = { ...site.business, locale: "ar" };
  applySiteOptions(site, options);
  return site;
}

const kindOf = (id: string) => {
  const keys = new Set(schemaOf(id).map((f) => f.key));
  if (!keys.has("hero.image") && !keys.has("hero.images")) return "band";
  return keys.has("hero.height") || keys.has("hero.textPosition") || id === "souq" || id === "maison" || id === "ember" ? "backdrop" : "panel";
};

describe.each(ids)("cards and hero slider in template %s", (id) => {
  it("looks exactly as before with the defaults, saved or not", () => {
    const saved = fixtureFor(id);
    const old = fixtureFor(id);
    for (const key of SHARED_KEYS) delete old.settings[key];
    expect(html(saved)).toBe(html(old));
    const el = root(render(saved), id);
    for (const attr of ["data-card-style", "data-card-border", "data-card-bc", "data-card-corners", "data-card-photo", "data-card-spacing", "data-hero-height", "data-hero-overlay", "data-hero-text"]) {
      expect(el.hasAttribute(attr), attr).toBe(false);
    }
    expect(render(saved).querySelector(".kit-slider"), "no slider with one photo").toBeNull();
  });

  it("has the Cards group right after Fonts & colors, with every card option", () => {
    const schema = schemaOf(id);
    const cards = schema.filter((f) => f.group === "Cards").map((f) => f.key);
    expect(cards).toEqual(cardSettings.fields.map((f) => f.key));
    const first = schema.findIndex((f) => f.group === "Cards");
    expect(schema[first - 1].group).toBe("Fonts & colors");
    for (const key of cards) expect(defaultsOf(id)[key]).toBe("auto");
  });

  it("has the hero slider options its opening can use", () => {
    const keys = schemaOf(id)
      .filter((f) => f.group === "Hero slider")
      .map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(["hero.transition", "hero.autoplay", "hero.speed", "hero.controls"]));
    const kind = kindOf(id);
    if (kind === "band" || schemaOf(id).some((f) => f.key === "hero.image")) expect(keys[0]).toBe("hero.slides");
    if (kind === "panel") for (const key of ["hero.height", "hero.overlay", "hero.textPosition"]) expect(keys).not.toContain(key);
    if (kind === "band") expect(keys).toContain("hero.height");
    const slides = schemaOf(id).find((f) => f.key === "hero.slides");
    if (slides) expect(slides.type).toBe("images");
    expect(defaultsOf(id)["hero.autoplay"]).toBe(true);
    // Maison keeps its quiet crossfade without buttons (only the pause button shows while it plays).
    expect(defaultsOf(id)["hero.controls"]).toEqual(id === "maison" ? [] : ["dots", "arrows"]);
    expect(defaultsOf(id)["hero.transition"]).toBe(id === "maison" ? "fade" : "slide");
  });

  it("marks its product cards (and category tiles) for the card options", () => {
    const site = siteWith(id, "card_outlined-border_thick-bc_c8102e-corners_large-photo_circle-spacing_airy");
    const page = MULTI_PAGE.has(id) ? ["menu"] : [];
    const doc = render(site, page);
    const el = root(doc, id);
    expect(el.getAttribute("data-card-style")).toBe("outlined");
    expect(el.getAttribute("data-card-border")).toBe("thick");
    expect(el.getAttribute("data-card-bc")).toBe("custom");
    expect(el.getAttribute("data-card-corners")).toBe("large");
    expect(el.getAttribute("data-card-photo")).toBe("circle");
    expect(el.getAttribute("data-card-spacing")).toBe("airy");
    expect((el as HTMLElement).style.getPropertyValue("--kit-bc-own")).toBe("#C8102E");
    const cards = doc.querySelectorAll(".kit-cards .kit-card");
    expect(cards.length, "product cards").toBeGreaterThan(0);
    for (const card of cards) expect(card.matches("[data-item-id], li"), "a card is the product button or its list item").toBe(true);
  });

  it.each(["en", "ar"] as const)("turns several hero photos into a slider (%s)", (locale) => {
    const doc = render(siteWith(id, "slides_4-trans_fade-speed_fast-ctrl_both", locale));
    const slider = doc.querySelector(".kit-slider")!;
    expect(slider, "slider").not.toBeNull();
    expect(slider.getAttribute("role")).toBe("region");
    expect(slider.getAttribute("data-transition")).toBe("fade");
    expect(slider.getAttribute("aria-label")).toBe(locale === "ar" ? "الصور" : "Photos");
    const slides = slider.querySelectorAll(".kit-slide");
    const count = id === "ember" || id === "bloom" ? 3 : 4;
    expect(slides.length).toBe(count);
    // Only the first photo is in the page at first; it is the page's priority image.
    expect(slides[0].querySelector("img")).not.toBeNull();
    expect(slides[0].querySelector("img")!.getAttribute("loading")).not.toBe("lazy");
    for (const slide of [...slides].slice(1)) {
      expect(slide.querySelector("img")).toBeNull();
      expect(slide.getAttribute("aria-hidden")).toBe("true");
    }
    expect(slider.querySelectorAll(".kit-slider-dot").length).toBe(count);
    expect(slider.querySelector(".kit-slider-prev")!.getAttribute("aria-label")).toBe(locale === "ar" ? "الصورة السابقة" : "Previous photo");
    expect(slider.querySelector(".kit-slider-next")).not.toBeNull();
    expect(slider.querySelector(".kit-slider-dot")!.getAttribute("aria-current")).toBe("true");
    // The server render assumes reduced motion, so it never starts moving (and has no pause button yet).
    expect(slider.hasAttribute("data-playing")).toBe(false);
  });

  it("shows only the buttons the owner chose", () => {
    const dots = render(siteWith(id, "slides-ctrl_dots")).querySelector(".kit-slider")!;
    expect(dots.querySelector(".kit-slider-prev")).toBeNull();
    expect(dots.querySelectorAll(".kit-slider-dot").length).toBeGreaterThan(1);
    const none = render(siteWith(id, "slides-ctrl_none-auto_off")).querySelector(".kit-slider")!;
    expect(none.querySelector(".kit-slider-bar")).toBeNull();
  });

  it("keeps the hero as it was with one photo", () => {
    const doc = render(siteWith(id, "slides_2"));
    expect(doc.querySelector(".kit-slider")).not.toBeNull();
    const single = fixtureFor(id);
    if (kindOf(id) === "band") {
      expect(render(single).querySelector(".kit-hero-band"), "no photo strip without photos").toBeNull();
      single.settings["hero.slides"] = [FIXTURE_SLIDES[0]];
      const band = render(single).querySelector(".kit-hero-band")!;
      expect(band.querySelector(".kit-slider")).toBeNull();
      expect(band.querySelector("img")!.getAttribute("loading")).not.toBe("lazy");
    }
  });

  if (kindOf(id) === "backdrop" && schemaOf(id).some((f) => f.key === "hero.height")) {
    it("sets the height, darkening and text position of a photo with text on it", () => {
      const doc = render(siteWith(id, "slides-height_full-overlay_strong-text_center"));
      const el = root(doc, id);
      expect(el.getAttribute("data-hero-height")).toBe("full");
      expect(el.getAttribute("data-hero-text")).toBe("center");
      expect(doc.querySelector(".kit-hero .kit-hero-media .kit-slider")).not.toBeNull();
      expect(doc.querySelector(".kit-hero .kit-hero-text h1")).not.toBeNull();
    });
  }
});

describe("card and hero styles", () => {
  it("are imported by every template's stylesheet", () => {
    for (const id of ids) {
      const css = readFileSync(path.join(__dirname, id, "styles.css"), "utf8");
      expect(css, id).toContain('@import "../_kit/cards.css";');
      expect(css, id).toContain('@import "../_kit/hero.css";');
    }
  });

  it("stop every slider animation for visitors who prefer less motion", () => {
    const css = readFileSync(path.join(__dirname, "_kit", "hero.css"), "utf8");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("transition: none !important");
    expect(reduced).toContain("animation: none !important");
  });

  it("have Arabic labels for every new editor string", () => {
    for (const id of ids) {
      for (const field of registry.templates.find((t) => t.id === id)!.schema as (Field & { labelAr?: string; groupAr?: string; optionLabelsAr?: Record<string, string> })[]) {
        if (!SHARED_KEYS.includes(field.key)) continue;
        expect(field.labelAr, field.key).toBeTruthy();
        expect(field.groupAr, field.key).toBeTruthy();
        if (field.options && field.type !== "color") expect(Object.keys(field.optionLabelsAr ?? {}).sort(), field.key).toEqual([...field.options].sort());
      }
    }
  });
});
