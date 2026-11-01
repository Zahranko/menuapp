import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import menuSettings from "../templates/_kit/menu-settings.json";
import registry from "../templates/registry.json";

/**
 * The shared "Menu layout" options (templates/_kit/menu.css, Menu.tsx) on every template, at phone width, through fixture
 * previews (lib/fixtures.ts: ml_ layout, mcol_ columns, mph_ photos, mrat_ photo proportions, mpr_ prices, mnav_
 * category links, mtit_ category titles). Every template tries every menu layout once, each with the other options
 * picked at random from a generator seeded with the template id (so a failure always reproduces), half in English and
 * half in Arabic. Each page passes the accessibility checks, keeps the page on the screen and has no errors, and a
 * product opens the template's product dialog. Multi-page sites are checked on their menu page.
 */

const options = (key: string) => menuSettings.fields.find((f) => f.key === key)!.options;
const LAYOUTS = options("menu.layout").filter((o) => o !== "auto");
const OTHERS: [string, string][] = [
  ["menu.columns", "mcol"],
  ["menu.photos", "mph"],
  ["menu.photoShape", "mrat"],
  ["menu.price", "mpr"],
  ["menu.categoryNav", "mnav"],
  ["menu.categoryTitle", "mtit"],
];
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

/** Every layout with random other options and a language. */
function combos(id: string) {
  const next = random(id);
  return LAYOUTS.map((layout, i) => {
    const parts = [`ml_${layout}`];
    for (const [key, token] of OTHERS) {
      const all = options(key);
      const value = all[Math.floor(next() * all.length)];
      if (value !== "auto") parts.push(`${token}_${value}`);
    }
    return { layout, token: parts.join("-"), locale: i % 2 === (next() < 0.5 ? 0 : 1) ? "ar" : "en" };
  });
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
  test.describe(`${template.name}: menu layout`, () => {
    test("every menu layout passes accessibility checks and fits a phone", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "a phone check");
      test.setTimeout(150_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const suffix = MULTI_PAGE.has(id) ? "/menu" : "";
      for (const c of combos(id)) {
        const label = `${c.token} (${c.locale})`;
        const errors = await open(page, `/_preview/fixture.${id}.default.${c.locale}.${c.token}${suffix}`);
        const menu = page.locator(".kit-mn");
        await expect(menu, label).toHaveCount(1);
        await expect(menu, label).toHaveAttribute("data-mn", c.layout);
        await noSideScroll(page);
        expect(await axe(page), label).toEqual([]);
        // A product opens the template's product dialog.
        const item = menu.locator("button.kit-mn-item").first();
        await item.scrollIntoViewIfNeeded();
        await item.click();
        await expect(page.locator("dialog[open]"), label).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(page.locator("dialog[open]"), label).toHaveCount(0);
        expect(errors, label).toEqual([]);
      }
    });
  });
}

test("the drop-down list of categories opens, jumps and closes", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "a phone check");
  await open(page, "/_preview/fixture.souq.default.ar.ml_list-mnav_dropdown");
  await page.locator(".kit-mn-drop-btn").click();
  const link = page.locator(".kit-mn-drop .kit-mn-link").nth(1);
  await expect(link).toBeVisible();
  await noSideScroll(page);
  await link.click();
  await expect(page.locator(".kit-mn-drop")).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(/#cat-2$/);
});

test("the search and the filters keep working over the shared menu", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "a phone check");
  await open(page, "/_preview/fixture.souq.default.en.ml_tiles");
  const shown = page.locator(".kit-mn-li:visible");
  const all = await shown.count();
  await page.locator('input[type="search"]').fill("latte");
  await expect(shown).not.toHaveCount(all);
  expect(await shown.count()).toBeGreaterThan(0);

  await open(page, "/_preview/fixture.pocket.default.en.ml_masonry");
  const before = await page.locator(".kit-mn-li:visible").count();
  await page.locator(".catalog-chips .chip").nth(1).click();
  await expect(page.locator(".kit-mn-li:visible")).not.toHaveCount(before);
  await expect(page.locator(".kit-mn-cat:visible")).toHaveCount(1);
});

test("the side list of categories stays beside the menu on a big screen", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "a desktop check");
  await open(page, "/_preview/fixture.souq.default.en.ml_grid-mnav_sidebar-mcol_three");
  const nav = await page.locator(".kit-mn-nav").boundingBox();
  const first = await page.locator(".kit-mn-cat").first().boundingBox();
  expect(nav!.x + nav!.width).toBeLessThanOrEqual(first!.x);
  expect(await axe(page)).toEqual([]);
});
