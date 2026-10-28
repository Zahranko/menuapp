import type { ReactElement, SVGProps } from "react";
import { initial } from "@/lib/format";
import { madeWith } from "@/lib/i18n";
import { cx, type SiteContext } from "./context";
import { Facebook, Instagram, Mail, Phone, Pin, Snapchat, TikTok, WhatsApp } from "./icons";
import { optionAttributes, type Network, type OrderAction, type OrderButton, type SocialAccount } from "./options";
import { ItemSheet, type SheetItem } from "./ItemSheet";
import { bareLogo, logoAttributes } from "./logo";
import { NaturalPicture, Picture } from "./Picture";
import { tintFor, type MenuItem } from "./site-data";
import { MadeWithLink } from "@/components/brand/logo-mark";

/*
 * Small building blocks with plain class names. Each template styles them in its own styles.css
 * (everything there is nested under the template's root class, so the names never clash).
 */

/** "Skip to menu" link for keyboard users, the preview notice and the announcement bar. */
export function TopBars({ ctx, announcement = true }: { ctx: SiteContext; announcement?: boolean }) {
  const text = ctx.text("announcement");
  return (
    <>
      <a className="skip" href="#menu">
        {ctx.t.viewMenu}
      </a>
      {ctx.site.isPreview && <div className="preview-bar">{ctx.t.preview}</div>}
      {announcement && ctx.on("announcement") && text && (
        <div className="announcement" data-section="announcement">
          {text}
        </div>
      )}
    </>
  );
}

/**
 * The logo setting, or the business's first letter. Follows the owner's logo options (_kit/logo.ts, _kit/logo.css):
 * its size, and with the frame off the uploaded picture at its own proportions with none of the template's tile around it.
 */
export function Logo({ ctx, className = "logo", sizes = "48px" }: { ctx: SiteContext; className?: string; sizes?: string }) {
  const logo = ctx.image("logo");
  const bare = logo !== null && bareLogo(ctx.logo);
  return (
    <span className={cx(className, "kit-logo", bare && "kit-logo-bare")}>
      {logo ? bare ? <NaturalPicture src={logo} /> : <Picture src={logo} sizes={sizes} /> : initial(ctx.site.business.name)}
    </span>
  );
}

/** The business name next to the logo. Hidden on screen (kept for screen readers) when the owner turns the name off. */
export function BrandName({ ctx, className }: { ctx: SiteContext; className?: string }) {
  return <span className={cx(className, "kit-name")}>{ctx.site.business.name}</span>;
}

/** Data attributes for a template's root element that switch on the owner's logo options in _kit/logo.css. */
export const logoRoot = (ctx: SiteContext) => logoAttributes(ctx.logo);

/** A product photo, or a tinted tile with the first letter. Put it inside a positioned box. */
export function ProductPicture({ item, sizes }: { item: MenuItem; sizes: string }) {
  return item.imageUrl ? (
    <Picture src={item.imageUrl} sizes={sizes} />
  ) : (
    <span className="no-photo" style={{ background: tintFor(item.name) }} aria-hidden="true">
      {initial(item.name)}
    </span>
  );
}

/** Opening hours as a definition list; today's row gets class "today" and a small tag. */
export function HoursList({ ctx, className = "hours" }: { ctx: SiteContext; className?: string }) {
  return (
    <dl className={className}>
      {ctx.hours.map((row) => (
        <div key={row.day} className={row.today ? "today" : undefined}>
          <dt>
            {row.name}
            {row.today && <span className="today-tag">{ctx.t.today}</span>}
          </dt>
          <dd>{row.time ?? ctx.t.closed}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Address, WhatsApp and email with icons. */
export function ContactList({ ctx, className = "contact" }: { ctx: SiteContext; className?: string }) {
  const { business } = ctx.site;
  return (
    <ul className={className}>
      {business.address && (
        <li>
          <Pin />
          <p>
            <span>{ctx.t.address}</span>
            <bdi>{business.address}</bdi>
          </p>
        </li>
      )}
      {business.whatsApp && (
        <li>
          <WhatsApp />
          <p>
            <span>{ctx.t.phone}</span>
            <bdi dir="ltr">{business.whatsApp}</bdi>
          </p>
        </li>
      )}
      {business.email && (
        <li>
          <Mail />
          <p>
            <span>{ctx.t.email}</span>
            <bdi>{business.email}</bdi>
          </p>
        </li>
      )}
    </ul>
  );
}

/**
 * "© 2026 Name. All rights reserved." and the "Made with" link. A long name wraps (_kit/options.css); in footers without
 * a FootName the line follows the owner's footer name size.
 */
export function Credits({ ctx, className = "credits" }: { ctx: SiteContext; className?: string }) {
  return (
    <div className={cx(className, "kit-credits")}>
      <span className="kit-credits-text">
        © {ctx.now.getFullYear()} {ctx.site.business.name}. {ctx.t.rights}
      </span>
      <MadeWithLink label={madeWith(ctx.locale)} />
    </div>
  );
}

/**
 * The business name set large in a footer. It wraps (even a single long word) instead of running off the screen, and
 * follows the owner's footer name size: the inner span scales from the template's own size (_kit/options.css).
 * `decorative`: a large watermark the page already names elsewhere, hidden from screen readers.
 */
export function FootName({ ctx, className, as: Tag = "p", decorative = false }: { ctx: SiteContext; className?: string; as?: "p" | "span" | "div"; decorative?: boolean }) {
  return (
    <Tag className={cx(className, "kit-foot-name")} aria-hidden={decorative || undefined}>
      <span className="kit-foot-name-text">{ctx.site.business.name}</span>
    </Tag>
  );
}

const NETWORK_ICONS: Record<Network, (p: SVGProps<SVGSVGElement>) => ReactElement> = {
  instagram: Instagram,
  whatsapp: WhatsApp,
  facebook: Facebook,
  tiktok: TikTok,
  snapchat: Snapchat,
  phone: Phone,
};

/** The icon of a social network (line style, in the text color). */
export function NetworkIcon({ network, ...props }: { network: Network } & SVGProps<SVGSVGElement>) {
  const Icon = NETWORK_ICONS[network];
  return <Icon {...props} />;
}

/**
 * Icon links to the business's social accounts, for templates to put inside their own footer row.
 * Each link is named for screen readers ("Instagram", "Call us").
 */
export function SocialIcons({ accounts, className }: { accounts: SocialAccount[]; className?: string }) {
  return (
    <>
      {accounts.map((a) => (
        <a
          key={a.network}
          className={cx(className, "kit-social-link")}
          data-network={a.network}
          href={a.href}
          aria-label={a.label}
          title={a.label}
          {...(a.network === "phone" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          <NetworkIcon network={a.network} />
        </a>
      ))}
    </>
  );
}

/** A row of social icon links ("social.show"), or nothing when the owner shows none. Styled by the template (.kit-social). */
export function SocialLinks({ accounts, className }: { accounts: SocialAccount[]; className?: string }) {
  if (accounts.length === 0) return null;
  return (
    <div className={cx(className, "kit-social")} data-section="social">
      <SocialIcons accounts={accounts} />
    </div>
  );
}

const ORDER_ICONS: Record<OrderAction, Network> = { whatsapp: "whatsapp", call: "phone", instagram: "instagram", facebook: "facebook" };

/** The icon for an order button's action. */
export function OrderIcon({ action, ...props }: { action: OrderAction } & SVGProps<SVGSVGElement>) {
  return <NetworkIcon network={ORDER_ICONS[action]} {...props} />;
}

/** Link attributes for an order button: a new tab for WhatsApp, Instagram and Facebook, none for a call. */
export const orderLink = (order: OrderButton) => ({
  href: order.href,
  "data-order-action": order.action,
  ...(order.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
});

/**
 * The inside of a template's own order button: the action's icon and the label. Templates whose button had an icon pass
 * `icon`; the others show one only once the owner picks an action or a shape, so their button looks as before until then.
 */
export function OrderContent({ order, icon = false }: { order: OrderButton; icon?: boolean }) {
  const showIcon = icon || order.chosen || order.shape !== "auto";
  return (
    <>
      {showIcon && <OrderIcon action={order.action} className="kit-order-icon" />}
      <span className="kit-order-label">{order.label}</span>
    </>
  );
}

/**
 * The shared floating order button, for templates without one of their own. It shows only when the owner picked an
 * action ("Template default" keeps these templates as they were, without one). Shape and colors: _kit/options.css.
 */
export function OrderFab({ order }: { order: OrderButton | null }) {
  if (!order || !order.chosen) return null;
  return (
    <a className="kit-fab kit-order" data-k="float" {...orderLink(order)} aria-label={order.label} data-section="order">
      <OrderIcon action={order.action} />
      <span className="kit-order-label">{order.label}</span>
    </a>
  );
}

/** Data attributes for a template's root element that switch on the owner's site options in _kit/options.css. */
export const optionRoot = (ctx: SiteContext, order: OrderButton | null = null, ownButton = false) => optionAttributes(ctx.site, order, ownButton);

/** The product details dialog, fed from the menu. Class names: sheet, sheet-media, sheet-body, sheet-title, sheet-text, sheet-row, sheet-close, tag. */
/** Product details dialog. Service templates pass `services` so unavailable items read "Not available" instead of "Sold out". */
export function ProductSheet({ ctx, closeClassName = "sheet-close", services = false }: { ctx: SiteContext; closeClassName?: string; services?: boolean }) {
  const items: SheetItem[] = ctx.sections.flatMap((section) =>
    section.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.priceText,
      image: p.imageUrl,
      tint: tintFor(p.name),
      label: p.labelText,
      soldOut: !p.isAvailable,
    })),
  );
  return (
    <ItemSheet
      items={items}
      closeLabel={ctx.t.close}
      soldOutLabel={services ? ctx.t.unavailable : ctx.t.soldOut}
      classes={{ dialog: "sheet", media: "sheet-media", body: "sheet-body", title: "sheet-title", text: "sheet-text", row: "sheet-row", close: closeClassName, tag: "tag" }}
    />
  );
}
