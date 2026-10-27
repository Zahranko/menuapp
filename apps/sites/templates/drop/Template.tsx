import type { CSSProperties } from "react";
import { itemCount } from "@/lib/i18n";
import type { TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, FootName, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, SocialIcons, TopBars } from "../_kit/blocks";
import { CatalogControls } from "../_kit/CatalogControls";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { heroPhotos } from "../_kit/hero";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { Arrow, Pin, WhatsApp } from "../_kit/icons";
import { orderButton, socialAccounts } from "../_kit/options";
import { Picture } from "../_kit/Picture";
import { hasHours, type MenuItem } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars, type Palette } from "../_kit/theme";
import { fashionCopy, fill } from "../_fashion/copy";
import { details, sizeRange } from "../_fashion/details";
import { sheetItems, sheetLabels, viewerLabels } from "../_fashion/items";
import { PhotoViewer } from "../_fashion/PhotoViewer";
import { ProductSheet } from "../_fashion/ProductSheet";
import { orderCta, pageTop, SiteHeader, SiteHero, type NavLink } from "../_kit/Top";

/*
 * Template 028 "Drop": a loud streetwear store. A moving ticker, a full-screen poster for the latest drop with a
 * sticker, the featured pieces as a numbered sideways strip, a filterable grid of bordered cards with sticker labels
 * and sizes, a street photo wall, a statement story and a giant outlined name in the footer.
 */

const PALETTES = {
  black: { bg: "#0E0E0E", surf: "#1A1A1A", ink: "#F4F4F0", muted: "#A6A6A0", line: "#F4F4F0" },
  white: { bg: "#F4F4F0", surf: "#FFFFFF", ink: "#0E0E0E", muted: "#55554F", line: "#0E0E0E" },
  concrete: { bg: "#CFCFCB", surf: "#E2E2DE", ink: "#111111", muted: "#45453F", line: "#111111" },
  cobalt: { bg: "#1433C9", surf: "#0F28A3", ink: "#F4F4F0", muted: "#D2D9FF", line: "#F4F4F0" },
} satisfies Record<string, Palette>;

const copy = {
  en: { shop: "Shop", photos: "Photos", store: "Store", dm: "DM to order", sort: "Sort", featured: "Hot first", low: "Price: low to high", high: "Price: high to low", filter: "Filter by category", hold: "Hold my size", reviews: "The crew says", find: "Find the store" },
  ar: { shop: "المتجر", photos: "الصور", store: "المحل", dm: "اطلب برسالة", sort: "الترتيب", featured: "الرائج أولًا", low: "السعر: من الأقل", high: "السعر: من الأعلى", filter: "تصفية حسب القسم", hold: "احجز مقاسي", reviews: "ماذا يقول زبائننا", find: "زورونا في المحل" },
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function DropTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const f = fashionCopy(ctx.locale);
  const order = orderButton(site);
  const all = ctx.sections.flatMap((s) => s.products.map((item) => ({ item, collection: s.name })));
  const photos = ctx.on("gallery") ? ctx.gallery : [];
  const top = pageTop(ctx, { photos: heroPhotos(site.settings, "hero.image"), backdrop: true });
  const links: NavLink[] = [
    { href: "#menu", label: f.shop },
    ...[...(photos.length > 0 ? [{ href: "#street", label: c.photos }] : [])],
    ...(ctx.on("story") && ctx.text("story.text") ? [{ href: "#story", label: ctx.t.story }] : []),
    ...(ctx.on("visit") ? [{ href: "#visit", label: c.store }] : []),
  ];
  const style = themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["condensed", "bold", "grotesk"], defaultAccent: "#C6FF00", radius: { rounded: "0px", sharp: "0px" } });

  return (
    <div data-template="drop" {...logoRoot(ctx)} {...optionRoot(ctx, order)} className={cx("t-drop", fontVariables)} style={style}>
      <TemplateStyles id="drop" />
      <TopBars ctx={ctx} announcement={false} />
      {ctx.on("announcement") && ctx.text("announcement") && <Ticker text={ctx.text("announcement")} />}
      <SiteHeader ctx={ctx} top={top} links={links} cta={orderCta(order)}>
        <Header ctx={ctx} c={c} photos={photos.length > 0} />
      </SiteHeader>
      <main id="top">
        <SiteHero ctx={ctx} top={top} actions={[{ href: "#menu", label: f.shopAll }]}>
          <Poster ctx={ctx} f={f} />
        </SiteHero>
        {ctx.on("hot") && <Hot ctx={ctx} />}
        <Shop ctx={ctx} c={c} f={f} />
        {photos.length > 0 && <Wall ctx={ctx} f={f} photos={photos} />}
        {ctx.on("story") && ctx.text("story.text") && <Statement ctx={ctx} />}
        {ctx.on("reviews") && ctx.reviews.length > 0 && <Crew ctx={ctx} c={c} />}
        {ctx.on("visit") && <Store ctx={ctx} c={c} f={f} />}
      </main>
      <Footer ctx={ctx} c={c} />
      <OrderFab order={order} />
      <ProductSheet items={sheetItems(ctx, all)} phone={site.business.whatsApp} labels={sheetLabels(ctx)} />
      {photos.length > 0 && <PhotoViewer photos={photos.map((src) => ({ src, alt: null }))} labels={viewerLabels(ctx)} />}
    </div>
  );
}

type C = (typeof copy)["en"];
type F = ReturnType<typeof fashionCopy>;

/** The announcement as a moving ticker; the copies after the first are decoration (hidden from screen readers). */
function Ticker({ text }: { text: string }) {
  return (
    <div className="dr-ticker" data-section="announcement">
      <p className="sr-only">{text}</p>
      <div className="dr-ticker-track" aria-hidden="true">
        {[0, 1].map((half) => (
          <div key={half} className="dr-ticker-half">
            {[0, 1, 2, 3].map((n) => (
              <span key={n}>
                {text} <b>✦</b>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ ctx, c, photos }: { ctx: SiteContext; c: C; photos: boolean }) {
  return (
    <header className="dr-head kit-head" data-section="header">
      <a className="dr-lockup kit-lockup" href="#top">
        <Logo ctx={ctx} className="dr-logo" sizes="40px" />
        <BrandName ctx={ctx} className="dr-name" />
      </a>
      <nav className="dr-nav" aria-label={c.shop}>
        <a href="#menu">{c.shop}</a>
        {photos && <a href="#street">{c.photos}</a>}
        {ctx.on("visit") && <a href="#visit">{c.store}</a>}
      </nav>
      {ctx.contact.whatsapp && (
        <a className="dr-dm" href={ctx.contact.whatsapp} target="_blank" rel="noopener noreferrer">
          <WhatsApp />
          <span>{c.dm}</span>
        </a>
      )}
    </header>
  );
}

/** The opening: the drop's poster. Photo full screen, a sticker and a giant headline on it. */
function Poster({ ctx, f }: { ctx: SiteContext; f: F }) {
  const s = ctx.site.settings;
  const photos = heroPhotos(s, "hero.image");
  const sticker = ctx.text("hero.eyebrow");
  const subtitle = ctx.text("hero.subtitle");
  return (
    <section className={cx("dr-poster kit-hero", photos.length === 0 && "is-plain")} data-section="hero" aria-labelledby="dr-title">
      {photos.length > 0 && (
        <div className="dr-poster-media kit-hero-media">
          <HeroPhotos ctx={ctx} photos={photos} sizes="100vw" placement="corner" />
        </div>
      )}
      <div className="dr-poster-text kit-hero-text">
        {sticker && <p className="dr-sticker">{sticker}</p>}
        <h1 id="dr-title" className="dr-title">
          {ctx.text("hero.title") || ctx.site.business.name}
        </h1>
        {subtitle && <p className="dr-sub">{subtitle}</p>}
        <div className="dr-poster-actions">
          <a data-k="btn" className="dr-btn" href="#menu">
            {f.shopAll} <Arrow className="flip" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Stickers({ ctx, item }: { ctx: SiteContext; item: MenuItem }) {
  if (!item.labelText && item.isAvailable) return null;
  return (
    <span className="dr-stickers">
      {item.labelText && <span className="tag">{item.labelText}</span>}
      {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
    </span>
  );
}

/** Featured pieces in a sideways strip with big outlined numbers. */
function Hot({ ctx }: { ctx: SiteContext }) {
  const picks = ctx.sections.flatMap((s) => s.products).filter((p) => p.isFeatured && p.isAvailable).slice(0, 8);
  if (picks.length === 0) return null;
  return (
    <section className="dr-hot" data-section="highlights" aria-labelledby="dr-hot-title">
      <h2 id="dr-hot-title" className="dr-h2">
        {ctx.text("hot.title") || fashionCopy(ctx.locale).newIn}
      </h2>
      <ul className="plain dr-hot-row" tabIndex={0} aria-labelledby="dr-hot-title">
        {picks.map((item, i) => (
          <li key={item.id}>
            <button type="button" className="dr-hot-card" data-item-id={item.id}>
              <span className="dr-hot-num" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span data-k="photo" className="dr-hot-media">
                <ProductPicture item={item} sizes="(min-width: 760px) 26vw, 64vw" />
              </span>
              <span className="dr-hot-name">{item.name}</span>
              <span className="dr-price">{item.priceText}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Shop({ ctx, c, f }: { ctx: SiteContext; c: C; f: F }) {
  const products = ctx.sections.flatMap((s) => s.products.map((p) => ({ ...p, category: s })));
  // Featured first, then menu order; the sort control can reorder by price.
  const order = new Map([...products].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).map((p, i) => [p.id, i]));
  const number = new Map(products.map((p, i) => [p.id, i + 1]));
  return (
    <section id="menu" className="dr-shop" data-section="menu" aria-labelledby="dr-shop-title">
      <div className="dr-shop-head">
        <h2 id="dr-shop-title" className="dr-h2">
          {ctx.text("menu.title") || c.shop}
        </h2>
        <span className="dr-count">{itemCount(products.length, ctx.locale)}</span>
      </div>
      <CatalogControls
        gridId="dr-grid"
        className="dr-controls"
        categories={ctx.sections.map((s) => ({ id: s.anchor, name: s.name }))}
        labels={{ all: ctx.t.all, search: f.find, sort: c.sort, featured: c.featured, priceLow: c.low, priceHigh: c.high, filter: c.filter }}
        locale={ctx.locale}
      />
      <ul id="dr-grid" className="plain dr-grid kit-cards">
        {products.map((item) => {
          const sizes = sizeRange(details(item.description).sizes);
          return (
            <li key={item.id} className="dr-cell" data-product data-cat={item.category.anchor} data-q={item.search} data-price={item.price} data-order={order.get(item.id)} style={{ order: order.get(item.id) } as CSSProperties}>
              <button type="button" className={cx("dr-card kit-card", !item.isAvailable && "is-out")} data-item-id={item.id}>
                <span className="dr-card-media kit-card-media kit-flush">
                  <ProductPicture item={item} sizes="(min-width: 1100px) 25vw, (min-width: 760px) 33vw, 50vw" />
                  <Stickers ctx={ctx} item={item} />
                </span>
                <span className="dr-card-body">
                  <span className="dr-card-meta">
                    <span>#{pad(number.get(item.id) ?? 0)}</span>
                    <span className="dr-card-cat">{item.category.name}</span>
                  </span>
                  <span className="dr-card-name">{item.name}</span>
                  {sizes && (
                    <span className="dr-card-sizes">
                      <span className="sr-only">{f.sizes}: </span>
                      {sizes}
                    </span>
                  )}
                  <span className="dr-price">{item.priceText}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="dr-empty" data-catalog-empty hidden={products.length > 0}>
        {f.empty}
      </p>
    </section>
  );
}

/** The street photo wall: photos only, in square and tall frames. Each opens the viewer. */
function Wall({ ctx, f, photos }: { ctx: SiteContext; f: F; photos: string[] }) {
  return (
    <section id="street" className="dr-wall" data-section="gallery" aria-labelledby="dr-wall-title">
      <h2 id="dr-wall-title" className="dr-h2">
        {ctx.text("gallery.title") || f.lookbook}
      </h2>
      <ul className="plain dr-wall-grid" data-gallery>
        {photos.map((src, i) => (
          <li key={src + i} className={i % 5 === 0 ? "is-big" : undefined}>
            <button data-k="photo fill" type="button" className="fs-tile" data-photo={i} aria-label={fill(f.openPhoto, { n: i + 1 })}>
              <Picture src={src} sizes={i % 5 === 0 ? "(min-width: 760px) 50vw, 100vw" : "(min-width: 760px) 25vw, 50vw"} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Statement({ ctx }: { ctx: SiteContext }) {
  return (
    <section id="story" className="dr-statement" data-section="story" aria-labelledby="dr-story-title">
      <h2 id="dr-story-title" className="dr-statement-title">
        {ctx.text("story.title") || ctx.t.story}
      </h2>
      <p className="dr-statement-text">{ctx.text("story.text")}</p>
    </section>
  );
}

function Crew({ ctx, c }: { ctx: SiteContext; c: C }) {
  return (
    <section id="reviews" className="dr-crew" data-section="reviews" aria-labelledby="dr-crew-title">
      <h2 id="dr-crew-title" className="dr-h2">
        {c.reviews}
      </h2>
      <ul className="plain dr-crew-list">
        {ctx.reviews.map((r, i) => (
          <li key={i}>
            <figure className="dr-bubble">
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

function Store({ ctx, c, f }: { ctx: SiteContext; c: C; f: F }) {
  const { contact } = ctx;
  return (
    <section id="visit" className="dr-store" data-section="visit" aria-labelledby="dr-store-title">
      <h2 id="dr-store-title" className="dr-h2">
        {c.find}
      </h2>
      <div className="dr-store-grid">
        <div className="dr-panel">
          <ContactList ctx={ctx} className="contact dr-contact" />
          <div className="dr-store-actions">
            {contact.whatsapp && (
              <a data-k="btn" className="dr-btn" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> {c.hold}
              </a>
            )}
            {contact.maps && (
              <a data-k="btn" className="dr-btn dr-btn-line" href={contact.maps} target="_blank" rel="noopener noreferrer">
                <Pin /> {ctx.t.directions}
              </a>
            )}
          </div>
          <p className="dr-note">{f.exchange}</p>
        </div>
        {hasHours(ctx.hours) && (
          <div className="dr-panel">
            <h3 className="dr-h3">{ctx.t.hours}</h3>
            {ctx.today && <p className="dr-today">{ctx.today}</p>}
            <HoursList ctx={ctx} className="hours dr-hours" />
          </div>
        )}
      </div>
    </section>
  );
}

function Footer({ ctx, c }: { ctx: SiteContext; c: C }) {
  const social = socialAccounts(ctx.site);
  return (
    <footer className="dr-foot" data-section="footer">
      <FootName ctx={ctx} className="dr-wordmark" decorative />
      <div className="dr-foot-row">
        <nav className="dr-foot-nav" aria-label={c.shop}>
          {ctx.sections.slice(0, 8).map((s) => (
            <a key={s.id} href="#menu">
              {s.name}
            </a>
          ))}
        </nav>
        {social.length > 0 && (
          <div className="dr-social kit-social" data-section="social">
            <SocialIcons accounts={social} className="dr-social-link" />
          </div>
        )}
      </div>
      <Credits ctx={ctx} className="credits dr-credits" />
    </footer>
  );
}
