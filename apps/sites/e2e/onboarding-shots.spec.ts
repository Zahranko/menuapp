import fs from "node:fs";
import path from "node:path";
import { test, type Page } from "@playwright/test";
import registry from "../templates/registry.json";

/**
 * The mobile app's onboarding pictures (apps/mobile/assets/onboarding/{site,products,templates}_{en,ar}.webp, 780 × 1688).
 * Run all three steps with scripts/onboarding-shots.sh. Skipped unless ONBOARDING_SHOTS (a work folder) is set:
 *   1. ONBOARDING_SHOTS=<dir> npx playwright test --project=mobile onboarding-shots
 *      saves the showcase site (lib/fixtures.ts showcaseSite) at phone size and, for the app screenshots,
 *      the sample product pictures and template thumbnails as PNG under <dir>/img.
 *   2. The Flutter harness (apps/mobile/test/onboarding_shots_test.dart) saves the app screens into <dir>.
 *   3. ONBOARDING_STEP=finish ONBOARDING_SHOTS=<dir> npx playwright test --project=mobile onboarding-shots
 *      cuts, frames and encodes everything as WebP into the app's assets.
 * The top 50 points of every picture stay empty: the app draws its own status bar there.
 */
const dir = process.env.ONBOARDING_SHOTS;
const finish = process.env.ONBOARDING_STEP === "finish";
test.skip(!dir, "set ONBOARDING_SHOTS to a work folder to make the onboarding pictures");
test.beforeEach(() => test.skip(test.info().project.name !== "mobile", "phone pictures, made once"));

const PHONE = { width: 390, height: 844 };
const STATUS_BAR = 50;
const ASSETS = path.resolve(__dirname, "../../mobile/assets/onboarding");

test.describe("capture", () => {
  test.skip(finish, "capture step");

  for (const lang of ["en", "ar"]) {
    test(`showcase site ${lang}`, async ({ browser }) => {
      // Phone height minus the status bar; the finish step puts the status bar band back on top.
      const page = await browser.newPage({ viewport: { width: PHONE.width, height: PHONE.height - STATUS_BAR }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
      await page.goto(lang === "ar" ? "/showcasear" : "/showcase");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${dir}/site-${lang}.png` });
      await page.close();
    });
  }

  test("pictures for the app screens", async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 1, isMobile: false });
    const food = path.resolve(__dirname, "../public/samples/food");
    fs.mkdirSync(`${dir}/img/photos`, { recursive: true });
    for (const file of fs.readdirSync(food).filter((f) => f.endsWith(".svg"))) {
      const svg = fs.readFileSync(path.join(food, file), "utf8");
      await page.setContent(`<html><head><style>body{margin:0}svg{display:block;width:200px;height:200px}</style></head><body>${svg}</body></html>`);
      await page.screenshot({ path: `${dir}/img/photos/${file.replace(".svg", ".png")}` });
    }
    for (const t of registry.templates) {
      fs.mkdirSync(`${dir}/img/templates/${t.id}`, { recursive: true });
      fs.copyFileSync(path.resolve(__dirname, `../public/templates/${t.id}/thumbnail.png`), `${dir}/img/templates/${t.id}/thumbnail.png`);
    }
    await page.close();
  });
});

/** Draws a picture into a 780 × 1688 canvas in the browser and returns it as WebP. */
async function encode(page: Page, png: Buffer, plan: { kind: "site" } | { kind: "cut"; from: number; to: number }): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    async ({ src, plan, w, h, status }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext("2d")!;
      if (plan.kind === "site") {
        // The status bar band takes the color of the site's first row of pixels.
        g.drawImage(img, 0, 0, w, 1, 0, 0, w, status);
        g.drawImage(img, 0, 0, w, h - status, 0, status, w, h - status);
      } else {
        // Leaves out the rows from..to (a bar the picture does not need) and keeps the rest from the top.
        g.drawImage(img, 0, 0, w, plan.from, 0, 0, w, plan.from);
        g.drawImage(img, 0, plan.to, w, h - plan.from, 0, plan.from, w, h - plan.from);
      }
      return canvas.toDataURL("image/webp", 0.82);
    },
    { src: `data:image/png;base64,${png.toString("base64")}`, plan, w: PHONE.width * 2, h: PHONE.height * 2, status: STATUS_BAR * 2 },
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test.describe("finish", () => {
  test.skip(!finish, "set ONBOARDING_STEP=finish after the Flutter harness ran");

  test("onboarding pictures as WebP", async ({ page }) => {
    // The bars to leave out of the app screens, in logical pixels, as the Flutter harness measured them.
    const bars = JSON.parse(fs.readFileSync(`${dir}/rects.json`, "utf8")) as Record<string, [number, number, number, number]>;
    for (const lang of ["en", "ar"]) {
      fs.writeFileSync(`${ASSETS}/site_${lang}.webp`, await encode(page, fs.readFileSync(`${dir}/site-${lang}.png`), { kind: "site" }));
      for (const shot of ["products", "templates"]) {
        const [, top, , bottom] = bars[`${shot}-${lang}-bar`];
        // The templates screen keeps its status bar space and loses only the header under it.
        const from = Math.round((shot === "templates" ? Math.max(top, STATUS_BAR) : top) * 2);
        const webp = await encode(page, fs.readFileSync(`${dir}/${shot}-${lang}.png`), { kind: "cut", from, to: Math.round(bottom * 2) });
        fs.writeFileSync(`${ASSETS}/${shot}_${lang}.webp`, webp);
      }
    }
  });
});
