import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";
import { floatingCoverIssues, headerControlIssues, headingOverlaps, type PageIssue } from "./page-checks";

/**
 * Headings, header buttons and floating buttons on a phone, through fixture previews of the production build:
 *
 * - Arabic: every template in its defaults and in each of its looks, in Arabic. No heading's lines run into each other
 *   (e2e/page-checks.ts measures the letters of each line), every button and link in the header shows text or an icon
 *   that stands out, and no floating button lies over a heading or the opening's text on the first screen.
 * - Arabic headings on a site in English ("artext": the owner wrote the headline in Arabic), in every look.
 * - Every header look (solid, glass, see-through, accent) over the template's own header, each on one of its looks: no
 *   empty pill (a button drawn in its own text color), and a tab bar that floats at the foot of the screen keeps its fill.
 * - The size of the app's live preview (a short screen): the opening's text is never under a floating button.
 *
 * TEMPLATES=<id,id> checks some templates only.
 */

type Look = { id: string };
const only = process.env.TEMPLATES?.split(",").filter(Boolean);
const templates = (registry.templates as { id: string; name: string; looks?: Look[] }[]).filter((t) => !only || only.includes(t.id));
const HEADER_STYLES = ["solid", "glass", "transparent", "accent"];

async function open(page: Page, path: string): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`page error: ${e.message}`));
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  return errors;
}

const report = (path: string, issues: PageIssue[]) => issues.map((i) => `${path} [${i.category}] ${i.detail}`);

test.describe.configure({ mode: "parallel" });

for (const template of templates) {
  const looks = (template.looks ?? []).map((l) => l.id);

  test(`${template.name}: Arabic headings, header buttons and floating buttons in every look`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "checked on a phone");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const found: string[] = [];
    for (const look of [null, ...looks]) {
      const path = `/_preview/fixture.${template.id}.default.ar${look ? `.look_${look}` : ""}`;
      found.push(...(await open(page, path)));
      found.push(...report(path, [...(await page.evaluate(headingOverlaps, {})), ...(await page.evaluate(headerControlIssues)), ...(await page.evaluate(floatingCoverIssues))]));
    }
    expect(found).toEqual([]);
  });

  test(`${template.name}: Arabic headings on a site in English`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "checked on a phone");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const found: string[] = [];
    for (const look of [null, ...looks]) {
      const path = `/_preview/fixture.${template.id}.default.en.${look ? `look_${look}-` : ""}artext`;
      found.push(...(await open(page, path)));
      found.push(...report(path, [...(await page.evaluate(headingOverlaps, { arabicOnly: true })), ...(await page.evaluate(floatingCoverIssues))]));
    }
    expect(found).toEqual([]);
  });

  test(`${template.name}: every header look keeps its buttons readable`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "checked on a phone");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const found: string[] = [];
    for (const [i, style] of HEADER_STYLES.entries()) {
      const look = looks.length ? looks[i % looks.length] : null;
      for (const locale of ["en", "ar"]) {
        const path = `/_preview/fixture.${template.id}.default.${locale}.${look ? `look_${look}-` : ""}hst_${style}`;
        found.push(...(await open(page, path)));
        found.push(...report(path, await page.evaluate(headerControlIssues)));
      }
    }
    expect(found).toEqual([]);
  });

  test(`${template.name}: the opening stays clear in the app's live preview`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "checked on a phone");
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 355, height: 344 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const found: string[] = [];
    for (const [i, look] of [null, ...looks].entries()) {
      const path = `/_preview/fixture.${template.id}.default.${i % 2 ? "en" : "ar"}${look ? `.look_${look}` : ""}`;
      found.push(...(await open(page, path)));
      found.push(...report(path, [...(await page.evaluate(floatingCoverIssues)), ...(await page.evaluate(headingOverlaps, { arabicOnly: true }))]));
    }
    expect(found).toEqual([]);
  });
}
