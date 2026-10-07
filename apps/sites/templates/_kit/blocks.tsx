import { brand } from "@/lib/brand";
import { initial } from "@/lib/format";
import { madeWith } from "@/lib/i18n";
import type { SiteContext } from "./context";
import { Mail, Pin, WhatsApp } from "./icons";
import { ItemSheet, type SheetItem } from "./ItemSheet";
import { Picture } from "./Picture";
import { tintFor, type MenuItem } from "./site-data";

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

/** The logo setting, or the business's first letter. */
export function Logo({ ctx, className = "logo", sizes = "48px" }: { ctx: SiteContext; className?: string; sizes?: string }) {
  const logo = ctx.image("logo");
  return <span className={className}>{logo ? <Picture src={logo} sizes={sizes} /> : initial(ctx.site.business.name)}</span>;
}

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

/** "© 2026 Name. All rights reserved." and the "Made with" link. */
export function Credits({ ctx, className = "credits" }: { ctx: SiteContext; className?: string }) {
  return (
    <div className={className}>
      <span>
        © {ctx.now.getFullYear()} {ctx.site.business.name}. {ctx.t.rights}
      </span>
      <a href={`https://${brand.domain}`}>{madeWith(ctx.locale)}</a>
    </div>
  );
}

/** The product details dialog, fed from the menu. Class names: sheet, sheet-media, sheet-body, sheet-title, sheet-text, sheet-row, sheet-close, tag. */
export function ProductSheet({ ctx, closeClassName = "sheet-close" }: { ctx: SiteContext; closeClassName?: string }) {
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
      soldOutLabel={ctx.t.soldOut}
      classes={{ dialog: "sheet", media: "sheet-media", body: "sheet-body", title: "sheet-title", text: "sheet-text", row: "sheet-row", close: closeClassName, tag: "tag" }}
    />
  );
}
