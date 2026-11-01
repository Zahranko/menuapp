import { describe, expect, it } from "vitest";
import registry from "../registry.json";
import { bareLogo, LOGO_SIZE, logoAttributes, logoOptions, nameHidden } from "./logo";
import logoSettings from "./logo-settings.json";

const withLogo = { logo: "https://cdn.example.com/logo.png" };

describe("logo options", () => {
  it("reads the defaults when nothing is saved, and they add no attributes", () => {
    const o = logoOptions({});
    expect(o).toEqual({ hasLogo: false, frame: true, size: 100, centered: false, showName: true });
    expect(logoAttributes(o)).toEqual({});
    expect(logoAttributes(logoOptions({ ...withLogo, ...logoSettings.defaults }))).toEqual({});
  });

  it("turns each option into its data attribute", () => {
    const o = logoOptions({ ...withLogo, "logo.frame": false, "logo.size": 150, "logo.position": "center", "logo.name": false });
    expect(logoAttributes(o)).toEqual({ "data-logo-frame": "off", "data-logo-size": "150", "data-logo-pos": "center", "data-logo-name": "hidden" });
  });

  it("clamps the size to its range and rounds it to the step", () => {
    expect(logoOptions({ "logo.size": 10 }).size).toBe(LOGO_SIZE.min);
    expect(logoOptions({ "logo.size": 999 }).size).toBe(LOGO_SIZE.max);
    expect(logoOptions({ "logo.size": 134 }).size).toBe(130);
    expect(logoOptions({ "logo.size": 136 }).size).toBe(140);
    expect(logoOptions({ "logo.size": Number.NaN }).size).toBe(100);
    expect(logoOptions({ "logo.size": "180" }).size).toBe(100);
    expect(LOGO_SIZE).toMatchObject({ min: 70, max: 180, step: 10, default: 100 });
  });

  it("ignores values of the wrong type", () => {
    const o = logoOptions({ ...withLogo, "logo.frame": "no", "logo.position": "left", "logo.name": 0 });
    expect(o).toMatchObject({ frame: true, centered: false, showName: true });
  });

  it("keeps the frame and the name when there is no logo picture, so the header is never empty", () => {
    const o = logoOptions({ logo: "", "logo.frame": false, "logo.name": false });
    expect(bareLogo(o)).toBe(false);
    expect(nameHidden(o)).toBe(false);
    expect(logoAttributes(o)).toEqual({});
  });

  it("treats a preset picture as a logo", () => {
    expect(logoOptions({ logo: "preset:beans", "logo.name": false }).hasLogo).toBe(true);
  });

  it("is in every template, right after the logo, in the logo's group, with defaults", () => {
    for (const t of registry.templates) {
      const keys = t.schema.map((f) => f.key);
      const at = keys.indexOf("logo");
      expect(keys.slice(at, at + 5), t.id).toEqual(["logo", "logo.frame", "logo.size", "logo.position", "logo.name"]);
      for (const field of t.schema.slice(at + 1, at + 5)) {
        expect(field.group, t.id).toBe(t.schema[at].group);
        expect(field.labelAr, t.id).toMatch(/[؀-ۿ]/);
      }
      expect(t.defaults, t.id).toMatchObject(logoSettings.defaults);
      const size = t.schema[at + 2] as { min?: number; max?: number; step?: number };
      expect([size.min, size.max, size.step]).toEqual([70, 180, 10]);
    }
  });
});
