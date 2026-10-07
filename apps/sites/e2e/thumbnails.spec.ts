import { test } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * Gallery thumbnails: THUMBNAILS=1 npm run test:e2e -- --project=mobile thumbnails
 * writes public/templates/<id>/thumbnail.png for every template, from the sample business.
 */
test.skip(!process.env.THUMBNAILS, "set THUMBNAILS=1 to regenerate thumbnails");

for (const template of registry.templates) {
  test(`thumbnail for ${template.id}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1 });
    await page.goto(`/${template.id}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `public/templates/${template.id}/thumbnail.png` });
    await page.close();
  });
}
