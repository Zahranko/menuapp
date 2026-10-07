import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fixtureFor } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { contrast } from "../_kit/color";
import SouqTemplate from "./Template";
import { THEME_NAMES, souqVars } from "./theme";
import manifest from "./manifest.json";

const now = new Date("2026-10-07T09:00:00Z"); // a Wednesday in Amman

function render(settings: Record<string, unknown> = {}, overrides: Partial<PublicSite> = {}) {
  const site = fixtureFor("souq", overrides);
  site.settings = { ...site.settings, ...settings };
  return renderToStaticMarkup(<SouqTemplate site={site} preview={false} now={now} />);
}

const sectionOrder = (html: string) => [...html.matchAll(/data-section="([a-z]+)"/g)].map((m) => m[1]);
const accents = manifest.schema.find((f) => f.key === "accent")!.options as string[];

describe("Souq", () => {
  it.each(THEME_NAMES.flatMap((theme) => ["modern", "elegant", "bold"].flatMap((font) => ["full", "split"].map((layout) => [theme, font, layout]))))(
    "renders the sample site in %s / %s / %s",
    (theme, font, layout) => {
      const html = render({ theme, font, "hero.layout": layout });
      expect(html).toContain("Vanilla Menu");
      expect(html).toContain("Kunafa cheesecake");
    },
  );

  it("keeps the prototype's section order", () => {
    expect(sectionOrder(render())).toEqual(["announcement", "header", "hero", "highlights", "signature", "menu", "story", "gallery", "reviews", "visit", "footer"]);
  });

  it("leaves out switched-off sections and sections with nothing to show", () => {
    const html = render({ sections: ["signature", "visit"], gallery: [], "reviews.1.quote": "" });
    expect(sectionOrder(html)).toEqual(["header", "hero", "signature", "menu", "visit", "footer"]);
    expect(sectionOrder(render({ "reviews.1.quote": "", "reviews.2.quote": "", "reviews.3.quote": "", gallery: [] }))).not.toContain("reviews");
  });

  it("shows sold-out products with a label but never as a signature pick", () => {
    const site = fixtureFor("souq");
    site.categories[0].products[0].isAvailable = false; // Vanilla latte is featured
    const html = renderToStaticMarkup(<SouqTemplate site={site} preview={false} now={now} />);
    expect(html.match(/Sold out/g)?.length).toBe(2);
    expect(html.split('data-section="signature"')[1].split('data-section="menu"')[0]).not.toContain("Vanilla latte");
  });

  it("highlights today in the business's time zone", () => {
    expect(render()).toMatch(/Wednesday<span[^>]*>Today<\/span>/);
  });

  it("speaks Arabic for Arabic businesses", () => {
    const site = fixtureFor("souq");
    site.business.locale = "ar";
    const html = renderToStaticMarkup(<SouqTemplate site={site} preview={false} now={now} />);
    expect(html).toContain("القائمة والأسعار");
    expect(html).toContain("د.أ");
  });

  it("marks previews", () => {
    const site = fixtureFor("souq");
    expect(renderToStaticMarkup(<SouqTemplate site={site} preview now={now} />)).toContain("Only you can see this");
  });

  it.each(THEME_NAMES.flatMap((theme) => accents.map((accent) => [theme, accent])))("text has 4.5:1 contrast in %s with accent %s", (theme, accent) => {
    const v = souqVars({ theme, accent }, "en") as Record<string, string>;
    for (const bg of [v["--sbg"], v["--ssurf"]]) {
      expect(contrast(v["--sink"], bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(v["--smuted"], bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(v["--sacctext"], bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(v["--sacctext"], v["--saccsoft"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(v["--saccink"], v["--sacc"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(v["--sfootink"], v["--sfoot"])).toBeGreaterThanOrEqual(4.5);
  });
});
