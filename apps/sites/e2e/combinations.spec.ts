import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { combination, combinationCount, templates, type Combination } from "./combinations";
import { floatingCoverIssues, headerControlIssues, headingOverlaps } from "./page-checks";

/**
 * Random design combinations on every template (e2e/combinations.ts): owners can mix colors, fonts, looks, every shared
 * group and the template's signature options, so each template renders random mixes from the production build, on a
 * phone and a desktop, half of them in Arabic, and each page must:
 *
 * - pass axe (WCAG 2 A and AA, plus 2.2 AA target size: tap targets at least 24px or spaced apart),
 * - keep the page on the screen (no sideways scroll) and log no page or console errors,
 * - keep the text of headings and buttons inside their boxes, and no text cut off by a box that hides its overflow,
 * - keep the main call to action and the floating buttons uncovered by fixed or sticky bars, and on the first screen keep
 *   the headings and the opening's text clear of floating buttons (e2e/page-checks.ts: a bar or pill over the opening's
 *   text was missed while only bars covering buttons were checked),
 * - show text or an icon that stands out on every button and link of the header (no empty pill),
 * - keep the lines of Arabic headings from running into each other,
 * - give every image an alt text,
 * - keep text readable on what is really behind it: text over photos, gradients and decorations (what axe can't
 *   judge) is measured on a screenshot of the page with the text hidden.
 *
 * Two combinations per template by default (CI); COMBOS=1 runs twelve, COMBOS=<n> runs n. COMBO_SHOTS=<dir> saves a
 * screenshot of the top of each page there (contact sheets), COMBO_REPORT=<file> writes what each page found. Each failure prints the page address, which reproduces it.
 */

const COUNT = combinationCount();
const SHOTS = process.env.COMBO_SHOTS;
/** COMBO_REPORT=<file> appends one JSON line per combination (its address, values and issues), to sort issues by kind. */
const REPORT = process.env.COMBO_REPORT;
const wordmark = readFileSync(path.join(__dirname, "assets", "wordmark.png"));

/** A flat picture of the size in its address (".../3-300x1500.svg"). */
function photo(url: string): string {
  const [, n = "1", w = "100", h = "100"] = /\/(\d+)-(\d+)x(\d+)\.svg/.exec(url) ?? [];
  const hue = (Number(n) * 47) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="hsl(${hue} 50% 60%)"/><circle cx="50%" cy="50%" r="30%" fill="hsl(${hue} 50% 30%)"/></svg>`;
}

test.beforeEach(async ({ page }) => {
  await page.route("https://fixture-photo.invalid/**", (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: photo(route.request().url()) }));
  await page.route("https://fixture-logo.invalid/**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: wordmark }));
});

type Issue = { category: string; detail: string };

/** Loads the page, waits for fonts and lets lazy pictures load by scrolling through it once. */
async function open(page: Page, combo: Combination): Promise<{ errors: string[]; path: string }> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  let target = combo.path;
  let response = await page.goto(target);
  // An inner page that doesn't exist for this content (a gallery page without photos): the home page instead.
  if (response?.status() === 404 && combo.page) {
    errors.length = 0;
    target = combo.path.slice(0, -combo.page.length);
    response = await page.goto(target);
  }
  expect(response?.status(), target).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo({ top: y, behavior: "instant" });
      await frame();
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await frame();
    await Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => ((i.onload = r), (i.onerror = r), setTimeout(r, 2000)))));
  });
  return { errors, path: target };
}

/** Layout checks that run in the page: overflowing and cut-off text, covered buttons, overlapping bars, alt texts. */
function layoutIssues(): Issue[] {
  const issues: Issue[] = [];
  const name = (el: Element) => {
    const parts: string[] = [];
    for (let e: Element | null = el; e && parts.length < 3 && e !== document.body; e = e.parentElement) {
      const cls = [...e.classList].slice(0, 2).join(".");
      const section = e.getAttribute("data-section");
      parts.unshift(`${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ""}${cls ? `.${cls}` : ""}${section ? `[data-section=${section}]` : ""}`);
    }
    return parts.join(" > ");
  };
  const text = (el: Element) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && Number(s.opacity) > 0.05 && !el.closest("[aria-hidden=true], [inert], .sr-only, dialog:not([open])");
  };
  /** The boxes that the text nodes inside an element draw. */
  const textRects = (el: Element) => {
    const rects: DOMRect[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      // Decorations (hidden from screen readers, or drawn in SVG, like a stamp around a photo) may stick out.
      if (!n.textContent?.trim() || n.parentElement?.closest("[aria-hidden=true], svg")) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      rects.push(...[...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0));
    }
    return rects;
  };
  const truncates = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.textOverflow === "ellipsis" || (s.webkitLineClamp && s.webkitLineClamp !== "none")) return true;
    }
    return false;
  };
  const moving = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) if (getComputedStyle(e).animationName !== "none" || e.matches("[data-marquee], [class*=marquee], [class*=ticker]")) return true;
    return false;
  };

  // Text of headings and buttons that runs out of its box.
  for (const el of document.querySelectorAll("h1, h2, h3, h4, h5, h6, button, [data-k=btn], [role=button]")) {
    if (!visible(el) || getComputedStyle(el).display === "inline" || truncates(el)) continue;
    const box = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (s.overflowX === "auto" || s.overflowX === "scroll") continue;
    const out = textRects(el).some((r) => r.right > box.right + 2 || r.left < box.left - 2);
    if (el.scrollWidth > el.clientWidth + 1 && out) issues.push({ category: "text-overflow", detail: `${name(el)} "${text(el)}" (${el.scrollWidth} > ${el.clientWidth})` });
  }

  // Text cut off by a box that hides its overflow (or by the page itself).
  const clipped = new Set<Element>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!parent || !n.textContent?.trim() || clipped.has(parent) || !visible(parent) || truncates(parent) || moving(parent)) continue;
    if (parent.closest("script, style, noscript, template, select, option")) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    // The glyphs, roughly: a line box is taller than its letters (Arabic fonts most of all).
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => new DOMRect(r.x, r.y + r.height * 0.2, r.width, r.height * 0.6));
    if (!rects.length) continue;
    for (let a: Element | null = parent; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      // Inside a box that scrolls sideways (a slider): the rest shows when it is scrolled.
      if ((s.overflowX === "auto" || s.overflowX === "scroll") && a !== document.documentElement) break;
      const hidesX = s.overflowX === "hidden" || s.overflowX === "clip";
      const hidesY = s.overflowY === "hidden" || s.overflowY === "clip";
      if (!hidesX && !hidesY) continue;
      const box = a.getBoundingClientRect();
      if (box.width <= 2 || box.height <= 2) break; // visually hidden text
      // The padding box (clientWidth is not reliable on buttons).
      const root = a === document.documentElement || a === document.body;
      const left = root ? 0 : box.left + parseFloat(s.borderLeftWidth);
      const right = root ? window.innerWidth : box.right - parseFloat(s.borderRightWidth);
      const top = root ? -window.scrollY : box.top + parseFloat(s.borderTopWidth);
      const bottom = root ? Infinity : box.bottom - parseFloat(s.borderBottomWidth);
      const cutX = hidesX && rects.some((r) => r.left < left - 2 || r.right > right + 2);
      const cutY = hidesY && rects.some((r) => r.top < top - 2 || r.bottom > bottom + 2);
      // A scrolling box (a slider) shows the rest when scrolled: only text cut where it can't scroll counts.
      const scrolls = (s.overflowX === "auto" || s.overflowX === "scroll") && !cutY;
      if ((cutX || cutY) && !scrolls) {
        clipped.add(parent);
        issues.push({ category: "text-clipped", detail: `${name(parent)} "${text(parent)}" cut ${cutX ? "sideways" : "top/bottom"} by ${name(a)}` });
        break;
      }
    }
  }

  // Fixed bars and floating buttons: none may cover the main call to action or each other.
  /** The fixed bar an element is in, or the sticky one while it is stuck (in its place in the page it is just content). */
  const pinned = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.position === "fixed") return e;
      if (s.position === "sticky") {
        const r = e.getBoundingClientRect();
        const top = s.top !== "auto" && Math.abs(r.top - parseFloat(s.top)) < 2;
        const bottom = s.bottom !== "auto" && Math.abs(window.innerHeight - r.bottom - parseFloat(s.bottom)) < 2;
        if (top || bottom) return e;
      }
    }
    return null;
  };
  const covered = (el: Element, label: string) => {
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= window.innerHeight || r.width < 2) return;
    const own = pinned(el);
    const points = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.left + 4, r.top + 4],
      [r.right - 4, r.bottom - 4],
    ];
    for (const [x, y] of points) {
      if (y < 0 || y >= window.innerHeight || x < 0 || x >= window.innerWidth) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit || el.contains(hit) || hit.contains(el)) continue;
      const bar = pinned(hit);
      if (bar && bar !== own && !bar.contains(el)) {
        issues.push({ category: "covered", detail: `${label} ${name(el)} "${text(el)}" under ${name(bar)}` });
        return;
      }
    }
  };
  // The main call to action in the middle of the screen (at the very bottom of the first screen, any floating button may
  // lie over it until the page scrolls a little).
  const cta = [...document.querySelectorAll(".kit-hv [data-k=btn], [data-section=hero] [data-k=btn], [data-section=header] ~ * [data-k=btn], main [data-k=btn]")].find(visible);
  if (cta) {
    const y = window.scrollY;
    cta.scrollIntoView({ block: "center", behavior: "instant" });
    covered(cta, "main call to action");
    window.scrollTo({ top: y, behavior: "instant" });
  }
  const fixed = [...document.querySelectorAll("body *")].filter((el) => getComputedStyle(el).position === "fixed" && visible(el) && !el.closest("dialog"));
  const outer = fixed.filter((el) => !fixed.some((o) => o !== el && o.contains(el)));
  const small = outer.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width * r.height < window.innerWidth * window.innerHeight * 0.4;
  });
  for (const el of small) if (el.matches("a, button") || el.querySelector("a, button")) covered(el.matches("a, button") ? el : el.querySelector("a, button")!, "floating button");
  for (let i = 0; i < small.length; i++)
    for (let j = i + 1; j < small.length; j++) {
      const a = small[i].getBoundingClientRect();
      const b = small[j].getBoundingClientRect();
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 2 && h > 2) issues.push({ category: "covered", detail: `${name(small[i])} overlaps ${name(small[j])}` });
    }

  // Every image says what it shows, or says it shows nothing (alt="").
  for (const img of document.querySelectorAll("img:not([alt])")) issues.push({ category: "alt", detail: `${name(img)} ${(img as HTMLImageElement).src.slice(-60)}` });
  for (const svg of document.querySelectorAll("svg[role=img]:not([aria-label]):not([aria-labelledby])")) issues.push({ category: "alt", detail: name(svg) });
  return issues;
}

type TextSample = { selector: string; fg: [number, number, number, number]; large: boolean };

/** Text that axe couldn't judge (over photos, gradients, decorations): its color and whether it is large. */
function textSamples(selectors: string[]): TextSample[] {
  const out: TextSample[] = [];
  // Any CSS color (oklch, color-mix, color()) to sRGB, through a pixel painted on a canvas.
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const parse = (c: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  for (const selector of selectors.slice(0, 40)) {
    const el = document.querySelector(selector);
    if (!el) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || el.closest("[aria-hidden=true], dialog:not([open])")) continue;
    const size = parseFloat(s.fontSize);
    const bold = Number(s.fontWeight) >= 700;
    out.push({ selector, fg: parse(s.color), large: size >= 24 || (bold && size >= 18.66) });
  }
  return out;
}

/** Brings a text to the middle of the screen, hides the fixed and sticky bars that don't hold it, and says where its letters are. */
function placeText(selector: string) {
  for (const name of ["data-qa-hide", "data-qa-hide-before", "data-qa-hide-after"]) document.querySelectorAll(`[${name}]`).forEach((e) => e.removeAttribute(name));
  const el = document.querySelector(selector);
  if (!el) return [];
  el.scrollIntoView({ block: "center", behavior: "instant" });
  for (const e of document.querySelectorAll("body *")) {
    const position = getComputedStyle(e).position;
    if ((position === "fixed" || position === "sticky") && !e.contains(el)) e.setAttribute("data-qa-hide", "");
    // A fixed see-through layer over the whole page (film grain) lies over the text as much as its background.
    for (const pseudo of ["before", "after"]) {
      if (getComputedStyle(e, `::${pseudo}`).position === "fixed") e.setAttribute(`data-qa-hide-${pseudo}`, "");
    }
  }
  // Only what is on screen: inside the window and inside every box that clips it (a sideways row, a card).
  let box = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
  for (let a = el.parentElement; a; a = a.parentElement) {
    const st = getComputedStyle(a);
    if (st.overflowX === "visible" && st.overflowY === "visible") continue;
    const ar = a.getBoundingClientRect();
    box = { left: Math.max(box.left, ar.left), top: Math.max(box.top, ar.top), right: Math.min(box.right, ar.right), bottom: Math.min(box.bottom, ar.bottom) };
  }
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (const n of el.childNodes) {
    if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      const x = Math.max(box.left, r.left);
      const y = Math.max(box.top, r.top);
      const w = Math.min(box.right, r.right) - x;
      const h = Math.min(box.bottom, r.bottom) - y;
      // The line box is taller than the letters (and than a pill drawn around them): keep its middle half.
      if (w > 1 && h > 1) rects.push({ x, y: y + h / 4, w, h: h / 2 });
    }
  }
  return rects;
}

/** The contrast of a text color over the pixels of a screenshot of its place (taken with the text hidden). */
async function contrastOver({ png, fg }: { png: string; fg: [number, number, number, number] }): Promise<number | null> {
  const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const lum = (r: number, g: number, b: number) => {
    const c = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [fr, fgr, fb, fa] = fg;
  // Each 3x3 block is averaged first, as the eye does: the grain of a paper or noise texture doesn't count, a photo does.
  const ratios: number[] = [];
  const { width, height } = bitmap;
  for (let y = 0; y + 3 <= height; y += 3) {
    for (let x = 0; x + 3 <= width; x += 3) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const i = ((y + dy) * width + x + dx) * 4;
          r += data[i] / 9;
          g += data[i + 1] / 9;
          b += data[i + 2] / 9;
        }
      }
      const l1 = lum(fr * fa + r * (1 - fa), fgr * fa + g * (1 - fa), fb * fa + b * (1 - fa));
      const l2 = lum(r, g, b);
      ratios.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
    }
  }
  if (!ratios.length) return null;
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length * 0.2)];
}

/** Hides every text, and the bars and layers marked by placeText, so a screenshot shows only what is behind the text. */
const HIDE_TEXT =
  "*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; -webkit-text-stroke-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; transition: none !important; text-decoration-color: transparent !important; } [data-qa-hide], [data-qa-hide-before]::before, [data-qa-hide-after]::after { visibility: hidden !important; }";

/**
 * The contrast of each text over what is really behind it: the text is brought into view, the page is photographed with
 * every text hidden (and the fixed bars that don't hold it), and the text color is compared with the worst fifth of the
 * pixels under its letters.
 */
async function pixelContrast(page: Page, samples: TextSample[]): Promise<Issue[]> {
  const issues: Issue[] = [];
  for (const s of samples) {
    const rects = await page.evaluate(placeText, s.selector);
    // Its color once in place: a link in a menu bar that follows scrolling may have changed state on the way.
    const fg = (await page.evaluate(textSamples, [s.selector]))[0]?.fg ?? s.fg;
    const style = await page.addStyleTag({ content: HIDE_TEXT });
    let worst: number | null = null;
    for (const r of rects.slice(0, 4)) {
      const shot = await page.screenshot({ clip: { x: r.x, y: r.y, width: r.w, height: r.h }, scale: "css", animations: "disabled" });
      const ratio = await page.evaluate(contrastOver, { png: shot.toString("base64"), fg });
      if (ratio !== null) worst = worst === null ? ratio : Math.min(worst, ratio);
    }
    await style.evaluate((el) => (el as Element).remove());
    const need = s.large ? 3 : 4.5;
    if (worst !== null && worst < need) issues.push({ category: "contrast", detail: `${s.selector}: ${worst.toFixed(2)}:1 over its background (needs ${need}:1)` });
  }
  await page.evaluate(() => {
    for (const name of ["data-qa-hide", "data-qa-hide-before", "data-qa-hide-after"]) document.querySelectorAll(`[${name}]`).forEach((e) => e.removeAttribute(name));
  });
  return issues;
}

/** Every check on the open page. */
async function check(page: Page): Promise<Issue[]> {
  const issues: Issue[] = [];
  const width = page.viewportSize()!.width;
  const sideways = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
  if (sideways > 0 && width) issues.push({ category: "sideways-scroll", detail: `page is ${sideways}px wider than the screen` });

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  for (const v of axe.violations) {
    const category = v.id === "color-contrast" ? "contrast" : v.id === "target-size" ? "tap-target" : v.id === "image-alt" ? "alt" : `axe:${v.id}`;
    for (const n of v.nodes.slice(0, 6)) issues.push({ category, detail: `${v.id}: ${n.target.join(" ")}${v.id === "color-contrast" || v.id === "target-size" ? ` ${n.any[0]?.message ?? ""}` : ""}` });
  }
  const unsure = axe.incomplete.find((v) => v.id === "color-contrast")?.nodes.map((n) => n.target.join(" ")).filter((t) => !t.includes(" >>> ")) ?? [];

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  issues.push(...(await page.evaluate(layoutIssues)));
  issues.push(...(await page.evaluate(floatingCoverIssues)), ...(await page.evaluate(headerControlIssues)), ...(await page.evaluate(headingOverlaps, { arabicOnly: true })));
  // Floating buttons and bars at the end of the page as well.
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(100);
  const end = (await page.evaluate(layoutIssues)).filter((i) => i.category === "covered");
  issues.push(...end.filter((i) => !issues.some((o) => o.detail === i.detail)));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(100);

  issues.push(...(await pixelContrast(page, await page.evaluate(textSamples, unsure))));
  return issues;
}

/** COMBO_URL=<preview address> checks that one page (to look into a failure, or to try a fix). */
if (process.env.COMBO_URL) {
  test("one page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const url = process.env.COMBO_URL!;
    const { errors } = await open(page, { template: "", index: 0, locale: "en", look: null, values: {}, extras: [], page: "", path: url });
    const issues = [...errors.map((e) => ({ category: "errors", detail: e })), ...(await check(page))];
    expect(issues.map((i) => `[${i.category}] ${i.detail}`)).toEqual([]);
  });
}

/** COMBO_REPLAY=<file written by COMBO_REPORT> checks again the pages that had issues there (each on its own project). */
if (process.env.COMBO_REPLAY) {
  const failed = readFileSync(process.env.COMBO_REPLAY, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Combination & { project: string; issues: unknown[] })
    .filter((row) => row.issues.length);
  for (const row of failed) {
    test(`replay ${row.project} ${row.template} #${row.index}`, async ({ page }, info) => {
      test.skip(info.project.name !== row.project, "checked on its own project");
      test.setTimeout(90_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const { errors, path: opened } = await open(page, row);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${row.project}-${row.template}-${row.index + 1}.png`) });
      const issues = [...errors.map((e) => ({ category: "errors", detail: e })), ...(await check(page))];
      if (REPORT) appendFileSync(REPORT, `${JSON.stringify({ ...row, opened, issues })}\n`);
      expect(issues.map((i) => `[${i.category}] ${i.detail}`), opened).toEqual([]);
    });
  }
}

const describe = (c: Combination) => `${c.template} #${c.index} ${c.locale}${c.look ? ` look ${c.look}` : ""}${c.extras.length ? ` [${c.extras.join(", ")}]` : ""}`;

for (const template of process.env.COMBO_URL || process.env.COMBO_REPLAY ? [] : templates) {
  test.describe(`${template.name}: random combinations`, () => {
    for (let index = 0; index < COUNT; index++) {
      test(`combination ${index + 1}`, async ({ page }, info) => {
        test.setTimeout(90_000);
        await page.emulateMedia({ reducedMotion: "reduce" });
        const combo = combination(template, index, info.project.name);
        const { errors, path: opened } = await open(page, combo);
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-${template.id}-${index + 1}.png`) });
        const issues = [...errors.map((e) => ({ category: "errors", detail: e })), ...(await check(page))];
        if (REPORT) appendFileSync(REPORT, `${JSON.stringify({ project: info.project.name, ...combo, opened, issues })}\n`);
        const report = issues.map((i) => `[${i.category}] ${i.detail}`);
        if (report.length) {
          await info.attach("combination", { body: JSON.stringify({ ...combo, opened, issues }, null, 2), contentType: "application/json" });
        }
        expect(report, `${describe(combo)}\n${opened}\n${JSON.stringify(combo.values)}`).toEqual([]);
      });
    }
  });
}
