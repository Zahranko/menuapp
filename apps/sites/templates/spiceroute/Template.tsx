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
  en: { welcome: "Ahlan wa sahlan", menu: "Our table", jump: "Menu sections", story: "Our story", visit: "Visit us", hours: "Hours", reserve: "Reserve on WhatsApp" },
  ar: { welcome: "أهلًا وسهلًا", menu: "سفرتنا", jump: "أقسام القائمة", story: "حكايتنا", visit: "زورونا", hours: "ساعات العمل", reserve: "احجز عبر واتساب" },
};

const PALETTES = {
  saffron: { bg: "#FBF4E6", surf: "#FFFBF2", ink: "#2A1E12", muted: "#6B5A45", line: "#E8D7B8", tile: "#F1E2C3" },
  rose: { bg: "#FBF0EB", surf: "#FFF9F6", ink: "#2C1A17", muted: "#6D534D", line: "#EFD3C8", tile: "#F3DCD2" },
  olive: { bg: "#F1F0E2", surf: "#FAF9F0", ink: "#22251A", muted: "#5D604E", line: "#DAD8BF", tile: "#E3E1C8" },
  indigo: { bg: "#141A2E", surf: "#1B2340", ink: "#F3EDE0", muted: "#B3AEA2", line: "#2E3858", tile: "#1F2948" },
};

const STAR = "12,2 14.76,5.35 19.07,4.93 18.65,9.24 22,12 18.65,14.76 19.07,19.07 14.76,18.65 12,22 9.24,18.65 4.93,19.07 5.35,14.76 2,12 5.35,9.24 4.93,4.93 9.24,5.35";

/** A band of eight-point stars, drawn with an SVG pattern so it follows the theme colors. */
function StarBand({ id }: { id: string }) {
  return (
    <svg className="band" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <polygon points={STAR} fill="none" stroke="var(--acc-text)" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="2" fill="var(--acc-text)" />
          <circle cx="0" cy="0" r="1.4" fill="var(--acc-text)" />
          <circle cx="24" cy="24" r="1.4" fill="var(--acc-text)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function Star({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polygon points={STAR} fill="currentColor" />
    </svg>
  );
}

/** Template 015 "Spice Route": a Middle Eastern restaurant with geometric star borders, an arched window and centered courses. */
export default function SpiceRouteTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const pattern = flag(site.settings, "pattern", true);
  const hero = ctx.image("hero.image");
  const story = ctx.on("story") && ctx.text("story.text");

  return (
    <div data-template="spiceroute" className={cx("t-spice", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["naskh", "classic", "elegant"], defaultAccent: "#1F5F5B" })}>
      <TemplateStyles id="spiceroute" />
      <TopBars ctx={ctx} />
      {pattern && <StarBand id="stars-top" />}
      <header className="head" data-section="header">
        <Logo ctx={ctx} className="medallion" />
        <p className="welcome">{ctx.text("hero.eyebrow") || c.welcome}</p>
        <h1>{site.business.name}</h1>
        {ctx.text("hero.title") && <p className="tagline">{ctx.text("hero.title")}</p>}
        {ctx.today && <p className="today">{ctx.today}</p>}
      </header>

      <main>
        {hero && (
          <div className="window" data-section="hero">
            <Picture src={hero} sizes="(min-width: 760px) 560px, 90vw" priority />
          </div>
        )}

        <section id="menu" className="menu" data-section="menu" aria-labelledby="menu-title">
          <h2 id="menu-title" className="menu-title">
            <Star className="star" />
            <span>{c.menu}</span>
            <Star className="star" />
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
          {ctx.sections.map((section) => (
            <section key={section.id} id={section.anchor} className="course" aria-labelledby={`${section.anchor}-h`}>
              <h3 id={`${section.anchor}-h`} className="course-title">
                <span>{section.name}</span>
              </h3>
              <ul className="plain dishes">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("dish", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="dish-photo">
                        <ProductPicture item={item} sizes="96px" />
                      </span>
                      <span className="dish-name">{item.name}</span>
                      {item.description && <span className="dish-desc">{item.description}</span>}
                      {(item.labelText || !item.isAvailable) && (
                        <span className="tags">
                          {item.labelText && <span className="tag">{item.labelText}</span>}
                          {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                        </span>
                      )}
                      <span className="dish-price">{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {story && (
          <section id="story" className="story" data-section="story" aria-labelledby="story-title">
            <Star className="story-star" />
            <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
            <p>{story}</p>
          </section>
        )}

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <div className="frame">
              <h2 id="visit-title">{c.visit}</h2>
              <div className="visit-grid">
                {hasHours(ctx.hours) && (
                  <div>
                    <h3>{c.hours}</h3>
                    <HoursList ctx={ctx} />
                  </div>
                )}
                <div>
                  <h3>{ctx.t.findUs}</h3>
                  <ContactList ctx={ctx} />
                  {ctx.contact.whatsapp && (
                    <a className="reserve" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                      <WhatsApp /> {c.reserve}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <Credits ctx={ctx} />
      </footer>
      {pattern && <StarBand id="stars-bottom" />}
      <ProductSheet ctx={ctx} />
    </div>
  );
}
