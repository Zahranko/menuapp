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
  en: { services: "Services", how: "How it works", faq: "Questions", visit: "Contact", book: "Book a visit", from: "From", reviews: "What patients say", hours: "Opening hours", contact: "Find us", ready: "Ready when you are", readyText: "Send us a message and we will find a time that suits you.", directions: "Directions", menu: "Main menu", jump: "Service groups" },
  ar: { services: "الخدمات", how: "كيف تتم الزيارة", faq: "أسئلة شائعة", visit: "تواصل", book: "احجز موعدًا", from: "يبدأ من", reviews: "ماذا يقول المراجعون", hours: "ساعات العمل", contact: "موقعنا", ready: "نحن جاهزون متى شئت", readyText: "أرسل لنا رسالة وسنجد موعدًا يناسبك.", directions: "الاتجاهات", menu: "القائمة الرئيسية", jump: "مجموعات الخدمات" },
};

const PALETTES = {
  fresh: { bg: "#F5F9FC", surf: "#FFFFFF", ink: "#0F1E2E", muted: "#4E5F72", line: "#DCE6F0", soft: "#E8F1FA" },
  mint: { bg: "#F2F8F6", surf: "#FFFFFF", ink: "#10241F", muted: "#4B635B", line: "#D5E7E0", soft: "#E1F1EB" },
  warm: { bg: "#FBF8F4", surf: "#FFFFFF", ink: "#221C16", muted: "#635A50", line: "#ECE3D7", soft: "#F4ECE1" },
  night: { bg: "#0F1722", surf: "#162130", ink: "#EEF3F8", muted: "#A6B3C2", line: "#25344A", soft: "#1B2A3D" },
};

function Check() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="10" fill="var(--acc)" />
      <path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="var(--acc-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Template 018 "Clinic": a calm, trustworthy website for a clinic or practice. Services, steps, FAQ and booking. */
export default function ClinicTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const hero = ctx.image("hero.image");
  const book = bookLink(ctx);
  const from = flag(site.settings, "prices.from", true);
  const points = highlights(ctx);
  const how = steps(ctx);
  const questions = faqs(ctx);

  return (
    <div data-template="clinic" className={cx("t-clinic", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["modern", "grotesk", "round"], defaultAccent: "#1F6FEB", radius: { rounded: "20px", sharp: "6px" } })}>
      <TemplateStyles id="clinic" />
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
          {ctx.on("visit") && <a href="#visit">{c.visit}</a>}
        </nav>
        {book && (
          <a className="btn small" href={book} rel="noopener" target="_blank">
            {c.book}
          </a>
        )}
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            {ctx.text("hero.eyebrow") && <p className="eyebrow">{ctx.text("hero.eyebrow")}</p>}
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p className="lede">{ctx.text("hero.subtitle")}</p>}
            <div className="actions">
              {book && (
                <a className="btn" href={book} rel="noopener" target="_blank">
                  <WhatsApp /> {c.book}
                </a>
              )}
              <a className="btn ghost" href="#menu">
                {c.services}
              </a>
            </div>
            {ctx.on("highlights") && points.length > 0 && (
              <ul className="plain checks" data-section="highlights">
                {points.map((p) => (
                  <li key={p.title}>
                    <Check />
                    <span>{p.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hero-visual">
            {hero && (
              <div className="hero-image">
                <Picture src={hero} sizes="(min-width: 760px) 45vw, 100vw" priority />
              </div>
            )}
            {(ctx.today || site.business.address) && (
              <div className="float-card">
                {ctx.today && (
                  <p>
                    <Clock /> {ctx.today}
                  </p>
                )}
                {site.business.address && (
                  <p>
                    <Pin /> {site.business.address}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section id="menu" className="services" data-section="menu" aria-labelledby="services-title">
          <div className="section-head">
            <p className="eyebrow">{c.services}</p>
            <h2 id="services-title">{ctx.text("services.title") || c.services}</h2>
          </div>
          {ctx.sections.length > 1 && (
            <nav className="segments" aria-label={c.jump}>
              {ctx.sections.map((s) => (
                <a key={s.id} href={`#${s.anchor}`}>
                  {s.name}
                </a>
              ))}
            </nav>
          )}
          {ctx.sections.map((section) => (
            <section key={section.id} id={section.anchor} className="group" aria-labelledby={`${section.anchor}-h`}>
              <h3 id={`${section.anchor}-h`}>{section.name}</h3>
              <ul className="plain cards">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("card", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="card-icon">
                        <ProductPicture item={item} sizes="64px" />
                      </span>
                      <span className="card-name">{item.name}</span>
                      {item.description && <span className="card-desc">{item.description}</span>}
                      <span className="card-foot">
                        <span className="card-price">
                          {from && <small>{c.from} </small>}
                          {item.priceText}
                        </span>
                        {item.labelText && <span className="tag">{item.labelText}</span>}
                        {!item.isAvailable && <span className="tag tag-out">{ctx.t.unavailable}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {ctx.on("steps") && how.length > 0 && (
          <section id="how" className="how" data-section="steps" aria-labelledby="how-title">
            <h2 id="how-title">{ctx.text("steps.title") || c.how}</h2>
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
            <h2 id="reviews-title">{c.reviews}</h2>
            <div className="review-grid">
              {ctx.reviews.slice(0, 3).map((r) => (
                <figure key={r.quote}>
                  <blockquote>{r.quote}</blockquote>
                  {r.name && <figcaption>{r.name}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {ctx.on("faq") && questions.length > 0 && (
          <section id="faq" className="faq" data-section="faq" aria-labelledby="faq-title">
            <h2 id="faq-title">{c.faq}</h2>
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
            <div className="cta">
              <h2 id="visit-title">{c.ready}</h2>
              <p>{c.readyText}</p>
              <div className="actions">
                {book && (
                  <a className="btn light" href={book} rel="noopener" target="_blank">
                    <WhatsApp /> {c.book}
                  </a>
                )}
                {ctx.contact.maps && (
                  <a className="btn ghost light-ghost" href={ctx.contact.maps} rel="noopener" target="_blank">
                    {c.directions}
                  </a>
                )}
              </div>
            </div>
            <div className="visit-grid">
              {hasHours(ctx.hours) && (
                <div className="panel">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              <div className="panel">
                <h3>{c.contact}</h3>
                <ContactList ctx={ctx} />
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <Credits ctx={ctx} />
      </footer>
      <ProductSheet ctx={ctx} services />
    </div>
  );
}
