import { strings } from "@/lib/i18n";
import { image, list, sectionOn, text } from "@/lib/settings";
import type { PublicSite } from "@/lib/types";
import { contact, hoursRows, menu, todayLine, type Contact, type HoursRow, type MenuSection } from "../_kit/site-data";
import { souqCopy, type SouqCopy } from "./copy";

/** Everything the sections need, worked out once per render. */
export type SouqContext = {
  site: PublicSite;
  t: ReturnType<typeof strings>;
  c: SouqCopy;
  sections: MenuSection[];
  contact: Contact;
  hours: HoursRow[];
  today: string | null;
  on: (section: string) => boolean;
  text: (key: string) => string;
  image: (key: string) => string | null;
  gallery: string[];
  /** The time of this render (tests pass a fixed one). */
  now: Date;
};

export function souqContext(site: PublicSite, now: Date = new Date()): SouqContext {
  const hours = hoursRows(site, now);
  return {
    site,
    t: strings(site.business.locale),
    c: souqCopy(site.business.locale),
    sections: menu(site),
    contact: contact(site),
    hours,
    today: todayLine(site, hours),
    on: (section) => sectionOn(site.settings, section),
    text: (key) => text(site.settings, key).trim(),
    image: (key) => image(site.settings[key], site.templateId),
    gallery: list(site.settings, "gallery").slice(0, 6),
    now,
  };
}
