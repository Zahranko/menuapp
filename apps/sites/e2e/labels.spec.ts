import { expect, test } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * Product labels at their longest (24 characters, with spaces and as one long word) in every template, in English and
 * Arabic: the page never scrolls sideways and every badge stays inside its product card without clipping its text.
 */

const LONG = ["Limited weekend special!", "Chefsrecommendationtoday", "عرض خاص لنهاية الأسبوع", "توصيةالشيفلهذااليومفقط"];

for (const template of registry.templates) {
  for (const locale of ["en", "ar"] as const) {
    test(`${template.name}: long labels fit (${locale})`, async ({ page }) => {
      await page.goto(`/_preview/fixture.${template.id}.default.${locale}.labels`);
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);

      const problems = await page.evaluate((long) => {
        const out: string[] = [];
        const badges = [...document.querySelectorAll<HTMLElement>("#menu *, [data-item-id] *")].filter(
          (el) => el.children.length === 0 && long.some((l) => el.textContent?.replace(/[[\]]/g, "").trim() === l),
        );
        for (const badge of badges) {
          const style = getComputedStyle(badge);
          if (style.display === "none" || style.visibility === "hidden" || badge.getClientRects().length === 0) continue;
          const box = badge.getBoundingClientRect();
          if (box.width === 0) continue;
          const text = badge.textContent!.trim();
          if (badge.scrollWidth > badge.clientWidth + 1 && style.overflow !== "visible") out.push(`clipped: ${text}`);
          const card = badge.closest<HTMLElement>("[data-item-id]");
          if (!card) continue;
          const c = card.getBoundingClientRect();
          if (box.left < c.left - 1 || box.right > c.right + 1) out.push(`outside its card: ${text} (${Math.round(box.left)}-${Math.round(box.right)} vs ${Math.round(c.left)}-${Math.round(c.right)})`);
        }
        return out;
      }, LONG);
      expect(problems).toEqual([]);
    });
  }
}
