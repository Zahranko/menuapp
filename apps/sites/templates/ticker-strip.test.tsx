import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { contrast } from "./_kit/color";
import { TICKER_ATTRIBUTES, TICKER_KEYS } from "./_kit/ticker";
import tickerSettings from "./_kit/ticker-settings.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared moving strip options (_kit/ticker.ts, ticker.css) on every template: only those with a strip offer them. */

const ids = Object.keys(templates);
type Field = { key: string; type: string; group?: string; groupAr?: string; options?: string[]; previews?: Record<string, string> };
type Look = { id: string; values: Record<string, unknown> };
const entry = (id: string) => registry.templates.find((t) => t.id === id)!;
const schemaOf = (id: string) => entry(id).schema as Field[];
/** The templates whose manifest says they have a moving strip ("ticker": true). */
const WITH_STRIP = ids.filter((id) => JSON.parse(readFileSync(path.join(__dirname, id, "manifest.json"), "utf8")).ticker === true);
const CHANGED = { "ticker.style": "torn", "ticker.separator": "star", "ticker.speed": "still", "ticker.edge": "zigzag" };

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const root = (doc: Document, id: string) => doc.querySelector(`[data-template="${id}"]`) as HTMLElement;
const withOptions = (id: string, settings: Record<string, unknown>, arabic = false) => {
  const site = fixtureFor(id, {}, undefined, arabic);
  site.settings = { ...site.settings, ...settings };
  if (arabic) site.business = { ...site.business, locale: "ar" };
  return site;
};

it("the templates with a moving strip are the ones with one", () => {
  expect(WITH_STRIP.sort()).toEqual(["agency", "drop", "ember", "lumen"]);
});

describe.each(ids)("moving strip in template %s", (id) => {
  it("looks exactly as before with every option on auto, saved or not", () => {
    for (const arabic of [false, true]) {
      const saved = withOptions(id, tickerSettings.defaults, arabic);
      const old = withOptions(id, {}, arabic);
      for (const key of TICKER_KEYS) delete old.settings[key];
      const markup = html(saved);
      expect(markup).toBe(html(old));
      const doc = parse(markup);
      for (const attr of TICKER_ATTRIBUTES) expect(root(doc, id).hasAttribute(attr), attr).toBe(false);
      expect(doc.querySelectorAll('[data-k~="ticker"], [data-k*="ticker-"]').length).toBe(0);
      expect(root(doc, id).getAttribute("style") ?? "").not.toContain("--tk-");
    }
  });

  if (!WITH_STRIP.includes(id)) {
    it("offers no strip options", () => {
      expect(schemaOf(id).filter((f) => f.key.startsWith("ticker.") || f.group === "Moving strip")).toEqual([]);
    });
    return;
  }

  it("has the Moving strip group right after Sections, every option on Template default, with pictures", () => {
    const schema = schemaOf(id);
    const fields = schema.filter((f) => f.group === "Moving strip");
    expect(fields.map((f) => f.key)).toEqual(TICKER_KEYS);
    const first = schema.findIndex((f) => f.group === "Moving strip");
    expect(schema[first - 1].group).toBe("Sections");
    expect(schema.slice(first, first + fields.length).every((f) => f.group === "Moving strip")).toBe(true);
    const defaults = entry(id).defaults as Record<string, unknown>;
    for (const field of fields) {
      expect(field.groupAr, field.key).toBe(tickerSettings.groupAr);
      if (field.type === "choice") {
        expect(defaults[field.key], field.key).toBe("auto");
        expect(Object.keys(field.previews ?? {}), field.key).toEqual(field.options);
      }
    }
  });

  it("marks its strip and puts the owner's choices on the root, in English and Arabic", () => {
    for (const arabic of [false, true]) {
      const doc = parse(html(withOptions(id, CHANGED, arabic)));
      const el = root(doc, id);
      expect(el.getAttribute("data-tk-style")).toBe("torn");
      expect(el.getAttribute("data-tk-sep")).toBe("star");
      expect(el.getAttribute("data-tk-speed")).toBe("still");
      expect(el.getAttribute("data-tk-edge")).toBe("zigzag");
      expect(doc.querySelectorAll('[data-k~="ticker"]').length, "strip").toBeGreaterThan(0);
      for (const strip of doc.querySelectorAll('[data-k~="ticker"]')) {
        expect(strip.querySelectorAll('[data-k~="ticker-track"]').length, "track").toBe(1);
        const items = strip.querySelectorAll('[data-k~="ticker-item"]');
        expect(items.length, "items").toBeGreaterThan(1);
        // The repeats that only fill the loop are marked, and at least one run of words is not.
        expect([...items].some((i) => !i.closest('[data-k~="ticker-copy"]')), "words to read").toBe(true);
      }
    }
  });

  it("gives the strip's band a readable text color in every theme, for every color choice", () => {
    const themes = schemaOf(id).find((f) => f.key === "theme")!.options!;
    for (const theme of themes) {
      for (const color of ["accent", "ink", "paper", "#FFC21A", "#141110", "#1F6FEB", "#E5281E"]) {
        const settings = color.startsWith("#") ? { theme, "ticker.color": "custom", "ticker.bg": color } : { theme, "ticker.color": color };
        const style = root(parse(html(withOptions(id, settings))), id).style;
        const [band, ink] = [style.getPropertyValue("--tk-bg"), style.getPropertyValue("--tk-ink")];
        expect(band, `${theme} ${color}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(contrast(ink, band), `${theme} ${color}: ${ink} on ${band}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("gives every look strip values the group offers", () => {
    const schema = schemaOf(id);
    for (const look of (entry(id).looks ?? []) as Look[]) {
      for (const [key, value] of Object.entries(look.values).filter(([k]) => k.startsWith("ticker."))) {
        const field = schema.find((f) => f.key === key)!;
        if (field.type === "choice") expect(field.options, `${look.id} ${key}`).toContain(value);
      }
    }
  });
});
