/**
 * Checks that run inside a page (each function is passed to page.evaluate, so it holds everything it needs): headings
 * whose lines run into each other, header buttons and links with nothing visible on them, and floating buttons that lie
 * over the opening on the first screen. Used by e2e/headings.spec.ts and e2e/combinations.spec.ts.
 */

export type PageIssue = { category: string; detail: string };

/**
 * Lines of a heading that crash into the next one: for each pair of lines in a heading (h1 to h3, a business name),
 * no word of the lower line may reach into a word of the line before it that stands over it by more than a small
 * tolerance. The words are measured with the heading's own font on a canvas (the real ink, Arabic dots and tails
 * included), and placed where the page drew them.
 * A word's ink is a box, so a tall letter at one end of a word counts over its whole width: lines that come close
 * without touching measure up to about 0.1em. The tolerance (0.12em) lets those pass; headings set as tight as the
 * templates' own Latin values measure 0.18em to 0.46em in Arabic (the owner's Ember case, line height 0.9: 0.46em).
 */
export function headingOverlaps(options: { arabicOnly?: boolean; tolerance?: number } = {}): PageIssue[] {
  const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  const tolerance = options.tolerance ?? 0.12;
  const issues: PageIssue[] = [];
  const canvas = document.createElement("canvas").getContext("2d")!;
  const name = (el: Element) => {
    const cls = [...el.classList].slice(0, 2).join(".");
    const section = el.closest("[data-section]")?.getAttribute("data-section");
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}${section ? ` in ${section}` : ""}`;
  };
  type Glyph = { ch: string; word: number; top: number; height: number; left: number; right: number; font: string; upper: boolean };
  /** The box a piece of text sits in: the nearest element inside the heading (or the heading) that is not inline. */
  const blockOf = (node: Element, heading: Element) => {
    for (let e: Element | null = node; e && e !== heading; e = e.parentElement) {
      const d = getComputedStyle(e).display;
      if (d !== "inline" && d !== "contents") return e;
    }
    return heading;
  };
  for (const el of document.querySelectorAll("h1, h2, h3, .kit-name, .kit-foot-name")) {
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2 || el.closest(".sr-only, dialog:not([open]), [hidden]")) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || Number(style.opacity) < 0.05) continue;
    const blocks = new Map<Element, Glyph[]>();
    let word = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      const parent = n.parentElement;
      if (!parent || parent.closest(".sr-only") || !n.data.trim()) continue;
      const s = getComputedStyle(parent);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const block = blockOf(parent, el);
      const glyphs = blocks.get(block) ?? [];
      blocks.set(block, glyphs);
      const range = document.createRange();
      word++;
      for (let i = 0; i < n.data.length; i++) {
        if (/\s/.test(n.data[i])) {
          word++;
          continue;
        }
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        // At a line break a letter can also report an empty box at the end of the line before: take its widest box.
        // Marks (Arabic vowels) take no width of their own; they still count in the word's ink.
        const r = [...range.getClientRects()].filter((b) => b.height >= 1).sort((a, b) => b.width - a.width)[0];
        if (!r) continue;
        glyphs.push({ ch: n.data[i], word, top: r.top, height: r.height, left: r.left, right: r.right, font, upper: s.textTransform === "uppercase" });
      }
    }
    // Each block of text in the heading on its own (a small number or count set on its own line is not a line of the
    // heading's text): its lines, top to bottom, and the ink of each pair of lines that follow each other.
    for (const [block, glyphs] of blocks) {
      if (glyphs.length < 2) continue;
      const lines: Glyph[][] = [];
      for (const g of [...glyphs].sort((a, b) => a.top - b.top)) {
        const line = lines[lines.length - 1];
        if (line && g.top - line[0].top < Math.min(line[0].height, g.height) * 0.5) line.push(g);
        else lines.push([g]);
      }
      if (lines.length < 2) continue;
      // Each word's ink, from its line's baseline (the line box's top plus the font's ascent), measured whole so Arabic
      // letters take the joined shapes the page draws; a word broken across two lines counts as two.
      const ink = lines.map((line) => {
        const words = new Map<string, Glyph[]>();
        for (const g of line) {
          const key = `${g.word}|${g.font}`;
          words.set(key, [...(words.get(key) ?? []), g]);
        }
        const letters = [...words.values()].map((list) => {
          const g = list[0];
          canvas.font = g.font;
          const text = list.map((o) => (o.upper ? o.ch.toUpperCase() : o.ch)).join("");
          const m = canvas.measureText(text);
          const baseline = Math.min(...list.map((o) => o.top)) + m.fontBoundingBoxAscent;
          const wide = list.filter((o) => o.right - o.left >= 0.5);
          return {
            text,
            left: Math.min(...(wide.length ? wide : list).map((o) => o.left)),
            right: Math.max(...(wide.length ? wide : list).map((o) => o.right)),
            top: baseline - m.actualBoundingBoxAscent,
            bottom: baseline + m.actualBoundingBoxDescent,
          };
        });
        return { letters, arabic: line.some((g) => ARABIC.test(g.ch)) };
      });
      const bs = getComputedStyle(block);
      const size = parseFloat(bs.fontSize);
      for (let i = 1; i < ink.length; i++) {
        const [above, below] = [ink[i - 1], ink[i]];
        if (options.arabicOnly && !above.arabic && !below.arabic) continue;
        // Only words over each other count: a tail low in one line beside a tall letter of the next does not touch it.
        let overlap = -Infinity;
        let pair = "";
        for (const a of above.letters) {
          for (const b of below.letters) {
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.bottom - b.top > overlap) {
              overlap = a.bottom - b.top;
              pair = `"${b.text}" into "${a.text}"`;
            }
          }
        }
        if (overlap > size * tolerance) {
          issues.push({
            category: "lines-overlap",
            detail: `${name(el)} "${(el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}": line ${i + 1} reaches ${overlap.toFixed(1)}px into line ${i}, ${pair} (${bs.fontSize}, line height ${bs.lineHeight})`,
          });
          break;
        }
      }
    }
  }
  return issues;
}

/**
 * Buttons and links in the header that show nothing: each visible one needs text or an icon (or a picture, like the
 * logo) whose color stands out from what is behind it by at least 3:1; one with neither (a slider dot) needs a fill or
 * border that does. A button drawn in the color of its own text is an empty pill to the visitor.
 */
export function headerControlIssues(): PageIssue[] {
  const issues: PageIssue[] = [];
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const rgba = (c: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const lum = ([r, g, b]: number[]) => {
    const c = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const over = (top: [number, number, number, number], under: number[]) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3]));
  /**
   * What is behind an element where it is drawn: the backgrounds of everything painted under its middle, laid over each
   * other (a see-through header over the opening's photo shows the photo); null over a picture or a gradient.
   */
  const behind = (el: Element, under = false): number[] | null => {
    const r = el.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const from = stack.findIndex((e) => e === el || e.contains(el));
    const layers: [number, number, number, number][] = [];
    // under: only what lies under the element, not its own background.
    const below = from < 0 ? (under && el.parentElement ? [el.parentElement] : [el]) : stack.slice(from).filter((e) => !under || e !== el);
    for (const e of below) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== "none" || e.matches("img, picture, video, canvas")) return null;
      if (e instanceof SVGElement && e !== el && !el.contains(e)) return null;
      const color = rgba(s.backgroundColor);
      if (color[3] > 0) layers.push(color);
      if (color[3] >= 0.99) break;
    }
    let base = [255, 255, 255];
    for (const layer of layers.reverse()) base = over(layer, base);
    return base;
  };
  const ratio = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const shown = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width >= 2 && r.height >= 2 && s.visibility !== "hidden" && Number(s.opacity) > 0.05;
  };
  const headers = document.querySelectorAll('[data-section="header"], .kit-hd, .kit-head');
  const seen = new Set<Element>();
  for (const header of headers) {
    for (const el of header.querySelectorAll("a, button")) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!shown(el) || el.closest('#site-drawer, dialog, .sr-only, [aria-hidden="true"]') || el.matches(".sr-only, .kit-skip")) continue;
      let seenOk = false;
      // A picture (the logo) shows itself.
      if ([...el.querySelectorAll("img")].some(shown)) seenOk = true;
      // Text and icons, in their own color over what is behind them.
      const parts: Element[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.textContent?.trim() && n.parentElement && !n.parentElement.closest(".sr-only")) parts.push(n.parentElement);
      }
      parts.push(...el.querySelectorAll("svg"));
      for (const part of parts) {
        if (seenOk) break;
        if (!shown(part)) continue;
        const s = getComputedStyle(part);
        const fill = part instanceof SVGElement ? (s.stroke !== "none" ? s.stroke : s.fill) : s.color;
        const color = rgba(fill === "none" || !fill ? s.color : fill);
        const back = behind(part);
        if (!back || color[3] < 0.05) {
          if (!back) seenOk = true; // over a picture or a gradient: the pixel checks judge it
          continue;
        }
        if (ratio(over(color, back), back) >= 3) seenOk = true;
      }
      // A control with no text or icon at all (a slider dot) shows itself by its fill or its border.
      if (!seenOk && !parts.some(shown)) {
        const s = getComputedStyle(el);
        const fill = rgba(s.backgroundColor);
        const border = parseFloat(s.borderTopWidth) >= 1 ? rgba(s.borderTopColor) : null;
        const parent = behind(el, true);
        if (!parent) seenOk = true;
        else if (fill[3] > 0.05 && ratio(over(fill, parent), parent) >= 3) seenOk = true;
        else if (border && border[3] > 0.05 && ratio(over(border, parent), parent) >= 3) seenOk = true;
      }
      if (!seenOk) {
        const label = el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "";
        issues.push({ category: "empty-control", detail: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")} "${label.slice(0, 30)}" shows nothing readable` });
      }
    }
  }
  return issues;
}

/**
 * Floating buttons (fixed, small: the order button and anything marked data-k="float") that lie over a heading or the
 * opening's text on the first screen, before any scrolling: each one's box against the lines of text in headings and in
 * the opening. Bars for moving around the site (the header, a phone's tab bar) are not floating buttons.
 */
export function floatingCoverIssues(): PageIssue[] {
  const issues: PageIssue[] = [];
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width >= 2 && r.height >= 2 && s.visibility !== "hidden" && Number(s.opacity) > 0.05 && !el.closest("dialog, [inert]");
  };
  const fixed = [...document.querySelectorAll("body *")].filter((el) => getComputedStyle(el).position === "fixed" && visible(el));
  const outer = fixed.filter((el) => !fixed.some((o) => o !== el && o.contains(el)));
  const floating = outer.filter((el) => {
    const r = el.getBoundingClientRect();
    // The order button (a pill, a round button or a slim bar of its own) and other floating buttons the templates mark;
    // the header and a phone's tab bar are the site's navigation, which the visitor expects at the edge.
    const FLOAT = '.kit-order, [data-k~="float"], [data-section="order"]';
    return r.width * r.height < window.innerWidth * window.innerHeight * 0.25 && r.top > window.innerHeight * 0.3 && (el.matches(FLOAT) || el.querySelector(FLOAT));
  });
  if (!floating.length) return issues;
  const lines: { rect: DOMRect; label: string }[] = [];
  const texts = document.querySelectorAll(
    'h1, h2, h3, [data-section="hero"] p, .kit-hv p, [data-section="hero"] [data-k~="btn"], .kit-hv [data-k~="btn"]',
  );
  for (const el of texts) {
    if (!visible(el) || floating.some((f) => f.contains(el)) || el.closest(".sr-only")) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim() || n.parentElement?.closest(".sr-only")) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < window.innerHeight) lines.push({ rect: r, label: `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"` });
      }
    }
  }
  for (const f of floating) {
    const b = f.getBoundingClientRect();
    const hit = lines.find(({ rect: r }) => r.left < b.right - 2 && b.left < r.right - 2 && r.top + r.height * 0.2 < b.bottom - 2 && b.top < r.bottom - r.height * 0.2 - 2);
    if (hit) {
      issues.push({ category: "covered", detail: `floating ${f.tagName.toLowerCase()}.${[...f.classList].slice(0, 2).join(".")} lies over ${hit.label} on the first screen` });
    }
  }
  return issues;
}

/**
 * The owner's moving strip (_kit/ticker.ts, marked data-k="ticker" once an option is set): every strip is on the page,
 * and each of its words or specials reads on what is really behind it (the band, a label, or the page for the
 * see-through shapes) at 4.5:1, or 3:1 for large text. `index` checks the page's strip of that number only; call it
 * with that strip on the screen.
 */
export function stripIssues(index: number | null = null): PageIssue[] {
  const issues: PageIssue[] = [];
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const rgba = (c: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const lum = ([r, g, b]: number[]) => {
    const c = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const over = (top: [number, number, number, number], under: number[]) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3]));
  const ratio = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const all = [...document.querySelectorAll('[data-k~="ticker"]')];
  const strips = index === null ? all : all.slice(index, index + 1);
  if (!strips.length) issues.push({ category: "strip", detail: "no moving strip marked on the page" });
  for (const strip of strips) {
    const box = strip.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) {
      issues.push({ category: "strip", detail: `${strip.tagName.toLowerCase()}.${strip.className} is not shown` });
      continue;
    }
    // The words on the screen: each one's text color over the colors under its middle.
    const words = [...strip.querySelectorAll('[data-k~="ticker-item"]')].filter((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 2 && r.height > 2 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight && s.visibility !== "hidden";
    });
    if (!words.length) issues.push({ category: "strip", detail: `${strip.tagName.toLowerCase()}.${strip.className} shows no words on the screen` });
    for (const word of words.slice(0, 6)) {
      const parts = [word, ...word.querySelectorAll("*")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()));
      for (const part of parts) {
        const r = part.getBoundingClientRect();
        const [x, y] = [r.left + r.width / 2, r.top + r.height / 2];
        // Only text whose middle is on the screen (the strip runs past both sides), and not a hidden separator.
        if (r.width < 1 || r.height < 1 || x < 1 || x > window.innerWidth - 1 || y < 1 || y > window.innerHeight - 1 || getComputedStyle(part).visibility === "hidden") continue;
        const stack = document.elementsFromPoint(x, y);
        const from = stack.findIndex((e) => e === part || e.contains(part));
        const layers: [number, number, number, number][] = [];
        let picture = false;
        for (const e of from < 0 ? [part] : stack.slice(from)) {
          const s = getComputedStyle(e);
          if (s.backgroundImage !== "none" || e.matches("img, picture, video, canvas")) {
            picture = true;
            break;
          }
          const color = rgba(s.backgroundColor);
          if (color[3] > 0) layers.push(color);
          if (color[3] >= 0.99) break;
        }
        if (picture) continue;
        let back = [255, 255, 255];
        for (const layer of layers.reverse()) back = over(layer, back);
        const s = getComputedStyle(part);
        const fg = over(rgba(s.color), back);
        const size = parseFloat(s.fontSize);
        const need = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700) ? 3 : 4.5;
        const got = ratio(fg, back);
        if (got < need) {
          issues.push({ category: "strip-contrast", detail: `"${(part.textContent ?? "").trim().slice(0, 24)}" ${s.color} on rgb(${back.map(Math.round).join(", ")}): ${got.toFixed(2)}:1 (needs ${need}:1)` });
          break;
        }
      }
    }
  }
  return issues;
}
