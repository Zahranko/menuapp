import type { TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, FootName, HoursList, Logo, logoRoot, optionRoot, OrderContent, orderLink, ProductPicture, ProductSheet, SocialLinks, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow } from "../_kit/icons";
import { heroPhotos } from "../_kit/hero";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { Picture } from "../_kit/Picture";
import { bookLink, highlights } from "../_kit/services";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";
import { basicLinks, pageTop, SiteHeader, SiteHero } from "../_kit/Top";
import { SiteMenu } from "../_kit/Menu";
import { SiteFooter, SiteGallery, SiteHighlights, SiteReviews, SiteStory, SiteVisit, ordered } from "../_kit/Sections";

const copy = {
  en: {
    services: "Services",
    about: "About",
    visit: "Visit",
    book: "Book now",
    bookThis: "Book",
    gallery: "Inside the salon",
    reviews: "Kind words",
    hours: "Opening hours",
    contact: "Contact",
    full: "Fully booked",
    menu: "Main menu",
  },
  ar: {
    services: "الخدمات",
    about: "من نحن",
    visit: "زورونا",
    book: "احجز الآن",
    bookThis: "احجز",
    gallery: "داخل الصالون",
    reviews: "كلمات لطيفة",
    hours: "ساعات العمل",
    contact: "تواصل",
    full: "محجوز بالكامل",
    menu: "القائمة الرئيسية",
  },
};

const PALETTES = {
  blush: {
    bg: "#FAF5F2",
    surf: "#FFFFFF",
    ink: "#221A18",
    muted: "#6B5D58",
    line: "#EADFD9",
    deep: "#2B2220",
  },
  sand: {
    bg: "#F5F0E8",
    surf: "#FFFCF7",
    ink: "#1F1B16",
    muted: "#655D52",
    line: "#E3D9C9",
    deep: "#26211B",
  },
  sage: {
    bg: "#F1F3EE",
    surf: "#FFFFFF",
    ink: "#1B211C",
    muted: "#5A6359",
    line: "#DCE1D8",
    deep: "#1F2A22",
  },
  noir: {
    bg: "#141212",
    surf: "#1D1A1A",
    ink: "#F3EEEA",
    muted: "#B3ABA6",
    line: "#332E2D",
    deep: "#0B0A0A",
  },
};

/** Template 017 "Atelier": an editorial website for a salon or beauty studio, with a price list you can book from. */
export default function AtelierTemplate({
  site,
  now,
}: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const heroPics = heroPhotos(site.settings, "hero.image");
  const hero = heroPics[0] ?? null;
  const story = ctx.on("story") && ctx.text("story.text");
  const book = bookLink(ctx);
  const order = orderButton(site, { label: c.book, whatsapp: book });
  const top = pageTop(ctx, { photos: heroPics, backdrop: true });
  const points = highlights(ctx);
  const storyImage = ctx.image("story.image");

  return (
    <div
      data-template="atelier" {...logoRoot(ctx)} {...optionRoot(ctx, order, true)}
      className={cx("t-atelier", order && "has-book", fontVariables)}
      style={themeVars(site.settings, ctx.locale, {
        palettes: PALETTES,
        fonts: ["elegant", "classic", "modern"],
        defaultAccent: "#B76E79",
      })}
    >
      <TemplateStyles id="atelier" />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={top} links={basicLinks(ctx, { story })} cta={book ? { href: book, label: c.book, external: true } : null}>
        <header className="head kit-head" data-section="header">
          <a className="brand kit-lockup" href="#top">
            <Logo ctx={ctx} />
            <BrandName ctx={ctx} />
          </a>
          <nav aria-label={c.menu}>
            <a href="#menu">{c.services}</a>
            {story && <a href="#story">{c.about}</a>}
            {ctx.on("visit") && <a href="#visit">{c.visit}</a>}
          </nav>
          {book && (
            <a data-k="btn" className="btn small" href={book} rel="noopener" target="_blank">
              {c.book}
            </a>
          )}
        </header>
      </SiteHeader>

      <main id="top">
        <SiteHero ctx={ctx} top={top} actions={[...(book ? [{ href: book, label: c.book, external: true }] : []), { href: "#menu", label: c.services }]}>
          <section
            className={cx("hero", "kit-hero", !hero && "no-image")}
            data-section="hero"
            aria-labelledby="hero-title"
          >
            {hero && (
              <div className="hero-image kit-hero-media">
                <HeroPhotos ctx={ctx} photos={heroPics} sizes="100vw" placement="corner" />
              </div>
            )}
            <div className="hero-text kit-hero-text">
              {ctx.text("hero.eyebrow") && (
                <p className="eyebrow">{ctx.text("hero.eyebrow")}</p>
              )}
              <h1 id="hero-title">
                {ctx.text("hero.title") || site.business.name}
              </h1>
              {ctx.text("hero.subtitle") && (
                <p className="lede">{ctx.text("hero.subtitle")}</p>
              )}
              <div className="hero-actions">
                {book && (
                  <a data-k="btn" className="btn" href={book} rel="noopener" target="_blank">
                    {c.book}
                  </a>
                )}
                <a data-k="btn" className="btn ghost" href="#menu">
                  {c.services} <Arrow />
                </a>
              </div>
            </div>
          </section>
        </SiteHero>

        {ordered(ctx, {
          highlights: ctx.on("highlights") && points.length > 0 && (
            <SiteHighlights ctx={ctx} items={points}>
              <ul className="plain points" data-section="highlights">
                {points.map((p) => (
                  <li key={p.title}>
                    <strong>{p.title}</strong>
                    {p.text && <span>{p.text}</span>}
                  </li>
                ))}
              </ul>
            </SiteHighlights>
          ),
          menu: (
            <section
              id="menu"
              className="services"
              data-section="menu"
              aria-labelledby="services-title"
            >
              <div className="section-head">
                <p className="eyebrow">{c.services}</p>
                <h2 id="services-title">
                  {ctx.text("services.title") || c.services}
                </h2>
              </div>
              <SiteMenu ctx={ctx} like="list" services action={(item) => { const link = item.isAvailable ? bookLink(ctx, item.name) : null; return link ? { href: link, label: c.bookThis } : null; }}>
              <div className="lists">
                {ctx.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.anchor}
                    className="list"
                    aria-labelledby={`${section.anchor}-h`}
                  >
                    <h3 id={`${section.anchor}-h`}>{section.name}</h3>
                    <ul className="plain kit-cards kit-rows">
                      {section.products.map((item) => {
                        const link = item.isAvailable
                          ? bookLink(ctx, item.name)
                          : null;
                        return (
                          <li
                            key={item.id}
                            className={cx("service kit-card kit-card-pad", !item.isAvailable && "out")}
                          >
                            <button
                              type="button"
                              className="service-main"
                              data-item-id={item.id}
                            >
                              <span className="service-thumb kit-card-media">
                                <ProductPicture item={item} sizes="64px" />
                              </span>
                              <span className="service-text">
                                <span className="service-name">
                                  {item.name}
                                  {item.labelText && (
                                    <span className="tag">{item.labelText}</span>
                                  )}
                                  {!item.isAvailable && (
                                    <span className="tag tag-out">{ctx.t.unavailable}</span>
                                  )}
                                </span>
                                {item.description && (
                                  <span className="service-desc">
                                    {item.description}
                                  </span>
                                )}
                              </span>
                              <span className="service-price">
                                {item.priceText}
                              </span>
                            </button>
                            {link && (
                              <a
                                className="service-book"
                                href={link}
                                rel="noopener"
                                target="_blank"
                                aria-label={`${c.bookThis}: ${item.name}`}
                              >
                                {c.bookThis}
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
              </SiteMenu>
            </section>
          ),
          story: story && (
            <SiteStory ctx={ctx} eyebrow={c.about} title={ctx.text("story.title") || c.about}>
              <section
                id="story"
                className="story"
                data-section="story"
                aria-labelledby="story-title"
              >
                {storyImage && (
                  <div data-k="photo" className="story-image">
                    <Picture
                      src={storyImage}
                      sizes="(min-width: 760px) 45vw, 100vw"
                    />
                  </div>
                )}
                <div className="story-text">
                  <p className="eyebrow">{c.about}</p>
                  <h2 id="story-title">{ctx.text("story.title") || c.about}</h2>
                  <p>{story}</p>
                </div>
              </section>
            </SiteStory>
          ),
          gallery: ctx.on("gallery") && ctx.gallery.length > 0 && (
            <SiteGallery ctx={ctx} title={c.gallery}>
              <section
                className="gallery"
                data-section="gallery"
                aria-labelledby="gallery-title"
              >
                <h2 id="gallery-title" className="sr-only">
                  {c.gallery}
                </h2>
                <ul className="plain" data-gallery>
                  {ctx.gallery.slice(0, 6).map((src, i) => (
                    <li key={src + i} data-k="photo fill">
                      <Picture
                        src={src}
                        sizes="(min-width: 760px) 33vw, 50vw"
                        alt={ctx.t.photoOf
                          .replace("{n}", String(i + 1))
                          .replace("{name}", site.business.name)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </SiteGallery>
          ),
          reviews: ctx.on("reviews") && ctx.reviews.length > 0 && (
            <SiteReviews ctx={ctx} title={c.reviews}>
              <section
                className="reviews"
                data-section="reviews"
                aria-labelledby="reviews-title"
              >
                <h2 id="reviews-title">{c.reviews}</h2>
                <div className="quotes">
                  {ctx.reviews.slice(0, 3).map((r) => (
                    <figure key={r.quote}>
                      <blockquote>{r.quote}</blockquote>
                      {r.name && <figcaption>{r.name}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            </SiteReviews>
          ),
          visit: ctx.on("visit") && (
            <SiteVisit ctx={ctx} title={c.visit} cta={book ? { href: book, label: c.book } : null}>
              <section
                id="visit"
                className="visit"
                data-section="visit"
                aria-labelledby="visit-title"
              >
                <h2 id="visit-title">{c.visit}</h2>
                <div className="visit-grid">
                  {hasHours(ctx.hours) && (
                    <div>
                      <h3>{c.hours}</h3>
                      <HoursList ctx={ctx} />
                    </div>
                  )}
                  <div>
                    <h3>{c.contact}</h3>
                    <ContactList ctx={ctx} />
                    {book && (
                      <a data-k="btn" className="btn" href={book} rel="noopener" target="_blank">
                        {c.book}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            </SiteVisit>
          ),
        })}
      </main>

      <SiteFooter ctx={ctx} links={basicLinks(ctx, { story })}>
        <footer className="foot" data-section="footer">
          <FootName ctx={ctx} as="span" className="foot-name" />
          <SocialLinks accounts={socialAccounts(site)} className="foot-social" />
          <Credits ctx={ctx} />
        </footer>
      </SiteFooter>
      {order && (
        <a className="book-bar kit-order" data-k="float" {...orderLink(order)}>
          <OrderContent order={order} />
        </a>
      )}
      <ProductSheet ctx={ctx} services />
    </div>
  );
}
