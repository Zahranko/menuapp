import registry from "../templates/registry.json";
import { DAYS, parseRange } from "../templates/_kit/site-data";
import { hours, image, text } from "./settings";
import { siteUrl } from "./seo";
import type { PublicSite } from "./types";

const DAY_NAMES = { sat: "Saturday", sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" } as const;

/** Cafés are a CafeOrCoffeeShop, everything else a Restaurant (the template's category decides). */
export function businessType(templateId: string): "CafeOrCoffeeShop" | "Restaurant" {
  const category = registry.templates.find((t) => t.id === templateId)?.category ?? "";
  return /caf|coffee|bakery/i.test(category) ? "CafeOrCoffeeShop" : "Restaurant";
}

const absolute = (src: string | null, origin: string) => (src ? new URL(src, origin).toString() : undefined);

/** schema.org data for search engines: the business, its opening hours and its full menu with prices. */
export function siteJsonLd(site: PublicSite): Record<string, unknown> {
  const url = siteUrl(site);
  const origin = new URL(url).origin;
  const { business } = site;
  const opening = DAYS.flatMap((day) => {
    const range = parseRange(hours(site.settings)[day]);
    if (!range) return [];
    return [{ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`, opens: range[0], closes: range[1] === "24:00" ? "23:59" : range[1] }];
  });

  return {
    "@context": "https://schema.org",
    "@type": businessType(site.templateId),
    name: business.name,
    url,
    description: text(site.settings, "hero.subtitle") || undefined,
    image: absolute(image(site.settings["hero.image"], site.templateId), origin),
    logo: absolute(image(site.settings["logo"], site.templateId), origin),
    telephone: business.whatsApp ?? undefined,
    email: business.email ?? undefined,
    address: business.address ? { "@type": "PostalAddress", streetAddress: business.address } : undefined,
    sameAs: business.instagram ? [`https://instagram.com/${business.instagram.replace(/^@/, "")}`] : undefined,
    currenciesAccepted: business.currencyCode,
    openingHoursSpecification: opening.length ? opening : undefined,
    hasMenu: {
      "@type": "Menu",
      name: business.name,
      url,
      inLanguage: business.locale,
      hasMenuSection: site.categories
        .filter((c) => c.products.length)
        .map((c) => ({
          "@type": "MenuSection",
          name: c.name,
          hasMenuItem: c.products.map((p) => ({
            "@type": "MenuItem",
            name: p.name,
            description: p.description ?? undefined,
            image: absolute(p.imageUrl, origin),
            offers: {
              "@type": "Offer",
              price: p.price.toFixed(3).replace(/0$/, ""),
              priceCurrency: business.currencyCode,
              availability: p.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          })),
        })),
    },
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
