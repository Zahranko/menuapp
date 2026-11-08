import { test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * Review screenshots of the shared background color (before: "Template default"; after: a few backgrounds):
 *   SHOTS_DIR=/some/dir npx playwright test --project=desktop colors-shots
 * SHOTS_TEMPLATES=souq,maison picks the templates (default: a light, a dark, a Pro and a fashion one; "all" for every
 * template). Skipped unless SHOTS_DIR is set. Each test opens its own phone page, so one project is enough.
 */
const dir = process.env.SHOTS_DIR;
test.skip(!dir, "set SHOTS_DIR to save background color screenshots");

const picked = process.env.SHOTS_TEMPLATES ?? "souq,bento,maison,couture,chalkboard";
const TEMPLATES = picked === "all" ? registry.templates.map((t) => t.id) : picked.split(",");
const BACKGROUNDS = (process.env.SHOTS_BACKGROUNDS ?? "default,ffffff,e4eff8,e3f2ea,14213d").split(",");
const PHONE = { width: 390, height: 844 };

async function open(page: Page, id: string, options: string, locale: string) {
  // Maison opens on a full-screen photo; its menu page shows the colors better.
  const suffix = id === "maison" ? "/menu" : "";
  await page.goto(`/_preview/fixture.${id}.default.${locale}${options ? `.${options}` : ""}${suffix}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

for (const id of TEMPLATES) {
  for (const bg of BACKGROUNDS) {
    test(`${id} on ${bg}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: PHONE, deviceScaleFactor: 1 });
      await open(page, id, bg === "default" ? "" : `bg_${bg}`, id === "souq" ? "ar" : "en");
      await page.evaluate(() => window.scrollTo(0, Math.min(700, document.documentElement.scrollHeight)));
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${dir}/${id}-${bg === "default" ? "before" : `bg-${bg}`}.png`, fullPage: false });
      await page.close();
    });
  }
}
