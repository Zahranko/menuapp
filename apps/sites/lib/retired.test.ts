import { describe, expect, it } from "vitest";
import registry from "@/templates/registry.json";
import { templates, templateFor } from "@/templates/registry";
import { liveTemplateId, retiredTemplates } from "./retired";

describe("retired templates", () => {
  it("send their sites to a live template", () => {
    expect(Object.keys(retiredTemplates).length).toBeGreaterThan(0);
    for (const [id, next] of Object.entries(retiredTemplates)) {
      expect(templates[id], id).toBeUndefined();
      expect(templates[next], next).toBeDefined();
      expect(liveTemplateId(id)).toBe(next);
      expect(templateFor(id)).toBe(templates[next]);
    }
  });

  it("leave live templates alone", () => {
    for (const t of registry.templates) expect(liveTemplateId(t.id)).toBe(t.id);
  });
});
