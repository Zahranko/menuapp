import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The shared background color on every template (fixture previews take it as "bg_<rrggbb>", see lib/fixtures.ts
 * applySiteOptions): light, dark and custom backgrounds, with an extra accent color, pass the accessibility checks
 * (text contrast included) on the home page and, for templates with several pages, the menu page too.
 */

/** Templates with several pages show their products on the menu page. */
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
const CASES: { name: string; options: string; scheme: "light" | "dark"; locale: "en" | "ar" }[] = [
  { name: "white", options: "bg_ffffff", scheme: "light", locale: "en" },
  { name: "butter, coral accent", options: "bg_fff4d6-accent_f0644a", scheme: "light", locale: "ar" },
  { name: "lavender, mint accent", options: "bg_eee8f7-accent_7cc4a4", scheme: "light", locale: "en" },
  { name: "navy", options: "bg_14213d", scheme: "dark", locale: "en" },
  { name: "black, navy accent", options: "bg_0e0e0e-accent_1e3a8a", scheme: "dark", locale: "ar" },
  { name: "custom mid red", options: "bg_c8102e", scheme: "dark", locale: "en" },
  { name: "custom mid gray", options: "bg_9a9a9a-accent_f2c14e", scheme: "light", locale: "en" },
];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
}

for (const template of registry.templates) {
  const id = template.id;
  const paths = MULTI_PAGE.has(id) ? ["", "/menu"] : [""];

  test.describe(`${template.name}: background colors`, () => {
    for (const c of CASES) {
      test(`${c.name} (${c.locale}) passes accessibility checks`, async ({ page }, info) => {
        test.skip(info.project.name !== "mobile", "checked once, on mobile");
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        for (const path of paths) {
          const response = await page.goto(`/_preview/fixture.${id}.default.${c.locale}.${c.options}${path}`);
          expect(response?.status()).toBe(200);
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator(`[data-template="${id}"]`)).toHaveAttribute("data-page-bg", c.scheme);
          expect(await axe(page), path || "home").toEqual([]);
        }
        expect(errors).toEqual([]);
      });
    }
  });
}
