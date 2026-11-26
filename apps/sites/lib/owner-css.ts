/*
 * The owner's own CSS ("tune.css", in the "Fine tuning" group of every template), made safe to put in a <style> element
 * on their website:
 *  - It can't leave the <style> element: "<" is removed, so "</style>" can't close it, and backslash escapes are removed,
 *    so nothing can be spelled in a way that slips past the next rules.
 *  - It loads nothing from elsewhere: url(), image-set(), image(), src() and expression() are switched off, and every
 *    at-rule except @media, @supports and @keyframes (so no @import, @font-face or @namespace) is dropped.
 *  - It stays inside the website: the whole stylesheet is nested under the template's root ([data-template]), and braces
 *    are balanced, so a stray "}" can't end that block early.
 * What is left is ordinary CSS: colors, sizes, spacing, borders, shadows, animations, hiding things, on any element of the
 * template. The browser drops anything it doesn't understand, so a typo only switches off its own rule.
 */

export const OWNER_CSS_MAX = 4000;

const ALLOWED_AT_RULES = new Set(["media", "supports", "keyframes", "-webkit-keyframes"]);

/** The owner's CSS, cleaned and nested under the template's root; null when there is nothing to add. */
export function ownerCss(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let css = raw.slice(0, OWNER_CSS_MAX);
  css = css.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  css = css.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, " ");
  css = css.replace(/[<\\]/g, "");
  css = css.replace(/\b(url|image-set|-webkit-image-set|image|src|expression|element|cross-fade|paint)\s*\(/gi, "blocked(");
  css = css.replace(/javascript\s*:/gi, "");
  css = dropAtRules(css);
  css = balance(css).trim();
  if (!/[{:]/.test(css)) return null;
  return `[data-template]{\n${css}\n}`;
}

/** Removes at-rules other than @media, @supports and @keyframes, with their statement or block. */
function dropAtRules(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c !== "@") {
      out += c;
      i++;
      continue;
    }
    const name = /^@([a-z-]+)/i.exec(css.slice(i))?.[1]?.toLowerCase() ?? "";
    if (ALLOWED_AT_RULES.has(name)) {
      out += c;
      i++;
      continue;
    }
    // Skip to the end of the statement (";") or past its block ("{...}"), whichever comes first.
    let j = i + 1;
    while (j < css.length && css[j] !== ";" && css[j] !== "{") j++;
    if (css[j] === "{") {
      let depth = 0;
      for (; j < css.length; j++) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}" && --depth === 0) break;
      }
    }
    i = j + 1;
  }
  return out;
}

/** Drops a "}" with no "{" before it and closes the blocks left open. Strings are left alone. */
function balance(css: string): string {
  let out = "";
  let depth = 0;
  let quote: string | null = null;
  for (const c of css) {
    if (quote) {
      if (c === quote || c === "\n") quote = null;
      out += c;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    if (c === "{") depth++;
    if (c === "}") {
      if (depth === 0) continue;
      depth--;
    }
    out += c;
  }
  if (quote) out += quote;
  return out + "}".repeat(depth);
}
