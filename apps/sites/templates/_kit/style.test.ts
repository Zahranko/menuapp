import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_STYLE_ATTRIBUTES, PAGE_STYLE_KEYS, pageStyle, styleAttributes } from "./style";
import styleSettings from "./style-settings.json";

describe("page style options", () => {
  it("adds nothing for the defaults or for unknown values", () => {
    expect(styleAttributes({})).toEqual({});
    expect(styleAttributes(styleSettings.defaults)).toEqual({});
    expect(styleAttributes({ "style.textSize": "huge", "style.buttons": 3, "style.photos": null, "style.motion": ["fade"] })).toEqual({});
    expect(pageStyle({ "style.dividers": "sparkles" }).dividers).toBe("auto");
  });

  it("turns the owner's choices into one data attribute each", () => {
    const settings = {
      "style.textSize": "big",
      "style.headings": "condensed",
      "style.tracking": "wide",
      "style.spacing": "airy",
      "style.buttons": "outline",
      "style.photos": "arch",
      "style.dividers": "wave",
      "style.texture": "grain",
      "style.motion": "playful",
    };
    expect(styleAttributes(settings)).toEqual({
      "data-ps-text": "big",
      "data-ps-head": "condensed",
      "data-ps-track": "wide",
      "data-ps-space": "airy",
      "data-ps-btn": "outline",
      "data-ps-photo": "arch",
      "data-ps-div": "wave",
      "data-ps-tex": "grain",
      "data-ps-motion": "playful",
    });
    expect(Object.keys(styleAttributes(settings))).toEqual(PAGE_STYLE_ATTRIBUTES);
  });

  it("knows every field of style-settings.json, each starting on Template default", () => {
    expect(PAGE_STYLE_KEYS).toEqual(styleSettings.fields.map((f) => f.key));
    for (const field of styleSettings.fields) {
      expect(field.type, field.key).toBe("choice");
      expect(field.options[0], field.key).toBe("auto");
      expect((styleSettings.defaults as Record<string, string>)[field.key], field.key).toBe("auto");
    }
  });

  it("has English and Arabic labels and a preview picture for every option", () => {
    expect(styleSettings.groupAr.trim()).not.toBe("");
    for (const field of styleSettings.fields) {
      expect(field.labelAr.trim(), field.key).not.toBe("");
      const labels = field.optionLabels as unknown as Record<string, string>;
      const labelsAr = field.optionLabelsAr as unknown as Record<string, string>;
      const previews = field.previews as unknown as Record<string, string>;
      expect(Object.keys(previews), field.key).toEqual(field.options);
      for (const option of field.options) {
        expect(labels[option]?.trim(), `${field.key} ${option}`).toBeTruthy();
        expect(labelsAr[option]?.trim(), `${field.key} ${option} (Arabic)`).toBeTruthy();
        expect(previews[option], `${field.key} ${option}`).toMatch(/^\/kit\/previews\/[a-z0-9-]+\.svg$/);
        expect(existsSync(path.join(__dirname, "..", "..", "public", previews[option])), previews[option]).toBe(true);
      }
    }
  });
});
