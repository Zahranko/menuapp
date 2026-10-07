import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import registry from "../templates/registry.json";

/** Every template, on its sample business: loads cleanly, fits the screen, opens a product, passes accessibility checks. */

const themes = (t: (typeof registry.templates)[number]) => (t.schema.find((f) => f.key === "theme") as { options?: string[] } | undefined)?.options ?? ["default"];

for (const template of registry.templates) {
  test.describe(template.name, () => {
    test("loads, fits the screen and opens a product", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

      const response = await page.goto(`/${template.id}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("#menu")).toBeAttached();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);

      const product = page.locator("#menu [data-item-id]:visible").first();
      if (await product.count()) {
        await product.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeHidden();
      }
      expect(errors).toEqual([]);
    });

    for (const theme of themes(template)) {
      for (const locale of theme === themes(template)[0] ? ["en", "ar"] : ["en"]) {
        test(`passes accessibility checks in ${theme} (${locale})`, async ({ page }, info) => {
          test.skip(info.project.name !== "mobile", "checked once, on mobile");
          await page.goto(`/_preview/fixture.${template.id}.${theme}.${locale}`);
          await page.evaluate(() => document.fonts.ready);
          const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
          const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
          expect(summary).toEqual([]);
        });
      }
    }
  });
}
