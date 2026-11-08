import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The clothing-store templates (Folio, Drop, Couture): sizes parsed from the description become buttons, the chosen
 * size goes into the WhatsApp message, the gallery shows photos only (no names or captions, never spilling out of its
 * tiles) and the pages fit a 360px phone in English and Arabic.
 */

const FASHION = ["folio", "drop", "couture"] as const;

const address = (id: string, locale: "en" | "ar") => (locale === "en" ? `/${id}` : `/_preview/fixture.${id}.default.ar`);

/** Opens the first product whose sheet has size buttons; returns that product's name. */
async function openSizedProduct(page: Page): Promise<string> {
  const products = page.locator("#menu [data-item-id]:visible");
  const count = Math.min(await products.count(), 8);
  for (let i = 0; i < count; i++) {
    await products.nth(i).scrollIntoViewIfNeeded();
    await products.nth(i).click();
    const dialog = page.locator("dialog.fs-sheet");
    await expect(dialog).toBeVisible();
    if ((await dialog.locator(".fs-size:enabled").count()) > 0) return (await dialog.locator("#fs-title").textContent()) ?? "";
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  throw new Error("no product with sizes");
}

for (const id of FASHION) {
  test.describe(id, () => {
    for (const locale of ["en", "ar"] as const) {
      test(`fits a 360px phone (${locale})`, async ({ page }, info) => {
        test.skip(info.project.name !== "mobile", "phone width only");
        await page.setViewportSize({ width: 360, height: 780 });
        const response = await page.goto(address(id, locale));
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("h1")).toHaveCount(1);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
      });

      test(`a chosen size goes into the WhatsApp order (${locale})`, async ({ page }) => {
        await page.goto(address(id, locale));
        const name = await openSizedProduct(page);
        const dialog = page.locator("dialog.fs-sheet");
        await expect(dialog.locator(".fs-close")).toBeFocused();

        const order = dialog.locator("a.fs-order");
        const before = new URL((await order.getAttribute("href"))!);
        expect(before.hostname).toBe("wa.me");
        expect(before.searchParams.get("text")).toContain(name);

        const size = dialog.locator(".fs-size:enabled").nth(1);
        const label = (await size.textContent())!.trim();
        await size.click();
        await expect(size).toHaveAttribute("aria-pressed", "true");
        const text = new URL((await order.getAttribute("href"))!).searchParams.get("text")!;
        expect(text).toContain(name);
        expect(text).toContain(locale === "ar" ? `المقاس ${label}` : `size ${label}`);

        const results = await new AxeBuilder({ page }).include("dialog.fs-sheet").withTags(["wcag2a", "wcag2aa"]).analyze();
        expect(results.violations.map((v) => v.id)).toEqual([]);

        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
      });

      test(`the gallery shows photos only, inside their tiles (${locale})`, async ({ page }) => {
        await page.goto(id === "couture" ? (locale === "en" ? "/couture/gallery" : address(id, locale)) : address(id, locale));
        const tiles = page.locator("[data-photo]");
        expect(await tiles.count()).toBeGreaterThan(2);
        const gallery = page.locator('[data-section="gallery"], main#menu').filter({ has: tiles }).first();
        await expect(gallery.locator("figcaption")).toHaveCount(0);

        const checks = await tiles.evaluateAll((els) =>
          els.map((el) => {
            const tile = el.getBoundingClientRect();
            const img = el.querySelector("img");
            const box = img?.getBoundingClientRect();
            return {
              text: (el as HTMLElement).innerText.trim(),
              alt: img?.getAttribute("alt") ?? null,
              label: el.getAttribute("aria-label"),
              inside: !!box && box.left >= tile.left - 1 && box.right <= tile.right + 1 && box.top >= tile.top - 1 && box.bottom <= tile.bottom + 1,
              clipped: getComputedStyle(el).overflow === "hidden" || getComputedStyle(el.parentElement!).overflow === "hidden",
            };
          }),
        );
        for (const c of checks) {
          expect(c.text, "no names or captions on gallery photos").toBe("");
          expect(c.alt, "photos are decorative; the button is labelled").toBe("");
          expect(c.label).toBeTruthy();
          expect(c.inside || c.clipped, "photo stays inside its tile").toBe(true);
        }

        await tiles.nth(1).scrollIntoViewIfNeeded();
        await tiles.nth(1).click();
        const viewer = page.locator("dialog.fs-viewer");
        await expect(viewer).toBeVisible();
        await expect(viewer.locator(".fs-viewer-count")).toHaveText(/^2 \/ \d+$/);
        await page.keyboard.press(locale === "ar" ? "ArrowLeft" : "ArrowRight");
        await expect(viewer.locator(".fs-viewer-count")).toHaveText(/^3 \/ \d+$/);
        await page.keyboard.press("Escape");
        await expect(viewer).toBeHidden();
      });
    }

    test("opens a product from the keyboard", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "keyboard on desktop");
      await page.goto(`/${id}`);
      const product = page.locator("#menu [data-item-id]:visible").first();
      await product.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("dialog.fs-sheet")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog.fs-sheet")).toBeHidden();
      await expect(product).toBeFocused();
    });

    test("shows sale prices and sold-out pieces through labels", async ({ page }) => {
      await page.goto(id === "couture" ? "/couture/menu" : `/${id}`);
      await expect(page.locator(".tag-out").first()).toBeAttached();
      await expect(page.locator(".tag", { hasText: /Sale|−\d+%/ }).first()).toBeAttached();
    });
  });
}

test.describe("couture pages", () => {
  for (const path of ["/couture/menu", "/couture/best-sellers", "/couture/gallery", "/couture/visit"]) {
    test(`${path} has one headline and fits the screen`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".cu-crumbs")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("a collection page lists its sub-collections and pieces", async ({ page }) => {
    await page.goto("/couture/menu");
    const first = page.locator('a[href^="/couture/c/"]').first();
    const href = (await first.getAttribute("href"))!;
    await page.goto(href);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".cu-crumbs a").first()).toBeVisible();
    expect(await page.locator("#menu [data-item-id]").count()).toBeGreaterThan(0);
  });

  test("the mega menu opens from the keyboard on wide screens", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "wide screens only");
    await page.goto("/couture");
    const panel = page.locator(".cu-mega-panel");
    await expect(panel).toBeHidden();
    await page.locator(".cu-mega-top").focus();
    await expect(panel).toBeVisible();
    await expect(panel.locator("a").first()).toBeVisible();
  });
});
