import { test } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * Gallery thumbnails: THUMBNAILS=1 npm run test:e2e -- --project=mobile thumbnails
 * writes public/templates/<id>/thumbnail.png for every template, from the sample business in the template's first look
 * (manifest "looks", the "look_<id>" fixture token), so the gallery shows the look the owner sees first in the editor.
 */
test.skip(!process.env.THUMBNAILS, "set THUMBNAILS=1 to regenerate thumbnails");

for (const template of registry.templates) {
  const first = (template as { looks?: { id: string }[] }).looks?.[0]?.id;
  test(`thumbnail for ${template.id}`, async ({ browser }) => {
    // Reduced motion: the thumbnail shows the settled page, not an opening animation halfway through.
    const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await page.goto(first ? `/_preview/fixture.${template.id}.default.en.look_${first}` : `/${template.id}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    // The look comes through a fixture preview: take away its "Preview. Only you can see this." bar.
    await page.evaluate(() => document.querySelectorAll(".preview-bar, .a-preview, [data-template] > .preview").forEach((bar) => bar.remove()));
    await page.screenshot({ path: `public/templates/${template.id}/thumbnail.png` });
    await page.close();
  });
}
