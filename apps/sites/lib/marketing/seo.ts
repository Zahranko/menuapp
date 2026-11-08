import type { Metadata } from "next";
import { brand } from "../brand";
import { copy, fill, pagePath, type Lang, type MarketingPage } from "./copy";

/** Title, description, canonical address, the other language's address and share card of one marketing page. */
export function marketingMetadata(lang: Lang, page: MarketingPage): Metadata {
  const meta = copy(lang).meta[page];
  const title = fill(meta.title, lang);
  const description = fill(meta.description, lang);
  const url = pagePath(lang, page);
  return {
    metadataBase: new URL(`https://${brand.domain}`),
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: { en: pagePath("en", page), ar: pagePath("ar", page), "x-default": pagePath("en", page) },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: lang === "ar" ? brand.brandNameAr : brand.brandName,
      type: "website",
      locale: lang === "ar" ? "ar_JO" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar_JO",
    },
    // The share picture comes from opengraph-image.tsx next to each layout.
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Every marketing page in both languages, for the sitemap of the brand domain. */
export function marketingUrls(): { url: string; languages: Record<Lang, string>; priority: number }[] {
  const origin = `https://${brand.domain}`;
  const pages: MarketingPage[] = ["home", "privacy", "contact"];
  return pages.flatMap((page) =>
    (["en", "ar"] as const).map((lang) => ({
      url: `${origin}${pagePath(lang, page)}`,
      languages: { en: `${origin}${pagePath("en", page)}`, ar: `${origin}${pagePath("ar", page)}` },
      priority: page === "home" ? 1 : 0.4,
    })),
  );
}
