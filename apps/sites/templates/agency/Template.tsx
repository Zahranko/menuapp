import { flag } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Mail, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { bookLink, faqs, highlights, steps } from "../_kit/services";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { services: "Services", work: "Selected work", process: "Process", faq: "Questions", contact: "Contact", start: "Start a project", from: "From", reviews: "Clients on working with us", talk: "Let's talk", email: "Email us", hours: "Studio hours", reach: "Reach us", menu: "Main menu", count: "services" },
  ar: { services: "الخدمات", work: "من أعمالنا", process: "طريقة العمل", faq: "أسئلة", contact: "تواصل", start: "ابدأ مشروعك", from: "يبدأ من", reviews: "ماذا يقول عملاؤنا", talk: "لنتحدث", email: "راسلنا", hours: "ساعات الاستوديو", reach: "تواصل معنا", menu: "القائمة الرئيسية", count: "خدمات" },
};

const PALETTES = {
  ink: { bg: "#0B0B0C", surf: "#161618", ink: "#F3F2EE", muted: "#A4A39E", line: "#2A2A2E" },
  cobalt: { bg: "#0C1230", surf: "#141B40", ink: "#F1F3FF", muted: "#A9B0D6", line: "#26306A" },
  paper: { bg: "#F2F0EA", surf: "#FFFFFF", ink: "#121212", muted: "#5C5A55", line: "#D9D5CB" },
  plum: { bg: "#1B0F1F", surf: "#26162B", ink: "#F7EEF6", muted: "#BFA9BD", line: "#3C2642" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Template 019 "Agency": a bold, dark site for a creative studio or freelancer. Numbered services, work, process, a big contact call. */
export default function AgencyTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const hero = ctx.image("hero.image");
  const book = bookLink(ctx);
  const from = flag(site.settings, "prices.from", true);
  const stats = highlights(ctx);
  const process = steps(ctx);
  const questions = faqs(ctx);
  const names = ctx.sections.flatMap((s) => s.products.map((p) => p.name));
  // Numbering runs across groups: 01, 02 in the first group, 03 in the next, and so on.
  const offsets = ctx.sections.map((_, i) => ctx.sections.slice(0, i).reduce((n, s) => n + s.products.length, 0));

  return (
    <div data-template="agency" className={cx("t-agency", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["bold", "grotesk", "modern", "condensed"], defaultAccent: "#D7FF3A", radius: { rounded: "22px", sharp: "0px" } })}>
      <TemplateStyles id="agency" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        <nav aria-label={c.menu}>
          <a href="#menu">{c.services}</a>
          {ctx.on("work") && ctx.gallery.length > 0 && <a href="#work">{c.work}</a>}
          {ctx.on("steps") && process.length > 0 && <a href="#process">{c.process}</a>}
          <a href="#contact">{c.contact}</a>
        </nav>
        <a className="pill" href="#contact">
          {c.start}
        </a>
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          {ctx.text("hero.eyebrow") && <p className="eyebrow">{ctx.text("hero.eyebrow")}</p>}
          <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
          <div className="hero-foot">
            {ctx.text("hero.subtitle") && <p className="lede">{ctx.text("hero.subtitle")}</p>}
            <a className="round" href="#menu" aria-label={c.services}>
              <Arrow />
            </a>
          </div>
          {hero && (
            <div className="hero-image">
              <Picture src={hero} sizes="100vw" priority />
            </div>
          )}
        </section>

        {ctx.on("marquee") && names.length > 0 && (
          <div className="marquee" data-section="marquee" aria-hidden="true">
            <div className="track">
              {[0, 1].map((copyNo) => (
                <span key={copyNo}>
                  {names.map((n) => (
                    <span key={n}>
                      {n} <i>✦</i>{" "}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        )}

        {ctx.on("highlights") && stats.length > 0 && (
          <ul className="plain stats" data-section="highlights">
            {stats.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                {s.text && <span>{s.text}</span>}
              </li>
            ))}
          </ul>
        )}

        <section id="menu" className="services" data-section="menu" aria-labelledby="services-title">
          <div className="section-head">
            <h2 id="services-title">{ctx.text("services.title") || c.services}</h2>
            <p>
              ({pad(names.length)}) {c.count}
            </p>
          </div>
          {ctx.sections.map((section, si) => (
            <section key={section.id} id={section.anchor} className="group" aria-labelledby={`${section.anchor}-h`}>
              <h3 id={`${section.anchor}-h`}>{section.name}</h3>
              <ul className="plain rows">
                {section.products.map((item, i) => (
                  <li key={item.id}>
                    <button type="button" className={cx("row", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="row-no">{pad(offsets[si] + i + 1)}</span>
                      <span className="row-main">
                        <span className="row-name">{item.name}</span>
                        {item.description && <span className="row-desc">{item.description}</span>}
                      </span>
                      <span className="row-side">
                        {item.labelText && <span className="tag">{item.labelText}</span>}
                        {!item.isAvailable && <span className="tag tag-out">{ctx.t.unavailable}</span>}
                        <span className="row-price">
                          {from && <small>{c.from} </small>}
                          {item.priceText}
                        </span>
                      </span>
                      <span className="row-arrow" aria-hidden="true">
                        <Arrow />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {ctx.on("work") && ctx.gallery.length > 0 && (
          <section id="work" className="work" data-section="gallery" aria-labelledby="work-title">
            <h2 id="work-title">{ctx.text("work.title") || c.work}</h2>
            <ul className="plain work-grid">
              {ctx.gallery.slice(0, 6).map((src, i) => (
                <li key={src + i}>
                  <Picture src={src} sizes="(min-width: 760px) 50vw, 100vw" alt={ctx.t.photoOf.replace("{n}", String(i + 1)).replace("{name}", site.business.name)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {ctx.on("steps") && process.length > 0 && (
          <section id="process" className="process" data-section="steps" aria-labelledby="process-title">
            <h2 id="process-title">{ctx.text("steps.title") || c.process}</h2>
            <ol className="plain steps">
              {process.map((s, i) => (
                <li key={s.title}>
                  <span className="step-no" aria-hidden="true">
                    {pad(i + 1)}
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
            <h2 id="reviews-title" className="small-title">
              {c.reviews}
            </h2>
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

        {ctx.on("faq") && questions.length > 0 && (
          <section className="faq" data-section="faq" aria-labelledby="faq-title">
            <h2 id="faq-title" className="small-title">
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

        <section id="contact" className="contact-band" data-section="visit" aria-labelledby="contact-title">
          <p className="eyebrow">{ctx.text("cta.text") || c.reach}</p>
          <h2 id="contact-title">
            {book ? (
              <a href={book} rel="noopener" target="_blank">
                {c.talk} <Arrow />
              </a>
            ) : (
              c.talk
            )}
          </h2>
          <div className="contact-actions">
            {book && (
              <a className="pill big" href={book} rel="noopener" target="_blank">
                <WhatsApp /> {c.start}
              </a>
            )}
            {ctx.contact.email && (
              <a className="pill big ghost" href={ctx.contact.email}>
                <Mail /> {c.email}
              </a>
            )}
          </div>
          {ctx.on("visit") && (
            <div className="contact-grid">
              <div>
                <h3>{c.reach}</h3>
                <ContactList ctx={ctx} />
              </div>
              {hasHours(ctx.hours) && (
                <div>
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="foot" data-section="footer">
        <p className="foot-name" data-name={site.business.name} aria-hidden="true" />
        <Credits ctx={ctx} />
      </footer>
      <ProductSheet ctx={ctx} services />
    </div>
  );
}
