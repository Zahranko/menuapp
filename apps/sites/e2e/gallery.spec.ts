import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";
import { galleryProblems } from "./gallery-measure";

/**
 * Every template with a gallery, in English and Arabic, on phones and desktops: the gallery shows only photos (no
 * product names or captions), every photo stays inside its tile, every tile inside the gallery and the gallery inside
 * the page, with 1 to 12 photos of odd shapes (very tall, very wide, tiny). Fixture previews take "gal_<n>" (n owner
 * photos) or "galp_<n>" (plus product photos, which carry the product names); the photo host is answered here.
 */

const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
const withGallery = registry.templates.filter((t) => "gallery" in (t.defaults as Record<string, unknown>));

/** A flat picture of the size in its address (".../3-300x1500.svg"), with a frame so a crop that cuts it shows. */
function photo(url: string): string {
  const [, n = "1", w = "100", h = "100"] = /\/(\d+)-(\d+)x(\d+)\.svg/.exec(url) ?? [];
  const hue = (Number(n) * 47) % 360;
  const stroke = Math.max(1, Math.min(Number(w), Number(h)) / 30);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="hsl(${hue} 60% 55%)"/><rect x="2%" y="2%" width="96%" height="96%" fill="none" stroke="#111" stroke-width="${stroke}"/></svg>`;
}

test.beforeEach(async ({ page }) => {
  await page.route("https://fixture-photo.invalid/**", (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: photo(route.request().url()) }));
});

async function open(page: Page, id: string, locale: string, options: string, path = "") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(`/_preview/fixture.${id}.default.${locale}.${options}${path}`);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  const gallery = page.locator("[data-gallery]").first();
  await gallery.scrollIntoViewIfNeeded();
  // Photos that fade in as they scroll into view.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  return errors;
}

async function check(page: Page, what: string) {
  expect(await page.evaluate(galleryProblems), what).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${what}: page scrolls sideways`).toBeLessThanOrEqual(0);
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
}

for (const template of withGallery) {
  const id = template.id;
  const paths = MULTI_PAGE.has(id) ? ["", "/gallery"] : [""];

  test.describe(`${template.name}: gallery`, () => {
    for (const locale of ["en", "ar"] as const) {
      test(`only photos, each inside its tile, with 1 to 12 photos (${locale})`, async ({ page }) => {
        test.slow();
        for (const path of paths) {
          for (const options of ["gal_1", "gal_2", "gal_5", "gal_12", "galp_6"]) {
            const errors = await open(page, id, locale, options, path);
            await expect(page.locator("[data-gallery] img").first()).toBeVisible();
            await check(page, `${options}${path}`);
            expect(errors).toEqual([]);
          }
        }
      });

      test(`passes accessibility checks (${locale})`, async ({ page }, info) => {
        test.skip(info.project.name !== "mobile", "checked once, on mobile");
        for (const path of paths) {
          await open(page, id, locale, "galp_6", path);
          expect(await axe(page), path || "home").toEqual([]);
        }
      });
    }

    if (MULTI_PAGE.has(id)) {
      test("the lightbox shows only the photo and where it is in the set", async ({ page }) => {
        await open(page, id, "en", "galp_3", "/gallery");
        const tiles = page.locator("[data-gallery] [data-photo]");
        const count = await tiles.count();
        expect(count).toBeGreaterThan(3);
        // A product photo (they come after the owner's three).
        await tiles.nth(3).click();
        const dialog = page.locator("dialog.lightbox");
        await expect(dialog).toBeVisible();
        const img = dialog.locator("img");
        await expect(img).toBeVisible();
        expect((await img.getAttribute("alt"))?.trim(), "the photo keeps a name for screen readers").toBeTruthy();
        const caption = (await dialog.locator("figure").innerText()).replace(/\s+/g, " ").trim();
        expect(caption).toBe(`4 / ${count}`);
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
      });
    }
  });
}
