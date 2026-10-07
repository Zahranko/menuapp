import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";
import type { TemplateProps } from "@/lib/types";

const copy = {
  en: { picks: "Favorites", picksTitle: "Start with these", chapter: "Chapter", story: "Our story", reviews: "Kind words", visit: "Come say hello", hours: "Opening hours", contact: "Where to find us", order: "Order on WhatsApp", nav: "Main" },
  ar: { picks: "المفضلة", picksTitle: "ابدأ بهذه", chapter: "الفصل", story: "قصتنا", reviews: "كلمات لطيفة", visit: "تفضلوا بزيارتنا", hours: "ساعات العمل", contact: "أين تجدوننا", order: "اطلب عبر واتساب", nav: "الرئيسية" },
};

const PALETTES = {
  blush: { bg: "#F8E8E4", surf: "#FDF5F2", ink: "#2E1A1C", muted: "#74595B", line: "#EBCFC8" },
  sand: { bg: "#F4ECDD", surf: "#FBF6EC", ink: "#2B2116", muted: "#6E604E", line: "#E2D3B9" },
  sage: { bg: "#E7ECE3", surf: "#F4F7F1", ink: "#1E2A21", muted: "#566558", line: "#CED8C9" },
  cocoa: { bg: "#2A1D19", surf: "#352520", ink: "#F7EAE2", muted: "#C4ADA2", line: "#4A352E" },
};

const two = (n: number) => String(n).padStart(2, "0");

/** Template 004 "Arch Story": a magazine for sweet shops, with arched photos and the menu told in chapters. */
export default function ArchStoryTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const hero = ctx.image("hero.image");
  const storyText = ctx.on("story") && ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  const reviews = ctx.on("reviews") ? ctx.reviews.slice(0, 3) : [];
  const links: [string, string][] = [["#menu", ctx.t.menu], ...(storyText ? [["#story", c.story] as [string, string]] : []), ...(ctx.on("visit") ? [["#visit", ctx.t.visit] as [string, string]] : [])];

  return (
    <div data-template="archstory" className={cx("t-arch", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["soft", "elegant", "classic"], defaultAccent: "#C2577A", radius: { rounded: "24px", sharp: "6px" } })}>
      <TemplateStyles id="archstory" />
      <TopBars ctx={ctx} />
      <header className="top" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        <nav aria-label={c.nav}>
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className="cover" id="top" data-section="hero" aria-labelledby="cover-title">
          <div className="cover-text">
            {ctx.text("hero.eyebrow") && <p className="eyebrow">{ctx.text("hero.eyebrow")}</p>}
            <h1 id="cover-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p className="lede">{ctx.text("hero.subtitle")}</p>}
            <a className="pill" href="#menu">
              {ctx.t.viewMenu} <Arrow className="flip" />
            </a>
          </div>
          {hero && (
            <div className="arch cover-arch">
              <Picture src={hero} sizes="(min-width: 760px) 45vw, 90vw" priority />
            </div>
          )}
        </section>

        {ctx.on("picks") && ctx.picks.length > 0 && (
          <section className="picks" data-section="picks" aria-labelledby="picks-title">
            <p className="eyebrow">{c.picks}</p>
            <h2 id="picks-title">{c.picksTitle}</h2>
            <ol className="swipe" tabIndex={0} aria-labelledby="picks-title">
              {ctx.picks.map((item, i) => (
                <li key={item.id}>
                  <button type="button" className="story-card" data-item-id={item.id}>
                    <span className="arch card-arch">
                      <ProductPicture item={item} sizes="(min-width: 760px) 30vw, 75vw" />
                    </span>
                    <span className="card-no">{two(i + 1)}</span>
                    <span className="card-name">{item.name}</span>
                    <span className="card-price">{item.priceText}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section id="menu" className="chapters" data-section="menu" aria-label={ctx.t.menu}>
          {ctx.sections.map((section, i) => (
            <section key={section.id} id={section.anchor} className="chapter" aria-labelledby={`${section.anchor}-h`}>
              <div className="chapter-head">
                <span className="chapter-no">
                  {c.chapter} {two(i + 1)}
                </span>
                <h2 id={`${section.anchor}-h`}>{section.name}</h2>
              </div>
              <ul className="plain treats">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("treat", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="arch treat-arch">
                        <ProductPicture item={item} sizes="(min-width: 760px) 20vw, 45vw" />
                      </span>
                      <span className="treat-tags">
                        {item.labelText && <span className="tag">{item.labelText}</span>}
                        {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                      </span>
                      <span className="treat-name">{item.name}</span>
                      {item.description && <span className="treat-desc">{item.description}</span>}
                      <span className="treat-price">{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {storyText && (
          <section id="story" className="story" data-section="story" aria-labelledby="story-title">
            {storyImage && (
              <div className="arch story-arch">
                <Picture src={storyImage} sizes="(min-width: 760px) 40vw, 80vw" />
              </div>
            )}
            <div>
              <p className="eyebrow">{c.story}</p>
              <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
              <p className="story-text">{storyText}</p>
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="reviews" data-section="reviews" aria-labelledby="reviews-title">
            <p className="eyebrow" id="reviews-title">
              {c.reviews}
            </p>
            <div className="quotes" tabIndex={0} role="region" aria-labelledby="reviews-title">
              {reviews.map((r, i) => (
                <figure key={i}>
                  <blockquote>“{r.quote}”</blockquote>
                  {r.name && <figcaption>{r.name}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <h2 id="visit-title">{c.visit}</h2>
            <div className="visit-arches">
              {hasHours(ctx.hours) && (
                <div className="arch-panel">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              <div className="arch-panel">
                <h3>{c.contact}</h3>
                <ContactList ctx={ctx} />
                <div className="visit-actions">
                  {ctx.contact.whatsapp && (
                    <a className="pill" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                      <WhatsApp /> {c.order}
                    </a>
                  )}
                  {ctx.contact.maps && (
                    <a className="pill ghost" href={ctx.contact.maps} rel="noopener" target="_blank">
                      {ctx.t.directions}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <p className="wordmark">{site.business.name}</p>
        <Credits ctx={ctx} />
      </footer>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
