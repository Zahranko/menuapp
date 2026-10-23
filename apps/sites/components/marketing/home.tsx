import Image from "next/image";
import { LogoMark } from "@/components/brand/logo-mark";
import { brand } from "@/lib/brand";
import { copy, fill, type Lang } from "@/lib/marketing/copy";
import { Arrow, Check, Phone, QrArt, Sparkle } from "./art";
import { StoreButtons } from "./store-buttons";

/** The landing page at "/" and "/ar". */
export function HomePage({ lang }: { lang: Lang }) {
  const t = copy(lang);
  const f = (s: string) => fill(s, lang);
  const h = t.hero;
  const ft = t.features;

  return (
    <>
      <section className="mk-hero" aria-labelledby="hero-title">
        <div className="mk-wrap mk-hero-grid">
          <div className="mk-hero-copy">
            <p className="mk-eyebrow">
              <span className="mk-dot" aria-hidden="true" />
              {h.eyebrow}
            </p>
            <h1 id="hero-title" className="mk-display">
              {h.titleStart} <mark>{h.titleMark}</mark>
              {h.titleEnd}
            </h1>
            <p className="mk-lead">{h.lead}</p>
            <StoreButtons lang={lang} />
            <ul className="mk-proof">
              {h.proof.map((p) => (
                <li key={p}>
                  <Check className="mk-proof-icon" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="mk-hero-art">
            <div className="mk-stage" aria-hidden="true">
              <span className="mk-stage-sun" />
              <span className="mk-stage-ring" />
              <span className="mk-stage-ring mk-stage-ring-2" />
            </div>
            <figure className="mk-hero-phone mk-hero-phone-site">
              <Phone src={`/marketing/site-${lang}.webp`} alt={f(h.siteAlt)} sizes="(max-width: 900px) 46vw, 300px" priority />
              <figcaption className="mk-caption">{h.siteCaption}</figcaption>
            </figure>
            <figure className="mk-hero-phone mk-hero-phone-app">
              <Phone src={`/marketing/products-${lang}.webp`} alt={f(h.appAlt)} sizes="(max-width: 900px) 46vw, 300px" priority />
              <figcaption className="mk-caption">{f(h.appCaption)}</figcaption>
            </figure>
            <p className="mk-chip mk-chip-live" aria-hidden="true">
              <Check className="mk-chip-check" />
              {h.live}
            </p>
            <p className="mk-chip mk-chip-link" aria-hidden="true" dir="ltr">
              <span className="mk-chip-dot" />
              {f(h.link)}
            </p>
          </div>
        </div>
      </section>

      <div className="mk-ticker-clip" aria-hidden="true">
      <div className="mk-ticker">
        <div className="mk-ticker-track">
          {[0, 1].map((copyIndex) => (
            <ul key={copyIndex}>
              {t.ticker.map((word) => (
                <li key={word}>
                  {word}
                  <Sparkle className="mk-ticker-star" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      </div>

      <section id="how" className="mk-section" aria-labelledby="how-title">
        <div className="mk-wrap">
          <header className="mk-section-head">
            <p className="mk-kicker">{t.how.kicker}</p>
            <h2 id="how-title" className="mk-h2">
              {t.how.title}
            </h2>
          </header>
          <ol className="mk-steps">
            {t.how.steps.map((step, i) => (
              <li key={step.title} className="mk-step">
                <span className="mk-step-num" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{f(step.body)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="mk-section mk-section-tight" aria-labelledby="features-title">
        <div className="mk-wrap">
          <header className="mk-section-head">
            <p className="mk-kicker">{ft.kicker}</p>
            <h2 id="features-title" className="mk-h2">
              {ft.title}
            </h2>
          </header>
          <div className="mk-bento">
            <article className="mk-tile mk-tile-templates">
              <div className="mk-tile-copy">
                <h3 className="mk-templates-title">
                  <span className="mk-big-num">100</span>
                  <span>{ft.templatesWord}</span>
                </h3>
                <p>{ft.templates.body}</p>
              </div>
              <div className="mk-tile-shot">
                <Image src={`/marketing/templates-${lang}.webp`} alt={f(h.templatesAlt)} width={780} height={1688} sizes="(max-width: 900px) 70vw, 340px" />
              </div>
            </article>

            <article className="mk-tile mk-tile-ai">
              <Sparkle className="mk-tile-icon" />
              <h3>{ft.ai.title}</h3>
              <p>{ft.ai.body}</p>
              <p className="mk-ai-bar" aria-hidden="true">
                <span className="mk-ai-pulse" />
                {ft.aiSample}
              </p>
            </article>

            <article className="mk-tile mk-tile-lang">
              <p className="mk-lang-art" aria-hidden="true">
                <span lang={lang === "ar" ? "ar" : "en"}>{ft.langSample.a}</span>
                <span lang={lang === "ar" ? "en" : "ar"}>{ft.langSample.b}</span>
              </p>
              <h3>{ft.languages.title}</h3>
              <p>{ft.languages.body}</p>
            </article>

            <article className="mk-tile mk-tile-qr">
              <div className="mk-qr-card" aria-hidden="true">
                <QrArt className="mk-qr" />
                <LogoMark size={26} className="mk-qr-logo" />
              </div>
              <h3>{ft.qr.title}</h3>
              <p>{ft.qr.body}</p>
            </article>

            <article className="mk-tile mk-tile-domain">
              <div className="mk-url" aria-hidden="true" dir="ltr">
                <span className="mk-url-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mk-url-bar">
                  <svg viewBox="0 0 24 24" className="mk-url-lock">
                    <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  {ft.domainSample}
                </span>
              </div>
              <h3>{ft.domain.title}</h3>
              <p>{ft.domain.body}</p>
            </article>

            <article className="mk-tile mk-tile-edit">
              <ul className="mk-toggles" aria-hidden="true">
                <li>
                  <span>{ft.available}</span>
                  <span className="mk-toggle mk-toggle-on" />
                </li>
                <li>
                  <span>{ft.soldOut}</span>
                  <span className="mk-toggle" />
                </li>
              </ul>
              <h3>{ft.edit.title}</h3>
              <p>{ft.edit.body}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="plans" className="mk-section" aria-labelledby="plans-title">
        <div className="mk-wrap">
          <header className="mk-section-head mk-section-head-center">
            <p className="mk-kicker">{t.plans.kicker}</p>
            <h2 id="plans-title" className="mk-h2">
              {t.plans.title}
            </h2>
            <p className="mk-section-lead">{t.plans.lead}</p>
          </header>
          <div className="mk-plans">
            {t.plans.list.map((plan, i) => (
              <article key={plan.name} className={`mk-plan ${i === 1 ? "mk-plan-pro" : ""}`} data-plan={i === 1 ? "pro" : "basic"}>
                {i === 1 && <p className="mk-plan-tag">{t.plans.popular}</p>}
                <h3>{plan.name}</h3>
                <p className="mk-price">
                  <span className="mk-price-num">{plan.price}</span>
                  <span className="mk-price-per">{plan.per}</span>
                </p>
                <p className="mk-plan-note">{f(plan.note)}</p>
                <ul>
                  {plan.points.map((p) => (
                    <li key={p}>
                      <Check className="mk-plan-check" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="mk-section mk-section-cta" aria-labelledby="cta-title">
        <div className="mk-wrap">
          <div className="mk-cta">
            <LogoMark size={260} className="mk-cta-mark" />
            <div className="mk-cta-copy">
              <h2 id="cta-title" className="mk-display mk-cta-title">
                {t.cta.title}
              </h2>
              <p>{f(t.cta.body)}</p>
              <StoreButtons lang={lang} />
            </div>
            <a className="mk-cta-link" href={`mailto:${brand.supportEmail}`}>
              <span dir="ltr">{brand.supportEmail}</span>
              <Arrow />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
