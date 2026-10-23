import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applySiteOptions, fixtureFor, LONG_NAMES } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { contrast, isDark } from "./_kit/color";
import siteOptions from "./_kit/site-options.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The owner's shared site options on every template: footer name size, social accounts, order button, font and colors. */

const ids = Object.keys(templates);
const SHARED_KEYS = [...siteOptions.fontsAndColors.fields, ...siteOptions.fontsAndColors.afterTheme, ...siteOptions.fields].map((f) => f.key);
const BACKGROUNDS = siteOptions.fontsAndColors.afterTheme[0].options.filter((o) => o.startsWith("#"));

function html(site: PublicSite): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={[]} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const render = (site: PublicSite) => parse(html(site));

function siteWith(id: string, options: string, locale: "en" | "ar" = "en"): PublicSite {
  const site = fixtureFor(id);
  if (locale === "ar") site.business = { ...site.business, locale: "ar" };
  applySiteOptions(site, options);
  return site;
}

const root = (doc: Document, id: string) => doc.querySelector(`[data-template="${id}"]`)!;
const footer = (doc: Document) => doc.querySelector('[data-section="footer"]')!;
/** The floating order button: the template's own or the shared one. */
const fab = (doc: Document) => doc.querySelector(".kit-order");
/** What the button says: its text, or its accessible name (Lumen's sticker sets its text around a ring in capitals). */
const words = (el: Element) => `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`;

describe.each(ids)("site options in template %s", (id) => {
  it("looks exactly as before with the defaults, saved or not", () => {
    const saved = fixtureFor(id);
    const old = fixtureFor(id);
    for (const key of SHARED_KEYS) delete old.settings[key];
    expect(html(saved)).toBe(html(old));
    const el = root(render(saved), id);
    for (const attr of ["data-foot-name", "data-order-shape", "data-order-fab", "data-font", "data-page-bg"]) expect(el.hasAttribute(attr), attr).toBe(false);
  });

  it.each(["en", "ar"] as const)("keeps a long business name in the footer (%s)", (locale) => {
    for (const option of ["longname", "longword"]) {
      const doc = render(siteWith(id, option, locale));
      const name = locale === "ar" ? LONG_NAMES.ar : LONG_NAMES.en;
      expect(footer(doc).textContent).toContain(option === "longname" ? name.name : name.word);
    }
  });

  it.each(["medium", "small"])("sets the footer name size %s", (size) => {
    const doc = render(siteWith(id, `foot:${size}`));
    expect(root(doc, id).getAttribute("data-foot-name")).toBe(size);
    // The name is in the footer as a large mark (.kit-foot-name) or in the credits line (.kit-credits-text).
    expect(footer(doc).querySelector(".kit-foot-name, .kit-credits-text")).not.toBeNull();
  });

  it("shows every chosen social account with its link and icon", () => {
    const site = siteWith(id, "social");
    const doc = render(site);
    const links = [...footer(doc).querySelectorAll<HTMLAnchorElement>("a.kit-social-link")];
    const by = Object.fromEntries(links.map((a) => [a.dataset.network, a.getAttribute("href")]));
    expect(by).toEqual({
      instagram: "https://instagram.com/" + site.business.instagram,
      whatsapp: "https://wa.me/15555550123",
      facebook: "https://www.facebook.com/" + site.business.facebook,
      tiktok: "https://www.tiktok.com/@" + site.business.tikTok,
      snapchat: "https://www.snapchat.com/add/" + site.business.snapchat,
      phone: "tel:+15555550100",
    });
    for (const a of links) {
      expect(a.getAttribute("aria-label"), a.dataset.network).toBeTruthy();
      expect(a.querySelector("svg"), a.dataset.network).not.toBeNull();
    }
  });

  it("shows no social icons the owner turned off", () => {
    const site = fixtureFor(id);
    site.settings = { ...site.settings, "social.show": [] };
    expect(footer(render(site)).querySelectorAll("a.kit-social-link").length).toBe(0);
  });

  it.each([
    ["whatsapp", "https://wa.me/15555550123"],
    ["call", "tel:+15555550100"],
    ["instagram", "https://instagram.com/"],
    ["facebook", "https://www.facebook.com/"],
  ])("points the order button at %s", (action, href) => {
    const doc = render(siteWith(id, `order:${action}`));
    const button = fab(doc);
    expect(button, "order button").not.toBeNull();
    expect(button!.getAttribute("href")).toContain(href);
    expect(button!.getAttribute("data-order-action")).toBe(action);
    expect(button!.querySelector("svg"), "icon").not.toBeNull();
    expect(words(button!).trim().length).toBeGreaterThan(0);
    if (action === "call") expect(button!.hasAttribute("target")).toBe(false);
  });

  it.each(["pill", "rounded", "circle"])("gives the order button the %s shape", (shape) => {
    const doc = render(siteWith(id, `order:whatsapp-shape:${shape}`));
    expect(root(doc, id).getAttribute("data-order-shape")).toBe(shape);
    expect(fab(doc)).not.toBeNull();
  });

  it("hides the order button, and uses the owner's own text", () => {
    expect(fab(render(siteWith(id, "order:hide")))).toBeNull();
    const site = siteWith(id, "order:call");
    site.settings["order.label"] = "Ring the bakery";
    expect(words(fab(render(site))!)).toContain("Ring the bakery");
  });

  it("falls back to WhatsApp when the chosen account is missing, and hides without WhatsApp", () => {
    const site = siteWith(id, "order:facebook");
    site.business = { ...site.business, facebook: null };
    expect(fab(render(site))!.getAttribute("data-order-action")).toBe("whatsapp");
    const none = siteWith(id, "order:instagram-nowa");
    none.business = { ...none.business, instagram: null };
    expect(fab(render(none))).toBeNull();
  });

  it("says the order button's words in Arabic", () => {
    const doc = render(siteWith(id, "order:call", "ar"));
    expect(words(fab(doc)!)).toContain("اتصل بنا");
  });

  it("uses the owner's font", () => {
    const doc = render(siteWith(id, "font:cairo"));
    const el = root(doc, id);
    expect(el.getAttribute("data-font")).toBe("cairo");
    expect(el.getAttribute("style")).toContain("var(--f-cairo)");
  });

  it("keeps button text readable on a custom accent color", () => {
    for (const color of ["FFE600", "0B3D2E", "FF66CC"]) {
      const el = root(render(siteWith(id, `accent:${color}`)), id);
      const style = el.getAttribute("style")!;
      const fill = style.match(/--s?acc:\s*(#[0-9A-F]{6})/i)?.[1];
      const ink = style.match(/--(?:acc-ink|saccink):\s*(#[0-9A-F]{6})/i)?.[1];
      expect(fill && ink, style).toBeTruthy();
      expect(contrast(fill!, ink!), color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("puts every background color on the page and keeps text, muted text and accent readable on it", () => {
    // Every preset, plus custom colors: middle tones (which move lighter or darker) and strong ones, with odd accents.
    for (const bg of [...BACKGROUNDS, "#C8102E", "#9A9A9A", "#7CC4A4", "#3B2A5C"]) {
      for (const accent of ["", "FFE600", "1E3A8A"]) {
        const site = siteWith(id, accent ? `bg:${bg.slice(1)}-accent:${accent}` : `bg:${bg.slice(1)}`);
        const el = root(render(site), id);
        const style = el.getAttribute("style")!;
        const v = (...names: string[]) => names.map((n) => style.match(new RegExp(`(?:^|;)\\s*--${n}:\\s*(#[0-9A-F]{6})`, "i"))?.[1]).find(Boolean)!;
        const [page, ink, muted, accentText, fill, onFill] = [v("bg", "sbg"), v("ink", "sink"), v("muted", "smuted"), v("acc-text", "sacctext"), v("acc", "sacc"), v("acc-ink", "saccink")];
        const label = `${bg} ${accent}`;
        expect(page && ink && muted && accentText && fill && onFill, `${label}: ${style}`).toBeTruthy();
        if (/^#(FFFFFF|FBF7EE|1E2B22|14213D|0E0E0E|E4EFF8)$/.test(bg)) expect(page.toUpperCase(), label).toBe(bg);
        expect(el.getAttribute("data-page-bg"), label).toBe(isDark(page) ? "dark" : "light");
        expect(contrast(ink, page), `${label} text`).toBeGreaterThanOrEqual(7);
        expect(contrast(muted, page), `${label} muted text`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(accentText, page), `${label} accent text`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fill, onFill), `${label} button text`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("shared site options in the registry", () => {
  type Field = { key: string; type: string; group?: string; groupAr?: string; options?: string[]; custom?: boolean; labelAr?: string };
  const all = registry.templates as unknown as { id: string; schema: Field[]; defaults: Record<string, unknown> }[];

  it("gives every template the fields, grouped, with Arabic labels and defaults", () => {
    for (const t of all) {
      for (const key of SHARED_KEYS) {
        const field = t.schema.find((f) => f.key === key);
        expect(field, `${t.id} ${key}`).toBeDefined();
        expect(field!.labelAr, `${t.id} ${key}`).toBeTruthy();
        expect(field!.groupAr, `${t.id} ${key}`).toBeTruthy();
        expect(key in t.defaults, `${t.id} ${key}`).toBe(true);
      }
      for (const key of ["font", "font.family", "theme", "colors.background", "accent"]) expect(t.schema.find((f) => f.key === key)!.group, `${t.id} ${key}`).toBe("Fonts & colors");
      expect(t.defaults["order.action"]).toBe("auto");
      expect(t.defaults["font.family"]).toBe("default");
    }
  });

  it("offers more accent colors and a custom one on every template", () => {
    for (const t of all) {
      const accent = t.schema.find((f) => f.key === "accent")!;
      expect(accent.custom, t.id).toBe(true);
      expect(accent.options!.length, t.id).toBeGreaterThanOrEqual(24);
      expect(new Set(accent.options!.map((o) => o.toUpperCase())).size, t.id).toBe(accent.options!.length);
    }
  });

  it("offers background colors, light and dark, named in English and Arabic, right after the theme", () => {
    type ColorField = Field & { optionLabels: Record<string, string>; optionLabelsAr: Record<string, string> };
    for (const t of all) {
      const at = t.schema.findIndex((f) => f.key === "colors.background");
      const field = t.schema[at] as ColorField;
      expect(t.schema[at - 1].key, t.id).toBe("theme");
      expect(field.type, t.id).toBe("color");
      expect(field.custom, t.id).toBe(true);
      expect(field.options![0], t.id).toBe("default");
      expect(field.options!.length, t.id).toBeGreaterThanOrEqual(11);
      for (const option of field.options!) expect(field.optionLabels[option] && field.optionLabelsAr[option], `${t.id} ${option}`).toBeTruthy();
      expect(t.defaults["colors.background"], t.id).toBe("default");
    }
    expect(BACKGROUNDS.some(isDark) && BACKGROUNDS.some((b) => !isDark(b))).toBe(true);
  });

  it("is imported by every template stylesheet", () => {
    for (const id of ids) expect(readFileSync(path.join(__dirname, id, "styles.css"), "utf8"), id).toContain('@import "../_kit/options.css";');
  });
});
