import { describe, expect, it } from "vitest";
import brandFile from "../../../../brand.json";
import { LATIN_FONTS } from "@/components/marketing/fonts";
import { ARABIC_FONT } from "@/components/marketing/fonts-arabic";
import { brand } from "../brand";
import { copy, fill, formatDate, pagePath } from "./copy";
import { marketingMetadata, marketingUrls } from "./seo";
import { storeLinks } from "./stores";

/** Same keys and the same list lengths in both languages, so no Arabic string is missing. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return typeof value;
}

describe("marketing copy", () => {
  it("has every English string in Arabic too", () => {
    expect(shape(copy("ar"))).toEqual(shape(copy("en")));
  });

  it("never writes the brand name, domain or email itself", () => {
    const text = JSON.stringify([copy("en"), copy("ar")]).toLowerCase();
    for (const value of [brand.brandName, brand.brandNameAr, brand.domain, brand.supportEmail]) expect(text).not.toContain(value.toLowerCase());
  });

  it("fills placeholders from brand.json", () => {
    expect(fill("{brandName} at {domain}, {email}", "en")).toBe(`${brand.brandName} at ${brand.domain}, ${brand.supportEmail}`);
    expect(fill("{brandName}", "ar")).toBe(brand.brandNameAr);
  });

  it("formats the privacy date in both languages", () => {
    expect(formatDate("2026-10-22", "en")).toBe("22 October 2026");
    expect(formatDate("2026-10-22", "ar")).toContain("2026");
  });
});

describe("pagePath", () => {
  it("puts English at the root and Arabic under /ar", () => {
    expect(pagePath("en", "home")).toBe("/");
    expect(pagePath("en", "privacy")).toBe("/privacy");
    expect(pagePath("ar", "home")).toBe("/ar");
    expect(pagePath("ar", "contact")).toBe("/ar/contact");
  });
});

describe("SEO", () => {
  it("gives every page its own title, canonical and language alternates", () => {
    const meta = marketingMetadata("ar", "privacy");
    expect(meta.title).toEqual({ absolute: `سياسة الخصوصية · ${brand.brandNameAr}` });
    expect(meta.alternates?.canonical).toBe("/ar/privacy");
    expect(meta.alternates?.languages).toEqual({ en: "/privacy", ar: "/ar/privacy", "x-default": "/privacy" });
    expect(marketingMetadata("en", "home").description).toBeTruthy();
  });

  it("lists all six marketing pages for the sitemap", () => {
    const urls = marketingUrls().map((u) => u.url);
    expect(urls).toHaveLength(6);
    for (const path of ["/", "/ar", "/privacy", "/ar/privacy", "/contact", "/ar/contact"]) expect(urls).toContain(`https://${brand.domain}${path}`);
  });
});

describe("storeLinks", () => {
  it("is empty until brand.json has store addresses", () => {
    expect(storeLinks({})).toEqual({ appStore: null, googlePlay: null });
    expect(storeLinks()).toEqual({
      appStore: (brandFile as { appStoreUrl?: string }).appStoreUrl ?? null,
      googlePlay: (brandFile as { googlePlayUrl?: string }).googlePlayUrl ?? null,
    });
  });

  it("only accepts https addresses", () => {
    expect(storeLinks({ appStoreUrl: "https://apps.example/x", googlePlayUrl: "javascript:alert(1)" })).toEqual({ appStore: "https://apps.example/x", googlePlay: null });
  });
});

describe("fonts", () => {
  it("load the brand fonts named in brand.json", () => {
    expect({ ...LATIN_FONTS, ...ARABIC_FONT }).toEqual({ fontDisplay: brand.fontDisplay, fontBody: brand.fontBody, fontArabic: brand.fontArabic });
  });
});
