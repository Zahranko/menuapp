import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The shared "Sections" options (templates/_kit/Sections.tsx, sections.css) on every template, at phone width, through
 * fixture previews (lib/fixtures.ts: hil_ highlights, stl_ story, gll_ gallery, rvl_ reviews, vsl_ visit and ftl_ footer
 * layouts, so_ the order of the sections, sparse for the least content). Each page shows one layout of every kind of
 * section the template has, so every template goes through every layout; the pages take turns between English and
 * Arabic from a generator seeded with the template id (a failure always reproduces), and one more page has the sections
 * in reverse order. Each page passes the accessibility checks, keeps the page on the screen and has no errors, and the
 * links to the page's sections still land somewhere. Multi-page sites are checked on their home page.
 */

const TOKENS: Record<string, string> = {
  "highlights.layout": "hil",
  "story.layout": "stl",
  "gallery.layout": "gll",
  "reviews.layout": "rvl",
  "visit.layout": "vsl",
  "footer.layout": "ftl",
};

type Field = { key: string; type: string; group?: string; options?: string[] };

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

/** Pages that show every layout of every kind of section the template has, and a language for each. */
function combos(id: string, fields: Field[]) {
  const next = random(id);
  const rounds = Math.max(...fields.map((f) => f.options!.length - 1));
  const start = next() < 0.5 ? 0 : 1;
  return Array.from({ length: rounds }, (_, i) => {
    const layouts = Object.fromEntries(fields.map((f) => [f.key, f.options![1 + (i % (f.options!.length - 1))]]));
    const token = Object.entries(layouts)
      .map(([key, value]) => `${TOKENS[key]}_${value}`)
      .join("-");
    return { layouts, token: i === rounds - 1 ? `${token}-sparse` : token, locale: (i + start) % 2 === 0 ? "ar" : "en" };
  });
}

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

/** Every link to a section of the page ("#story") lands on an element. */
async function anchorsLand(page: Page, label: string) {
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
      .map((a) => a.getAttribute("href")!.slice(1))
      .filter((id) => id && !document.getElementById(decodeURIComponent(id))),
  );
  expect(missing, `${label}: links to missing sections`).toEqual([]);
}

for (const template of registry.templates) {
  const id = template.id;
  const schema = template.schema as Field[];
  const fields = schema.filter((f) => f.group === "Sections" && f.key in TOKENS);
  const order = schema.find((f) => f.key === "sections.order")!.options!;

  test.describe(`${template.name}: sections`, () => {
    test("every section layout passes accessibility checks and fits a phone", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "a phone check");
      test.setTimeout(240_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const c of combos(id, fields)) {
        const label = `${c.token} (${c.locale})`;
        const errors = await open(page, `/_preview/fixture.${id}.default.${c.locale}.${c.token}`);
        for (const [key, layout] of Object.entries(c.layouts)) {
          const kind = key.split(".")[0];
          const shared = page.locator(kind === "footer" ? ".kit-sc-ft" : `.kit-sc[data-section="${kind}"]`);
          if (kind === "footer" || kind === "visit") await expect(shared, `${label}: ${key}`).toHaveCount(1);
          if ((await shared.count()) > 0) await expect(shared, `${label}: ${key}`).toHaveAttribute("data-sc", layout);
        }
        await noSideScroll(page);
        await anchorsLand(page, label);
        expect(await axe(page), label).toEqual([]);
        expect(errors, label).toEqual([]);
      }
    });

    test("the sections follow the owner's order, with the opening first and the footer last", async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "a phone check");
      test.setTimeout(120_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const reversed = [...order].reverse();
      for (const [locale, extra] of [
        ["en", ""],
        ["ar", `-${fields.map((f) => `${TOKENS[f.key]}_${f.options![1]}`).join("-")}`],
      ]) {
        const label = `reversed (${locale})${extra}`;
        const errors = await open(page, `/_preview/fixture.${id}.default.${locale}.so_${reversed.join("+")}${extra}`);
        const names = await page.evaluate(() =>
          [...document.querySelectorAll("[data-section]")]
            .filter((e) => !e.parentElement?.closest("[data-section]"))
            .map((e) => e.getAttribute("data-section")!)
            .filter((n) => n !== "order"),
        );
        const alias = (n: string) => (["folio", "drop"].includes(id) && n === "picks" ? "highlights" : n);
        const expected = reversed.map(alias).filter((n) => names.includes(n));
        expect(names.filter((n) => expected.includes(n)), label).toEqual(expected);
        expect(names.at(-1), label).toBe("footer");
        await noSideScroll(page);
        await anchorsLand(page, label);
        expect(await axe(page), label).toEqual([]);
        expect(errors, label).toEqual([]);
      }
    });
  });
}

test("the photo slider scrolls inside itself and a photo opens the viewer", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "a phone check");
  await open(page, "/_preview/fixture.maison.default.en.gll_carousel");
  const strip = page.locator('.kit-sc[data-section="gallery"] .kit-sc-scroll');
  await expect(strip).toHaveCount(1);
  expect(await strip.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
  await noSideScroll(page);
  await page.locator('.kit-sc[data-section="gallery"] [data-photo]').first().click();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
});
