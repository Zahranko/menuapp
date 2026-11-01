import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The owner's logo options on every template, on phones and desktops: a frameless wide wordmark at the largest size,
 * centered and with the name hidden, still fits the screen, shows the logo inside the header and keeps the name for
 * screen readers. Fixture previews take the options as a fifth token part; their logo host is answered here.
 */

const wordmark = readFileSync(path.join(__dirname, "assets", "wordmark.png"));

test.beforeEach(async ({ page }) => {
  await page.route("https://fixture-logo.invalid/**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: wordmark }));
});

for (const template of registry.templates) {
  for (const options of ["logo-bare-s180", "logo-bare-center-noname-s180", "logo-center-s70"]) {
    test(`${template.name}: ${options}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      // Inner page for multi-page templates whose home page hides the header logo behind the hero.
      const suffix = template.id === "maison" ? "/menu" : "";
      const response = await page.goto(`/_preview/fixture.${template.id}.default.en.${options}${suffix}`);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);

      const header = page.locator('[data-section="header"]').first();
      const logo = header.locator(".kit-logo").first();
      await expect(logo).toBeVisible();
      const [h, l] = [await header.boundingBox(), await logo.boundingBox()];
      expect(l!.x).toBeGreaterThanOrEqual(-1);
      expect(l!.x + l!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
      expect(l!.y + l!.height, "logo stays inside the header").toBeLessThanOrEqual(h!.y + h!.height + 1);

      if (options.includes("noname")) {
        const name = header.locator(".kit-name").first();
        const box = await name.boundingBox();
        expect(box === null || (box.width <= 2 && box.height <= 2), "name is hidden on screen").toBe(true);
        expect(await name.textContent()).toBeTruthy();
      }
      expect(errors).toEqual([]);
    });
  }
}
