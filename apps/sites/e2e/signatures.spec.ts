import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import signatures from "../templates/_kit/signatures.generated.json";
import registry from "../templates/registry.json";

/**
 * Each template's own ("signature") layout options and its named looks (manifest "signature" and "looks",
 * templates/<id>/signature.css), at phone width, through fixture previews: "hl_", "hv_", "ml_" and "stl_" pick a layout,
 * "look_<id>" applies a look, "sparse" leaves out what can be left out. Every signature gets a page, then one page has all
 * of the template's signatures with the least content, then every look gets a page. The pages take turns between English and
 * Arabic, starting from a coin seeded with the template id (a failure always reproduces). Each page passes the accessibility
 * checks, keeps the page on the screen and has no errors. A menu signature on a multi-page site is checked on its menu page.
 */

const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
/** The fixture token, the element and the attribute of each part a signature can change. */
const PARTS: Record<string, { token: string; selector: string; attribute: string }> = {
  "header.layout": { token: "hl", selector: ".kit-hd", attribute: "data-hd" },
  "hero.variant": { token: "hv", selector: ".kit-hv", attribute: "data-hv" },
  "menu.layout": { token: "ml", selector: ".kit-mn", attribute: "data-mn" },
  "story.layout": { token: "stl", selector: '.kit-sc[data-section="story"]', attribute: "data-sc" },
};
const sigMap = signatures as Record<string, Record<string, Record<string, string>>>;
type Look = { id: string; label: { en: string; ar: string } };

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

type Check = { label: string; token: string; menuPage: boolean; parts: [string, string, string][] };

/** The pages to check for one template: each signature, all of them on the least content, each look. */
function pages(id: string, looks: Look[]): (Check & { locale: string })[] {
  const own = Object.entries(sigMap[id] ?? {}).flatMap(([key, options]) => Object.entries(options).map(([option, base]) => [key, option, base] as [string, string, string]));
  const checks: Check[] = [
    ...own.map(([key, option, base]) => ({ label: `${key}=${option}`, token: `${PARTS[key].token}_${option}`, menuPage: key === "menu.layout", parts: [[key, option, base]] as [string, string, string][] })),
    { label: "all signatures, sparse", token: `${own.map(([key, option]) => `${PARTS[key].token}_${option}`).join("-")}-sparse`, menuPage: false, parts: own.filter(([key]) => key !== "menu.layout" || !MULTI_PAGE.has(id)) },
    ...looks.map((look) => ({ label: `look ${look.id}`, token: `look_${look.id}`, menuPage: false, parts: [] })),
  ];
  const start = random(id)() < 0.5 ? 0 : 1;
  return checks.map((c, i) => ({ ...c, locale: (i + start) % 2 === 0 ? "ar" : "en" }));
}

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

async function noSideScroll(page: Page, label: string) {
  const width = page.viewportSize()!.width;
  const overflow = await page.evaluate((w) => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w, width);
  expect(overflow, `${label}: page scrolls sideways`).toBeLessThanOrEqual(0);
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
}

for (const template of registry.templates) {
  const id = template.id;
  const looks = ((template as { looks?: Look[] }).looks ?? []) as Look[];

  test.describe(`${template.name}: signatures and looks`, () => {
    test("every signature option and every look passes accessibility checks and fits a phone", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "a phone check");
      test.setTimeout(240_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const c of pages(id, looks)) {
        const label = `${c.label} (${c.locale})`;
        const suffix = c.menuPage && MULTI_PAGE.has(id) ? "/menu" : "";
        const errors = await open(page, `/_preview/fixture.${id}.default.${c.locale}.${c.token}${suffix}`);
        await expect(page.locator("h1"), `${label}: one main heading`).toHaveCount(1);
        for (const [key, option, base] of c.parts) {
          const part = page.locator(PARTS[key].selector);
          await expect(part, `${label}: ${key}`).toHaveCount(1);
          await expect(part, `${label}: ${key}`).toHaveAttribute(PARTS[key].attribute, base);
          await expect(part, `${label}: ${key}`).toHaveAttribute("data-sig", option);
        }
        await noSideScroll(page, label);
        expect(await axe(page), label).toEqual([]);
        expect(errors, label).toEqual([]);
      }
    });
  });
}
