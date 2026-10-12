import type { CSSProperties, ReactNode } from "react";
import { initial, whatsappLink } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { choice, flag, text } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture } from "../_kit/blocks";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Instagram, Pin, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours, tintFor, type MenuItem } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars, type Palette } from "../_kit/theme";
import { copyFor, fill } from "../_premium/copy";
import { Lightbox } from "../_premium/Lightbox";
import { bestSellers, categoryTree, galleryPhotos, PAGE_PATHS, resolvePage, type Category, type Page, type Tree } from "../_premium/pages";
import { atlasCopy } from "./copy";
import { Finder } from "./Finder";
import { QuickView, type QuickItem } from "./QuickView";
import { SideDrawer } from "./SideDrawer";

/*
 * Template 024 "Atlas" (Pro): a direct-to-consumer storefront. Thin announcement bar, a sticky header with a search
 * field that jumps to departments and products, a department mega menu (a slide-in drawer on phones), a split hero
 * with a shoppable product, product grids with a quick-view bottom sheet, ranked best sellers and a masonry lookbook.
 * Everything is styled in ./styles.css under .t-atlas; only the search, drawer, quick view and lightbox run in the browser.
 */

const PALETTES = {
  white: { bg: "#FFFFFF", surf: "#F3F3F1", ink: "#121212", muted: "#5C5C59", line: "#E3E3DF" },
  stone: { bg: "#ECEBE7", surf: "#F7F6F3", ink: "#161616", muted: "#575652", line: "#D5D3CC" },
  sand: { bg: "#E6DCCB", surf: "#F1EADE", ink: "#211D18", muted: "#5E5446", line: "#D0C2AA" },
  black: { bg: "#0D0D0D", surf: "#191919", ink: "#F2F1ED", muted: "#A2A19C", line: "#2B2B2A" },
} satisfies Record<string, Palette>;

const FONTS = ["grotesk", "modern", "mono"] as const;
const HERO = ["split", "flip", "text"] as const;
const DENSITY = ["comfy", "dense"] as const;

type View = {
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  a: ReturnType<typeof atlasCopy>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  best: MenuItem[];
  photos: { src: string; caption: string | null }[];
  order: string | null;
  cta: string;
  /** Product id → its department's name. */
  deptOf: Map<string, string>;
};

export default function AtlasTemplate({ site, path = [], base, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copyFor(ctx.locale);
  const a = atlasCopy(ctx.locale);
  const tree = categoryTree(site);
  // An unknown address never gets here (the route answers 404); fall back to the home page to be safe.
  const page = resolvePage(site, path, tree) ?? { kind: "home" };
  const root = base ?? `/${site.business.slug}`;
  const href = (p: string) => (p ? `${root}${p}` : root || "/");
  const deptOf = new Map<string, string>();
  for (const cat of tree.list) for (const p of cat.products) deptOf.set(p.id, cat.name);
  const v: View = {
    ctx,
    c,
    a,
    tree,
    page,
    href,
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree),
    order: site.business.whatsApp ? whatsappLink(site.business.whatsApp) : null,
    cta: text(site.settings, "cta.label") || c.order,
    deptOf,
  };
  const style = themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: FONTS, defaultAccent: "#2447D9", radius: { rounded: "12px", sharp: "0px" } });

  const quick: QuickItem[] = tree.items.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.priceText,
    image: p.imageUrl,
    tint: tintFor(p.name),
    initial: initial(p.name),
    label: p.labelText,
    soldOut: !p.isAvailable,
    department: deptOf.get(p.id) ?? null,
    order: site.business.whatsApp ? whatsappLink(site.business.whatsApp, fill(a.orderMessage, { name: p.name, price: p.priceText })) : null,
  }));

  return (
    <div
      data-template="atlas"
      data-page={page.kind}
      className={cx("t-atlas", fontVariables, `grid-${choice(site.settings, "density", DENSITY, "comfy")}`, flag(site.settings, "motion", true) && "motion")}
      style={style}
    >
      <TemplateStyles id="atlas" />
      <TopBar v={v} />
      <Header v={v} />
      {page.kind === "home" ? (
        <main>
          <Home v={v} />
        </main>
      ) : (
        <main id="menu" data-section="menu" className="a-page">
          {page.kind === "menu" && <MenuPage v={v} />}
          {page.kind === "category" && <CategoryPage v={v} category={page.category} />}
          {page.kind === "best" && <BestPage v={v} />}
          {page.kind === "gallery" && <GalleryPage v={v} />}
          {page.kind === "visit" && <VisitPage v={v} />}
        </main>
      )}
      <Footer v={v} />
      <QuickView items={quick} labels={{ close: ctx.t.close, soldOut: ctx.t.soldOut, inStock: a.inStock, order: v.cta }} />
      {v.photos.length > 0 && <Lightbox photos={v.photos} labels={{ close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo }} />}
    </div>
  );
}

/* ---------- header ---------- */

function TopBar({ v }: { v: View }) {
  const { ctx } = v;
  const note = ctx.text("announcement");
  return (
    <>
      <a className="skip" href="#menu">
        {ctx.t.viewMenu}
      </a>
      {ctx.site.isPreview && <div className="a-preview">{ctx.t.preview}</div>}
      {ctx.on("announcement") && note && (
        <div className="a-announce" data-section="announcement">
          <p>{note}</p>
          {ctx.today && <p className="a-announce-today">{ctx.today}</p>}
        </div>
      )}
    </>
  );
}

function Header({ v }: { v: View }) {
  const { ctx, c, a, page, href, tree } = v;
  const current = (kind: Page["kind"]) => (page.kind === kind ? ("page" as const) : undefined);
  const shopCurrent = page.kind === "menu" || page.kind === "category" ? ("page" as const) : undefined;
  const feature = tree.roots.find((r) => r.cover) ?? null;
  const departments = tree.list.map((d) => ({ name: d.name, href: href(d.path), parent: d.parent?.name ?? null, count: itemCount(d.all.length, ctx.locale) }));
  const products = tree.items.map((p) => ({ id: p.id, name: p.name, department: v.deptOf.get(p.id) ?? "", price: p.priceText }));

  return (
    <header className="a-head" data-section="header">
      <div className="a-head-row">
        <SideDrawer openLabel={ctx.t.openMenu} closeLabel={ctx.t.close} title={ctx.site.business.name}>
          <nav aria-label={a.departments} className="side-depts">
            <p className="side-label">{a.departments}</p>
            <ul className="plain">
              {tree.roots.map((cat) => (
                <li key={cat.id}>
                  {cat.children.length > 0 ? (
                    <details>
                      <summary>
                        <span>{cat.name}</span>
                        <small>{itemCount(cat.all.length, ctx.locale)}</small>
                      </summary>
                      <ul className="plain">
                        <li>
                          <a href={href(cat.path)}>{fill(a.shopName, { name: cat.name })}</a>
                        </li>
                        {cat.children.map((sub) => (
                          <li key={sub.id}>
                            <a href={href(sub.path)}>{sub.name}</a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <a className="side-dept" href={href(cat.path)}>
                      <span>{cat.name}</span>
                      <small>{itemCount(cat.all.length, ctx.locale)}</small>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={c.pages} className="side-pages">
            <a href={href("")} aria-current={current("home")}>
              {c.home}
            </a>
            <a href={href(PAGE_PATHS.menu)} aria-current={shopCurrent}>
              {a.shopAll}
            </a>
            {v.best.length > 0 && (
              <a href={href(PAGE_PATHS.best)} aria-current={current("best")}>
                {c.best}
              </a>
            )}
            {v.photos.length > 0 && (
              <a href={href(PAGE_PATHS.gallery)} aria-current={current("gallery")}>
                {a.lookbook}
              </a>
            )}
            <a href={href(PAGE_PATHS.visit)} aria-current={current("visit")}>
              {c.visit}
            </a>
          </nav>
          {v.order && (
            <a className="a-btn a-btn-solid side-cta" href={v.order} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> {v.cta}
            </a>
          )}
          {ctx.today && <p className="side-today">{ctx.today}</p>}
        </SideDrawer>

        <a className="a-brand" href={href("")}>
          <Logo ctx={ctx} className="a-logo" sizes="40px" />
          <span className="a-brand-name">{ctx.site.business.name}</span>
        </a>

        <nav className="a-nav" aria-label={c.pages}>
          <div className="a-mega">
            <a className="a-mega-top" href={href(PAGE_PATHS.menu)} aria-current={shopCurrent}>
              {c.shop}
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </a>
            {tree.roots.length > 0 && (
              <div className="a-mega-panel">
                <div className="a-mega-in">
                  <div className="a-mega-cols">
                    {tree.roots.map((cat) => (
                      <div key={cat.id} className="a-mega-col">
                        <a className="a-mega-cat" href={href(cat.path)}>
                          {cat.name}
                        </a>
                        <ul className="plain">
                          {cat.children.map((sub) => (
                            <li key={sub.id}>
                              <a href={href(sub.path)}>{sub.name}</a>
                            </li>
                          ))}
                          <li>
                            <a className="a-mega-all" href={href(cat.path)}>
                              {itemCount(cat.all.length, ctx.locale)}
                            </a>
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                  {feature && (
                    <a className="a-mega-feature" href={href(feature.path)}>
                      <span className="a-mega-img">
                        <Picture src={feature.cover!} sizes="320px" />
                      </span>
                      <span className="a-mega-cap">
                        {fill(a.shopName, { name: feature.name })} <Arrow className="flip" />
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          {v.best.length > 0 && (
            <a href={href(PAGE_PATHS.best)} aria-current={current("best")}>
              {c.best}
            </a>
          )}
          {v.photos.length > 0 && (
            <a href={href(PAGE_PATHS.gallery)} aria-current={current("gallery")}>
              {a.lookbook}
            </a>
          )}
          <a href={href(PAGE_PATHS.visit)} aria-current={current("visit")}>
            {c.visit}
          </a>
        </nav>

        <Finder departments={departments} products={products} labels={{ placeholder: a.find, label: a.findLabel, empty: a.findEmpty, departments: a.departments, products: a.products }} />

        {v.order && (
          <a className="a-icon a-head-order" href={v.order} target="_blank" rel="noopener noreferrer" aria-label={v.cta}>
            <WhatsApp />
            <span className="a-head-order-text">{v.cta}</span>
          </a>
        )}
      </div>
    </header>
  );
}

/* ---------- building blocks ---------- */

function Head({ title, id, link, level = 2 }: { title: string; id: string; link?: { href: string; label: string }; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="a-sec-head">
      <H id={id} className={level === 2 ? "a-h2" : "a-h3"}>
        {title}
      </H>
      {link && (
        <a className="a-link" href={link.href}>
          {link.label} <Arrow className="flip" />
        </a>
      )}
    </div>
  );
}

function Card({ v, item, sizes = "(min-width: 1100px) 24vw, (min-width: 700px) 32vw, 50vw" }: { v: View; item: MenuItem; sizes?: string }) {
  return (
    <button type="button" className={cx("a-card", !item.isAvailable && "is-out")} data-item-id={item.id}>
      <span className="a-card-media">
        <ProductPicture item={item} sizes={sizes} />
        {(item.labelText || !item.isAvailable) && (
          <span className="a-badges">
            {!item.isAvailable && <span className="a-badge a-badge-out">{v.ctx.t.soldOut}</span>}
            {item.labelText && <span className="a-badge">{item.labelText}</span>}
          </span>
        )}
        <span className="a-card-qv" aria-hidden="true">
          {v.a.quickView}
        </span>
      </span>
      <span className="a-card-row">
        <span className="a-card-name">{item.name}</span>
        <span className="a-card-price">{item.priceText}</span>
      </span>
      {item.description && <span className="a-card-desc">{item.description}</span>}
    </button>
  );
}

function Grid({ v, items }: { v: View; items: MenuItem[] }) {
  return (
    <ul className="plain a-grid">
      {items.map((item) => (
        <li key={item.id} className="rv">
          <Card v={v} item={item} />
        </li>
      ))}
    </ul>
  );
}

function Departments({ v, categories, id }: { v: View; categories: Category[]; id?: string }) {
  return (
    <ul className="plain a-depts" id={id}>
      {categories.map((cat) => (
        <li key={cat.id} className="rv">
          <a className="a-dept" href={v.href(cat.path)}>
            <span className="a-dept-media">{cat.cover ? <Picture src={cat.cover} sizes="(min-width: 900px) 22vw, 44vw" /> : <span className="a-blank" aria-hidden="true">{initial(cat.name)}</span>}</span>
            <span className="a-dept-name">
              {cat.name} <Arrow className="flip" />
            </span>
            <span className="a-dept-count">{cat.children.length > 0 ? cat.children.map((s) => s.name).join(", ") : itemCount(cat.all.length, v.ctx.locale)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Best sellers as a ranked list: the first one large, the rest as numbered rows. */
function Ranked({ v, items, big = false }: { v: View; items: MenuItem[]; big?: boolean }) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <div className={cx("a-ranked", big && "is-big")}>
      <button type="button" className={cx("a-rank-hero rv", !first.isAvailable && "is-out")} data-item-id={first.id}>
        <span className="a-rank-media">
          <ProductPicture item={first} sizes="(min-width: 900px) 46vw, 100vw" />
          {!first.isAvailable && (
            <span className="a-badges">
              <span className="a-badge a-badge-out">{v.ctx.t.soldOut}</span>
            </span>
          )}
        </span>
        <span className="a-rank-n" aria-hidden="true">
          1
        </span>
        <span className="a-rank-info">
          <span className="sr-only">1. </span>
          <span className="a-rank-name">{first.name}</span>
          <span className="a-rank-price">{first.priceText}</span>
        </span>
      </button>
      {rest.length > 0 && (
        <ol className="plain a-rank-list" start={2}>
          {rest.map((item, i) => (
            <li key={item.id} className="rv">
              <button type="button" className={cx("a-rank-row", !item.isAvailable && "is-out")} data-item-id={item.id}>
                <span className="a-rank-num" aria-hidden="true">
                  {i + 2}
                </span>
                <span className="a-rank-thumb">
                  <ProductPicture item={item} sizes="96px" />
                </span>
                <span className="a-rank-text">
                  <span className="sr-only">{i + 2}. </span>
                  <span className="a-rank-name">{item.name}</span>
                  {item.description && <span className="a-rank-desc">{item.description}</span>}
                  {!item.isAvailable && <span className="a-rank-out">{v.ctx.t.soldOut}</span>}
                </span>
                <span className="a-rank-price">{item.priceText}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** The lookbook: photos in a masonry of mixed heights; each opens the lightbox. */
function Lookbook({ v, photos }: { v: View; photos: { src: string; caption: string | null }[] }) {
  return (
    <ul className="plain a-masonry">
      {photos.map((p, i) => (
        <li key={p.src} style={{ "--ar": ["3 / 4", "1 / 1", "4 / 5", "2 / 3", "5 / 4", "3 / 4", "1 / 1"][i % 7] } as CSSProperties}>
          <button type="button" className="a-shot" data-photo={i} aria-label={p.caption ?? fill(v.c.photo, { n: i + 1 })}>
            <Picture src={p.src} sizes="(min-width: 900px) 33vw, 50vw" />
          </button>
          {p.caption && <span className="a-shot-cap">{p.caption}</span>}
        </li>
      ))}
    </ul>
  );
}

function Crumbs({ v, trail }: { v: View; trail: { label: string; href?: string }[] }) {
  const items = [{ label: v.c.home, href: v.href("") }, ...trail];
  return (
    <nav className="a-crumbs" aria-label={v.c.breadcrumb}>
      <ol className="plain">
        {items.map((item, i) => (
          <li key={i}>{item.href && i < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

function PageHead({ v, trail, title, lead }: { v: View; trail: { label: string; href?: string }[]; title: string; lead?: string | null }) {
  return (
    <header className="a-page-head">
      <Crumbs v={v} trail={trail} />
      <div className="a-page-title-row">
        <h1 className="a-page-title">{title}</h1>
        {lead && <p className="a-page-lead">{lead}</p>}
      </div>
    </header>
  );
}

/** The sticky row of filter chips under the header. */
function Chips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav className="a-chips" aria-label={label}>
      <div className="a-chips-in">{children}</div>
    </nav>
  );
}

/* ---------- home ---------- */

function Hero({ v }: { v: View }) {
  const { ctx, c, a, href } = v;
  const s = ctx.site.settings;
  const layout = choice(s, "hero.layout", HERO, "split");
  const pick = v.best.find((p) => p.imageUrl) ?? v.tree.items.find((p) => p.imageUrl && p.isAvailable) ?? v.tree.items.find((p) => p.imageUrl) ?? null;
  const media = layout !== "text" ? (ctx.image("hero.image") ?? pick?.imageUrl ?? null) : null;
  const title = ctx.text("hero.title") || ctx.site.business.name;
  const eyebrow = ctx.text("hero.eyebrow");
  const subtitle = ctx.text("hero.subtitle");

  return (
    <section className={cx("a-hero", media ? `a-hero-${layout}` : "a-hero-text")} data-section="hero" aria-labelledby="hero-title">
      <div className="a-hero-copy">
        {eyebrow && <p className="a-eyebrow">{eyebrow}</p>}
        <h1 id="hero-title" className="a-hero-title">
          {title}
        </h1>
        {subtitle && <p className="a-hero-sub">{subtitle}</p>}
        <div className="a-hero-actions">
          <a className="a-btn a-btn-solid" href={href(PAGE_PATHS.menu)}>
            {a.shopAll} <Arrow className="flip" />
          </a>
          {v.best.length > 0 && (
            <a className="a-btn a-btn-line" href={href(PAGE_PATHS.best)}>
              {c.best}
            </a>
          )}
        </div>
      </div>
      {media && (
        <div className="a-hero-media">
          <div className="a-hero-img">
            <Picture src={media} sizes="(min-width: 900px) 50vw, 100vw" priority />
          </div>
          {pick && (
            <>
              <span className="a-spot" aria-hidden="true" />
              <button type="button" className="a-shop-card" data-item-id={pick.id}>
                <span className="a-shop-thumb">
                  <ProductPicture item={pick} sizes="64px" />
                </span>
                <span className="a-shop-text">
                  <small>{a.featuredPiece}</small>
                  <b>{pick.name}</b>
                  <span>{pick.priceText}</span>
                </span>
                <span className="a-shop-go">
                  {a.quickView}
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                    <path d="M6 2v8M2 6h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Home({ v }: { v: View }) {
  const { ctx, c, a, href, tree } = v;
  const story = ctx.on("story") && ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  const edit = [...tree.items.filter((p) => p.isFeatured || p.label === "New"), ...tree.items.filter((p) => !(p.isFeatured || p.label === "New"))].slice(0, 8);
  return (
    <>
      <Hero v={v} />

      <section id="menu" className="a-sec a-shop" data-section="menu" aria-labelledby="shop-title">
        <Head title={ctx.text("categories.title") || a.departments} id="shop-title" link={{ href: href(PAGE_PATHS.menu), label: a.shopAll }} />
        {tree.roots.length > 0 && <Departments v={v} categories={tree.roots} />}
        {ctx.on("arrivals") && edit.length > 0 && (
          <div className="a-edit">
            <Head level={3} title={ctx.text("arrivals.title") || a.newIn} id="edit-title" />
            <Grid v={v} items={edit} />
          </div>
        )}
      </section>

      {ctx.on("best") && v.best.length > 0 && (
        <section id="best" className="a-sec a-best" data-section="best" aria-labelledby="best-title">
          <Head title={ctx.text("best.title") || c.best} id="best-title" link={{ href: href(PAGE_PATHS.best), label: c.viewAll }} />
          <Ranked v={v} items={v.best.slice(0, 5)} />
        </section>
      )}

      {story && (
        <section id="story" className={cx("a-story", storyImage && "has-image")} data-section="story" aria-labelledby="story-title">
          {storyImage && (
            <div className="a-story-img">
              <Picture src={storyImage} sizes="100vw" />
            </div>
          )}
          <div className="a-story-card rv">
            <h2 id="story-title" className="a-h2">
              {ctx.text("story.title") || ctx.t.story}
            </h2>
            <p>{story}</p>
            <a className="a-link" href={href(PAGE_PATHS.visit)}>
              {c.about} <Arrow className="flip" />
            </a>
          </div>
        </section>
      )}

      {ctx.on("gallery") && v.photos.length > 0 && (
        <section id="gallery" className="a-sec a-look" data-section="gallery" aria-labelledby="look-title">
          <Head title={ctx.text("gallery.title") || a.lookbook} id="look-title" link={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }} />
          <Lookbook v={v} photos={v.photos.slice(0, 7)} />
        </section>
      )}

      {ctx.on("reviews") && ctx.reviews.length > 0 && <Reviews v={v} />}

      {ctx.on("visit") && <VisitStrip v={v} />}
    </>
  );
}

function Reviews({ v }: { v: View }) {
  return (
    <section id="reviews" className="a-sec a-reviews" data-section="reviews" aria-labelledby="reviews-title">
      <Head title={v.ctx.t.reviews} id="reviews-title" />
      <ul className="plain a-quotes">
        {v.ctx.reviews.map((r, i) => (
          <li key={i} className="rv">
            <figure className="a-quote">
              <blockquote>
                <p>{r.quote}</p>
              </blockquote>
              {r.name && <figcaption>{r.name}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisitStrip({ v, heading = true }: { v: View; heading?: boolean }) {
  const { ctx, c } = v;
  const { contact } = ctx;
  return (
    <section id="visit" className="a-sec a-visit" data-section="visit" aria-labelledby={heading ? "visit-title" : undefined} aria-label={heading ? undefined : ctx.t.visit}>
      {heading && <Head title={ctx.t.visit} id="visit-title" link={{ href: v.href(PAGE_PATHS.visit), label: c.findUs }} />}
      <div className="a-visit-grid">
        {hasHours(ctx.hours) && (
          <div className="a-cell">
            <h3 className="a-cell-title">{ctx.t.hours}</h3>
            {ctx.today && <p className="a-cell-today">{ctx.today}</p>}
            <HoursList ctx={ctx} className="a-hours" />
          </div>
        )}
        <div className="a-cell">
          <h3 className="a-cell-title">{ctx.t.contact}</h3>
          <ContactList ctx={ctx} className="plain a-contact" />
          <div className="a-cell-actions">
            {contact.whatsapp && (
              <a className="a-btn a-btn-solid" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> {v.cta}
              </a>
            )}
            {contact.maps && (
              <a className="a-btn a-btn-line" href={contact.maps} target="_blank" rel="noopener noreferrer">
                <Pin /> {ctx.t.directions}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- pages ---------- */

function MenuPage({ v }: { v: View }) {
  const { tree, a, href, ctx } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: a.shopAll }]} title={a.shopAll} lead={itemCount(tree.items.length, ctx.locale)} />
      {tree.roots.length > 1 && (
        <Chips label={a.departments}>
          {tree.roots.map((cat) => (
            <a key={cat.id} className="a-chip" href={`#m-${cat.id}`}>
              {cat.name}
            </a>
          ))}
        </Chips>
      )}
      {tree.roots.map((cat) => (
        <section key={cat.id} id={`m-${cat.id}`} className="a-sec a-block" aria-labelledby={`m-${cat.id}-h`}>
          <Head title={cat.name} id={`m-${cat.id}-h`} link={{ href: href(cat.path), label: fill(a.shopName, { name: cat.name }) }} />
          {cat.products.length > 0 && <Grid v={v} items={cat.products} />}
          {cat.children.map((sub) => (
            <div key={sub.id} className="a-sub">
              <h3 className="a-sub-title">
                <a href={href(sub.path)}>{sub.name}</a>
                <small>{itemCount(sub.all.length, ctx.locale)}</small>
              </h3>
              <Grid v={v} items={sub.products} />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function CategoryPage({ v, category }: { v: View; category: Category }) {
  const { c, a, href, ctx, tree } = v;
  const parent = category.parent;
  const trail = [{ label: a.shopAll, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];
  const family = parent ?? category;
  const others = tree.roots.filter((r) => r !== family);
  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} lead={itemCount(category.all.length, ctx.locale)} />
      {family.children.length > 0 && (
        <Chips label={fill(c.subcategories, { name: family.name })}>
          <a className="a-chip" href={href(family.path)} aria-current={category === family ? "page" : undefined}>
            {c.everything}
          </a>
          {family.children.map((sub) => (
            <a key={sub.id} className="a-chip" href={href(sub.path)} aria-current={sub === category ? "page" : undefined}>
              {sub.name}
            </a>
          ))}
        </Chips>
      )}

      {category.products.length > 0 && (
        <section className="a-sec a-block" aria-labelledby="own-title">
          {category.children.length > 0 ? <Head title={fill(c.inThis, { name: category.name })} id="own-title" /> : <h2 id="own-title" className="sr-only">{category.name}</h2>}
          <Grid v={v} items={category.products} />
        </section>
      )}

      {category.children.map((sub) => (
        <section key={sub.id} className="a-sec a-block" aria-labelledby={`s-${sub.id}`}>
          <Head title={sub.name} id={`s-${sub.id}`} link={{ href: href(sub.path), label: fill(a.shopName, { name: sub.name }) }} />
          <Grid v={v} items={sub.products} />
        </section>
      ))}

      {others.length > 0 && (
        <section className="a-sec a-more" aria-labelledby="more-title">
          <Head title={a.departments} id="more-title" link={{ href: href(PAGE_PATHS.menu), label: a.shopAll }} />
          <Departments v={v} categories={others} />
        </section>
      )}
    </>
  );
}

function BestPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.c.best }]} title={v.c.best} lead={v.ctx.text("best.title") || v.a.ranked} />
      <section className="a-sec a-best" aria-label={v.c.best}>
        <Ranked v={v} items={v.best} big />
      </section>
    </>
  );
}

function GalleryPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.a.lookbook }]} title={v.a.lookbook} lead={v.ctx.text("gallery.title") || v.c.galleryLead} />
      <section className="a-sec a-look" aria-label={v.a.lookbook}>
        <Lookbook v={v} photos={v.photos} />
      </section>
    </>
  );
}

function VisitPage({ v }: { v: View }) {
  const { ctx, c } = v;
  const story = ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  return (
    <>
      <PageHead v={v} trail={[{ label: c.visit }]} title={ctx.t.visit} lead={ctx.site.business.address} />
      <VisitStrip v={v} heading={false} />
      {story && (
        <section className={cx("a-story", storyImage && "has-image")} data-section="story" aria-labelledby="story-title">
          {storyImage && (
            <div className="a-story-img">
              <Picture src={storyImage} sizes="100vw" />
            </div>
          )}
          <div className="a-story-card">
            <h2 id="story-title" className="a-h2">
              {ctx.text("story.title") || ctx.t.story}
            </h2>
            <p>{story}</p>
          </div>
        </section>
      )}
      {ctx.reviews.length > 0 && ctx.on("reviews") && <Reviews v={v} />}
    </>
  );
}

/* ---------- footer ---------- */

function Footer({ v }: { v: View }) {
  const { ctx, c, a, href, tree } = v;
  const { site, contact } = ctx;
  const tagline = ctx.text("footer.text");
  return (
    <footer className="a-foot" data-section="footer">
      <div className="a-foot-grid">
        <div className="a-foot-brand">
          {tagline && <p className="a-foot-text">{tagline}</p>}
          <div className="a-socials">
            {contact.instagram && (
              <a className="a-icon" href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.instagram}>
                <Instagram />
              </a>
            )}
            {contact.whatsapp && (
              <a className="a-icon" href={contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.phone}>
                <WhatsApp />
              </a>
            )}
            {contact.maps && (
              <a className="a-icon" href={contact.maps} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.directions}>
                <Pin />
              </a>
            )}
          </div>
        </div>
        {tree.roots.length > 0 && (
          <nav className="a-foot-col" aria-label={a.departments}>
            <h2 className="a-foot-title">{a.departments}</h2>
            <ul className="plain">
              {tree.roots.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <a href={href(cat.path)}>{cat.name}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <nav className="a-foot-col" aria-label={c.pages}>
          <h2 className="a-foot-title">{c.pages}</h2>
          <ul className="plain">
            <li>
              <a href={href(PAGE_PATHS.menu)}>{a.shopAll}</a>
            </li>
            {v.best.length > 0 && (
              <li>
                <a href={href(PAGE_PATHS.best)}>{c.best}</a>
              </li>
            )}
            {v.photos.length > 0 && (
              <li>
                <a href={href(PAGE_PATHS.gallery)}>{a.lookbook}</a>
              </li>
            )}
            <li>
              <a href={href(PAGE_PATHS.visit)}>{c.visit}</a>
            </li>
          </ul>
        </nav>
        {(ctx.today || site.business.address) && (
          <div className="a-foot-col">
            <h2 className="a-foot-title">{c.findUs}</h2>
            {site.business.address && <p>{site.business.address}</p>}
            {ctx.today && <p className="a-foot-today">{ctx.today}</p>}
          </div>
        )}
      </div>
      <p className="a-wordmark" aria-hidden="true">
        {site.business.name}
      </p>
      <Credits ctx={ctx} className="a-credits" />
    </footer>
  );
}
