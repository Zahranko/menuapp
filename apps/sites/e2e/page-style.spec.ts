import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The shared "Page style" options (templates/_kit/style.css) on every template, through fixture previews
 * (lib/fixtures.ts): two strongly different combinations, in English and in Arabic, pass the accessibility checks and
 * keep the page on the screen; motion on scroll runs only for visitors who don't ask for less motion.
 */

const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
const COMBOS = {
  playful: "ts_larger-hs_uppercase-tr_wide-sp_airy-btn_outline-pic_circle-div_wave-tex_dots-mo_playful",
  bold: "ts_big-hs_condensed-sp_compact-btn_shadow-pic_arch-div_zigzag-tex_grain-mo_rise",
  quiet: "ts_smaller-hs_outlined-tr_tight-btn_underline-pic_blob-div_slant-tex_paper-mo_fade",
};

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

async function noSideScroll(page: Page) {
  const width = page.viewportSize()!.width;
  const overflow = await page.evaluate((w) => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w, width);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
}

/** Scroll-driven page style animations running on the page. */
const styleAnimations = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => (a as CSSAnimation).animationName?.startsWith("kit-ps-")).length);

for (const template of registry.templates) {
  const id = template.id;
  const ownMotion = !(template.schema as { key: string }[]).some((f) => f.key === "style.motion");
  const pages = MULTI_PAGE.has(id) ? ["", "/menu"] : [""];

  test.describe(`${template.name}: page style`, () => {
    for (const [name, options] of Object.entries(COMBOS)) {
      for (const locale of ["en", "ar"]) {
        test(`${name} (${locale}) passes accessibility checks and fits the screen`, async ({ page }, info) => {
          test.skip(info.project.name !== "mobile" && locale === "ar", "Arabic checked on mobile");
          await page.emulateMedia({ reducedMotion: "reduce" });
          for (const sub of pages) {
            const errors = await open(page, `/_preview/fixture.${id}.default.${locale}.${options}${sub}`);
            await expect(page.locator(`[data-template="${id}"]`)).toHaveAttribute("data-ps-btn", /.+/);
            await noSideScroll(page);
            if (info.project.name === "mobile") expect(await axe(page), sub || "home").toEqual([]);
            expect(await styleAnimations(page), "nothing moves for visitors who prefer less motion").toBe(0);
            expect(errors).toEqual([]);
          }
        });
      }
    }

    test("motion on scroll runs only when chosen", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile" || ownMotion, "checked once, on templates with the shared motion option");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await open(page, `/_preview/fixture.${id}.default.en.mo_rise${pages.at(-1)}`);
      expect(await styleAnimations(page)).toBeGreaterThan(0);
      await open(page, `/_preview/fixture.${id}.default.en${pages.at(-1)}`);
      expect(await styleAnimations(page)).toBe(0);
    });
  });
}
