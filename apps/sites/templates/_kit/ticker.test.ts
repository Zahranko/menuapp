import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrast } from "./color";
import { onBand, TICKER_ATTRIBUTES, TICKER_KEYS, tickerAttributes, tickerColors, tickerMarks, tickerOptions } from "./ticker";
import tickerSettings from "./ticker-settings.json";

type Field = { key: string; type: string; labelAr: string; options?: string[]; optionLabels?: Record<string, string>; optionLabelsAr?: Record<string, string>; previews?: Record<string, string> };
const fields = tickerSettings.fields as Field[];
const choices = fields.filter((f) => f.type === "choice");

/** Pages light and dark, and accents with the text the theme puts on them. */
const THEMES = [
  { bg: "#FFF8EC", surf: "#FFFFFF", ink: "#1A1410" },
  { bg: "#F4D03F", surf: "#FFE27A", ink: "#141110" },
  { bg: "#141110", surf: "#221C18", ink: "#F5EFE6" },
  { bg: "#0B0B0C", surf: "#18181A", ink: "#F2F1ED" },
  { bg: "#E7F1D5", surf: "#F6FAEE", ink: "#14301D" },
];
const ACCENTS = [
  { fill: "#E5281E", onFill: "#FFFFFF" },
  { fill: "#FFC21A", onFill: "#141110" },
  { fill: "#2B8448", onFill: "#FFFFFF" },
];

describe("moving strip options", () => {
  it("adds nothing for the defaults, unknown values or the owner's color without a color", () => {
    expect(tickerAttributes({})).toEqual({});
    expect(tickerAttributes(tickerSettings.defaults)).toEqual({});
    expect(tickerAttributes({ "ticker.style": "spiral", "ticker.speed": 3, "ticker.edge": null })).toEqual({});
    expect(tickerAttributes({ "ticker.color": "custom", "ticker.bg": "red" })).toEqual({});
    expect(tickerColors({}, THEMES[0], ACCENTS[0])).toEqual({});
    expect(tickerMarks({})("strip")).toEqual({});
  });

  it("turns the owner's choices into one data attribute each", () => {
    const settings = { "ticker.style": "torn", "ticker.color": "custom", "ticker.bg": "#1f6feb", "ticker.separator": "flame", "ticker.speed": "still", "ticker.edge": "waves" };
    expect(tickerAttributes(settings)).toEqual({ "data-tk-style": "torn", "data-tk-color": "custom", "data-tk-sep": "flame", "data-tk-speed": "still", "data-tk-edge": "waves" });
    expect(Object.keys(tickerAttributes(settings))).toEqual(TICKER_ATTRIBUTES);
    expect(tickerOptions(settings).bg).toBe("#1F6FEB");
  });

  it("marks the parts of a strip only once the owner changed something", () => {
    const tk = tickerMarks({ "ticker.speed": "fast" });
    expect(tk("strip")).toEqual({ "data-k": "ticker" });
    expect(tk("item", false, "copy")).toEqual({ "data-k": "ticker-item ticker-copy" });
    expect(tk()).toEqual({});
  });

  it("always reads: the text on the band, and the strip's lines on the page", () => {
    const owners = ["#E5281E", "#FFC21A", "#FF5A1F", "#2F8F4E", "#1F6FEB", "#7B2D6E", "#D6336C", "#141110", "#FFFFFF", "#808080", "#777777"];
    for (const theme of THEMES) {
      for (const accent of ACCENTS) {
        for (const color of ["accent", "ink", "paper", ...owners]) {
          const settings = color.startsWith("#") ? { "ticker.color": "custom", "ticker.bg": color } : { "ticker.color": color };
          const vars = tickerColors(settings, theme, accent);
          const label = `${color} on ${theme.bg} (accent ${accent.fill})`;
          expect(vars["--tk-bg"], label).toBeTruthy();
          // The accent's own text is the template's pairing (checked by the theme tests); every other band picks its text here.
          if (color !== "accent") expect(contrast(vars["--tk-ink"], vars["--tk-bg"]), label).toBeGreaterThanOrEqual(4.5);
          for (const page of [theme.bg, theme.surf]) expect(contrast(vars["--tk-line"], page), `${label}, lines on ${page}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("keeps a dark band on a dark page, and a light one on a light page, apart from the page", () => {
    for (const theme of THEMES) {
      for (const color of ["ink", "paper"]) {
        const band = tickerColors({ "ticker.color": color }, theme, ACCENTS[0])["--tk-bg"];
        expect(contrast(band, theme.bg), `${color} on ${theme.bg}`).toBeGreaterThan(1.2);
      }
    }
  });

  it("puts the theme's own dark or light color on a band when it reads, else black or white", () => {
    expect(onBand("#FFC21A", ["#141110", "#FFF8EC"])).toBe("#141110");
    expect(onBand("#7B2D6E", ["#141110", "#FFF8EC"])).toBe("#FFF8EC");
    expect(onBand("#1F6FEB", ["#141110", "#FFF8EC"])).toBe("#FFFFFF");
    expect(contrast(onBand("#808080", ["#555555", "#AAAAAA"]), "#808080")).toBeGreaterThanOrEqual(4.5);
  });

  it("knows every field of ticker-settings.json, each starting on Template default", () => {
    expect(TICKER_KEYS).toEqual(fields.map((f) => f.key));
    expect(TICKER_KEYS).toEqual(["ticker.style", "ticker.color", "ticker.bg", "ticker.separator", "ticker.speed", "ticker.edge"]);
    for (const field of choices) {
      expect(field.options![0], field.key).toBe("auto");
      expect((tickerSettings.defaults as Record<string, string>)[field.key], field.key).toBe("auto");
    }
    expect(fields.find((f) => f.key === "ticker.bg")!.type).toBe("color");
  });

  it("has English and Arabic labels and a preview picture with no words for every option", () => {
    expect(tickerSettings.groupAr.trim()).not.toBe("");
    for (const field of fields) expect(field.labelAr.trim(), field.key).not.toBe("");
    for (const field of choices) {
      expect(Object.keys(field.previews!), field.key).toEqual(field.options);
      for (const option of field.options!) {
        expect(field.optionLabels![option]?.trim(), `${field.key} ${option}`).toBeTruthy();
        expect(field.optionLabelsAr![option]?.trim(), `${field.key} ${option} (Arabic)`).toBeTruthy();
        const file = path.join(__dirname, "..", "..", "public", field.previews![option]);
        expect(existsSync(file), field.previews![option]).toBe(true);
        const svg = readFileSync(file, "utf8");
        expect(svg, file).toMatch(/viewBox="0 0 80 80"/);
        expect(svg, file).not.toMatch(/<text/);
      }
    }
  });
});
