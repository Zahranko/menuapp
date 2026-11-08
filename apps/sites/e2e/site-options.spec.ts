import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The owner's shared site options on every template, on phones and desktops (fixture previews take them in the token's
 * fifth part, see lib/fixtures.ts applySiteOptions): a very long business name (with spaces, or one long word) stays on
 * the screen in the footer in English and Arabic; social icons and the floating order button in each shape fit too.
 */

/** Templates whose own order bar is for phones only (desktops get the order button in the header or page instead). */
const PHONE_ONLY_BUTTON = new Set(["atelier", "handy", "lumen"]);

async function open(page: Page, id: string, locale: string, options: string) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Maison's reserve bar shows on inner pages (on the home page once the visitor scrolls past the opening shot).
  const suffix = id === "maison" ? "/menu" : "";
  const response = await page.goto(`/_preview/fixture.${id}.default.${locale}.${options}${suffix}`);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

async function noSideScroll(page: Page) {
  // Phones widen the page to fit content that is too wide, so compare with the device's width, not the page's.
  const width = page.viewportSize()!.width;
  const overflow = await page.evaluate((w) => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w, width);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}

/** Every visible element of the footer that holds the business name ends inside the screen. */
async function footerNameFits(page: Page) {
  const width = page.viewportSize()!.width;
  const boxes = await page.locator('[data-section="footer"] :is(.kit-foot-name, .kit-credits-text)').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, visible: r.width > 0 && getComputedStyle(el).visibility !== "hidden" };
    }),
  );
  expect(boxes.length, "footer shows the name").toBeGreaterThan(0);
  for (const b of boxes.filter((x) => x.visible)) {
    expect(b.left, "name starts on screen").toBeGreaterThanOrEqual(-1);
    expect(b.right, "name ends on screen").toBeLessThanOrEqual(width + 1);
  }
}

for (const template of registry.templates) {
  const id = template.id;

  for (const [locale, options] of [
    ["en", "longname-foot_small"],
    ["en", "longword"],
    ["ar", "longname"],
    ["ar", "longword-foot_medium"],
  ] as const) {
    test(`${template.name}: long name in the footer (${locale}, ${options})`, async ({ page }) => {
      const errors = await open(page, id, locale, options);
      await page.locator('[data-section="footer"]').scrollIntoViewIfNeeded();
      await noSideScroll(page);
      await footerNameFits(page);
      expect(errors).toEqual([]);
    });
  }

  for (const [locale, options, shape] of [
    ["en", "social-order_call-shape_circle", "circle"],
    ["ar", "social-order_instagram-shape_rounded-font_cairo-accent_0e7c66", "rounded"],
    ["en", "longword-social-order_whatsapp-shape_pill-font_amiri", "pill"],
  ] as const) {
    test(`${template.name}: social icons and order button (${locale}, ${options})`, async ({ page }, info) => {
      const errors = await open(page, id, locale, options);
      await noSideScroll(page);
      const width = page.viewportSize()!.width;

      const icons = page.locator('[data-section="footer"] a.kit-social-link');
      expect(await icons.count()).toBe(6);
      await icons.first().scrollIntoViewIfNeeded();
      for (const box of await icons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect))) {
        expect(box.width).toBeGreaterThan(16);
        expect(box.right).toBeLessThanOrEqual(width + 1);
      }

      const button = page.locator(".kit-order").first();
      const phoneOnly = PHONE_ONLY_BUTTON.has(id) && info.project.name === "desktop";
      if (phoneOnly) {
        await expect(button).toBeHidden();
      } else {
        await expect(button).toBeVisible();
        const box = (await button.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        if (shape === "circle") expect(Math.abs(box.width - box.height), "round button").toBeLessThanOrEqual(2);
        const action = options.match(/order_([a-z]+)/)![1];
        expect(await button.getAttribute("data-order-action")).toBe(action === "call" ? "call" : action);

        // At the very bottom of the page the floating button leaves the credits uncovered.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(150);
        const fab = (await button.boundingBox())!;
        // The lines of text in the credits (their boxes can be as wide as the footer).
        const credits = await page.locator(".kit-credits").evaluateAll((els) =>
          els.flatMap((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return [...range.getClientRects()].map((r) => r.toJSON() as DOMRect).filter((r) => r.width > 0 && r.height > 0);
          }),
        );
        for (const c of credits) {
          const overlaps = c.left < fab.x + fab.width && fab.x < c.right && c.top < fab.y + fab.height && fab.y < c.bottom;
          expect(overlaps, "the order button covers the credits").toBe(false);
        }
      }
      expect(errors).toEqual([]);
    });
  }

  for (const [locale, options] of [
    ["en", "social-order_call-shape_circle-font_rubik-accent_ffe600-foot_small"],
    ["ar", "social-order_facebook-shape_rounded-font_kufi-accent_0b3d2e"],
  ] as const) {
    test(`${template.name}: passes accessibility checks with the options (${locale}, ${options})`, async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "checked once, on mobile");
      await open(page, id, locale, options);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
      expect(summary).toEqual([]);
    });
  }
}
