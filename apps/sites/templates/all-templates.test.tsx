import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { arabicDefaultsFor, bigMenu, fixtureFor, fixturePreview } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { allPaths } from "./_premium/pages";
import registry from "./registry.json";
import { multiPage, templates } from "./registry";

/** Checks every template against the cases S16 asks for: all themes, Arabic, 1 to 200 products, long names, no photos. */

/** Every page of the site: the home page, plus the inner pages of Pro templates. */
const render = (site: PublicSite) => {
  const Template = templates[site.templateId];
  const paths = multiPage.has(site.templateId) ? allPaths(site) : [[]];
  return paths.map((path) => renderToStaticMarkup(<Template site={site} preview={false} path={path} base="/x" />)).join("\n");
};
const SiteOf = ({ site, path }: { site: PublicSite; path: string[] }) => {
  const Template = templates[site.templateId];
  return <Template site={site} preview={false} path={path} base="/x" />;
};
const themes = (id: string) => (registry.templates.find((t) => t.id === id)!.schema.find((f) => f.key === "theme") as { options?: string[] } | undefined)?.options ?? [];
const ids = Object.keys(templates);

describe.each(ids)("template %s", (id) => {
  it("renders its sample business with every product, sold-out label and the standard sections", () => {
    const site = fixtureFor(id);
    const html = render(site);
    expect(html).toContain(`data-template="${id}"`);
    expect(html).toContain(site.business.name.replace("&", "&amp;"));
    for (const p of site.categories.flatMap((c) => c.products)) expect(html, p.name).toContain(p.name.replace("'", "&#x27;"));
    expect(html).toMatch(/Sold out|Not available/);
    for (const section of ["header", "menu", "footer"]) expect(html).toContain(`data-section="${section}"`);
    expect(html).toContain('id="menu"');
  });

  it.each(themes(id))("renders in theme %s", (theme) => {
    const site = fixtureFor(id);
    site.settings = { ...site.settings, theme };
    expect(render(site)).toContain(`data-template="${id}"`);
  });

  it("renders in Arabic", () => {
    const site = fixtureFor(id);
    site.business = { ...site.business, locale: "ar" };
    const html = render(site);
    expect(html).toMatch(/نفد|غير متاح حاليًا/);
    expect(html).not.toMatch(/Sold out|Not available/);
  });

  it("shows its Arabic starter text in an Arabic preview", () => {
    const site = fixturePreview(`fixture.${id}.default.ar`)!;
    const title = arabicDefaultsFor(id)["hero.title"] as string;
    expect(title).toMatch(/[\u0600-\u06FF]/);
    const html = render(site);
    expect(html).toContain(title);
    expect(html).not.toContain(fixtureFor(id).settings["hero.title"] as string);
  });

  it("handles one product, and 200 products with long names and no photos", () => {
    const one = fixtureFor(id);
    // The first category with products (in Pro samples the first category is a main category holding sub-categories).
    const first = { ...one.categories.find((c) => c.products.length > 0)!, parentId: null };
    one.categories = [{ ...first, products: first.products.slice(0, 1) }];
    expect(render(one)).toContain(one.categories[0].products[0].name.replace("'", "&#x27;"));

    const many = bigMenu(fixtureFor(id), 200);
    const html = render(many);
    expect(html).toContain("Product 200");
    expect(html).toContain("deliberately long name");
  });

  it("still shows the menu with every optional section off and nothing filled in", () => {
    const site = fixtureFor(id);
    site.settings = Object.fromEntries(
      Object.entries(site.settings).map(([k, v]) => [k, k === "sections" ? [] : typeof v === "string" && !/^(#|preset:)/.test(v) && !["theme", "font", "corners"].includes(k) && !k.endsWith("layout") ? "" : Array.isArray(v) ? [] : v]),
    );
    site.business = { ...site.business, address: null, whatsApp: null, email: null, instagram: null };
    const html = render(site);
    expect(html).toContain('id="menu"');
    expect(html).toContain(site.categories.find((c) => c.products.length > 0)!.products[0].name.replace("'", "&#x27;"));
  });

  it.runIf(multiPage.has(id))("links its pages and nests sub-categories", () => {
    const site = fixtureFor(id);
    const home = renderToStaticMarkup(<SiteOf site={site} path={[]} />);
    expect(home).toContain('href="/x/menu"');
    expect(home).toContain('href="/x/best-sellers"');
    expect(home).toContain('href="/x/gallery"');
    const parent = site.categories.find((c) => site.categories.some((x) => x.parentId === c.id))!;
    const child = site.categories.find((c) => c.parentId === parent.id)!;
    const path = allPaths(site).find((p) => p[0] === "c" && p[1].endsWith(parent.id.replace(/-/g, "").slice(-8)))!;
    const page = renderToStaticMarkup(<SiteOf site={site} path={path} />);
    expect(page).toContain(child.name);
    expect(page).toContain('aria-label="You are here"');
  });

  it("has no empty menu when there are no products", () => {
    const site = fixtureFor(id);
    site.categories = [];
    expect(() => render(site)).not.toThrow();
  });
});

