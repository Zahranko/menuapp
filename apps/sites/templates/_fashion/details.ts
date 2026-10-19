/*
 * Clothing details for the fashion templates (Folio, Drop, Couture). Products have no size or color fields, so owners
 * write them in the description: "Washed linen, midi length. Sizes: XS–L. Colors: Sand, Black" (Arabic: "المقاسات:"
 * and "الألوان:"). These sentences become size buttons and a color line; the rest stays the description.
 */

/** Letter sizes in order, so "XS–L" becomes XS, S, M, L. */
const LETTERS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

const SIZES = /^(?:sizes?|المقاسات|مقاسات|المقاس)\s*[:：]\s*/i;
const COLORS = /^(?:colou?rs?|الألوان|ألوان|اللون)\s*[:：]\s*/i;
const LIST = /\s*[,،/|·]\s*/;
const RANGE = /^(.+?)\s*(?:–|—|-|to|إلى)\s*(.+)$/i;

export type Details = {
  /** The description without its sizes and colors sentences (empty when nothing else was written). */
  text: string;
  sizes: string[];
  colors: string[];
};

/** "XS–L" → XS, S, M, L; "38–41" → 38, 39, 40, 41; even numbers in steps of two ("46–52"); "2Y–5Y" keeps its unit. */
function expand(part: string): string[] {
  const range = part.match(RANGE);
  if (!range) return [part];
  const [from, to] = [range[1].trim(), range[2].trim()];
  const a = LETTERS.indexOf(from.toUpperCase());
  const b = LETTERS.indexOf(to.toUpperCase());
  if (a >= 0 && b > a) return LETTERS.slice(a, b + 1);
  const x = from.match(/^(\d{1,3})([a-z]*)$/i);
  const y = to.match(/^(\d{1,3})([a-z]*)$/i);
  if (x && y && x[2].toLowerCase() === y[2].toLowerCase()) {
    const [start, end] = [Number(x[1]), Number(y[1])];
    const step = start % 2 === 0 && end % 2 === 0 && end - start > 8 ? 2 : 1;
    if (end > start && (end - start) / step < 12) {
      const out: string[] = [];
      for (let n = start; n <= end; n += step) out.push(`${n}${y[2]}`);
      return out;
    }
  }
  return [part];
}

const values = (list: string) =>
  list
    .split(LIST)
    .map((v) => v.trim().replace(/[.;؛]+$/, ""))
    .filter(Boolean);

export function details(description: string | null | undefined): Details {
  const sizes: string[] = [];
  const colors: string[] = [];
  const kept: string[] = [];
  for (const sentence of (description ?? "").split(/(?<=[.;؛])\s+/)) {
    const line = sentence.trim();
    if (!line) continue;
    if (SIZES.test(line)) sizes.push(...values(line.replace(SIZES, "")).flatMap(expand));
    else if (COLORS.test(line)) colors.push(...values(line.replace(COLORS, "")));
    else kept.push(line);
  }
  return { text: kept.join(" "), sizes: [...new Set(sizes)], colors: [...new Set(colors)] };
}

/** "XS – L" for a card, or the one size; null without sizes. */
export function sizeRange(sizes: string[]): string | null {
  if (sizes.length === 0) return null;
  return sizes.length > 2 ? `${sizes[0]} – ${sizes[sizes.length - 1]}` : sizes.join(" · ");
}
