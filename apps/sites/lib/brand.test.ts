import { describe, expect, it } from "vitest";
import { brand, withBrand } from "./brand";

describe("brand", () => {
  it("reads values from brand.json", () => {
    expect(brand.brandName.length).toBeGreaterThan(0);
    expect(brand.domain).toMatch(/\./);
  });

  it("fills the brand name placeholder", () => {
    expect(withBrand("Made with {brandName}")).toBe(`Made with ${brand.brandName}`);
  });
});
