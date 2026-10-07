import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import registry from "./registry.json";
import { templates } from "./registry";

describe("template registry", () => {
  it("registry.json matches the manifests", () => {
    expect(() => execFileSync("node", ["scripts/build-registry.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });

  it("every component belongs to a template in registry.json", () => {
    const ids = new Set((registry as { templates: { id: string }[] }).templates.map((t) => t.id));
    for (const id of Object.keys(templates)) expect(ids.has(id), id).toBe(true);
  });
});
