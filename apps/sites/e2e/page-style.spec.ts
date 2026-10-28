import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The shared "Page style" options (templates/_kit/style.css) on every template, through fixture previews
 * (lib/fixtures.ts): two strongly different combinations, in English and in Arabic, pass the accessibility checks and
 * keep the page on the screen; motion on scroll runs only for visitors who don't ask for less motion; long words in
 * headings never break in the middle on a phone; outlined headings are only the large ones, never Arabic; the paper
 * texture becomes a fine grain on dark themes; round card photos never grow past the size the template gives them.
 */

const MULTI_PAGE = new Set(["maison", "lumen", "atlas", "ember", "bloom", "couture"]);
const COMBOS = {
  playful: "ts_larger-hs_uppercase-tr_wide-sp_airy-btn_outline-pic_circle-div_wave-tex_dots-mo_playful",
  bold: "ts_big-hs_condensed-sp_compact-btn_shadow-pic_arch-div_zigzag-tex_grain-mo_rise",
  quiet: "ts_smaller-hs_outlined-tr_tight-btn_underline-pic_blob-div_slant-tex_paper-mo_fade",
};

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

/**
 * Words in headings that wrap in the middle or run past the screen's edge, as { heading, word, off } where heading is
 * the heading's place on the page and off tells a word past the edge from one cut in two.
 */
const brokenWords = (page: Page) =>
  page.evaluate(() => {
    const out: { heading: number; word: string; off: boolean }[] = [];
    [...document.querySelectorAll("[data-template] :is(h1, h2, h3)")].forEach((h, heading) => {
      if (!h.getClientRects().length) return;
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (const m of (n as Text).data.matchAll(/\S+/g)) {
          const r = document.createRange();
          r.setStart(n, m.index!);
          r.setEnd(n, m.index! + m[0].length);
          const lines = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
          const box = r.getBoundingClientRect();
          if (lines.size > 1) out.push({ heading, word: `${m[0]} in ${h.tagName}`, off: false });
          else if (box.right > innerWidth + 0.5 || box.left < -0.5) out.push({ heading, word: `${m[0]} in ${h.tagName}`, off: true });
        }
      }
    });
    return out;
  });

/** Headings drawn as outlines, with their font size and language. */
const outlined = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-template] :is(h1, h2, h3, h4)")]
      .filter((h) => h.getClientRects().length && parseFloat(getComputedStyle(h).webkitTextStrokeWidth) > 0)
      .map((h) => ({ text: h.textContent!.slice(0, 30), size: parseFloat(getComputedStyle(h).fontSize), arabic: h.closest("[lang]")?.getAttribute("lang") === "ar" })),
  );

/** Scroll-driven page style animations running on the page. */
const styleAnimations = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => (a as CSSAnimation).animationName?.startsWith("kit-ps-")).length);

for (const template of registry.templates) {
  const id = template.id;
  const ownMotion = !(template.schema as { key: string }[]).some((f) => f.key === "style.motion");
  const pages = MULTI_PAGE.has(id) ? ["", "/menu"] : [""];

  test.describe(`${template.name}: page style`, () => {
    for (const [name, options] of Object.entries(COMBOS)) {
      for (const locale of ["en", "ar"]) {
        test(`${name} (${locale}) passes accessibility checks and fits the screen`, async ({ page }, info) => {
          test.skip(info.project.name !== "mobile" && locale === "ar", "Arabic checked on mobile");
          await page.emulateMedia({ reducedMotion: "reduce" });
          for (const sub of pages) {
            const errors = await open(page, `/_preview/fixture.${id}.default.${locale}.${options}${sub}`);
            await expect(page.locator(`[data-template="${id}"]`)).toHaveAttribute("data-ps-btn", /.+/);
            await noSideScroll(page);
            if (info.project.name === "mobile") expect(await axe(page), sub || "home").toEqual([]);
            expect(await styleAnimations(page), "nothing moves for visitors who prefer less motion").toBe(0);
            expect(errors).toEqual([]);
          }
        });
      }
    }

    test("long words in headings never break in the middle on a phone", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "a phone question");
      // Measured at rest: an opening animation (Ember's scaling, tilting title) can catch a word mid-move.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 360, height: 800 });
      for (const locale of ["en", "ar"]) {
        for (const sub of pages) {
          // A few headings run past the edge on purpose (Ember's cropped opening line, a long word the template already
          // breaks): those are left as the template draws them; any other break is the page style's.
          await open(page, `/_preview/fixture.${id}.default.${locale}${sub}`);
          const before = await brokenWords(page);
          const cropped = new Set(before.filter((w) => w.off).map((w) => w.heading));
          const cut = new Set(before.map((w) => w.word));
          for (const options of ["ts_big-hs_uppercase-tr_wide", "ts_larger-hs_condensed-tr_wide", "hs_uppercase-tr_wide"]) {
            await open(page, `/_preview/fixture.${id}.default.${locale}.${options}${sub}`);
            const broken = (await brokenWords(page)).filter((w) => !(w.off && cropped.has(w.heading)) && !cut.has(w.word));
            expect(broken.map((w) => w.word), `${locale} ${options} ${sub}`).toEqual([]);
          }
        }
      }
    });

    test("outlined headings are only the large display ones, and never Arabic", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "checked on a phone");
      for (const sub of pages) {
        await open(page, `/_preview/fixture.${id}.default.en.hs_outlined${sub}`);
        for (const h of await outlined(page)) expect(h.size, `"${h.text}" is outlined`).toBeGreaterThanOrEqual(26);
        await open(page, `/_preview/fixture.${id}.default.ar.hs_outlined${sub}`);
        expect((await outlined(page)).filter((h) => h.arabic)).toEqual([]);
      }
    });

    test("round card photos keep the size the template gives them", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "checked on a phone");
      const sub = pages.at(-1);
      const thumbs = () =>
        page.evaluate(() =>
          [...document.querySelectorAll(".kit-card-media:not(.kit-flush), .kit-cat-media:not(.kit-flush)")]
            .filter((e) => e.getClientRects().length && !e.matches('[data-k~="overlay"]'))
            .slice(0, 6)
            .map((e) => e.getBoundingClientRect().width),
        );
      await open(page, `/_preview/fixture.${id}.default.en${sub}`);
      const before = await thumbs();
      for (const options of ["photo_circle", "pic_circle"]) {
        await open(page, `/_preview/fixture.${id}.default.en.${options}${sub}`);
        const after = await thumbs();
        after.forEach((w, i) => expect(w, `${options} photo ${i + 1}`).toBeLessThanOrEqual(Math.max(before[i] ?? w, 0) + 1));
      }
    });

    test("motion on scroll runs only when chosen", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile" || ownMotion, "checked once, on templates with the shared motion option");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await open(page, `/_preview/fixture.${id}.default.en.mo_rise${pages.at(-1)}`);
      expect(await styleAnimations(page)).toBeGreaterThan(0);
      await open(page, `/_preview/fixture.${id}.default.en${pages.at(-1)}`);
      expect(await styleAnimations(page)).toBe(0);
    });
  });
}

test("the paper texture is a plain fine grain on a dark theme", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "checked once");
  const texture = async (path: string) => {
    await open(page, path);
    return page.locator("[data-template]").evaluate((el) => getComputedStyle(el).backgroundImage);
  };
  // Maison's default theme is dark; Souq's is light.
  expect(await texture("/_preview/fixture.maison.default.en.tex_paper")).toContain("baseFrequency='0.9'");
  expect(await texture("/_preview/fixture.souq.default.en.tex_paper")).toContain("baseFrequency='0.03 0.5'");
});
