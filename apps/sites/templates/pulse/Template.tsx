import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Clock, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { bookLink, faqs, highlights, steps } from "../_kit/services";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { plans: "Plans and classes", join: "Join now", popular: "Most popular", choose: "Choose", first: "Your first week", faq: "Questions", reviews: "Members say", hours: "Opening hours", contact: "Find us", ready: "Your first class is on us", menu: "Main menu", jump: "Plans and classes", photos: "Inside the gym", visit: "Visit" },
  ar: { plans: "الاشتراكات والحصص", join: "اشترك الآن", popular: "الأكثر طلبًا", choose: "اختر", first: "أسبوعك الأول", faq: "أسئلة", reviews: "ماذا يقول الأعضاء", hours: "ساعات العمل", contact: "موقعنا", ready: "حصتك الأولى علينا", menu: "القائمة الرئيسية", jump: "الاشتراكات والحصص", photos: "داخل النادي", visit: "زورونا" },
};

const PALETTES = {
  carbon: { bg: "#0E0E0E", surf: "#1A1A1A", ink: "#F5F5F0", muted: "#A8A8A0", line: "#2C2C2C", deep: "#000000" },
  chalk: { bg: "#F4F4F0", surf: "#FFFFFF", ink: "#111111", muted: "#5B5B55", line: "#DEDED6", deep: "#111111" },
  volt: { bg: "#0B1410", surf: "#13211A", ink: "#EEF7F1", muted: "#9FB5A8", line: "#22372C", deep: "#050B08" },
  steel: { bg: "#10151C", surf: "#18202A", ink: "#EEF2F6", muted: "#A0ABB8", line: "#28323F", deep: "#06090D" },
};

/** Template 020 "Pulse": a high-energy gym or studio site. Slanted hero, pricing cards with a "most popular" ribbon, class list, join band. */
export default function PulseTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const hero = ctx.image("hero.image");
  const join = bookLink(ctx);
  const points = highlights(ctx);
  const week = steps(ctx);
  const questions = faqs(ctx);
  const [plans, ...rest] = ctx.sections;
  // One plan gets the ribbon: the first featured plan that can be joined.
  const popular = plans?.products.find((p) => p.isFeatured && p.isAvailable)?.id;

  return (
    <div data-template="pulse" className={cx("t-pulse", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["condensed", "bold", "grotesk"], defaultAccent: "#FF4D1C", radius: { rounded: "16px", sharp: "0px" } })}>
      <TemplateStyles id="pulse" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        <nav aria-label={c.menu}>
          <a href="#menu">{c.plans}</a>
          {ctx.on("steps") && week.length > 0 && <a href="#week">{c.first}</a>}
          {ctx.on("visit") && <a href="#visit">{c.visit}</a>}
        </nav>
        {join && (
          <a className="btn small" href={join} rel="noopener" target="_blank">
            {c.join}
          </a>
        )}
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          {hero && (
            <div className="hero-image">
              <Picture src={hero} sizes="100vw" priority />
            </div>
          )}
          <div className="hero-text">
            {ctx.today && (
              <p className="live">
                <Clock /> {ctx.today}
              </p>
            )}
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p className="lede">{ctx.text("hero.subtitle")}</p>}
            <div className="actions">
              {join && (
                <a className="btn" href={join} rel="noopener" target="_blank">
                  <WhatsApp /> {c.join}
                </a>
              )}
              <a className="btn outline" href="#menu">
                {c.plans}
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

        <section id="menu" className="plans" data-section="menu" aria-labelledby="plans-title">
          <h2 id="plans-title" className="big-title">
            {ctx.text("services.title") || c.plans}
          </h2>
          {ctx.sections.length > 1 && (
            <nav className="jump" aria-label={c.jump}>
              {ctx.sections.map((s) => (
                <a key={s.id} href={`#${s.anchor}`}>
                  {s.name}
                </a>
              ))}
            </nav>
          )}
          {plans && (
            <section id={plans.anchor} className="group" aria-labelledby={`${plans.anchor}-h`}>
              <h3 id={`${plans.anchor}-h`} className="group-title">
                {plans.name}
              </h3>
              <ul className="plain price-cards">
                {plans.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("price-card", item.id === popular && "hot", !item.isAvailable && "out")} data-item-id={item.id}>
                      {item.id === popular && <span className="ribbon">{c.popular}</span>}
                      <span className="pc-name">{item.name}</span>
                      <span className="pc-price">{item.priceText}</span>
                      {item.description && <span className="pc-desc">{item.description}</span>}
                      <span className="pc-foot">
                        {item.labelText && <span className="tag">{item.labelText}</span>}
                        {!item.isAvailable && <span className="tag tag-out">{ctx.t.unavailable}</span>}
                        <span className="pc-cta">
                          {c.choose} <Arrow />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {rest.map((section) => (
            <section key={section.id} id={section.anchor} className="group" aria-labelledby={`${section.anchor}-h`}>
              <h3 id={`${section.anchor}-h`} className="group-title">
                {section.name}
              </h3>
              <ul className="plain classes">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("class-row", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="class-pic">
                        <ProductPicture item={item} sizes="56px" />
                      </span>
                      <span className="class-text">
                        <span className="class-name">{item.name}</span>
                        {item.description && <span className="class-desc">{item.description}</span>}
                      </span>
                      <span className="class-side">
                        <span className="class-price">{item.priceText}</span>
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

        {ctx.on("steps") && week.length > 0 && (
          <section id="week" className="week" data-section="steps" aria-labelledby="week-title">
            <h2 id="week-title" className="big-title">
              {ctx.text("steps.title") || c.first}
            </h2>
            <ol className="plain steps">
              {week.map((s, i) => (
                <li key={s.title}>
                  <span className="step-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{s.title}</h3>
                    {s.text && <p>{s.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {ctx.on("gallery") && ctx.gallery.length > 0 && (
          <section className="photos" data-section="gallery" aria-labelledby="photos-title">
            <h2 id="photos-title" className="sr-only">
              {c.photos}
            </h2>
            <ul className="plain strip" tabIndex={0} aria-label={c.photos}>
              {ctx.gallery.slice(0, 6).map((src, i) => (
                <li key={src + i}>
                  <Picture src={src} sizes="(min-width: 760px) 30vw, 70vw" alt={ctx.t.photoOf.replace("{n}", String(i + 1)).replace("{name}", site.business.name)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {ctx.on("reviews") && ctx.reviews.length > 0 && (
          <section className="reviews" data-section="reviews" aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="big-title">
              {c.reviews}
            </h2>
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
          <section className="faq" data-section="faq" aria-labelledby="faq-title">
            <h2 id="faq-title" className="big-title">
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

        <section className="join" data-section="join" aria-labelledby="join-title">
          <h2 id="join-title">{ctx.text("cta.title") || c.ready}</h2>
          {join && (
            <a className="btn dark" href={join} rel="noopener" target="_blank">
              <WhatsApp /> {c.join}
            </a>
          )}
        </section>

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <h2 id="visit-title" className="sr-only">
              {c.visit}
            </h2>
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
