import { expect, test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";
import tickerSettings from "../templates/_kit/ticker-settings.json";
import { stripIssues, type PageIssue } from "./page-checks";

/**
 * The owner's moving strip (_kit/ticker.ts, "Moving strip" group) on every template that has one, through fixture
 * previews of the production build, in English and Arabic: each shape, color (the owner's own colors among them),
 * separator, speed and edge shows the strip with its words readable on what is behind them, keeps the page on the screen,
 * and does what it says (a strip standing still doesn't move, "none" shows no separator, the others draw one).
 *
 * TEMPLATES=<id,id> checks some templates only.
 */

type Field = { key: string; options?: string[] };
const fields = tickerSettings.fields as Field[];
const optionsOf = (key: string) => (fields.find((f) => f.key === key)?.options ?? []).filter((o) => o !== "auto");
const only = process.env.TEMPLATES?.split(",").filter(Boolean);
const templates = (registry.templates as { id: string; name: string; schema: { key: string }[] }[]).filter(
  (t) => t.schema.some((f) => f.key === "ticker.style") && (!only || only.includes(t.id)),
);

/** Each option on its own, as fixture tokens, with the root attribute it must set. */
const CASES: { token: string; attr: string; value: string }[] = [
  ...optionsOf("ticker.style").map((v) => ({ token: `tks_${v}`, attr: "data-tk-style", value: v })),
  ...optionsOf("ticker.color")
    .filter((v) => v !== "custom")
    .map((v) => ({ token: `tkc_${v}`, attr: "data-tk-color", value: v })),
  // The owner's own colors: a light one, a dark one and a middle one, where the text must pick its side.
  ...["ffc21a", "141110", "e5281e", "1f6feb"].map((hex) => ({ token: `tkc_custom-tkbg_${hex}`, attr: "data-tk-color", value: "custom" })),
  ...optionsOf("ticker.separator").map((v) => ({ token: `tksep_${v}`, attr: "data-tk-sep", value: v })),
  ...optionsOf("ticker.speed").map((v) => ({ token: `tksp_${v}`, attr: "data-tk-speed", value: v })),
  ...optionsOf("ticker.edge").map((v) => ({ token: `tke_${v}`, attr: "data-tk-edge", value: v })),
  // Shapes that draw text straight on the page, with the owner's colors.
  ...["outline", "neon", "tags", "double"].map((v) => ({ token: `tks_${v}-tkc_paper`, attr: "data-tk-style", value: v })),
  { token: "tks_tilted-tkc_ink-tksep_star-tksp_still-tke_zigzag", attr: "data-tk-speed", value: "still" },
];

async function open(page: Page, path: string): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`page error: ${e.message}`));
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

test.describe.configure({ mode: "parallel" });

for (const template of templates) {
  for (const locale of ["en", "ar"]) {
    test(`${template.name}: every moving strip option (${locale})`, async ({ page }, info) => {
      test.skip(info.project.name !== "mobile", "checked on a phone");
      test.setTimeout(180_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const found: string[] = [];
      const report = (path: string, issues: PageIssue[]) => found.push(...issues.map((i) => `${path} [${i.category}] ${i.detail}`));

      // Left on "auto", nothing is marked.
      const plain = `/_preview/fixture.${template.id}.default.${locale}`;
      found.push(...(await open(page, plain)));
      expect(await page.locator('[data-k~="ticker"]').count(), `${plain}: no strip marked on auto`).toBe(0);

      for (const c of CASES) {
        const path = `/_preview/fixture.${template.id}.default.${locale}.${c.token}`;
        found.push(...(await open(page, path)));
        const root = page.locator("[data-template]").first();
        if ((await root.getAttribute(c.attr)) !== c.value) found.push(`${path} [attribute] ${c.attr} is not "${c.value}"`);
        const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (sideways > 0) found.push(`${path} [sideways-scroll] ${sideways}px`);
        const strips = page.locator('[data-k~="ticker"]');
        const count = await strips.count();
        if (!count) report(path, await page.evaluate(stripIssues, null));
        for (let i = 0; i < count; i++) {
          await strips.nth(i).scrollIntoViewIfNeeded();
          report(path, await page.evaluate(stripIssues, i));
        }
        if (c.token.includes("tksp_still")) {
          const moving = await page.locator('[data-k~="ticker-track"]').evaluateAll((els) => els.filter((e) => getComputedStyle(e).animationName !== "none").length);
          if (moving) found.push(`${path} [still] ${moving} strip(s) still move`);
        }
        if (c.attr === "data-tk-sep") {
          const marks = await page.locator('[data-k~="ticker-item"]').evaluateAll((els) => els.map((e) => getComputedStyle(e, "::after").content));
          const drawn = marks.filter((m) => m !== "none" && m !== "normal").length;
          if (c.value === "none" && drawn) found.push(`${path} [separator] ${drawn} separators drawn`);
          if (c.value !== "none" && !drawn) found.push(`${path} [separator] none drawn`);
        }
      }
      expect([...new Set(found)]).toEqual([]);
    });
  }
}
