/*
 * The style sheet the AI design studio writes for a Studio site ("studio.css"). It is untrusted text, so before it reaches a
 * page it is read rule by rule and only what is safe is kept:
 *   - style rules, @media, @supports, @container and @keyframes; every other at-rule (@import, @font-face, …) is dropped
 *   - every selector is scoped to the site ([data-template="studio"] …); html, body and :root can't be styled,
 *     and ":scope" means the site itself
 *   - no outside addresses: url() only for inline pictures (data:image/…) and the site's own photo hosts
 *   - no scripts or old browser tricks (expression(), javascript:, behavior, -moz-binding), no escapes, no "<"
 *   - nothing pinned over the page (position: fixed)
 *   - at most STUDIO_CSS_MAX characters, and every animation stops for visitors who ask their phone for less motion
 * The server checks the same rules when the draft is saved (TemplateSchema, type "css"); this is the second lock.
 */

export const STUDIO_CSS_MAX = 20_000;
export const STUDIO_ROOT = '[data-template="studio"]';

const REDUCED_MOTION = `@media (prefers-reduced-motion:reduce){${STUDIO_ROOT},${STUDIO_ROOT} *,${STUDIO_ROOT} *::before,${STUDIO_ROOT} *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;

const CONDITION_RULES = new Set(["media", "supports", "container"]);
const BANNED_PROPERTIES = new Set(["behavior", "-moz-binding", "-ms-behavior"]);
const SELECTOR_CHARS = /^[a-zA-Z0-9_\-\s.#:>+~*()[\]="'^$|%]+$/;
const CONDITION_CHARS = /^[a-zA-Z0-9_\-\s:().,<>=%/]+$/;

export type CleanCss = { css: string; dropped: string[] };

type Block = { prelude: string; body: string | null };

/** Splits CSS text into its top-level parts: `prelude { body }` blocks, or `prelude;` statements (body null). */
function blocks(text: string): Block[] {
  const out: Block[] = [];
  let i = 0;
  let start = 0;
  let quote = "";
  let parens = 0;
  while (i < text.length) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(") {
      parens++;
    } else if (ch === ")") {
      parens = Math.max(0, parens - 1);
    } else if (ch === ";" && parens === 0) {
      out.push({ prelude: text.slice(start, i).trim(), body: null });
      start = i + 1;
    } else if (ch === "{" && parens === 0) {
      const end = matching(text, i);
      out.push({ prelude: text.slice(start, i).trim(), body: text.slice(i + 1, end) });
      i = end;
      start = i + 1;
    } else if (ch === "}") {
      // A stray closing brace: skip it.
      start = i + 1;
    }
    i++;
  }
  const rest = text.slice(start).trim();
  if (rest) out.push({ prelude: rest, body: null });
  return out.filter((b) => b.prelude || b.body);
}

/** The index of the brace that closes the one at `open` (or the end of the text). */
function matching(text: string, open: number): number {
  let depth = 0;
  let quote = "";
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}" && --depth === 0) {
      return i;
    }
  }
  return text.length;
}

/** Splits on a separator outside quotes, parentheses and brackets. */
function splitTop(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(" || ch === "[") {
      depth++;
    } else if (ch === ")" || ch === "]") {
      depth = Math.max(0, depth - 1);
    } else if (ch === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/** The selector list scoped to the site, or null when any part of it can't be kept. */
export function scopeSelector(selector: string): string | null {
  const parts = splitTop(selector, ",").map((p) => p.trim().replace(/\s+/g, " "));
  if (parts.length === 0 || parts.some((p) => !p)) return null;
  const scoped: string[] = [];
  for (const part of parts) {
    if (!SELECTOR_CHARS.test(part)) return null;
    if (/(^|[\s>+~(,])(html|body)(?![\w-])/i.test(part) || /:root\b/i.test(part)) return null;
    if (/^:scope\b/i.test(part)) {
      scoped.push(STUDIO_ROOT + part.slice(":scope".length));
    } else if (/:scope\b/i.test(part)) {
      return null;
    } else {
      scoped.push(`${STUDIO_ROOT} ${part}`);
    }
  }
  return scoped.join(",");
}

/** A url(…) the page may load: an inline picture, or a photo on one of the site's own hosts. */
function allowedUrl(raw: string, hosts: readonly string[]): boolean {
  const url = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && hosts.includes(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}

/** The declaration as it will be written, or null when it is dropped. */
export function cleanDeclaration(text: string, hosts: readonly string[] = []): string | null {
  const colon = text.indexOf(":");
  if (colon < 0) return null;
  const property = text.slice(0, colon).trim().toLowerCase();
  const value = text.slice(colon + 1).trim();
  if (!/^(--[a-z0-9-]+|-?[a-z][a-z0-9-]*)$/.test(property) || BANNED_PROPERTIES.has(property)) return null;
  if (!value || /[<>{}@]/.test(value) || /expression\s*\(|javascript:|vbscript:/i.test(value)) return null;
  if (property === "position" && /fixed/i.test(value)) return null;
  for (const match of value.matchAll(/url\(\s*([^)]*)\)/gi)) {
    if (!allowedUrl(match[1], hosts)) return null;
  }
  // Other ways to load something by address are left out.
  if (/\b(image-set|src)\s*\(/i.test(value)) return null;
  return `${property}:${value}`;
}

function declarations(body: string, hosts: readonly string[], dropped: string[]): string {
  const kept: string[] = [];
  for (const part of splitTop(body, ";")) {
    const text = part.trim();
    if (!text) continue;
    const clean = cleanDeclaration(text, hosts);
    if (clean) kept.push(clean);
    else dropped.push(text.slice(0, 80));
  }
  return kept.join(";");
}

function rules(text: string, hosts: readonly string[], dropped: string[], depth: number): string {
  let out = "";
  for (const { prelude, body } of blocks(text)) {
    if (body === null) {
      dropped.push(prelude.slice(0, 80));
      continue;
    }
    const at = /^@([a-z-]+)\s*([\s\S]*)$/i.exec(prelude);
    if (at) {
      const name = at[1].toLowerCase();
      const rest = at[2].trim();
      if (CONDITION_RULES.has(name) && depth < 3 && CONDITION_CHARS.test(rest) && !/url/i.test(rest)) {
        const inner = rules(body, hosts, dropped, depth + 1);
        if (inner) out += `@${name} ${rest}{${inner}}`;
      } else if ((name === "keyframes" || name === "-webkit-keyframes") && /^[a-z][a-z0-9-]{0,40}$/i.test(rest)) {
        const frames = blocks(body)
          .filter((f) => f.body !== null && /^((from|to|\d{1,3}(\.\d+)?%)\s*,?\s*)+$/i.test(f.prelude))
          .map((f) => `${f.prelude}{${declarations(f.body!, hosts, dropped)}}`)
          .join("");
        if (frames) out += `@keyframes ${rest}{${frames}}`;
      } else {
        dropped.push(prelude.slice(0, 80));
      }
      continue;
    }
    const selector = scopeSelector(prelude);
    if (!selector) {
      dropped.push(prelude.slice(0, 80));
      continue;
    }
    const decls = declarations(body, hosts, dropped);
    if (decls) out += `${selector}{${decls}}`;
  }
  return out;
}

/**
 * The style sheet as it may go on the page, and what was left out. Anything that isn't text, or is too long, gives an empty
 * sheet. `hosts` are the hosts of the site's own photos (for url()).
 */
export function cleanStudioCss(input: unknown, hosts: readonly string[] = []): CleanCss {
  if (typeof input !== "string" || !input.trim()) return { css: "", dropped: [] };
  if (input.length > STUDIO_CSS_MAX) return { css: "", dropped: ["too long"] };
  // Escapes can hide any of the words below, and "<" could end the <style> element.
  if (/[\\<]/.test(input)) return { css: "", dropped: ["escapes or <"] };
  const dropped: string[] = [];
  const css = rules(input.replace(/\/\*[\s\S]*?(\*\/|$)/g, ""), hosts.map((h) => h.toLowerCase()), dropped, 0);
  return { css: css ? css + REDUCED_MOTION : "", dropped };
}
