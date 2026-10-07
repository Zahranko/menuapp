import type { TemplateProps } from "@/lib/types";
import { flag } from "@/lib/settings";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { menu: "Menu", story: "Our way", visit: "Visit", hours: "Hours", jump: "Menu sections" },
  ar: { menu: "القائمة", story: "طريقتنا", visit: "زورونا", hours: "ساعات العمل", jump: "أقسام القائمة" },
};

const PALETTES = {
  washi: { bg: "#F5F1E8", surf: "#FBF8F2", ink: "#1E1C19", muted: "#6A645B", line: "#DED6C7" },
  stone: { bg: "#ECEDEA", surf: "#F6F6F4", ink: "#1A1C1B", muted: "#5F6461", line: "#D3D6D2" },
  matcha: { bg: "#E9EEDF", surf: "#F4F7EE", ink: "#1C2318", muted: "#5A6650", line: "#CFD8C0" },
  ink: { bg: "#121212", surf: "#1A1A1A", ink: "#ECE8E0", muted: "#A39E95", line: "#2E2D2B" },
};

const pad = (n: number) => String(n).padStart(2, "0");

function Enso() {
  return (
    <svg className="enso" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <path d="M150 42C128 22 88 16 60 34 30 54 20 96 36 130c16 34 58 52 96 40 34-11 52-44 46-80-3-18-11-30-20-38" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
      <path d="M156 50c6 8 10 16 12 26" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

/** Template 009 "Zen": a quiet, minimal menu with big numerals, hairlines and small square photos. */
export default function ZenTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const photos = flag(site.settings, "photos", true);
  const story = ctx.on("story") && ctx.text("story.text");

  return (
    <div data-template="zen" className={cx("t-zen", !ctx.rtl && "vertical", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["elegant", "modern", "mono"], defaultAccent: "#B7282E", radius: { rounded: "4px", sharp: "0px" } })}>
      <TemplateStyles id="zen" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <a className="brand" href="#top">
          <Logo ctx={ctx} className="seal" />
          <span>{site.business.name}</span>
        </a>
        <nav aria-label={c.jump}>
          <a href="#menu">{c.menu}</a>
          {story && <a href="#story">{c.story}</a>}
          {ctx.on("visit") && <a href="#visit">{c.visit}</a>}
        </nav>
      </header>

      <main id="top">
        <section className="hero" data-section="hero" aria-labelledby="hero-title">
          <Enso />
          <div className="hero-text">
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            {ctx.today && <p className="today">{ctx.today}</p>}
          </div>
        </section>

        <section id="menu" className="menu" data-section="menu" aria-label={c.menu}>
          {ctx.sections.map((section, si) => (
            <section key={section.id} id={section.anchor} className="course" aria-labelledby={`${section.anchor}-h`}>
              <h2 id={`${section.anchor}-h`}>
                <span className="course-no">{pad(si + 1)}</span>
                <span className="course-name">{section.name}</span>
              </h2>
              <ol className="plain dishes">
                {section.products.map((item, i) => (
                  <li key={item.id}>
                    <button type="button" className={cx("dish", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="dish-no" aria-hidden="true">
                        {pad(i + 1)}
                      </span>
                      <span className="dish-text">
                        <span className="dish-name">{item.name}</span>
                        {item.description && <span className="dish-desc">{item.description}</span>}
                        {(item.labelText || !item.isAvailable) && (
                          <span className="tags">
                            {item.labelText && <span className="tag">{item.labelText}</span>}
                            {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                          </span>
                        )}
                      </span>
                      <span className="dish-price">{item.priceText}</span>
                      {photos && (
                        <span className="dish-photo">
                          <ProductPicture item={item} sizes="72px" />
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
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
                <div>
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              <div>
                <h3>{ctx.t.findUs}</h3>
                <ContactList ctx={ctx} />
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
