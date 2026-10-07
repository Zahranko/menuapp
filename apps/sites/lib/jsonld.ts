import registry from "../templates/registry.json";
import { DAYS, parseRange } from "../templates/_kit/site-data";
import { hours, image, text } from "./settings";
import { siteUrl } from "./seo";
import type { PublicSite } from "./types";

const DAY_NAMES = {
  sat: "Saturday",
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
} as const;

/** schema.org business types, picked from the template's category. The first match wins; anything else is a Restaurant. */
const TYPES: [RegExp, string][] = [
  [/caf|coffee|bakery/i, "CafeOrCoffeeShop"],
  [/salon|beauty|spa|barber/i, "BeautySalon"],
  [/dental|dentist/i, "Dentist"],
  [/clinic|medical|doctor/i, "MedicalClinic"],
  [/gym|fitness|yoga/i, "ExerciseGym"],
  [/agency|studio|design|freelanc|consult/i, "ProfessionalService"],
  [/home services|cleaning|repair|plumb/i, "HomeAndConstructionBusiness"],
  [/shop|store|boutique/i, "Store"],
];
const FOOD = new Set(["CafeOrCoffeeShop", "Restaurant"]);

export function businessType(templateId: string): string {
  const category =
    registry.templates.find((t) => t.id === templateId)?.category ?? "";
  return TYPES.find(([pattern]) => pattern.test(category))?.[1] ?? "Restaurant";
}

const absolute = (src: string | null, origin: string) =>
  src ? new URL(src, origin).toString() : undefined;

/** schema.org data for search engines: the business, its opening hours and its full menu or price list. */
export function siteJsonLd(site: PublicSite): Record<string, unknown> {
  const url = siteUrl(site);
  const origin = new URL(url).origin;
  const { business } = site;
  const opening = DAYS.flatMap((day) => {
    const range = parseRange(hours(site.settings)[day]);
    if (!range) return [];
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`,
        opens: range[0],
        closes: range[1] === "24:00" ? "23:59" : range[1],
      },
    ];
  });

  const type = businessType(site.templateId);
  const sections = site.categories.filter((c) => c.products.length);
  const offer = (p: PublicSite["categories"][number]["products"][number]) => ({
    "@type": "Offer",
    price: p.price.toFixed(3).replace(/0$/, ""),
    priceCurrency: business.currencyCode,
    availability: p.isAvailable
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
  });
  // Food places list a Menu; shops and service businesses list an OfferCatalog of products or services.
  const catalog = FOOD.has(type)
    ? {
        hasMenu: {
          "@type": "Menu",
          name: business.name,
          url,
          inLanguage: business.locale,
          hasMenuSection: sections.map((c) => ({
            "@type": "MenuSection",
            name: c.name,
            hasMenuItem: c.products.map((p) => ({
              "@type": "MenuItem",
              name: p.name,
              description: p.description ?? undefined,
              image: absolute(p.imageUrl, origin),
              offers: offer(p),
            })),
          })),
        },
      }
    : {
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: business.name,
          itemListElement: sections.map((c) => ({
            "@type": "OfferCatalog",
            name: c.name,
            itemListElement: c.products.map((p) => ({
              ...offer(p),
              itemOffered: {
                "@type": type === "Store" ? "Product" : "Service",
                name: p.name,
                description: p.description ?? undefined,
                image: absolute(p.imageUrl, origin),
              },
            })),
          })),
        },
      };

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: business.name,
    url,
    description: text(site.settings, "hero.subtitle") || undefined,
    image: absolute(image(site.settings["hero.image"]), origin),
    logo: absolute(image(site.settings["logo"]), origin),
    telephone: business.whatsApp ?? undefined,
    email: business.email ?? undefined,
    address: business.address
      ? { "@type": "PostalAddress", streetAddress: business.address }
      : undefined,
    sameAs: business.instagram
      ? [`https://instagram.com/${business.instagram.replace(/^@/, "")}`]
      : undefined,
    currenciesAccepted: business.currencyCode,
    openingHoursSpecification: opening.length ? opening : undefined,
    ...catalog,
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
