import { whatsappLink } from "@/lib/format";
import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { CatalogControls } from "../_kit/CatalogControls";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { shop: "Shop", all: "All", sort: "Sort", featured: "Featured", low: "Price: low to high", high: "Price: high to low", filter: "Filter by category", ask: "Ask on WhatsApp", about: "About us", visit: "Visit the shop", hours: "Opening hours", contact: "Contact", empty: "Nothing matches. Try another word or category." },
  ar: { shop: "المتجر", all: "الكل", sort: "الترتيب", featured: "المميز أولًا", low: "السعر: من الأقل", high: "السعر: من الأعلى", filter: "تصفية حسب القسم", ask: "اسأل عبر واتساب", about: "من نحن", visit: "زوروا المتجر", hours: "ساعات العمل", contact: "تواصل", empty: "لا توجد نتائج. جرّب كلمة أو قسمًا آخر." },
};

const PALETTES = {
  paper: { bg: "#F6F5F1", surf: "#FFFFFF", ink: "#141414", muted: "#5E5D58", line: "#E2E0D8" },
  cloud: { bg: "#EEF2F7", surf: "#FFFFFF", ink: "#0F1B2D", muted: "#4F5D70", line: "#D7DFEA" },
  mint: { bg: "#EAF4EF", surf: "#FFFFFF", ink: "#10241A", muted: "#4C6457", line: "#D0E3D8" },
  graphite: { bg: "#18191B", surf: "#222326", ink: "#F3F3F1", muted: "#A8A9AD", line: "#34363A" },
};

/** Template 005 "Pocket Catalog": a shop catalog with filters, price sorting and a WhatsApp question on every item. */
export default function PocketCatalogTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const banner = ctx.image("hero.image");
  const story = ctx.on("story") && ctx.text("story.text");
  const askStart = ctx.text("ask");
  const products = ctx.sections.flatMap((s) => s.products.map((p) => ({ ...p, category: s })));
  // Featured first, then menu order; the sort control can reorder by price.
  const order = new Map([...products].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).map((p, i) => [p.id, i]));

  return (
    <div
      data-template="pocket"
      className={cx("t-pocket", fontVariables)}
      style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["grotesk", "modern", "bold"], defaultAccent: "#1F3A5F", radius: { rounded: "16px", sharp: "0px" } })}
    >
      <TemplateStyles id="pocket" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        {ctx.contact.whatsapp && (
          <a className="head-ask" href={ctx.contact.whatsapp} rel="noopener" target="_blank" aria-label={c.ask}>
            <WhatsApp />
          </a>
        )}
      </header>

      <main id="top">
        {ctx.on("banner") ? (
          <section className="banner" data-section="hero" aria-labelledby="banner-title">
            <div className="banner-text">
              <h1 id="banner-title">{ctx.text("hero.title") || site.business.name}</h1>
              {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            </div>
            {banner && (
              <div className="banner-media">
                <Picture src={banner} sizes="(min-width: 760px) 35vw, 100vw" priority />
              </div>
            )}
          </section>
        ) : (
          <h1 className="sr-only">{site.business.name}</h1>
        )}

        <section id="menu" className="catalog" data-section="menu" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="sr-only">
            {c.shop}
          </h2>
          <CatalogControls
            gridId="catalog-grid"
            className="controls"
            categories={ctx.sections.map((s) => ({ id: s.anchor, name: s.name }))}
            labels={{ all: c.all, search: ctx.t.search, sort: c.sort, featured: c.featured, priceLow: c.low, priceHigh: c.high, filter: c.filter }}
            locale={ctx.locale}
          />
          <ul id="catalog-grid" className="plain grid">
            {products.map((item) => (
              <li
                key={item.id}
                className={cx("product", !item.isAvailable && "out")}
                data-product
                data-cat={item.category.anchor}
                data-q={item.search}
                data-price={item.price}
                data-order={order.get(item.id)}
                style={{ order: order.get(item.id) }}
              >
                <button type="button" className="product-main" data-item-id={item.id}>
                  <span className="product-media">
                    <ProductPicture item={item} sizes="(min-width: 760px) 25vw, 50vw" />
                    {(item.labelText || !item.isAvailable) && (
                      <span className="badges">
                        {item.labelText && <span className="tag">{item.labelText}</span>}
                        {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                      </span>
                    )}
                  </span>
                  <span className="product-cat">{item.category.name}</span>
                  <span className="product-name">{item.name}</span>
                  <span className="product-price">{item.priceText}</span>
                </button>
                {ctx.site.business.whatsApp && item.isAvailable && (
                  <a className="ask" href={whatsappLink(ctx.site.business.whatsApp, `${askStart} ${item.name}`.trim())} rel="noopener" target="_blank" aria-label={`${c.ask}: ${item.name}`}>
                    <WhatsApp /> {c.ask}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="empty" data-catalog-empty hidden={products.length > 0}>
            {c.empty}
          </p>
        </section>

        {(story || ctx.on("visit")) && (
          <div className="info">
            {story && (
              <section className="card" id="story" data-section="story" aria-labelledby="story-title">
                <h2 id="story-title">{ctx.text("story.title") || c.about}</h2>
                <p>{story}</p>
              </section>
            )}
            {ctx.on("visit") && (
              <section className="card" id="visit" data-section="visit" aria-labelledby="visit-title">
                <h2 id="visit-title">{c.visit}</h2>
                <div className="visit-cols">
                  <ContactList ctx={ctx} />
                  {hasHours(ctx.hours) && (
                    <div>
                      <h3>{c.hours}</h3>
                      <HoursList ctx={ctx} />
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <Credits ctx={ctx} />
      </footer>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
