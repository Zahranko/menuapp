import { formatPrice, instagramLink, mapsLink, whatsappLink } from "@/lib/format";
import { label, strings } from "@/lib/i18n";
import { hours as hoursSetting, type Hours } from "@/lib/settings";
import type { PublicCategory, PublicProduct, PublicSite } from "@/lib/types";

/** Everything a template needs that is not a design choice: menu, prices, hours, links, in the site's language. */

export const DAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;
export type Day = (typeof DAYS)[number];

export type HoursRow = { day: Day; name: string; time: string | null; today: boolean };

const SHORT_TO_DAY: Record<string, Day> = { Sat: "sat", Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri" };

/** Today's weekday in the business's time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): Day {
  let short: string;
  try {
    short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(now);
  } catch {
    short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(now);
  }
  return SHORT_TO_DAY[short] ?? "sat";
}

/** "08:00-23:00" → ["08:00", "23:00"]; empty or "closed" → null. */
export function parseRange(value: string | undefined): [string, string] | null {
  const match = value?.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  return match ? [match[1], match[2]] : null;
}

export function hoursRows(site: PublicSite, now: Date = new Date(), key = "hours"): HoursRow[] {
  const value: Hours = hoursSetting(site.settings, key);
  const today = todayIn(site.business.timeZone, now);
  const t = strings(site.business.locale);
  return DAYS.map((day) => {
    const range = parseRange(value[day]);
    return { day, name: t.days[day], time: range ? `${range[0]} – ${range[1]}` : null, today: day === today };
  });
}

export const hasHours = (rows: HoursRow[]) => rows.some((r) => r.time);

/** "Open today until 23:00", "Closed today", or null when no hours are set. */
export function todayLine(site: PublicSite, rows: HoursRow[]): string | null {
  if (!hasHours(rows)) return null;
  const t = strings(site.business.locale);
  const row = rows.find((r) => r.today);
  const range = row?.time?.split(" – ");
  return range ? t.openUntil.replace("{time}", range[1]) : t.closedToday;
}

export type MenuItem = PublicProduct & { priceText: string; labelText: string | null; search: string };
export type MenuSection = Omit<PublicCategory, "products"> & { products: MenuItem[]; anchor: string };

export function menu(site: PublicSite): MenuSection[] {
  const { locale, currencyCode } = site.business;
  return site.categories
    .filter((c) => c.products.length > 0)
    .map((c, i) => ({
      ...c,
      anchor: `cat-${i + 1}`,
      products: c.products.map((p) => ({
        ...p,
        priceText: formatPrice(p.price, currencyCode, locale),
        labelText: p.label ? label(p.label, locale) : null,
        search: `${p.name} ${p.description ?? ""} ${c.name}`.toLowerCase(),
      })),
    }));
}

/** Featured products that are in stock, in menu order. */
export function featured(sections: MenuSection[], max = 3): MenuItem[] {
  return sections.flatMap((s) => s.products).filter((p) => p.isFeatured && p.isAvailable).slice(0, max);
}

export type Contact = {
  whatsapp: string | null;
  maps: string | null;
  instagram: string | null;
  email: string | null;
};

export function contact(site: PublicSite): Contact {
  const b = site.business;
  return {
    whatsapp: b.whatsApp ? whatsappLink(b.whatsApp) : null,
    maps: b.address ? mapsLink(b.address) : null,
    instagram: b.instagram ? instagramLink(b.instagram) : null,
    email: b.email ? `mailto:${b.email}` : null,
  };
}

/** A soft, stable background tint for products without a photo. */
const TINTS = ["#E7C9A0", "#D8C3A5", "#DDE6CC", "#E9D2B8", "#DCE6C8", "#E8E3C8", "#EBD6BD", "#F6DDB0", "#F3D9C4", "#C9B6A6"];
export function tintFor(text: string): string {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}
