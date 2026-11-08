import { describe, expect, it } from "vitest";
import { fashionCopy, fill } from "./copy";
import { details, sizeRange } from "./details";

describe("fashion details", () => {
  it("takes sizes and colors out of the description", () => {
    const d = details("Washed linen, midi length. Sizes: XS–L. Colors: Sand, Black");
    expect(d.text).toBe("Washed linen, midi length.");
    expect(d.sizes).toEqual(["XS", "S", "M", "L"]);
    expect(d.colors).toEqual(["Sand", "Black"]);
  });

  it("reads Arabic sentences", () => {
    const d = details("كتان مغسول بطول متوسط. المقاسات: S–XL. الألوان: رملي، أسود");
    expect(d.text).toBe("كتان مغسول بطول متوسط.");
    expect(d.sizes).toEqual(["S", "M", "L", "XL"]);
    expect(d.colors).toEqual(["رملي", "أسود"]);
  });

  it("expands number ranges, in steps of two for tailoring sizes, and keeps units", () => {
    expect(details("Sizes: 40–44.").sizes).toEqual(["40", "41", "42", "43", "44"]);
    expect(details("Sizes: 46–54.").sizes).toEqual(["46", "48", "50", "52", "54"]);
    expect(details("Sizes: 2Y-5Y.").sizes).toEqual(["2Y", "3Y", "4Y", "5Y"]);
    expect(details("Sizes: One size.").sizes).toEqual(["One size"]);
    expect(details("Sizes: S, M, M, L").sizes).toEqual(["S", "M", "L"]);
  });

  it("leaves a description without sizes alone", () => {
    expect(details("Soft cotton tee.")).toEqual({ text: "Soft cotton tee.", sizes: [], colors: [] });
    expect(details(null)).toEqual({ text: "", sizes: [], colors: [] });
  });

  it("shortens sizes for cards", () => {
    expect(sizeRange(["XS", "S", "M", "L"])).toBe("XS – L");
    expect(sizeRange(["S", "M"])).toBe("S · M");
    expect(sizeRange([])).toBeNull();
  });

  it("has every word in English and Arabic, and fills the order message", () => {
    const en = fashionCopy("en");
    const ar = fashionCopy("ar");
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const value of Object.values(ar)) expect(value).toMatch(/[؀-ۿ]/);
    expect(fill(en.orderMessage, { name: "Linen shirt", price: "$40" })).toBe("Hello, I would like to order: Linen shirt ($40)");
  });
});
