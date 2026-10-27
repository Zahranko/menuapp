import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { MENU_LAYOUT_ATTRIBUTES, MENU_LAYOUT_KEYS, MENU_LAYOUTS, menuOptions, resolveMenu } from "./_kit/menu";
import menuSettings from "./_kit/menu-settings.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared "Menu layout" options (_kit/menu.ts, Menu.tsx, menu.css) on every template. */

const ids = Object.keys(templates);
type Field = { key: string; type: string; label: string; group?: string; groupAr?: string; options?: string[]; previews?: Record<string, string> };
const schemaOf = (id: string) => registry.templates.find((t) => t.id === id)!.schema as Field[];
const defaultsOf = (id: string) => registry.templates.find((t) => t.id === id)!.defaults as Record<string, unknown>;
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
/** Templates whose own menu choices move into the Menu layout group (manifest "menu.own"). */
const OWN_MENU: Record<string, string> = { atlas: "density", ember: "cards", linen: "columns", lumen: "cards", maison: "carte.style", zen: "photos" };
/** Templates whose own filter buttons and price sort (CatalogControls) keep working over the shared menu. */
const CATALOG = new Set(["pocket", "drop"]);

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const withMenu = (id: string, settings: Record<string, string>, arabic = false) => {
  const site = fixtureFor(id);
  site.settings = { ...site.settings, ...settings };
  if (arabic) site.business = { ...site.business, locale: "ar" };
  return site;
};
/** The page that shows the whole menu: the home page, or the menu page of a multi-page site. */
const menuPage = (id: string) => (MULTI_PAGE.has(id) ? ["menu"] : []);
const productCount = (site: PublicSite) => site.categories.reduce((n, c) => n + c.products.length, 0);

describe.each(ids)("menu layout in template %s", (id) => {
  it("looks exactly as before with the defaults, saved or not", () => {
    for (const page of [[], menuPage(id)]) {
      const saved = fixtureFor(id);
      const old = fixtureFor(id);
      for (const key of MENU_LAYOUT_KEYS) delete old.settings[key];
      expect(html(saved, page)).toBe(html(old, page));
      expect(parse(html(saved, page)).querySelector(".kit-mn"), "no shared menu").toBeNull();
    }
  });

  it("has the Menu layout group right after Page layout, every option on Template default, with pictures", () => {
    const schema = schemaOf(id);
    const fields = schema.filter((f) => f.group === "Menu layout");
    const expected = [...MENU_LAYOUT_KEYS];
    if (OWN_MENU[id]) expected.splice(1, 0, OWN_MENU[id]);
    expect(fields.map((f) => f.key)).toEqual(expected);
    const first = schema.findIndex((f) => f.group === "Menu layout");
    expect(schema[first - 1].group).toBe("Page layout");
    for (const field of fields) {
      expect(field.groupAr, field.key).toBe(menuSettings.groupAr);
      if (field.key === OWN_MENU[id]) continue;
      expect(defaultsOf(id)[field.key], field.key).toBe("auto");
      expect(Object.keys(field.previews ?? {}), field.key).toEqual(field.options);
    }
  });

  it.each(MENU_LAYOUTS.filter((l) => l !== "auto"))("shows every product in the %s layout, in English and Arabic", (layout) => {
    for (const arabic of [false, true]) {
      const site = withMenu(id, { "menu.layout": layout, "menu.categoryNav": "tabs", "menu.categoryTitle": "number" }, arabic);
      const doc = parse(html(site, menuPage(id)));
      const menu = doc.querySelectorAll(".kit-mn");
      expect(menu.length, "one shared menu").toBe(1);
      expect(menu[0].getAttribute("data-mn")).toBe(layout);
      const items = menu[0].querySelectorAll("button.kit-mn-item[data-item-id]");
      expect(items.length, "every product").toBe(productCount(site));
      for (const item of items) expect(item.classList.contains("kit-card"), "a card for the card options").toBe(true);
      expect(menu[0].querySelectorAll(".kit-mn-price").length).toBe(items.length);
      expect(doc.querySelectorAll("h1").length, "one main heading").toBe(1);
      const ids = [...doc.querySelectorAll("[id]")].map((e) => e.id);
      expect(new Set(ids).size, "ids are unique").toBe(ids.length);
      if (!CATALOG.has(id)) expect(menu[0].querySelectorAll(".kit-mn-nav .kit-mn-link").length, "category links").toBeGreaterThan(1);
      // Category titles follow the page's headings: h3 under the menu's own h2, h2 on a menu page.
      for (const h of menu[0].querySelectorAll(".kit-mn-h")) expect(["H2", "H3"]).toContain(h.tagName);
    }
  });

  it("uses the layout closest to its own menu when only another menu option changes", () => {
    const doc = parse(html(withMenu(id, { "menu.price": "badge" }), menuPage(id)));
    const menu = doc.querySelector(".kit-mn")!;
    expect(MENU_LAYOUTS).toContain(menu.getAttribute("data-mn"));
    expect(menu.getAttribute("data-mn-price")).toBe("badge");
  });

  it("works without photos, descriptions or categories links, and with sold-out products", () => {
    const site = withMenu(id, { "menu.layout": "tiles", "menu.photos": "none", "menu.price": "corner", "menu.categoryNav": "none" });
    site.categories = site.categories.map((c) => ({ ...c, products: c.products.map((p, i) => ({ ...p, imageUrl: null, description: null, isAvailable: i % 2 === 0 })) }));
    const doc = parse(html(site, menuPage(id)));
    const menu = doc.querySelector(".kit-mn")!;
    expect(menu.querySelector("img"), "no photos").toBeNull();
    expect(menu.querySelector(".kit-mn-nav")).toBeNull();
    // A price on the photo's corner without photos is a pill.
    expect(menu.getAttribute("data-mn-price")).toBe("badge");
    expect(menu.querySelectorAll("[data-out] .kit-mn-tag.is-out").length).toBeGreaterThan(0);
  });

  it("keeps the template's search and filters working", () => {
    const doc = parse(html(withMenu(id, { "menu.layout": "list" }), menuPage(id)));
    const items = doc.querySelectorAll(".kit-mn-li[data-q]");
    expect(items.length).toBeGreaterThan(0);
    if (CATALOG.has(id)) for (const li of items) expect(li.hasAttribute("data-product") && li.hasAttribute("data-price") && li.hasAttribute("data-cat")).toBe(true);
  });

  it("puts the shared menu on the menu and category pages of a multi-page site", () => {
    if (!MULTI_PAGE.has(id)) return;
    const site = withMenu(id, { "menu.layout": "magazine", "menu.categoryTitle": "banner" });
    const menu = parse(html(site, ["menu"])).querySelector(".kit-mn")!;
    expect(menu.classList.contains("kit-mn-page")).toBe(true);
    expect(menu.querySelector(".kit-mn-more")?.getAttribute("href")).toMatch(/^\/x\/c\//);
    const category = menu.querySelector(".kit-mn-more")!.getAttribute("href")!.slice(3).split("/");
    expect(parse(html(site, category)).querySelector(".kit-mn button[data-item-id]")).not.toBeNull();
  });
});

describe("menu layout fields", () => {
  it("lists every option with Arabic labels, auto first", () => {
    expect(menuSettings.fields.map((f) => f.key)).toEqual(MENU_LAYOUT_KEYS);
    for (const f of menuSettings.fields) {
      expect(f.options[0]).toBe("auto");
      expect(Object.keys(f.optionLabels)).toEqual(f.options);
      expect(Object.keys(f.optionLabelsAr)).toEqual(f.options);
    }
    expect(MENU_LAYOUT_ATTRIBUTES).toContain("data-mn");
  });

  it("works out what auto means for each layout", () => {
    const auto = menuOptions({});
    expect(resolveMenu(auto, "compact")).toMatchObject({ layout: "compact", photos: "none", price: "inline", nav: "chips", title: "simple" });
    expect(resolveMenu(auto, "tiles")).toMatchObject({ photos: "top", price: "badge", columns: "four" });
    expect(resolveMenu({ ...auto, layout: "magazine", photos: "top" }, "grid").photos).toBe("side");
    expect(resolveMenu({ ...auto, nav: "tabs" }, "grid", { categories: 1 }).nav).toBe("none");
    expect(resolveMenu(auto, "grid", { catalog: true }).nav).toBe("none");
    expect(resolveMenu(menuOptions({ "menu.layout": "nope", "menu.columns": 3 }), "list")).toMatchObject({ layout: "list", columns: "two" });
  });
});
