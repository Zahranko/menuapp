import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import layoutSettings from "../templates/_kit/layout-settings.json";
import registry from "../templates/registry.json";

/**
 * The shared "Page layout" options (templates/_kit/layout.css, Top.tsx) on every template, at phone width, through
 * fixture previews (lib/fixtures.ts: hl_ header layout, hst_ header look, stk_ header while scrolling, hv_ opening).
 * Every template tries every header layout and every opening once: they are paired in an order shuffled with a fixed
 * seed per template (so a failure always reproduces), half in English and half in Arabic, each with a header look.
 * Each page passes the accessibility checks, keeps the page on the screen and has no errors; the menu button opens the
 * links; multi-page sites keep their inner pages free of the opening.
 */

const options = (key: string) => layoutSettings.fields.find((f) => f.key === key)!.options.filter((o) => o !== "auto");
const HEADERS = options("header.layout");
const LOOKS = options("header.style");
const HEROES = options("hero.variant");
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);

/** A small seeded random generator (mulberry32), seeded from the template id. */
function random(seed: string) {
  let a = [...seed].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = <T>(list: T[], next: () => number) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Pairs covering every header layout and every opening, with a header look and a language each. */
function combos(id: string) {
  const next = random(id);
  const heroes = shuffle(HEROES, next);
  const headers = shuffle(HEADERS, next);
  const looks = shuffle(LOOKS, next);
  return heroes.map((hero, i) => ({
    header: headers[i % headers.length],
    look: looks[i % looks.length],
    hero,
    locale: i % 2 === (next() < 0.5 ? 0 : 1) ? "ar" : "en",
  }));
}

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

for (const template of registry.templates) {
  const id = template.id;
  test.describe(`${template.name}: page layout`, () => {
    test("every header layout and opening passes accessibility checks and fits a phone", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "a phone check");
      test.setTimeout(150_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const c of combos(id)) {
        const label = `${c.header}/${c.look}/${c.hero} (${c.locale})`;
        const errors = await open(page, `/_preview/fixture.${id}.default.${c.locale}.hl_${c.header}-hst_${c.look}-hv_${c.hero}`);
        await expect(page.locator(`.kit-hd[data-hd="${c.header}"]`), label).toHaveCount(1);
        await expect(page.locator(`.kit-hv[data-hv="${c.hero}"]`), label).toHaveCount(1);
        await noSideScroll(page);
        expect(await axe(page), label).toEqual([]);
        // The menu button opens the links and closes them again.
        const burger = page.locator(".kit-hd .kit-hd-burger");
        await burger.click();
        await expect(page.locator("#site-drawer a").first(), label).toBeVisible();
        await noSideScroll(page);
        await burger.click();
        await expect(page.locator("#site-drawer")).toBeHidden();
        expect(errors, label).toEqual([]);
      }
    });

    if (MULTI_PAGE.has(id)) {
      test("inner pages keep the shared header and leave the opening out", async ({ page }, info) => {
        test.skip(info.project.name !== "mobile", "a phone check");
        await open(page, `/_preview/fixture.${id}.default.ar.hl_centered-hst_glass-hv_full/menu`);
        await expect(page.locator(".kit-hd")).toHaveCount(1);
        await expect(page.locator(".kit-hv")).toHaveCount(0);
        await noSideScroll(page);
        expect(await axe(page)).toEqual([]);
      });
    }
  });
}

test("the template's own header takes the header look and scrolling options", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "a phone check");
  for (const [id, look] of [["souq", "accent"], ["clinic", "glass"], ["agency", "solid"], ["drop", "accent"]] as const) {
    await open(page, `/_preview/fixture.${id}.default.en.hst_${look}-stk_off`);
    const header = page.locator('[data-section="header"]').first();
    await expect(header).not.toHaveClass(/kit-hd/);
    expect(await header.evaluate((el) => getComputedStyle(el).position), id).toBe("relative");
    expect(await axe(page), `${id} ${look}`).toEqual([]);
  }
});
