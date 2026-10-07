import { whatsappLink } from "@/lib/format";
import type { SiteContext } from "./context";

/*
 * Helpers for service-business templates (salons, clinics, studios, gyms, home services).
 * Services are the business's products; these add the parts a service website needs on top of a menu.
 */

/** A WhatsApp link that starts a booking message, or null when the business has no WhatsApp. */
export function bookLink(ctx: SiteContext, service?: string): string | null {
  const phone = ctx.site.business.whatsApp;
  if (!phone) return null;
  const start = ctx.text("book.message");
  return whatsappLink(
    phone,
    [start, service].filter(Boolean).join(" ").trim() || undefined,
  );
}

/** Numbered settings such as faq.1.q / faq.1.a, filled-in pairs only. */
export function pairs(
  ctx: SiteContext,
  prefix: string,
  a: string,
  b: string,
  max = 6,
): { a: string; b: string }[] {
  return Array.from({ length: max }, (_, i) => ({
    a: ctx.text(`${prefix}.${i + 1}.${a}`),
    b: ctx.text(`${prefix}.${i + 1}.${b}`),
  })).filter((p) => p.a);
}

export const faqs = (ctx: SiteContext) =>
  pairs(ctx, "faq", "q", "a").map((p) => ({ q: p.a, a: p.b }));
export const steps = (ctx: SiteContext) =>
  pairs(ctx, "steps", "title", "text", 4).map((p) => ({
    title: p.a,
    text: p.b,
  }));
export const highlights = (ctx: SiteContext) =>
  pairs(ctx, "highlights", "title", "text", 4).map((p) => ({
    title: p.a,
    text: p.b,
  }));
