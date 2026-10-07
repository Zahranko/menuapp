import type { TemplateProps } from "@/lib/types";
import {
  ContactList,
  Credits,
  HoursList,
  Logo,
  ProductPicture,
  ProductSheet,
  TopBars,
} from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { bookLink, highlights } from "../_kit/services";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

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
  const hero = ctx.image("hero.image");
  const story = ctx.on("story") && ctx.text("story.text");
  const book = bookLink(ctx);
  const points = highlights(ctx);
  const storyImage = ctx.image("story.image");

  return (
    <div
      data-template="atelier"
      className={cx("t-atelier", book && "has-book", fontVariables)}
      style={themeVars(site.settings, ctx.locale, {
        palettes: PALETTES,
        fonts: ["elegant", "classic", "modern"],
        defaultAccent: "#B76E79",
      })}
    >
      <TemplateStyles id="atelier" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        <nav aria-label={c.menu}>
          <a href="#menu">{c.services}</a>
          {story && <a href="#story">{c.about}</a>}
          {ctx.on("visit") && <a href="#visit">{c.visit}</a>}
        </nav>
        {book && (
          <a className="btn small" href={book} rel="noopener" target="_blank">
            {c.book}
          </a>
        )}
      </header>

      <main id="top">
        <section
          className={cx("hero", !hero && "no-image")}
          data-section="hero"
          aria-labelledby="hero-title"
        >
          {hero && (
            <div className="hero-image">
              <Picture src={hero} sizes="100vw" priority />
            </div>
          )}
          <div className="hero-text">
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
                <a className="btn" href={book} rel="noopener" target="_blank">
                  {c.book}
                </a>
              )}
              <a className="btn ghost" href="#menu">
                {c.services} <Arrow />
              </a>
            </div>
          </div>
        </section>

        {ctx.on("highlights") && points.length > 0 && (
          <ul className="plain points" data-section="highlights">
            {points.map((p) => (
              <li key={p.title}>
                <strong>{p.title}</strong>
                {p.text && <span>{p.text}</span>}
              </li>
            ))}
          </ul>
        )}

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
          <div className="lists">
            {ctx.sections.map((section) => (
              <section
                key={section.id}
                id={section.anchor}
                className="list"
                aria-labelledby={`${section.anchor}-h`}
              >
                <h3 id={`${section.anchor}-h`}>{section.name}</h3>
                <ul className="plain">
                  {section.products.map((item) => {
                    const link = item.isAvailable
                      ? bookLink(ctx, item.name)
                      : null;
                    return (
                      <li
                        key={item.id}
                        className={cx("service", !item.isAvailable && "out")}
                      >
                        <button
                          type="button"
                          className="service-main"
                          data-item-id={item.id}
                        >
                          <span className="service-thumb">
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
        </section>

        {story && (
          <section
            id="story"
            className="story"
            data-section="story"
            aria-labelledby="story-title"
          >
            {storyImage && (
              <div className="story-image">
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
        )}

        {ctx.on("gallery") && ctx.gallery.length > 0 && (
          <section
            className="gallery"
            data-section="gallery"
            aria-labelledby="gallery-title"
          >
            <h2 id="gallery-title" className="sr-only">
              {c.gallery}
            </h2>
            <ul className="plain">
              {ctx.gallery.slice(0, 6).map((src, i) => (
                <li key={src + i}>
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
        )}

        {ctx.on("reviews") && ctx.reviews.length > 0 && (
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
        )}

        {ctx.on("visit") && (
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
                  <a className="btn" href={book} rel="noopener" target="_blank">
                    {c.book}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <span className="foot-name">{site.business.name}</span>
        <Credits ctx={ctx} />
      </footer>
      {book && (
        <a className="book-bar" href={book} rel="noopener" target="_blank">
          {c.book}
        </a>
      )}
      <ProductSheet ctx={ctx} services />
    </div>
  );
}
