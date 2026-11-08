import { describe, expect, it } from "vitest";
import { productLabel } from "./i18n";

describe("productLabel", () => {
  it("translates the fixed labels on Arabic sites", () => {
    expect(productLabel({ label: "New" }, "en")).toBe("New");
    expect(productLabel({ label: "New" }, "ar")).toBe("جديد");
    expect(productLabel({ label: "Best seller" }, "ar")).toBe("الأكثر طلبًا");
    expect(productLabel({ label: "Signature" }, "ar")).toBe("مميز");
    expect(productLabel({ label: "Vegan" }, "ar")).toBe("نباتي");
    expect(productLabel({ label: "Spicy" }, "ar")).toBe("حار");
  });

  it("shows no badge without a label", () => {
    expect(productLabel({ label: null, customLabel: "Ignored" }, "en")).toBeNull();
  });

  it("shows custom text as typed, in the site's language first", () => {
    const both = { label: "Custom", customLabel: "Chef's choice", customLabelAr: "اختيار الشيف" };
    expect(productLabel(both, "en")).toBe("Chef's choice");
    expect(productLabel(both, "ar")).toBe("اختيار الشيف");
  });

  it("falls back to the other language's custom text", () => {
    expect(productLabel({ label: "Custom", customLabel: "Halal" }, "ar")).toBe("Halal");
    expect(productLabel({ label: "Custom", customLabel: " ", customLabelAr: "حلال" }, "en")).toBe("حلال");
    expect(productLabel({ label: "Custom" }, "en")).toBeNull();
  });
});
