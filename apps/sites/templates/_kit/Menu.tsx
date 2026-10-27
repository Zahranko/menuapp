import type { ReactNode } from "react";
import { itemCount } from "@/lib/i18n";
import { ProductPicture } from "./blocks";
import { cx, type SiteContext } from "./context";
import { menuAttributes, menuOptions, kitMenuOn, resolveMenu, type MenuLayout, type ResolvedMenu } from "./menu";
import { MenuNav } from "./MenuNav";
import { Picture } from "./Picture";
import type { MenuItem } from "./site-data";

/*
 * The shared menu of the "Menu layout" options (_kit/menu.ts, styled by _kit/menu.css). A template wraps its own menu
 * (its category links and categories, inside its own menu section and heading):
 *
 *   <SiteMenu ctx={ctx} like="list">{its own category links and categories}</SiteMenu>
 *
 * With every option on "Template default" the template's own markup renders untouched. Otherwise the shared menu takes
 * its place, in the owner's layout, with the template's colors, fonts and corners. `like` is the shared layout closest to
 * the template's own menu: what "Template default" means once another menu option is changed.
 * Products are buttons with data-item-id (the template's product dialog opens them), .kit-card with a .kit-card-media
 * photo, so the card options and the page style's photo shapes reach them.
 */

/** A category for the shared menu; `children` are its sub-categories (multi-page sites). */
export type KitSection = {
  id: string;
  anchor: string;
  name: string;
  products: MenuItem[];
  /** The category's own page (multi-page sites) and the link's text. */
  link?: { href: string; label: string };
  children?: KitSection[];
};

type Props = {
  ctx: SiteContext;
  /** The shared layout closest to the template's own menu. */
  like: Exclude<MenuLayout, "auto">;
  /** The categories (default: the whole menu). */
  sections?: KitSection[];
  /** Heading level of the category titles: 3 under the menu's own heading, 2 on a menu page under its h1. */
  level?: 2 | 3;
  /** Service websites: "Not available" instead of "Sold out". */
  services?: boolean;
  /** Words before every price ("From"). */
  pricePrefix?: string;
  /** The id the template's search filters (MenuSearch menuId, CatalogControls gridId), and its "no results" text. */
  id?: string;
  empty?: string;
  /** The template filters and sorts the products with CatalogControls: data-product, data-cat, data-price, data-order. */
  catalog?: boolean;
  /** The template keeps its own category links outside (pointing at the same anchors): no shared ones unless asked for. */
  ownNav?: boolean;
  /** The menu stands on its own in a page (a multi-page site's menu page): it gets the page's width and margins. */
  page?: boolean;
  /** One list of products without category titles or links (a home page's picks); `label` names it for screen readers. */
  flat?: { label: string };
};

const COPY = {
  en: { jump: "Jump to a category" },
  ar: { jump: "انتقل إلى قسم" },
};

/** The template's own menu ("Template default"), or the shared menu in the owner's layout. */
export function SiteMenu({ children, ...props }: Props & { children: ReactNode }) {
  if (!kitMenuOn(props.ctx.site.settings)) return <>{children}</>;
  return <KitMenu {...props} />;
}

const COLUMNS = { one: 1, two: 2, three: 3, four: 4 } as const;

/** The image sizes for one product photo in a layout and column count. */
function sizesFor(m: ResolvedMenu): string {
  const cols = COLUMNS[m.columns];
  if (m.photos === "side" && m.layout !== "magazine") return "(min-width: 760px) 160px, 120px";
  if (m.layout === "carousel") return "(min-width: 760px) 30vw, 70vw";
  if (m.layout === "magazine") return "(min-width: 760px) 40vw, 45vw";
  const phone = m.layout === "grid" || m.layout === "masonry" || m.layout === "tiles" ? "50vw" : "100vw";
  return `(min-width: 1100px) ${Math.round(100 / cols)}vw, (min-width: 760px) ${Math.round(100 / Math.min(cols, 2))}vw, ${phone}`;
}

/** Photo proportions that take turns in the mosaic when the owner left them on "Template default". */
const MOSAIC = ["tall", "square", "wide", "square", "tall", "wide"] as const;

function KitMenu({
  ctx,
  like,
  sections = ctx.sections,
  level = 3,
  services = false,
  pricePrefix,
  id = "kit-menu",
  empty,
  catalog = false,
  ownNav = false,
  page = false,
  flat,
}: Props) {
  const options = menuOptions(ctx.site.settings);
  const top = flat ? [] : sections;
  const m = resolveMenu(options, like, {
    categories: flat ? 1 : top.length,
    catalog: catalog || ownNav,
  });
  const sizes = sizesFor(m);
  const vary = m.layout === "masonry" && options.shape === "auto";
  const out = services ? ctx.t.unavailable : ctx.t.soldOut;
  const rows = m.layout === "list" || m.layout === "compact";
  let order = 0;

  const price = (item: MenuItem) => (
    <span className="kit-mn-price">
      {pricePrefix && <small>{pricePrefix} </small>}
      <bdi>{item.priceText}</bdi>
    </span>
  );

  const product = (item: MenuItem, i: number, section: KitSection) => {
    const photo = m.photos !== "none";
    const tags = (item.labelText || !item.isAvailable) && (
      <span className="kit-mn-tags">
        {item.labelText && <span className="kit-mn-tag">{item.labelText}</span>}
        {!item.isAvailable && <span className="kit-mn-tag is-out">{out}</span>}
      </span>
    );
    const n = order++;
    return (
      <li
        key={item.id}
        className="kit-mn-li"
        data-q={item.search}
        {...(catalog
          ? {
              "data-product": "",
              "data-cat": section.anchor,
              "data-price": String(item.price),
              "data-order": String(n),
            }
          : {})}
      >
        <button
          type="button"
          className={cx("kit-mn-item kit-card", rows && "kit-card-pad")}
          data-item-id={item.id}
          data-out={!item.isAvailable || undefined}
          data-pic={photo ? (item.imageUrl ? "photo" : "tint") : undefined}
        >
          {photo && (
            <span
              className={cx("kit-mn-media", m.layout !== "tiles" && "kit-card-media", m.photos === "top" && m.layout !== "tiles" && "kit-flush")}
              data-r={vary ? MOSAIC[i % MOSAIC.length] : undefined}
            >
              <ProductPicture item={item} sizes={sizes} />
              {m.price === "corner" && price(item)}
            </span>
          )}
          <span className="kit-mn-text">
            <span className="kit-mn-head">
              <span className="kit-mn-name">{item.name}</span>
              {m.layout === "compact" && m.price === "inline" && <span className="kit-mn-dots" aria-hidden="true" />}
              {(m.price === "inline" || m.price === "badge") && price(item)}
            </span>
            {m.price === "under" && price(item)}
            {tags}
            {item.description && <span className="kit-mn-desc">{item.description}</span>}
            {m.price === "large" && price(item)}
          </span>
        </button>
      </li>
    );
  };

  const list = (section: KitSection) => (
    <ul className={cx("plain kit-mn-list kit-cards", rows && "kit-rows")}>{section.products.map((item, i) => product(item, i, section))}</ul>
  );

  const H = level === 2 ? "h2" : "h3";
  const Sub = level === 2 ? "h3" : "h4";
  const cover = (s: KitSection) => [...s.products, ...(s.children ?? []).flatMap((c) => c.products)].find((p) => p.imageUrl)?.imageUrl ?? null;

  const title = (s: KitSection, n: number) => {
    const count = s.products.length + (s.children ?? []).reduce((sum, c) => sum + c.products.length, 0);
    const photo = m.title === "banner" ? cover(s) : null;
    return (
      <div className="kit-mn-title" data-t={m.title} data-photo={photo ? "" : undefined}>
        {photo && (
          <span className="kit-mn-banner" aria-hidden="true">
            <Picture src={photo} sizes="100vw" />
          </span>
        )}
        <H id={`${s.anchor}-h`} className="kit-mn-h">
          {m.title === "number" && (
            <span className="kit-mn-num" aria-hidden="true">
              {String(n + 1).padStart(2, "0")}
            </span>
          )}
          <span className="kit-mn-cat-name">{s.name}</span>
        </H>
        <span className="kit-mn-count">{itemCount(count, ctx.locale)}</span>
        {s.link && (
          <a className="kit-mn-more" href={s.link.href}>
            {s.link.label}
          </a>
        )}
      </div>
    );
  };

  const categories = (
    <div className="kit-mn-cats">
      {flat ? (
        <section className="kit-mn-cat" data-menu-cat aria-label={flat.label}>
          {list({
            id: "all",
            anchor: `${id}-all`,
            name: flat.label,
            products: sections.flatMap((s) => s.products),
          })}
        </section>
      ) : (
        top.map((s, n) => (
          <section key={s.id} id={s.anchor} className="kit-mn-cat" data-menu-cat aria-labelledby={`${s.anchor}-h`}>
            {title(s, n)}
            {s.products.length > 0 && list(s)}
            {(s.children ?? []).map((c) => (
              <section key={c.id} id={c.anchor} className="kit-mn-sub" data-menu-cat aria-labelledby={`${c.anchor}-h`}>
                <div className="kit-mn-subtitle">
                  <Sub id={`${c.anchor}-h`} className="kit-mn-subh">
                    {c.link ? <a href={c.link.href}>{c.name}</a> : c.name}
                  </Sub>
                  <span className="kit-mn-count">{itemCount(c.products.length, ctx.locale)}</span>
                </div>
                {list(c)}
              </section>
            ))}
          </section>
        ))
      )}
      {empty !== undefined && (
        <p className="kit-mn-empty" data-menu-empty hidden={sections.length > 0}>
          {empty}
        </p>
      )}
    </div>
  );

  return (
    <div className={cx("kit-mn", page && "kit-mn-page")} id={id} {...menuAttributes(m)} data-flat={flat ? "" : undefined}>
      <div className="kit-mn-frame">
        {m.nav !== "none" && (
          <MenuNav
            menuId={id}
            categories={top.map(({ anchor, name }) => ({ anchor, name }))}
            kind={m.nav}
            label={ctx.t.categories}
            jump={COPY[ctx.locale].jump}
          />
        )}
        {categories}
      </div>
    </div>
  );
}
