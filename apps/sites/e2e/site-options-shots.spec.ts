import { test, type Page } from "@playwright/test";

/**
 * Review screenshots of the shared site options (footer with a long name, social icons, order button shapes and actions,
 * fonts, extra accent colors) for a few templates:
 *   SHOTS_DIR=/some/dir npx playwright test --project=desktop site-options-shots
 * Skipped unless SHOTS_DIR is set. Each test opens its own phone or desktop page, so one project is enough.
 */
const dir = process.env.SHOTS_DIR;
test.skip(!dir, "set SHOTS_DIR to save site option screenshots");

const TEMPLATES = ["souq", "maison", "ember", "chalkboard", "clinic", "bloom", "atlas", "lumen"];
const PHONE = { width: 360, height: 760 };
const DESKTOP = { width: 1280, height: 800 };

async function open(page: Page, id: string, locale: string, options: string) {
  // Maison's reserve bar shows on inner pages.
  const suffix = id === "maison" ? "/menu" : "";
  await page.goto(`/_preview/fixture.${id}.default.${locale}.${options}${suffix}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

async function shot(page: Page, name: string, where: "top" | "footer") {
  if (where === "footer") {
    await page.locator('[data-section="footer"]').last().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${name}.png` });
}

const cases: { name: string; locale: string; options: string; viewport: typeof PHONE; where: "top" | "footer" }[] = [
  { name: "footer-longname-en-360", locale: "en", options: "longname-social", viewport: PHONE, where: "footer" },
  { name: "footer-longname-ar-360", locale: "ar", options: "longname-social", viewport: PHONE, where: "footer" },
  { name: "footer-longword-en-360", locale: "en", options: "longword", viewport: PHONE, where: "footer" },
  { name: "footer-longname-en-desktop", locale: "en", options: "longname-social", viewport: DESKTOP, where: "footer" },
  { name: "footer-longword-ar-desktop", locale: "ar", options: "longword-social", viewport: DESKTOP, where: "footer" },
  { name: "footer-small-name-en-360", locale: "en", options: "longname-foot_small", viewport: PHONE, where: "footer" },
  { name: "order-whatsapp-pill-en", locale: "en", options: "social-order_whatsapp-shape_pill", viewport: PHONE, where: "footer" },
  { name: "order-call-rounded-en", locale: "en", options: "social-order_call-shape_rounded", viewport: PHONE, where: "footer" },
  { name: "order-instagram-circle-en", locale: "en", options: "social-order_instagram-shape_circle", viewport: PHONE, where: "footer" },
  { name: "order-facebook-pill-ar", locale: "ar", options: "social-order_facebook-shape_pill", viewport: PHONE, where: "footer" },
  { name: "font-cairo-ar", locale: "ar", options: "font_cairo", viewport: PHONE, where: "top" },
  { name: "font-amiri-en", locale: "en", options: "font_amiri", viewport: PHONE, where: "top" },
  { name: "font-lalezar-en", locale: "en", options: "font_lalezar", viewport: PHONE, where: "top" },
  { name: "color-c8102e-en", locale: "en", options: "accent_c8102e-order_whatsapp", viewport: PHONE, where: "top" },
  { name: "color-0e7c86-en", locale: "en", options: "accent_0e7c86-order_whatsapp", viewport: PHONE, where: "top" },
  { name: "color-5b3fd0-ar", locale: "ar", options: "accent_5b3fd0-order_whatsapp", viewport: PHONE, where: "top" },
];

for (const id of TEMPLATES) {
  for (const c of cases) {
    test(`${id} ${c.name}`, async ({ browser }) => {
      const phone = c.viewport === PHONE;
      const page = await browser.newPage({ viewport: c.viewport, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
      await open(page, id, c.locale, c.options);
      await shot(page, `${id}/${c.name}`, c.where);
      await page.close();
    });
  }
}
