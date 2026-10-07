import { strings } from "@/lib/i18n";
import { image, list, sectionOn, text } from "@/lib/settings";
import type { PublicSite } from "@/lib/types";
import { contact, featured, hoursRows, menu, todayLine, type Contact, type HoursRow, type MenuItem, type MenuSection } from "./site-data";

/** What every template works from, computed once per render. Templates add their own copy on top. */
export type SiteContext = {
  site: PublicSite;
  /** Shared words in the site's language (lib/i18n.ts). */
  t: ReturnType<typeof strings>;
  locale: "en" | "ar";
  rtl: boolean;
  sections: MenuSection[];
  /** Featured, in-stock products (at most 3 by default; call featured() for another count). */
  picks: MenuItem[];
  contact: Contact;
  hours: HoursRow[];
  today: string | null;
  on: (section: string) => boolean;
  text: (key: string) => string;
  image: (key: string) => string | null;
  gallery: string[];
  /** Filled-in reviews from reviews.<n>.quote / reviews.<n>.name. */
  reviews: { quote: string; name: string }[];
  /** The time of this render (tests pass a fixed one). */
  now: Date;
};

export function siteContext(site: PublicSite, now: Date = new Date()): SiteContext {
  const hours = hoursRows(site, now);
  const sections = menu(site);
  const read = (key: string) => text(site.settings, key).trim();
  const locale = site.business.locale === "ar" ? "ar" : "en";
  return {
    site,
    t: strings(locale),
    locale,
    rtl: locale === "ar",
    sections,
    picks: featured(sections, 3),
    contact: contact(site),
    hours,
    today: todayLine(site, hours),
    on: (section) => sectionOn(site.settings, section),
    text: read,
    image: (key) => image(site.settings[key]),
    gallery: list(site.settings, "gallery").slice(0, 12),
    reviews: [1, 2, 3, 4, 5, 6].map((n) => ({ quote: read(`reviews.${n}.quote`), name: read(`reviews.${n}.name`) })).filter((r) => r.quote),
    now,
  };
}

/** Joins class names, skipping empty ones. */
export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");
