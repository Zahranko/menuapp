import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { menu: "Menu", jump: "Menu sections", story: "From our oven", visit: "Come hungry", hours: "Hours", order: "Order on WhatsApp", see: "See the menu" },
  ar: { menu: "القائمة", jump: "أقسام القائمة", story: "من فرننا", visit: "تعالوا جائعين", hours: "ساعات العمل", order: "اطلب عبر واتساب", see: "شاهد القائمة" },
};

const PALETTES = {
  napoli: { bg: "#FFF8EE", surf: "#FFFFFF", ink: "#2B1B14", muted: "#6B5649", line: "#EED9C4", band: "#FBE6D8" },
  basil: { bg: "#F5F7EE", surf: "#FFFFFF", ink: "#1E2518", muted: "#56604B", line: "#DCE3CB", band: "#E2ECD3" },
  crust: { bg: "#F8EEDF", surf: "#FFFBF4", ink: "#2E1F12", muted: "#6A5440", line: "#E6D2B5", band: "#F0DCC0" },
  night: { bg: "#191513", surf: "#231D1A", ink: "#F6EDE3", muted: "#B9AA9C", line: "#3A302A", band: "#2A211D" },
};

function Stamp({ text }: { text: string }) {
  return (
    <svg className="stamp" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <path id="stamp-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="var(--acc)" />
      <circle cx="60" cy="60" r="30" fill="none" stroke="var(--acc-ink)" strokeWidth="1.5" strokeDasharray="3 4" />
      <path d="M48 70c4-14 8-22 12-26 4 4 8 12 12 26M52 70h16" fill="none" stroke="var(--acc-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text fill="var(--acc-ink)" fontSize="11.5" fontWeight="800" letterSpacing="2.4">
        <textPath href="#stamp-ring">{text}</textPath>
      </text>
    </svg>
  );
}

/** Template 011 "Pizzeria": a wood-fired pizza place. Round photo cutouts on colored bands, one band per category. */
export default function PizzeriaTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const star = ctx.picks[0];
  const story = ctx.on("story") && ctx.text("story.text");
  const stamp = ctx.text("stamp");

  return (
    <div data-template="pizzeria" className={cx("t-pizza", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["classic", "bold", "hand"], defaultAccent: "#C8102E" })}>
      <TemplateStyles id="pizzeria" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        {ctx.today && <span className="head-today">{ctx.today}</span>}
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            <a className="cta" href="#menu">
              {c.see}
            </a>
          </div>
          {star && (
            <button type="button" className="hero-pie" data-item-id={star.id} aria-label={`${star.name}, ${star.priceText}`}>
              <span className="pie">
                <ProductPicture item={star} sizes="(min-width: 760px) 420px, 80vw" />
              </span>
              {stamp && <Stamp text={`${stamp} · ${stamp} · `.toUpperCase()} />}
            </button>
          )}
        </section>

        <section id="menu" className="menu" data-section="menu" aria-label={c.menu}>
          {ctx.sections.length > 1 && (
            <nav className="tabs" aria-label={c.jump}>
              {ctx.sections.map((s) => (
                <a key={s.id} href={`#${s.anchor}`}>
                  {s.name}
                </a>
              ))}
            </nav>
          )}
          {ctx.sections.map((section, si) => (
            <section key={section.id} id={section.anchor} className={cx("band", si % 2 === 0 && "tinted")} aria-labelledby={`${section.anchor}-h`}>
              <h2 id={`${section.anchor}-h`}>{section.name}</h2>
              <ul className="plain pies">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("slice", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="slice-photo">
                        <ProductPicture item={item} sizes="160px" />
                      </span>
                      <span className="slice-name">{item.name}</span>
                      {item.description && <span className="slice-desc">{item.description}</span>}
                      {(item.labelText || !item.isAvailable) && (
                        <span className="tags">
                          {item.labelText && <span className="tag">{item.labelText}</span>}
                          {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                        </span>
                      )}
                      <span className="slice-price">{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {story && (
          <section id="story" className="story" data-section="story" aria-labelledby="story-title">
            <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
            <p>{story}</p>
          </section>
        )}

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <h2 id="visit-title">{c.visit}</h2>
            <div className="visit-grid">
              {hasHours(ctx.hours) && (
                <div className="visit-card">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              <div className="visit-card">
                <h3>{ctx.t.findUs}</h3>
                <ContactList ctx={ctx} />
                {ctx.contact.whatsapp && (
                  <a className="cta" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                    <WhatsApp /> {c.order}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <Credits ctx={ctx} />
      </footer>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
