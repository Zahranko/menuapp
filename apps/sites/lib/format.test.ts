import { describe, expect, it } from "vitest";
import { formatPrice, initial, whatsappLink } from "./format";

describe("formatPrice", () => {
  it("shows JOD with 2 or 3 decimals", () => {
    expect(formatPrice(3.5, "JOD", "en")).toBe("3.50 JD");
    expect(formatPrice(2.125, "JOD", "en")).toBe("2.125 JD");
    expect(formatPrice(3.5, "JOD", "ar")).toBe("3.50 د.أ");
  });

  it("puts symbols such as $, €, £ first", () => {
    expect(formatPrice(4, "USD", "en")).toBe("$4.00");
    expect(formatPrice(4.5, "EUR", "en")).toBe("€4.50");
    expect(formatPrice(12, "GBP", "en")).toBe("£12.00");
    expect(formatPrice(4, "USD", "ar")).toBe("$4.00");
    expect(formatPrice(9.99, "CAD", "en")).toBe("CA$9.99");
  });

  it("keeps cents to 2 decimals for 2-decimal currencies", () => {
    expect(formatPrice(4.125, "USD", "en")).toBe("$4.13");
    expect(formatPrice(1250, "USD", "en")).toBe("$1,250.00");
  });

  it("allows 3 decimals for KWD, BHD and OMR", () => {
    expect(formatPrice(1.5, "KWD", "en")).toBe("1.50 KD");
    expect(formatPrice(1.375, "KWD", "en")).toBe("1.375 KD");
    expect(formatPrice(1.375, "KWD", "ar")).toBe("1.375 د.ك");
    expect(formatPrice(2.25, "BHD", "en")).toBe("2.25 BD");
    expect(formatPrice(2.125, "OMR", "ar")).toBe("2.125 ر.ع");
  });

  it("shows no decimals for JPY", () => {
    expect(formatPrice(1200, "JPY", "en")).toBe("¥1,200");
    expect(formatPrice(1200.4, "JPY", "ar")).toBe("¥1,200");
  });

  it("uses Arabic labels for Gulf and Arab currencies", () => {
    expect(formatPrice(15, "SAR", "en")).toBe("15.00 SAR");
    expect(formatPrice(15, "SAR", "ar")).toBe("15.00 ر.س");
    expect(formatPrice(20, "AED", "ar")).toBe("20.00 د.إ");
    expect(formatPrice(85, "EGP", "en")).toBe("85.00 EGP");
    expect(formatPrice(85, "EGP", "ar")).toBe("85.00 ج.م");
  });

  it("accepts lowercase codes", () => {
    expect(formatPrice(4, "usd", "en")).toBe("$4.00");
    expect(formatPrice(3.5, "jod", "en")).toBe("3.50 JD");
  });

  it("falls back to the code for currencies it has no label for", () => {
    expect(formatPrice(50, "TRY", "en")).toBe("50.00 TRY");
    expect(formatPrice(50, "XYZ", "en")).toBe("50.00 XYZ");
    expect(formatPrice(50, "XYZ", "ar")).toBe("50.00 XYZ");
  });

  it("does not throw for malformed or empty codes", () => {
    expect(formatPrice(5, "dollars", "en")).toBe("5.00 DOLLARS");
    expect(formatPrice(5, "", "en")).toBe("5.00");
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
