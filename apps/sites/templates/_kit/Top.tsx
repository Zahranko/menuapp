import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { initial } from "@/lib/format";
import { BrandName, Logo, OrderIcon, ProductPicture } from "./blocks";
import { cx, type SiteContext } from "./context";
import { Drawer } from "./Drawer";
import { featured, type MenuItem } from "./site-data";
import { HeroPhotos } from "./HeroPhotos";
import { Arrow, Burger, Clock, Close, Pin } from "./icons";
import {
  pageLayout,
  PHOTO_VARIANTS,
  type HeaderLayout,
  type HeroVariant,
  type PageLayout,
} from "./layout";
import type { OrderAction, OrderButton } from "./options";
import { Picture } from "./Picture";
import { sortLinks } from "./sections";
import { signatureOf } from "./signatures";

/*
 * The shared headers and openings of the "Page layout" options (_kit/layout.ts, styled by _kit/layout.css).
 * A template wraps its own header and opening:
 *
 *   const top = pageTop(ctx, { photos: heroPics, backdrop: true });
 *   <SiteHeader ctx={ctx} top={top} links={links} cta={...}>{its own <header>}</SiteHeader>
 *   <SiteHero ctx={ctx} top={top}>{its own opening}</SiteHero>
 *
 * With "Template default" ("auto") the template's own markup renders untouched. A template whose header is also its
 * opening (a masthead with the name, tagline and photos) uses SiteMasthead instead of both: see there.
 */

export type NavLink = { href: string; label: string; current?: boolean };
export type TopAction = {
  href: string;
  label: string;
  external?: boolean;
  action?: OrderAction;
};

export type Top = {
  layout: PageLayout;
  /** The photos for a shared opening: the template's hero photos, else product photos (at most six). */
  photos: string[];
  /** The photos are the owner's own (more than one take turns); product photos stand in one at a time. */
  ownPhotos: boolean;
  /** The header lies over a photo at the very top: a full-photo opening (shared or the template's own). */
  overPhoto: boolean;
  /** The page shows the opening (false on the inner pages of multi-page sites). */
  home: boolean;
};

const COPY = {
  en: { nav: "Main", more: "More pages" },
  ar: { nav: "التنقل الرئيسي", more: "صفحات أخرى" },
};

/** The header's button from the order button (_kit/options.ts orderButton()): its action, link and text. */
export const orderCta = (order: OrderButton | null): TopAction | null =>
  order && {
    href: order.href,
    label: order.label,
    external: order.external,
    action: order.action,
  };

/** Links as the header takes them, from [href, label] pairs. */
export const navOf = (links: [string, string][]): NavLink[] =>
  links.map(([href, label]) => ({ href, label }));

/**
 * The usual links for a one-page site: the menu, the story when it shows, `more` (the template's own sections), and
 * the visit section when it is on.
 */
export function basicLinks(ctx: SiteContext, { story = false, more = [] }: { story?: unknown; more?: NavLink[] } = {}): NavLink[] {
  return [
    { href: "#menu", label: ctx.t.menu },
    ...(story ? [{ href: "#story", label: ctx.t.story }] : []),
    ...more,
    ...(ctx.on("visit") ? [{ href: "#visit", label: ctx.t.visit }] : []),
  ];
}

/** Product photos, featured ones first, for openings without photos of their own. */
function productPhotos(ctx: SiteContext, max: number): string[] {
  const items = ctx.sections.flatMap((s) => s.products);
  const ordered = [
    ...items.filter((p) => p.isFeatured && p.isAvailable),
    ...items.filter((p) => !(p.isFeatured && p.isAvailable)),
  ];
  return [
    ...new Set(ordered.map((p) => p.imageUrl).filter((u): u is string => !!u)),
  ].slice(0, max);
}

/**
 * What a template's header and opening need to agree on.
 * `photos`: the template's hero photos (heroPhotos()), `backdrop`: its own opening shows a photo behind its text,
 * `home`: this page has the opening (multi-page sites pass false on their inner pages).
 */
export function pageTop(
  ctx: SiteContext,
  {
    photos = [],
    backdrop = false,
    home = true,
  }: { photos?: string[]; backdrop?: boolean; home?: boolean } = {},
): Top {
  const layout = pageLayout(ctx.site.settings);
  const kitPhotos =
    photos.length > 0 ? photos.slice(0, 6) : productPhotos(ctx, 3);
  const overPhoto =
    home &&
    (layout.hero === "full"
      ? kitPhotos.length > 0
      : layout.hero === "auto" && backdrop && photos.length > 0);
  return { layout, photos: kitPhotos, ownPhotos: photos.length > 0, overPhoto, home };
}

/* ---------- header ---------- */

type HeaderProps = {
  ctx: SiteContext;
  top: Top;
  /** The template's own links, in order. */
  links: NavLink[];
  /** The call to action at the end of the header (the template's own, else its order button). */
  cta?: TopAction | null;
  /** The home link of the logo. */
  home?: string;
  /** The template's own classes for its logo and its main button, so they keep their look. */
  logoClassName?: string;
  buttonClassName?: string;
  /** Extra controls the header keeps whatever its layout (a search button, for example). */
  tools?: ReactNode;
  /** Decoration for the template's own ("signature") header options, drawn behind it (aria-hidden). */
  art?: ReactNode;
};

/** The decoration slot of a signature header or opening: hidden from screen readers, styled by the template. */
const SigArt = ({ art }: { art?: ReactNode }) => (
  <span className="kit-sig-art" aria-hidden="true">
    {art}
  </span>
);

/** The template's own header ("auto"), or the shared header in the owner's layout. */
export function SiteHeader({
  children,
  ...props
}: HeaderProps & { children: ReactNode }) {
  if (props.top.layout.header === "auto") return <>{children}</>;
  return <KitHeader {...props} layout={props.top.layout.header} />;
}

/**
 * For templates whose header is also their opening (a masthead with the name, tagline and photos): it stays exactly as
 * it is with both options on "Template default". A shared header goes above it, and it becomes the opening; a shared
 * opening replaces it (SiteHero renders it), with the shared header in `fallback`'s layout unless the owner picked one.
 */
export function SiteMasthead({
  children,
  fallback,
  ...props
}: HeaderProps & {
  children: ReactElement;
  fallback: Exclude<HeaderLayout, "auto">;
}) {
  const { header, hero } = props.top.layout;
  if (header === "auto" && hero === "auto") return children;
  const layout = header === "auto" ? fallback : header;
  const masthead =
    hero === "auto" && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "data-section": "hero",
        })
      : null;
  return (
    <>
      <KitHeader {...props} layout={layout} />
      {masthead}
    </>
  );
}

function KitHeader({
  ctx,
  top,
  links: own,
  cta,
  home = "#top",
  logoClassName,
  buttonClassName,
  tools,
  art,
  layout,
}: HeaderProps & { layout: Exclude<HeaderLayout, "auto"> }) {
  const copy = COPY[ctx.locale];
  const sig = signatureOf(ctx.site, "header.layout");
  // Links to the page's sections follow the owner's order of the sections ("sections.order").
  const links = sortLinks(ctx.site.settings, own);
  const { headerStyle, sticky } = top.layout;
  // A see-through header over a photo scrolls away (it turns solid while staying on screen where the browser can).
  const stick = sticky === "on" || (sticky === "auto" && layout !== "big");
  const over =
    top.overPhoto &&
    (headerStyle === "transparent" ||
      headerStyle === "glass" ||
      (headerStyle === "auto" && layout === "pill"));
  const half = Math.ceil(links.length / 2);
  const link = (l: NavLink) => (
    <a
      key={l.href}
      href={l.href}
      className="kit-hd-link"
      aria-current={l.current ? "page" : undefined}
    >
      {l.label}
    </a>
  );
  const button = cta && (
    <a
      data-k="btn"
      className={cx("kit-hd-cta", buttonClassName)}
      href={cta.href}
      {...(cta.action ? { "data-order-action": cta.action } : {})}
      {...(cta.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {cta.action && <OrderIcon action={cta.action} />}
      <span>{cta.label}</span>
    </a>
  );
  const drawer = (
    <Drawer
      openLabel={ctx.t.openMenu}
      closeLabel={ctx.t.close}
      buttonClassName="kit-hd-burger"
      panelClassName="kit-hd-drawer"
      icon={<Burger />}
      closeIcon={<Close />}
    >
      <nav className="kit-hd-drawer-nav" aria-label={copy.nav}>
        {links.map(link)}
      </nav>
      {cta && (
        <a
          data-k="btn"
          className={cx("kit-hd-cta kit-hd-drawer-cta", buttonClassName)}
          href={cta.href}
          {...(cta.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {cta.action && <OrderIcon action={cta.action} />}
          <span>{cta.label}</span>
        </a>
      )}
      {ctx.today && <p className="kit-hd-drawer-today">{ctx.today}</p>}
    </Drawer>
  );
  const brand = (
    <a className="kit-hd-brand kit-lockup" href={home}>
      <Logo
        ctx={ctx}
        className={logoClassName ?? "kit-hd-logo"}
        sizes={layout === "big" ? "96px" : "48px"}
      />
      <BrandName ctx={ctx} className="kit-hd-name" />
    </a>
  );
  const inline = layout !== "minimal" && layout !== "drawer";
  return (
    <header
      className="kit-hd"
      data-section="header"
      data-hd={layout}
      data-hd-style={headerStyle}
      data-stick={stick || undefined}
      data-over={over || undefined}
      data-links={links.length}
      data-sig={sig}
    >
      {sig && <SigArt art={art} />}
      <div className="kit-hd-in">
        {layout === "drawer" && drawer}
        {layout === "split" && links.length > 1 ? (
          <>
            <nav className="kit-hd-nav kit-hd-nav-a" aria-label={copy.nav}>
              {links.slice(0, half).map(link)}
            </nav>
            {brand}
            <nav className="kit-hd-nav kit-hd-nav-b" aria-label={copy.more}>
              {links.slice(half).map(link)}
            </nav>
          </>
        ) : (
          <>
            {brand}
            {layout === "big" && ctx.today && (
              <p className="kit-hd-today">
                <Clock /> {ctx.today}
              </p>
            )}
            {inline && links.length > 0 && (
              <nav className="kit-hd-nav" aria-label={copy.nav}>
                {links.map(link)}
              </nav>
            )}
          </>
        )}
        {tools && <div className="kit-hd-tools">{tools}</div>}
        {button}
        {layout !== "drawer" && drawer}
      </div>
    </header>
  );
}

/* ---------- opening ---------- */

type HeroProps = {
  ctx: SiteContext;
  top: Top;
  /** The headline: the template's own "hero.title", else the business name. */
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  /** The buttons: by default the menu and, with the visit section on, the way to find the business. */
  actions?: TopAction[];
  /** The template's own button classes (main, second), so the buttons keep its look. */
  buttonClassNames?: [string, string?];
  /** Where the full menu is ("#menu", or the menu page of a multi-page site). */
  menuHref?: string;
  /** Decoration for the template's own ("signature") openings (aria-hidden). */
  art?: ReactNode;
};

/** The template's own opening ("auto"), or the shared opening in the owner's layout. */
export function SiteHero({
  children,
  ...props
}: HeroProps & { children?: ReactNode }) {
  if (props.top.layout.hero === "auto" || !props.top.home)
    return <>{children}</>;
  return <KitHero {...props} variant={props.top.layout.hero} />;
}

/** "long" and "longer" headlines step down a size so they never run off a phone's screen. */
function lengthOf(title: string): string | undefined {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  if (title.length > 44 || longest > 16) return "longer";
  if (title.length > 22 || longest > 11) return "long";
  return undefined;
}

/** A decorative tile with the business's initial, where a photo would go and there is none. */
function Monogram({
  ctx,
  className,
}: {
  ctx: SiteContext;
  className?: string;
}) {
  return (
    <span className={cx("kit-hv-mono", className)} aria-hidden="true">
      <span>{initial(ctx.site.business.name)}</span>
    </span>
  );
}

/** Products for a menu-first opening: featured ones, else the first ones on the menu that are in stock. */
function openingPicks(ctx: SiteContext): MenuItem[] {
  const picks = featured(ctx.sections, 4);
  if (picks.length >= 2) return picks;
  const more = ctx.sections
    .flatMap((s) => s.products)
    .filter((p) => p.isAvailable && !picks.includes(p));
  return [...picks, ...more].slice(0, 4);
}

function KitHero({
  ctx,
  top,
  title,
  eyebrow,
  subtitle,
  actions,
  buttonClassNames,
  menuHref = "#menu",
  art,
  variant,
}: HeroProps & { variant: Exclude<HeroVariant, "auto"> }) {
  const sig = signatureOf(ctx.site, "hero.variant");
  const headline = title ?? (ctx.text("hero.title") || ctx.site.business.name);
  const kicker = eyebrow ?? ctx.text("hero.eyebrow");
  const lede = subtitle ?? ctx.text("hero.subtitle");
  const buttons = actions ?? [
    { href: menuHref, label: ctx.t.viewMenu },
    ...(ctx.on("visit") ? [{ href: "#visit", label: ctx.t.findUs }] : []),
  ];
  const photos = variant === "collage" ? [...new Set([...top.photos, ...productPhotos(ctx, 3)])] : top.photos;
  const photo = PHOTO_VARIANTS.has(variant) && photos.length > 0;
  const address = ctx.site.business.address;
  const picks = variant === "menu" ? openingPicks(ctx) : [];
  const sizes =
    variant === "full"
      ? "100vw"
      : variant === "stacked" || variant === "framed"
        ? "(min-width: 1100px) 1080px, 100vw"
        : variant === "poster" || variant === "circle"
          ? "(min-width: 760px) 420px, 80vw"
          : "(min-width: 760px) 50vw, 100vw";

  const media = PHOTO_VARIANTS.has(variant) ? (
    photo ? (
      <div className="kit-hv-media kit-hero-media">
        <HeroPhotos
          ctx={ctx}
          photos={top.ownPhotos && variant !== "poster" && variant !== "circle" ? photos : photos.slice(0, 1)}
          sizes={sizes}
          placement={variant === "full" ? "corner" : "center"}
        />
      </div>
    ) : variant === "full" ? null : (
      <Monogram ctx={ctx} className="kit-hv-media" />
    )
  ) : null;

  const collage =
    variant === "collage" ? (
      <div className="kit-hv-collage" aria-hidden="true">
        {[0, 1, 2].map((i) =>
          photos[i] ? (
            <span key={i} className="kit-hv-tile" data-tile={i}>
              <Picture
                src={photos[i]}
                sizes={
                  i === 0
                    ? "(min-width: 760px) 40vw, 70vw"
                    : "(min-width: 760px) 22vw, 40vw"
                }
                priority={i === 0}
              />
            </span>
          ) : (
            <Monogram key={i} ctx={ctx} className="kit-hv-tile" />
          ),
        )}
      </div>
    ) : null;

  return (
    <section
      className="kit-hv"
      data-hv={variant}
      data-photo={
        photo || (variant === "collage" && photos.length > 0) || undefined
      }
      data-len={lengthOf(headline)}
      data-sig={sig}
      data-section="hero"
      aria-labelledby="kit-hv-title"
    >
      {sig && <SigArt art={art} />}
      {variant === "full" && media}
      {variant === "full" && photo && (
        <span className="kit-hv-shade" aria-hidden="true" />
      )}
      {variant === "type" && (
        <span className="kit-hv-letter" aria-hidden="true">
          {initial(ctx.site.business.name)}
        </span>
      )}
      <div className="kit-hv-in">
        {variant !== "full" && media}
        {collage}
        <div className="kit-hv-text kit-hero-text">
          {kicker && <p className="kit-hv-eyebrow">{kicker}</p>}
          <h1 id="kit-hv-title" className="kit-hv-title">
            {headline}
          </h1>
          {lede && <p className="kit-hv-lede">{lede}</p>}
          {buttons.length > 0 && (
            <div className="kit-hv-actions">
              {buttons.map((b, i) => (
                <a
                  key={b.href + i}
                  data-k="btn"
                  className={cx(
                    "kit-hv-btn",
                    i === 0 ? "is-main" : "is-second",
                    buttonClassNames?.[i === 0 ? 0 : 1],
                  )}
                  href={b.href}
                  {...(b.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {b.action && <OrderIcon action={b.action} />}
                  <span>{b.label}</span>
                  {i === 0 && !b.external && <Arrow className="kit-hv-arrow" />}
                </a>
              ))}
            </div>
          )}
          {(ctx.today || address) && variant !== "menu" && (
            <ul className="kit-hv-meta">
              {ctx.today && (
                <li>
                  <Clock /> {ctx.today}
                </li>
              )}
              {address && (
                <li>
                  <Pin /> <bdi>{address}</bdi>
                </li>
              )}
            </ul>
          )}
        </div>
        {picks.length > 0 && (
          <ul className="kit-hv-picks">
            {picks.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="kit-hv-pick"
                  data-item-id={p.id}
                >
                  <span className="kit-hv-pick-media">
                    <ProductPicture
                      item={p}
                      sizes="(min-width: 760px) 240px, 45vw"
                    />
                  </span>
                  <span className="kit-hv-pick-name">{p.name}</span>
                  <span className="kit-hv-pick-price">{p.priceText}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
