import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import brand from "../../../brand.json";

/** The marketing pages in English and Arabic: they load, read in the right direction, never scroll sideways and pass the accessibility checks. */

const PAGES = [
  { path: "/", lang: "en" },
  { path: "/privacy", lang: "en" },
  { path: "/contact", lang: "en" },
  { path: "/ar", lang: "ar" },
  { path: "/ar/privacy", lang: "ar" },
  { path: "/ar/contact", lang: "ar" },
] as const;

test.use({ contextOptions: { reducedMotion: "reduce" } });

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
}

for (const { path, lang } of PAGES) {
  test(`${path} loads and passes accessibility checks`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "page scrolls sideways").toBeLessThanOrEqual(0);
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("store buttons do nothing yet", async ({ page }) => {
  await page.goto("/");
  const appStore = page.locator('[data-store="app-store"]').first();
  await expect(appStore).toHaveAttribute("aria-disabled", "true");
  await appStore.click({ force: true });
  await page.locator('[data-store="google-play"]').first().click({ force: true });
  await expect(page).toHaveURL(/\/$/);
});

test("the language switch keeps the page", async ({ page }) => {
  await page.goto("/privacy");
  await page.locator("header [data-lang-switch]").click();
  await expect(page).toHaveURL(/\/ar\/privacy$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator("header [data-lang-switch]").click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test("privacy and contact show the support email", async ({ page }) => {
  for (const path of ["/privacy", "/contact", "/ar/contact"]) {
    await page.goto(path);
    await expect(page.locator(`main a[href="mailto:${brand.supportEmail}"]`).first()).toBeVisible();
  }
});

test("phone pictures load in the page's language", async ({ page }) => {
  for (const lang of ["en", "ar"]) {
    await page.goto(lang === "ar" ? "/ar" : "/");
    const hero = page.locator(".mk-hero img");
    await expect(hero).toHaveCount(2);
    for (const img of await hero.all()) {
      expect(decodeURIComponent((await img.getAttribute("src")) ?? "")).toContain(`-${lang}.webp`);
      expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
  }
});

test("business sites still open next to the marketing pages", async ({ page }) => {
  const slug = `${brand.brandShortName.toLowerCase().replace(/[^a-z0-9]/g, "")}menu`.slice(0, 30);
  const response = await page.goto(`/${slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-template]").first()).toBeVisible();
});
