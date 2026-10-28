import { facebookLink, phoneLink, snapchatLink, tiktokLink } from "@/lib/format";
import { choice, list, text } from "@/lib/settings";
import type { PublicSite, Settings } from "@/lib/types";
import { pageBackground } from "./background";
import { cardAttributes } from "./cards";
import { isDark } from "./color";
import { heroAttributes } from "./hero";
import { signatureAttributes } from "./signatures";
import { layoutAttributes } from "./layout";
import { TYPEFACE_NAMES, TYPEFACES, type FontPair, type TypefaceName } from "./fonts";
import { contact as contactLinks } from "./site-data";
import siteOptions from "./site-options.json";
import { styleAttributes } from "./style";

/*
 * The owner's site options shared by every template (fields in site-options.json, added to every template by
 * scripts/build-registry.mjs): the footer name size, which social accounts show, the floating order button and the font.
 * This file turns the saved values into what templates render; _kit/options.css styles them. The defaults change
 * nothing, so a site that never touched these looks exactly as before.
 */

const field = (key: string) => siteOptions.fields.find((f) => f.key === key)!;
const options = <T extends string>(key: string) => field(key).options as T[];

/* ---------- footer ---------- */

export type FooterNameSize = "large" | "medium" | "small";
export const FOOTER_NAME_SIZES = options<FooterNameSize>("footer.nameSize");

export const footerNameSize = (settings: Settings): FooterNameSize => choice(settings, "footer.nameSize", FOOTER_NAME_SIZES, "large");

/* ---------- social accounts ---------- */

export type Network = "instagram" | "whatsapp" | "facebook" | "tiktok" | "snapchat" | "phone";
export const NETWORKS = options<Network>("social.show");

export type SocialAccount = { network: Network; href: string; label: string; handle: string };

const NETWORK_LABELS: Record<"en" | "ar", Record<Network, string>> = {
  en: { instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook", tiktok: "TikTok", snapchat: "Snapchat", phone: "Call us" },
  ar: { instagram: "إنستغرام", whatsapp: "واتساب", facebook: "فيسبوك", tiktok: "تيك توك", snapchat: "سناب شات", phone: "اتصل بنا" },
};

export const networkLabel = (network: Network, locale: string) => NETWORK_LABELS[locale === "ar" ? "ar" : "en"][network];

/** The number for calls: the business's phone, else its WhatsApp number. */
export const callNumber = (site: PublicSite) => site.business.phone || site.business.whatsApp || null;

/** Every account the business has filled in, with its link, in the order of the "social.show" toggles. */
export function accountsOf(site: PublicSite): SocialAccount[] {
  const b = site.business;
  const links = contactLinks(site);
  const call = callNumber(site);
  const all: Record<Network, [string | null | undefined, string | null | undefined]> = {
    instagram: [links.instagram, b.instagram],
    whatsapp: [links.whatsapp, b.whatsApp],
    facebook: [b.facebook ? facebookLink(b.facebook) : null, b.facebook],
    tiktok: [b.tikTok ? tiktokLink(b.tikTok) : null, b.tikTok],
    snapchat: [b.snapchat ? snapchatLink(b.snapchat) : null, b.snapchat],
    phone: [call ? phoneLink(call) : null, call],
  };
  const locale = b.locale;
  return NETWORKS.flatMap((network) => {
    const [href, handle] = all[network];
    return href && handle ? [{ network, href, handle, label: networkLabel(network, locale) }] : [];
  });
}

/**
 * The accounts the owner chose to show ("social.show"), that the business has filled in. A site saved before the setting
 * existed uses the template's default: what its footer showed before (Instagram and WhatsApp for some, none for most).
 */
export function socialAccounts(site: PublicSite, templateDefault: readonly Network[] = []): SocialAccount[] {
  const chosen = Array.isArray(site.settings["social.show"]) ? list(site.settings, "social.show") : templateDefault;
  return accountsOf(site).filter((a) => chosen.includes(a.network));
}

/* ---------- order button ---------- */

export type OrderAction = "whatsapp" | "call" | "instagram" | "facebook";
export type OrderChoice = "auto" | OrderAction | "hide";
export type OrderShape = "auto" | "pill" | "rounded" | "circle";
export const ORDER_CHOICES = options<OrderChoice>("order.action");
export const ORDER_SHAPES = options<OrderShape>("order.shape");

const ORDER_LABELS: Record<"en" | "ar", Record<OrderAction, string>> = {
  en: { whatsapp: "Order on WhatsApp", call: "Call us", instagram: "Find us on Instagram", facebook: "Find us on Facebook" },
  ar: { whatsapp: "اطلب عبر واتساب", call: "اتصل بنا", instagram: "تابعنا على إنستغرام", facebook: "تابعنا على فيسبوك" },
};

export type OrderButton = {
  action: OrderAction;
  href: string;
  /** The owner's own text, else the template's text for WhatsApp, else the action's usual text, in the site's language. */
  label: string;
  /** The owner chose the shape; "auto" keeps the template's own. */
  shape: OrderShape;
  /** Links outside the site open in a new tab; a phone call does not. */
  external: boolean;
  /** The owner picked an action (not "Template default"): templates without a floating button of their own show the shared one. */
  chosen: boolean;
};

const orderNetwork: Record<OrderAction, Network> = { whatsapp: "whatsapp", call: "phone", instagram: "instagram", facebook: "facebook" };

/**
 * The floating order button, or null when it is hidden or nothing can be linked.
 * "Template default" orders on WhatsApp like before; an action whose account is missing falls back to WhatsApp, and the
 * button hides when there is no WhatsApp either. `template` holds the template's own text and link for its WhatsApp
 * button (a WhatsApp link with a ready message, for example).
 */
export function orderButton(site: PublicSite, template: { label?: string; whatsapp?: string | null } = {}): OrderButton | null {
  const picked = choice(site.settings, "order.action", ORDER_CHOICES, "auto");
  if (picked === "hide") return null;
  const accounts = accountsOf(site);
  const link = (action: OrderAction) =>
    action === "whatsapp" && template.whatsapp !== undefined ? template.whatsapp : (accounts.find((a) => a.network === orderNetwork[action])?.href ?? null);
  let action: OrderAction = picked === "auto" ? "whatsapp" : picked;
  if (!link(action)) action = "whatsapp";
  const href = link(action);
  if (!href) return null;
  const locale = site.business.locale === "ar" ? "ar" : "en";
  const own = text(site.settings, "order.label").trim();
  return {
    action,
    href,
    label: own || (action === "whatsapp" && template.label) || ORDER_LABELS[locale][action],
    shape: choice(site.settings, "order.shape", ORDER_SHAPES, "auto"),
    external: action !== "call",
    chosen: picked !== "auto",
  };
}

/* ---------- font ---------- */

/** The owner's font pair ("font.family"), or null for the template's own fonts. Arabic drops letter spacing. */
export function typeface(settings: Settings, locale: string): FontPair | null {
  const name = choice<"default" | TypefaceName>(settings, "font.family", ["default", ...TYPEFACE_NAMES], "default");
  if (name === "default") return null;
  const pair: FontPair = TYPEFACES[name];
  return locale === "ar" ? { ...pair, tracking: "0" } : pair;
}

/* ---------- root attributes ---------- */

/**
 * Data attributes for the template's root element that switch on the options in _kit/options.css. Empty for the defaults.
 * `ownButton`: the template has a floating order button of its own; otherwise the shared one (OrderFab) shows when the
 * owner picked an action.
 */
export function optionAttributes(site: PublicSite, order: OrderButton | null = null, ownButton = false): Record<string, string> {
  const attrs: Record<string, string> = {};
  const size = footerNameSize(site.settings);
  if (size !== "large") attrs["data-foot-name"] = size;
  const shown = order !== null && (ownButton || order.chosen);
  if (shown && !ownButton) attrs["data-order-fab"] = order.action;
  if (shown && order.shape !== "auto") attrs["data-order-shape"] = order.shape;
  const font = choice(site.settings, "font.family", ["default", ...TYPEFACE_NAMES], "default");
  if (font !== "default") attrs["data-font"] = font;
  // The owner's background color (_kit/background.ts): templates restyle the few parts drawn in fixed colors.
  const background = pageBackground(site.settings);
  if (background) attrs["data-page-bg"] = isDark(background) ? "dark" : "light";
  // Card options (_kit/cards.ts, cards.css), hero options (_kit/hero.ts, hero.css), page style (_kit/style.ts, style.css)
  // and page layout (_kit/layout.ts, layout.css).
  return { ...attrs, ...cardAttributes(site.settings), ...heroAttributes(site.settings), ...styleAttributes(site.settings), ...layoutAttributes(site.settings), ...signatureAttributes(site) };
}
