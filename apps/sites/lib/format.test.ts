import { describe, expect, it } from "vitest";
import { formatPrice, initial, whatsappLink } from "./format";

describe("formatPrice", () => {
  it("shows JOD with 2 or 3 decimals", () => {
    expect(formatPrice(3.5, "JOD", "en")).toBe("3.50 JD");
    expect(formatPrice(2.125, "JOD", "en")).toBe("2.125 JD");
    expect(formatPrice(3.5, "JOD", "ar")).toBe("3.50 د.أ");
  });

  it("puts dollar signs first", () => {
    expect(formatPrice(4, "USD", "en")).toBe("$4.00");
  });
});

describe("links", () => {
  it("builds WhatsApp links from any phone format", () => {
    expect(whatsappLink("+962 7 9000 0000", "Hi")).toBe("https://wa.me/962790000000?text=Hi");
  });

  it("finds an initial", () => {
    expect(initial(" vanilla")).toBe("V");
  });
});
