import { describe, expect, it } from "vitest";
import { onBackground, pageBackground } from "./background";
import { contrast, isDark } from "./color";

const LIGHT = { bg: "#FBF7EE", surf: "#F4EEE1", ink: "#1E1A14", muted: "#6A6358", line: "#E6DECD", card: "#FFFFFF", pop: "#C41E16", popink: "#1E1A14", dot: "#1E1A1414" };
const DARK = { bg: "#121714", surf: "#1B221E", ink: "#F2EFE6", muted: "#A0ABA3", line: "#2B3530", card: "#26272B", pop: "#FFC21A", popink: "#121714", dot: "#F2EFE612" };

describe("pageBackground", () => {
  it("is null for the template default or anything that is not a color", () => {
    for (const value of [undefined, "", "default", "red", "#FFF", 12]) expect(pageBackground({ "colors.background": value as string })).toBeNull();
  });

  it("keeps clear light and dark colors, and moves middle tones until text reads well", () => {
    expect(pageBackground({ "colors.background": "#e4eff8" })).toBe("#E4EFF8");
    expect(pageBackground({ "colors.background": "#14213D" })).toBe("#14213D");
    for (const middle of ["#9A9A9A", "#C8102E", "#7CC4A4", "#808080"]) {
      const bg = pageBackground({ "colors.background": middle })!;
      expect(Math.max(contrast(bg, "#000000"), contrast(bg, "#FFFFFF")), middle).toBeGreaterThanOrEqual(10);
    }
  });
});

describe("onBackground", () => {
  it("keeps a light theme on a light background, moving panels and following text colors", () => {
    const { palette, panels } = onBackground(LIGHT, [LIGHT, DARK], "#E4EFF8");
    expect(palette.bg).toBe("#E4EFF8");
    expect(palette.pop).toBe("#C41E16");
    expect(palette.popink).toBe(palette.ink);
    expect(palette.dot).toBe(`${palette.ink}14`);
    expect(panels).toContain(palette.card);
    expect(panels).toContain(palette.surf);
    expect(palette.surf).not.toBe("#E4EFF8");
    for (const panel of [palette.bg, ...panels]) {
      expect(contrast(palette.ink, panel)).toBeGreaterThanOrEqual(7);
      expect(contrast(palette.muted, panel)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("starts from the template's dark theme on a dark background", () => {
    const { palette } = onBackground(LIGHT, [LIGHT, DARK], "#14213D");
    expect(isDark(palette.surf)).toBe(true);
    expect(isDark(palette.ink)).toBe(false);
    expect(contrast(palette.ink, palette.bg)).toBeGreaterThanOrEqual(7);
    // Text drawn in the page color on a sticker still reads on the sticker.
    expect(contrast(palette.popink, palette.pop)).toBeGreaterThanOrEqual(4.5);
  });

  it("works for a template with only light themes", () => {
    const { palette } = onBackground(LIGHT, [LIGHT], "#0E0E0E");
    expect(contrast(palette.ink, palette.bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(palette.muted, palette.surf)).toBeGreaterThanOrEqual(4.5);
  });
});
