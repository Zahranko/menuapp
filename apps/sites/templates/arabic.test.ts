import { describe, expect, it } from "vitest";
import registry from "./registry.json";

type Field = { key: string; type: string; label: string; labelAr?: string; group?: string; groupAr?: string; optionLabels?: Record<string, string>; optionLabelsAr?: Record<string, string>; max?: number };
type Template = { id: string; ar?: { name?: string; category?: string; description?: string }; schema: Field[]; defaults: Record<string, unknown>; defaultsAr?: Record<string, unknown> };
const list = (registry as unknown as { templates: Template[] }).templates;
const arabic = /[؀-ۿ]/;

/** The gallery, the editor and Arabic businesses' starter content all read these from registry.json. */
describe.each(list.map((t) => [t.id, t] as const))("template %s in Arabic", (_id, t) => {
  it("has an Arabic name, category and description", () => {
    for (const key of ["name", "category", "description"] as const) expect(t.ar?.[key], key).toMatch(arabic);
  });

  it("has an Arabic label, group and option labels for every field", () => {
    for (const f of t.schema) {
      expect(f.labelAr, f.key).toMatch(arabic);
      if (f.group) expect(f.groupAr, f.key).toMatch(arabic);
      if (f.optionLabels) {
        expect(Object.keys(f.optionLabelsAr ?? {}), f.key).toEqual(Object.keys(f.optionLabels));
        for (const v of Object.values(f.optionLabelsAr!)) expect(v, f.key).toMatch(arabic);
      }
    }
  });

  it("has Arabic starter text for every English text default, within each field's max", () => {
    const defaultsAr = t.defaultsAr ?? {};
    for (const f of t.schema) {
      const english = t.defaults[f.key];
      const isText = f.type === "text" || f.type === "textarea";
      if (isText && typeof english === "string" && english !== "") expect(typeof defaultsAr[f.key], f.key).toBe("string");
      const value = defaultsAr[f.key];
      if (typeof value === "string" && f.max !== undefined) expect(value.length, f.key).toBeLessThanOrEqual(f.max);
    }
    for (const key of Object.keys(defaultsAr)) expect(t.schema.find((f) => f.key === key)?.type, key).toMatch(/^text(area)?$/);
  });
});
