import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { bigMenu, fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import registry from "./registry.json";
import { templates } from "./registry";

/** Checks every template against the cases S16 asks for: all themes, Arabic, 1 to 200 products, long names, no photos. */

const render = (site: PublicSite) => {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} />);
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
    expect(html).toContain("Sold out");
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
    expect(html).toContain("نفد");
    expect(html).not.toContain("Sold out");
  });

  it("handles one product, and 200 products with long names and no photos", () => {
    const one = fixtureFor(id);
    one.categories = [{ ...one.categories[0], products: one.categories[0].products.slice(0, 1) }];
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
    expect(html).toContain(site.categories[0].products[0].name.replace("'", "&#x27;"));
  });

  it("has no empty menu when there are no products", () => {
    const site = fixtureFor(id);
    site.categories = [];
    expect(() => render(site)).not.toThrow();
  });
});

