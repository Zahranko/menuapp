import type { PublicSite } from "@/lib/types";
import { siteContext, type SiteContext } from "../_kit/context";
import { souqCopy, type SouqCopy } from "./copy";

export type SouqContext = SiteContext & { c: SouqCopy };

export function souqContext(site: PublicSite, now: Date = new Date()): SouqContext {
  const base = siteContext(site, now);
  return { ...base, c: souqCopy(base.locale), gallery: base.gallery.slice(0, 6) };
}
