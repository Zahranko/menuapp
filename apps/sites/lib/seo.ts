import type { Metadata } from "next";
import { brand } from "./brand";
import { text } from "./settings";
import type { PublicSite } from "./types";

/** The site's canonical URL: its first custom domain, otherwise {domain}/<slug>. */
export function siteUrl(site: PublicSite): string {
  const custom = site.business.customDomains[0];
  return custom ? `https://${custom}` : `https://${brand.domain}/${site.business.slug}`;
}

export function siteDescription(site: PublicSite): string {
  const subtitle = text(site.settings, "hero.subtitle");
  if (subtitle) return subtitle;
  const names = site.categories.flatMap((c) => c.products.map((p) => p.name)).slice(0, 4);
  return names.length ? `${site.business.name}: ${names.join(", ")} and more.` : site.business.name;
}

export function siteMetadata(site: PublicSite): Metadata {
  const url = siteUrl(site);
  const title = text(site.settings, "hero.title") ? `${site.business.name} · ${text(site.settings, "hero.title")}` : site.business.name;
  return {
    title,
    description: siteDescription(site),
    alternates: { canonical: url },
    openGraph: { title: site.business.name, description: siteDescription(site), url, siteName: site.business.name, type: "website", locale: site.business.locale === "ar" ? "ar_JO" : "en_US" },
    twitter: { card: "summary_large_image", title: site.business.name, description: siteDescription(site) },
  };
}
