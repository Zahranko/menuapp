import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The shared card options and the hero slider on every template, through fixture previews (lib/fixtures.ts
 * applyCardAndHeroOption): every card style passes the accessibility checks and keeps the page on the screen; borders
 * show as chosen; several hero photos become a slider that works with buttons, keys and swipes, runs on its own (but not
 * for visitors who prefer less motion), moves nothing on the page, and loads its photos one at a time.
 */

type Field = { key: string };
const fields = (t: (typeof registry.templates)[number]) => new Set((t.schema as Field[]).map((f) => f.key));
/** Templates with several pages show their products on the menu page. */
const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom"]);
const STYLES = ["flat", "outlined", "raised", "glass", "tinted", "minimal"];

async function open(page: Page, id: string, locale: string, options: string, suffix = "") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(`/_preview/fixture.${id}.default.${locale}.${options}${suffix}`);
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

const current = (page: Page) => page.locator(".kit-slider").first().evaluate((el) => [...el.querySelectorAll(".kit-slide")].findIndex((s) => s.classList.contains("is-active")));

for (const template of registry.templates) {
  const id = template.id;
  const menu = MULTI_PAGE.has(id) ? "/menu" : "";
  const keys = fields(template);

  test.describe(`${template.name}: cards`, () => {
    for (const style of STYLES) {
      test(`card style ${style} passes accessibility checks`, async ({ page }, info) => {
        test.skip(info.project.name !== "mobile", "checked once, on mobile");
        const errors = await open(page, id, "en", `card_${style}`, menu);
        await expect(page.locator(`[data-template="${id}"]`)).toHaveAttribute("data-card-style", style);
        expect(await page.locator(".kit-card").count(), "product cards").toBeGreaterThan(0);
        await noSideScroll(page);
        expect(await axe(page)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }

    test("border, corners, photo shape and spacing show as chosen (Arabic, soft color)", async ({ page }, info) => {
      const errors = await open(page, id, "ar", "card_tinted-border_thick-bc_c8102e-corners_large-photo_circle-spacing_airy", menu);
      const card = page.locator(".kit-card:visible").first();
      await card.scrollIntoViewIfNeeded();
      const style = await card.evaluate((el) => {
        const s = getComputedStyle(el);
        return { width: s.borderTopWidth, color: s.borderTopColor, radius: s.borderTopLeftRadius };
      });
      expect(style.width).toBe("4px");
      expect(style.color).toBe("rgb(200, 16, 46)");
      expect(style.radius).toBe("26px");
      const media = page.locator(".kit-card:visible .kit-card-media").first();
      if (await media.count()) {
        const box = await media.boundingBox();
        if (box && box.width > 0) expect(Math.abs(box.width - box.height), "a circle is as tall as it is wide").toBeLessThanOrEqual(2);
      }
      await noSideScroll(page);
      if (info.project.name === "mobile") expect(await axe(page)).toEqual([]);
      expect(errors).toEqual([]);
    });

    test("minimal cards keep only a line under each card", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "checked once, on desktop");
      await open(page, id, "en", "card_minimal-bc_accent-border_medium", menu);
      const card = page.locator(".kit-card:visible").first();
      const s = await card.evaluate((el) => {
        const c = getComputedStyle(el);
        return { top: c.borderTopWidth, bottom: c.borderBottomWidth, bg: c.backgroundColor, shadow: c.boxShadow };
      });
      expect(s).toEqual({ top: "0px", bottom: "2px", bg: "rgba(0, 0, 0, 0)", shadow: "none" });
    });
  });

  test.describe(`${template.name}: hero slider`, () => {
    test("one photo stays a still photo", async ({ page }) => {
      await open(page, id, "en", "card_auto");
      await expect(page.locator(".kit-slider")).toHaveCount(0);
      if (!keys.has("hero.image") && !keys.has("hero.images")) await expect(page.locator(".kit-hero-band")).toHaveCount(0);
    });

    for (const locale of ["en", "ar"] as const) {
      test(`buttons, keys and swipes change the photo, and nothing moves (${locale})`, async ({ page }, info) => {
        const errors = await open(page, id, locale, "slides_4-auto_off-trans_fade-ctrl_both");
        const slider = page.locator(".kit-slider").first();
        await slider.scrollIntoViewIfNeeded();
        await expect(slider).toBeVisible();
        const before = await slider.boundingBox();
        const count = await slider.locator(".kit-slide").count();
        expect(count).toBeGreaterThanOrEqual(3);
        // Only the first photo loads with the page, then the next one; the rest wait for their turn.
        await page.waitForLoadState("load");
        await expect(slider.locator(".kit-slide").nth(1).locator("img")).toHaveCount(1);
        await expect(slider.locator(".kit-slide").nth(2).locator("img")).toHaveCount(0);
        await expect(slider.locator(".kit-slide").nth(0).locator("img")).toHaveJSProperty("complete", true);

        await slider.locator(".kit-slider-next").click();
        expect(await current(page)).toBe(1);
        await expect(slider.locator(".kit-slider-dot").nth(1)).toHaveAttribute("aria-current", "true");
        await expect(slider.locator(".kit-slide").nth(0)).toHaveAttribute("aria-hidden", "true");
        await slider.locator(".kit-slider-dot").nth(count - 1).click();
        expect(await current(page)).toBe(count - 1);
        await slider.locator(".kit-slider-next").click();
        expect(await current(page), "after the last photo comes the first").toBe(0);
        await slider.locator(".kit-slider-prev").click();
        expect(await current(page)).toBe(count - 1);

        // Arrow keys follow the reading direction: in Arabic the left arrow shows the next photo.
        await slider.locator(".kit-slider-dot").first().click();
        await page.keyboard.press(locale === "ar" ? "ArrowLeft" : "ArrowRight");
        expect(await current(page)).toBe(1);
        await page.keyboard.press(locale === "ar" ? "ArrowRight" : "ArrowLeft");
        expect(await current(page)).toBe(0);

        // A swipe toward the start of the line shows the next photo.
        const box = (await slider.boundingBox())!;
        const y = box.y + box.height / 2;
        const [from, to] = locale === "ar" ? [box.x + 40, box.x + box.width - 40] : [box.x + box.width - 40, box.x + 40];
        await slider.dispatchEvent("pointerdown", { pointerType: "touch", clientX: from, clientY: y, isPrimary: true });
        await slider.dispatchEvent("pointerup", { pointerType: "touch", clientX: to, clientY: y + 6, isPrimary: true });
        expect(await current(page)).toBe(1);

        const after = await slider.boundingBox();
        expect(after?.width).toBeCloseTo(before!.width, 0);
        expect(after?.height).toBeCloseTo(before!.height, 0);
        await noSideScroll(page);
        if (info.project.name === "mobile") expect(await axe(page)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }

    test("plays on its own, pauses with its button, and stays still for reduced motion", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "checked once, on desktop");
      await page.mouse.move(0, 0);
      await open(page, id, "en", "slides_3-speed_fast-trans_zoom");
      const slider = page.locator(".kit-slider").first();
      await expect(slider).toHaveAttribute("data-playing", "true");
      await expect.poll(() => current(page), { timeout: 6000 }).toBe(1);
      const pause = slider.locator(".kit-slider-pause");
      await expect(pause).toHaveAttribute("aria-label", "Pause the photos");
      await pause.click();
      await expect(pause).toHaveAttribute("aria-label", "Play the photos");
      await page.mouse.move(0, 0);
      await page.locator("body").focus();
      const index = await current(page);
      await page.waitForTimeout(3600);
      expect(await current(page), "paused").toBe(index);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, id, "en", "slides_3-speed_fast");
      await expect(page.locator(".kit-slider").first()).not.toHaveAttribute("data-playing", "true");
      await expect(page.locator(".kit-slider-pause")).toHaveCount(0);
      await page.waitForTimeout(3600);
      expect(await current(page), "no autoplay for reduced motion").toBe(0);
    });

    if (keys.has("hero.height")) {
      test("height options", async ({ page }) => {
        const viewport = page.viewportSize()!;
        const box = keys.has("hero.image") || keys.has("hero.images") ? ".kit-hero" : ".kit-hero-band";
        await open(page, id, "en", "slides-height_full");
        const full = (await page.locator(box).first().boundingBox())!;
        expect(full.height).toBeGreaterThanOrEqual(box === ".kit-hero" ? viewport.height - 1 : Math.min(viewport.height - 100, 320));
        await open(page, id, "en", "slides-height_short");
        const short = (await page.locator(box).first().boundingBox())!;
        // A short top still grows to fit its text (big headlines on a desktop can make it as tall as a full one).
        expect(short.height).toBeLessThanOrEqual(full.height);
        await noSideScroll(page);
      });
    }

    if (keys.has("hero.textPosition")) {
      for (const position of ["center", "bottom", "start"]) {
        test(`text ${position} on the photo, darkened`, async ({ page }, info) => {
          const errors = await open(page, id, "ar", `slides-text_${position}-overlay_strong-height_medium`);
          const hero = page.locator(".kit-hero").first();
          const align = await hero.evaluate((el) => getComputedStyle(el).textAlign);
          expect(align).toBe(position === "center" ? "center" : "start");
          if (keys.has("hero.overlay")) expect(await hero.locator(".kit-slide img").first().evaluate((el) => getComputedStyle(el).filter)).toBe("brightness(0.35)");
          const text = (await hero.locator(".kit-hero-text").boundingBox())!;
          const area = (await hero.boundingBox())!;
          expect(text.y).toBeGreaterThanOrEqual(area.y - 1);
          expect(text.y + text.height).toBeLessThanOrEqual(area.y + area.height + 1);
          await noSideScroll(page);
          if (info.project.name === "mobile") expect(await axe(page)).toEqual([]);
          expect(errors).toEqual([]);
        });
      }
    }
  });
}
