import { flag } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Clock, Pin, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { bookLink, faqs, highlights, steps } from "../_kit/services";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { services: "Services", request: "Request a visit", ask: "Request", from: "From", areas: "Areas we cover", how: "How it works", reviews: "Happy homes", faq: "Questions", hours: "Working hours", contact: "Contact", menu: "Main menu", jump: "Service types", need: "What do you need?" },
  ar: { services: "الخدمات", request: "اطلب زيارة", ask: "اطلب", from: "يبدأ من", areas: "المناطق التي نخدمها", how: "كيف نعمل", reviews: "بيوت سعيدة", faq: "أسئلة", hours: "ساعات العمل", contact: "تواصل", menu: "القائمة الرئيسية", jump: "أنواع الخدمات", need: "ماذا تحتاج؟" },
};

const PALETTES = {
  clean: { bg: "#F6F8FB", surf: "#FFFFFF", ink: "#13233A", muted: "#536379", line: "#DFE5EE", hi: "#FFC845", hiink: "#13233A" },
  sunny: { bg: "#FFF9EC", surf: "#FFFFFF", ink: "#2A1F0E", muted: "#6A5B44", line: "#F0E3C6", hi: "#FFB020", hiink: "#2A1F0E" },
  sage: { bg: "#F3F6F1", surf: "#FFFFFF", ink: "#17251B", muted: "#55665A", line: "#DCE5D8", hi: "#C7E26A", hiink: "#17251B" },
  navy: { bg: "#0F1B2D", surf: "#16263D", ink: "#EEF3FA", muted: "#A7B4C6", line: "#26395A", hi: "#FFC845", hiink: "#13233A" },
};

function Shield() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10v-6z" fill="var(--hi)" />
      <path d="m8.2 12 2.6 2.6 5-5.2" fill="none" stroke="var(--hiink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Template 021 "Handy": a friendly site for home services. Trust badges, service areas, request buttons per service, steps and a sticky request bar. */
export default function HandyTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const hero = ctx.image("hero.image");
  const book = bookLink(ctx);
  const from = flag(site.settings, "prices.from", true);
  const badges = highlights(ctx);
  const how = steps(ctx);
  const questions = faqs(ctx);
  const areas = ctx
    .text("areas")
    .split(/[,،\n]/)
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <div data-template="handy" className={cx("t-handy", fontVariables, book && "has-bar")} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["round", "modern", "grotesk"], defaultAccent: "#1E5BB8", radius: { rounded: "18px", sharp: "4px" } })}>
      <TemplateStyles id="handy" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        <nav aria-label={c.menu}>
          <a href="#menu">{c.services}</a>
          {ctx.on("steps") && how.length > 0 && <a href="#how">{c.how}</a>}
          {ctx.on("faq") && questions.length > 0 && <a href="#faq">{c.faq}</a>}
          {ctx.on("visit") && <a href="#visit">{c.contact}</a>}
        </nav>
        {book && (
          <a className="btn small" href={book} rel="noopener" target="_blank" aria-label={c.request}>
            <WhatsApp /> <span>{c.request}</span>
          </a>
        )}
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p className="lede">{ctx.text("hero.subtitle")}</p>}
            <div className="picker">
              <p className="picker-title">{c.need}</p>
              <nav className="chips" aria-label={c.jump}>
                {ctx.sections.map((s) => (
                  <a key={s.id} href={`#${s.anchor}`}>
                    {s.name}
                  </a>
                ))}
              </nav>
              {book && (
                <a className="btn wide" href={book} rel="noopener" target="_blank">
                  <WhatsApp /> {c.request}
                </a>
              )}
            </div>
          </div>
          {hero && (
            <div className="hero-art">
              <div className="hero-image">
                <Picture src={hero} sizes="(min-width: 760px) 45vw, 100vw" priority />
              </div>
              {ctx.today && (
                <p className="sticker">
                  <Clock /> {ctx.today}
                </p>
              )}
            </div>
          )}
        </section>

        {ctx.on("highlights") && badges.length > 0 && (
          <ul className="plain badges" data-section="highlights">
            {badges.map((b) => (
              <li key={b.title}>
                <Shield />
                <span>
                  <strong>{b.title}</strong>
                  {b.text && <small>{b.text}</small>}
                </span>
              </li>
            ))}
          </ul>
        )}

        <section id="menu" className="services" data-section="menu" aria-labelledby="services-title">
          <h2 id="services-title" className="title">
            {ctx.text("services.title") || c.services}
          </h2>
          {ctx.sections.map((section) => (
            <section key={section.id} id={section.anchor} className="group" aria-labelledby={`${section.anchor}-h`}>
              <h3 id={`${section.anchor}-h`}>{section.name}</h3>
              <ul className="plain cards">
                {section.products.map((item) => (
                  <li key={item.id} className={cx("card", !item.isAvailable && "out")}>
                    <button type="button" className="card-main" data-item-id={item.id}>
                      <span className="card-pic">
                        <ProductPicture item={item} sizes="(min-width: 760px) 30vw, 90vw" />
                        {item.labelText && <span className="tag">{item.labelText}</span>}
                      </span>
                      <span className="card-name">{item.name}</span>
                      {item.description && <span className="card-desc">{item.description}</span>}
                    </button>
                    <div className="card-foot">
                      <span className="card-price">
                        {from && <small>{c.from} </small>}
                        {item.priceText}
                      </span>
                      {item.isAvailable ? (
                        book && (
                          <a className="ask" href={bookLink(ctx, item.name) ?? book} rel="noopener" target="_blank" aria-label={`${c.ask}: ${item.name}`}>
                            {c.ask}
                          </a>
                        )
                      ) : (
                        <span className="tag tag-out">{ctx.t.unavailable}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {ctx.on("areas") && areas.length > 0 && (
          <section className="areas" data-section="areas" aria-labelledby="areas-title">
            <h2 id="areas-title">
              <Pin /> {c.areas}
            </h2>
            <ul className="plain area-list">
              {areas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        )}

        {ctx.on("steps") && how.length > 0 && (
          <section id="how" className="how" data-section="steps" aria-labelledby="how-title">
            <h2 id="how-title" className="title">
              {ctx.text("steps.title") || c.how}
            </h2>
            <ol className="plain steps">
              {how.map((s, i) => (
                <li key={s.title}>
                  <span className="step-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{s.title}</h3>
                  {s.text && <p>{s.text}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {ctx.on("reviews") && ctx.reviews.length > 0 && (
          <section className="reviews" data-section="reviews" aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="title">
              {c.reviews}
            </h2>
            <ul className="plain review-list">
              {ctx.reviews.slice(0, 3).map((r) => (
                <li key={r.quote}>
                  <figure>
                    <p className="stars" aria-hidden="true">
                      ★★★★★
                    </p>
                    <blockquote>{r.quote}</blockquote>
                    {r.name && <figcaption>{r.name}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}

        {ctx.on("faq") && questions.length > 0 && (
          <section id="faq" className="faq" data-section="faq" aria-labelledby="faq-title">
            <h2 id="faq-title" className="title">
              {c.faq}
            </h2>
            <div className="faq-list">
              {questions.map((q) => (
                <details key={q.q}>
                  <summary>{q.q}</summary>
                  <p>{q.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <h2 id="visit-title" className="title">
              {c.contact}
            </h2>
            <div className="visit-grid">
              <div className="panel">
                <ContactList ctx={ctx} />
              </div>
              {hasHours(ctx.hours) && (
                <div className="panel">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <Credits ctx={ctx} />
      </footer>
      {book && (
        <div className="bar">
          {ctx.today && <span className="bar-today">{ctx.today}</span>}
          <a className="btn" href={book} rel="noopener" target="_blank">
            <WhatsApp /> {c.request}
          </a>
        </div>
      )}
      <ProductSheet ctx={ctx} services />
    </div>
  );
}
