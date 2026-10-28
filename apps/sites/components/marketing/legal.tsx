import { brand } from "@/lib/brand";
import { copy, fill, formatDate, PRIVACY_UPDATED, type Lang } from "@/lib/marketing/copy";
import { Arrow, Check } from "./art";

/** Turns the support email inside a sentence into a mailto link. */
function WithEmail({ text }: { text: string }) {
  const parts = text.split(brand.supportEmail);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <a href={`mailto:${brand.supportEmail}`} dir="ltr">
              {brand.supportEmail}
            </a>
          )}
        </span>
      ))}
    </>
  );
}

/** The privacy policy at "/privacy" and "/ar/privacy". */
export function PrivacyPage({ lang }: { lang: Lang }) {
  const t = copy(lang).privacy;
  const f = (s: string) => fill(s, lang);
  const date = formatDate(PRIVACY_UPDATED, lang);

  return (
    <article className="mk-doc">
      <header className="mk-doc-head">
        <div className="mk-wrap">
          <p className="mk-kicker">{t.kicker}</p>
          <h1 className="mk-display mk-doc-title">{t.title}</h1>
          <p className="mk-doc-date">
            <time dateTime={PRIVACY_UPDATED}>{t.updated.replace("{date}", date)}</time>
          </p>
        </div>
      </header>
      <div className="mk-wrap mk-doc-grid">
        <nav className="mk-toc" aria-labelledby="toc-title">
          <p id="toc-title" className="mk-toc-title">
            {t.contents}
          </p>
          <ol>
            {t.sections.map((s, i) => (
              <li key={s.title}>
                <a href={`#s${i + 1}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mk-prose">
          <p className="mk-doc-intro">{f(t.intro)}</p>
          {t.sections.map((s, i) => (
            <section key={s.title} id={`s${i + 1}`} aria-labelledby={`s${i + 1}-title`}>
              <h2 id={`s${i + 1}-title`}>
                <span className="mk-doc-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </h2>
              {s.body.map((p) => (
                <p key={p}>
                  <WithEmail text={f(p)} />
                </p>
              ))}
              {s.list && (
                <ul>
                  {s.list.map((item) => (
                    <li key={item}>{f(item)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

/** The contact page at "/contact" and "/ar/contact". */
export function ContactPage({ lang }: { lang: Lang }) {
  const t = copy(lang).contact;
  const f = (s: string) => fill(s, lang);

  return (
    <div className="mk-contact">
      <div className="mk-wrap mk-contact-grid">
        <div className="mk-contact-copy">
          <p className="mk-kicker">{t.kicker}</p>
          <h1 className="mk-display mk-doc-title">{t.title}</h1>
          <p className="mk-lead">{t.lead}</p>
        </div>
        <a className="mk-mail" href={`mailto:${brand.supportEmail}`}>
          <span className="mk-mail-label">{t.emailLabel}</span>
          <span className="mk-mail-address" dir="ltr">
            {brand.supportEmail}
          </span>
          <span className="mk-mail-go" aria-hidden="true">
            <Arrow />
          </span>
          <span className="mk-mail-reply">{t.reply}</span>
        </a>
        <section className="mk-card" aria-labelledby="tips-title">
          <h2 id="tips-title">{t.tipsTitle}</h2>
          <ul className="mk-ticks">
            {t.tips.map((tip) => (
              <li key={tip}>
                <Check className="mk-plan-check" />
                {f(tip)}
              </li>
            ))}
          </ul>
        </section>
        <section className="mk-card mk-card-dark" aria-labelledby="topics-title">
          <h2 id="topics-title">{t.topicsTitle}</h2>
          <ul className="mk-topics">
            {t.topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
