import type { TemplateProps } from "@/lib/types";
import { flag } from "@/lib/settings";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { see: "Browse the menu", jump: "Menu sections", story: "Grown with love", visit: "Visit us", hours: "Hours", order: "Order on WhatsApp", menu: "Menu" },
  ar: { see: "تصفح القائمة", jump: "أقسام القائمة", story: "مزروع بحب", visit: "زورونا", hours: "ساعات العمل", order: "اطلب عبر واتساب", menu: "القائمة" },
};

const PALETTES = {
  sage: { bg: "#F2F5EC", surf: "#FFFFFF", ink: "#1C2A1F", muted: "#536154", line: "#DCE4D2", blob: "#DDE9D0", blob2: "#F6E7CF" },
  blush: { bg: "#FBF2EE", surf: "#FFFFFF", ink: "#2C1D1A", muted: "#6A5450", line: "#F0DBD3", blob: "#F6D9CF", blob2: "#E2EAD5" },
  sunny: { bg: "#FFF9EA", surf: "#FFFFFF", ink: "#2A2414", muted: "#665C45", line: "#F1E3BD", blob: "#FBE7A9", blob2: "#D9EBCF" },
  forest: { bg: "#13211A", surf: "#1B2C23", ink: "#EEF3EA", muted: "#A9BBAD", line: "#2C4134", blob: "#22382B", blob2: "#2F3A26" },
};

function Leaf({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path d="M14 106C14 50 50 14 106 14c0 56-36 92-92 92z" fill="currentColor" />
      <path d="M14 106L82 38M40 80l-4-22M56 64l-2-22M40 80l22-2M56 64l22-4" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Wave() {
  return (
    <svg className="wave" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 22c100-22 200-22 300 0s200 22 300 0 200-22 300 0 200 22 300 0v18H0z" fill="currentColor" />
    </svg>
  );
}

/** Template 013 "Garden": a brunch place with organic blob shapes, leaves and cards that put diet tags first. */
export default function GardenTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const leaves = flag(site.settings, "leaves", true);
  const hero = ctx.image("hero.image");
  const story = ctx.on("story") && ctx.text("story.text");

  return (
    <div data-template="garden" className={cx("t-garden", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["soft", "round", "elegant"], defaultAccent: "#3F7D4E" })}>
      <TemplateStyles id="garden" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        {ctx.today && <span className="pill">{ctx.today}</span>}
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          {leaves && <Leaf className="leaf leaf-a" />}
          <div className="hero-text">
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            <a className="button" href="#menu">
              {c.see}
            </a>
          </div>
          {hero && (
            <div className="hero-blob">
              <Picture src={hero} sizes="(min-width: 760px) 40vw, 90vw" priority />
            </div>
          )}
        </section>

        <section id="menu" className="menu" data-section="menu" aria-label={c.menu}>
          <Wave />
          <div className="menu-inner">
            {ctx.sections.length > 1 && (
              <nav className="chips" aria-label={c.jump}>
                {ctx.sections.map((s) => (
                  <a key={s.id} href={`#${s.anchor}`}>
                    {s.name}
                  </a>
                ))}
              </nav>
            )}
            {ctx.sections.map((section) => (
              <section key={section.id} id={section.anchor} className="group" aria-labelledby={`${section.anchor}-h`}>
                <h2 id={`${section.anchor}-h`}>
                  {leaves && <Leaf className="leaf-icon" />}
                  {section.name}
                </h2>
                <ul className="plain cards">
                  {section.products.map((item, i) => (
                    <li key={item.id}>
                      <button type="button" className={cx("card", !item.isAvailable && "out")} data-item-id={item.id}>
                        <span className={cx("card-blob", `shape-${i % 3}`)}>
                          <ProductPicture item={item} sizes="140px" />
                        </span>
                        <span className="card-text">
                          {(item.labelText || !item.isAvailable) && (
                            <span className="tags">
                              {item.labelText && <span className="tag">{item.labelText}</span>}
                              {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                            </span>
                          )}
                          <span className="card-name">{item.name}</span>
                          {item.description && <span className="card-desc">{item.description}</span>}
                          <span className="card-price">{item.priceText}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>

        {story && (
          <section id="story" className="story" data-section="story" aria-labelledby="story-title">
            {leaves && <Leaf className="leaf leaf-b" />}
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
                  <a className="button" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
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
