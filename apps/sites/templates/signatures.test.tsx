import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it } from "vitest";
import { applySiteOptions, fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import signatures from "./_kit/signatures.generated.json";
import registry from "./registry.json";
import { templates } from "./registry";

/**
 * Each template's own ("signature") layout options and its named looks (manifest "signature" and "looks",
 * scripts/build-registry.mjs, _kit/signatures.ts, templates/<id>/signature.css).
 */

const ids = Object.keys(templates);
type Field = { key: string; type: string; options?: string[]; optionLabels?: Record<string, string>; optionLabelsAr?: Record<string, string>; previews?: Record<string, string>; signature?: string[]; custom?: boolean; min?: number; max?: number };
type Look = { id: string; label: { en: string; ar: string }; values: Record<string, unknown> };
type Entry = { id: string; schema: Field[]; defaults: Record<string, unknown>; looks?: Look[] };
const entry = (id: string) => (registry.templates as unknown as Entry[]).find((t) => t.id === id)!;
const sigMap = signatures as Record<string, Record<string, Record<string, string>>>;
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
/** The attribute each shared part names its (base) layout with. */
const BASE_ATTRIBUTE: Record<string, [string, string]> = {
  "header.layout": [".kit-hd", "data-hd"],
  "hero.variant": [".kit-hv", "data-hv"],
  "menu.layout": [".kit-mn", "data-mn"],
  "story.layout": ['.kit-sc[data-section="story"]', "data-sc"],
};
const publicDir = path.join(__dirname, "..", "public");

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const siteWith = (id: string, settings: Record<string, unknown>, arabic = false) => {
  const site = fixtureFor(id, {}, undefined, arabic);
  site.settings = { ...site.settings, ...settings };
  if (arabic) site.business = { ...site.business, locale: "ar" };
  return site;
};
const pageOf = (id: string, key: string) => (key === "menu.layout" && MULTI_PAGE.has(id) ? ["menu"] : []);
/** The page with what a signature adds taken away: its decorations and its data-sig marks. */
const withoutSignature = (markup: string) => {
  const doc = parse(markup);
  for (const art of doc.querySelectorAll(".kit-sig-art")) art.remove();
  for (const marked of doc.querySelectorAll("[data-sig]")) marked.removeAttribute("data-sig");
  return doc.body.innerHTML;
};

describe("signature options and looks, across templates", () => {
  it("every template has 1 to 3 signature options, with ids no other template uses", () => {
    const seen = new Map<string, string>();
    for (const id of ids) {
      const own = entry(id).schema.flatMap((f) => (f.signature ?? []).map((s) => s));
      expect(own.length, id).toBeGreaterThanOrEqual(1);
      expect(own.length, id).toBeLessThanOrEqual(3);
      for (const s of own) {
        expect(seen.get(s), `${s} in ${id}`).toBeUndefined();
        seen.set(s, id);
      }
    }
  });

  it("the generated signature map matches the schemas", () => {
    for (const id of ids) {
      const fromSchema = Object.fromEntries(entry(id).schema.filter((f) => f.signature).map((f) => [f.key, f.signature!]));
      expect(Object.fromEntries(Object.entries(sigMap[id] ?? {}).map(([k, v]) => [k, Object.keys(v)])), id).toEqual(fromSchema);
    }
  });

  it("every template has 4 to 6 looks with English and Arabic names", () => {
    for (const id of ids) {
      const looks = entry(id).looks ?? [];
      expect(looks.length, id).toBeGreaterThanOrEqual(4);
      expect(looks.length, id).toBeLessThanOrEqual(6);
      expect(new Set(looks.map((l) => l.id)).size, `${id}: ids once each`).toBe(looks.length);
      for (const look of looks) {
        expect(look.label.en.trim().length, `${id}/${look.id}`).toBeGreaterThan(0);
        expect(look.label.ar, `${id}/${look.id}`).toMatch(/[؀-ۿ]/);
      }
    }
  });
});

/** A manifest, as far as these checks change it. */
type M = { signature: Record<string, Array<Record<string, unknown>>>; looks: Look[] };

describe("the registry's signature and look rules", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "sig-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const manifest = (): M => JSON.parse(readFileSync(path.join(__dirname, "ticket", "manifest.json"), "utf8"));
  const check = (m: unknown) => {
    const file = path.join(dir, "manifest.json");
    writeFileSync(file, JSON.stringify(m));
    try {
      execFileSync("node", ["scripts/build-registry.mjs", "--manifest", file, "--dry"], { stdio: "pipe" });
      return "";
    } catch (error) {
      return String((error as { stderr?: Buffer }).stderr ?? error);
    }
  };

  it("accepts the real manifest", () => expect(check(manifest())).toBe(""));

  it.each([
    ["a field that takes no signature", (m: M) => (m.signature["font"] = m.signature["hero.variant"]), /cannot add options to "font"/],
    ["a base that is auto", (m: M) => (m.signature["hero.variant"][0].base = "auto"), /needs a "base"/],
    ["an id another template uses", (m: M) => (m.signature["hero.variant"][0].id = "awning"), /also a signature option of souq/],
    ["an id that is a shared option", (m: M) => (m.signature["hero.variant"][0].id = "poster"), /already an option/],
    ["a missing Arabic label", (m: M) => delete m.signature["hero.variant"][0].labelAr, /needs "labelAr"/],
    ["a preview elsewhere", (m: M) => (m.signature["hero.variant"][0].preview = "/kit/previews/hero-type.svg"), /needs a "preview"/],
    ["a preview that is missing", (m: M) => (m.signature["hero.variant"][0].preview = "/templates/ticket/previews/nope.svg"), /does not exist/],
    ["three looks", (m: M) => (m.looks = m.looks.slice(0, 3)), /4 to 6 looks/],
    ["a look with a dash", (m: M) => (m.looks[0].id = "late-night"), /look ids/],
    ["a look that sets text", (m: M) => (m.looks[0].values["hero.title"] = "Hi"), /looks only set/],
    ["a look with an unknown option", (m: M) => (m.looks[0].values["hero.variant"] = "nope"), /does not take/],
    ["a look with an unknown setting", (m: M) => (m.looks[0].values["nope"] = "x"), /does not have/],
    ["a look with a long name", (m: M) => (m.looks[0].label.en = "A very long name for a look"), /up to 24/],
  ])("refuses %s", (_, change, message) => {
    const m = manifest();
    change(m);
    expect(check(m)).toMatch(message);
  });

  it("gives every look the same settings, filling the template's defaults", () => {
    const looks = entry("ticket").looks!;
    const keys = Object.keys(looks[0].values);
    for (const look of looks) expect(Object.keys(look.values)).toEqual(keys);
    const raw = manifest().looks as Look[];
    const missing = keys.find((k) => !(k in raw[0].values));
    if (missing) expect(looks[0].values[missing]).toEqual(entry("ticket").defaults[missing]);
  });
});

describe.each(ids)("signatures in template %s", (id) => {
  const fields = entry(id).schema.filter((f) => f.signature);

  it("lists its signature right after Template default, with labels and pictures drawn without text", () => {
    for (const field of fields) {
      expect(field.options!.slice(1, 1 + field.signature!.length), field.key).toEqual(field.signature);
      for (const s of field.signature!) {
        expect(field.optionLabels?.[s], `${field.key}.${s}`).toBeTruthy();
        expect(field.optionLabelsAr?.[s], `${field.key}.${s}`).toMatch(/[؀-ۿ]/);
        const svg = readFileSync(path.join(publicDir, field.previews![s]), "utf8");
        expect(svg, field.previews![s]).toMatch(/^<svg [^>]*viewBox="0 0 80 80"/);
        expect(svg).not.toContain("<text");
      }
    }
  });

  it("leaves the page untouched on Template default", () => {
    const doc = parse(html(fixtureFor(id)));
    expect(doc.querySelector("[data-sig], .kit-sig-art")).toBeNull();
  });

  for (const field of fields) {
    it.each(field.signature!)(`draws ${field.key} %s on its base layout, in English and Arabic`, (option) => {
      const base = sigMap[id][field.key][option];
      const [selector, attribute] = BASE_ATTRIBUTE[field.key];
      for (const arabic of [false, true]) {
        const label = `${field.key}=${option}${arabic ? " (ar)" : ""}`;
        const markup = html(siteWith(id, { [field.key]: option }, arabic), pageOf(id, field.key));
        const doc = parse(markup);
        const part = doc.querySelectorAll(selector);
        expect(part.length, `${label}: one ${selector}`).toBe(1);
        expect(part[0].getAttribute(attribute), label).toBe(base);
        expect(part[0].getAttribute("data-sig"), label).toBe(option);
        expect(doc.querySelector(`[data-template="${id}"]`)!.getAttribute("data-sig")?.split(" "), `${label}: on the page`).toContain(option);
        for (const art of doc.querySelectorAll(".kit-sig-art")) expect(art.getAttribute("aria-hidden"), label).toBe("true");
        expect(doc.querySelectorAll("h1").length, `${label}: one main heading`).toBe(1);
        // Apart from its marks and decorations, a signature is exactly its base layout: the same words, links and photos.
        expect(withoutSignature(markup), label).toBe(withoutSignature(html(siteWith(id, { [field.key]: base }, arabic), pageOf(id, field.key))));
      }
    });
  }

  it.each((entry(id).looks ?? []).map((l) => l.id))("applies the look %s from a fixture token", (look) => {
    const site = fixtureFor(id);
    applySiteOptions(site, `look_${look}`);
    const values = entry(id).looks!.find((l) => l.id === look)!.values;
    for (const [key, value] of Object.entries(values)) expect(site.settings[key], key).toEqual(value);
    const doc = parse(html(site));
    expect(doc.querySelectorAll("h1").length).toBe(1);
  });
});
