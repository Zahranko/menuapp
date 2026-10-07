import type { TemplateProps } from "@/lib/types";
import { choice, flag } from "@/lib/settings";
import { ContactList, Credits, HoursList, Logo, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { menu: "The menu", story: "Our kitchen", visit: "Visit us", hours: "Hours", contact: "Find us", order: "Order on WhatsApp", contents: "Menu sections" },
  ar: { menu: "القائمة", story: "مطبخنا", visit: "زورونا", hours: "ساعات العمل", contact: "موقعنا", order: "اطلب عبر واتساب", contents: "أقسام القائمة" },
};

const PALETTES = {
  linen: { bg: "#F3EEE3", surf: "#FBF8F1", ink: "#24201A", muted: "#6B6253", line: "#D9CFBD" },
  ivory: { bg: "#FFFDF7", surf: "#F6F1E4", ink: "#1C1A17", muted: "#66605A", line: "#E4DCCB" },
  slate: { bg: "#E8ECEE", surf: "#F5F7F8", ink: "#1D2529", muted: "#56636B", line: "#C9D1D6" },
  ink: { bg: "#16181D", surf: "#1E2128", ink: "#EEE9DF", muted: "#A8A398", line: "#3A3E47" },
};

function Flourish() {
  return (
    <svg className="flourish" width="120" height="14" viewBox="0 0 120 14" aria-hidden="true" focusable="false">
      <path d="M2 7h44M74 7h44" stroke="currentColor" strokeWidth="1" />
      <path d="M60 2l5 5-5 5-5-5z" fill="currentColor" />
      <circle cx="50" cy="7" r="1.6" fill="currentColor" />
      <circle cx="70" cy="7" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Template 002 "Linen List": a printed, text-only menu with dotted leaders. */
export default function LinenTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const ornaments = flag(site.settings, "ornaments", true);
  const twoColumns = choice(site.settings, "columns", ["one", "two"] as const, "two") === "two";
  const story = ctx.on("story") && ctx.text("story.text");
  const intro = ctx.on("intro") && ctx.text("hero.subtitle");
  const note = ctx.text("note");
  const links: [string, string][] = [["#menu", c.menu], ...(story ? [["#story", c.story] as [string, string]] : []), ...(ctx.on("visit") ? [["#visit", c.visit] as [string, string]] : [])];

  return (
    <div data-template="linen" className={cx("t-linen", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["classic", "elegant", "soft"], defaultAccent: "#8C2F39" })}>
      <TemplateStyles id="linen" />
      <TopBars ctx={ctx} />
      <div className="paper">
        <header className="masthead" data-section="header">
          <Logo ctx={ctx} />
          <h1>{site.business.name}</h1>
          {ctx.text("hero.title") && <p className="tagline">{ctx.text("hero.title")}</p>}
          {ornaments && <Flourish />}
          <nav aria-label={ctx.t.menu}>
            {links.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
        </header>

        <main>
          {intro && (
            <p className="intro" data-section="intro">
              {intro}
            </p>
          )}

          <section id="menu" className="menu" data-section="menu" aria-labelledby="menu-title">
            <h2 id="menu-title" className="menu-title">
              {c.menu}
            </h2>
            {ctx.sections.length > 1 && (
              <nav className="contents" aria-label={c.contents}>
                {ctx.sections.map((s) => (
                  <a key={s.id} href={`#${s.anchor}`}>
                    {s.name}
                  </a>
                ))}
              </nav>
            )}
            <div className={cx("courses", twoColumns && "two")}>
              {ctx.sections.map((section) => (
                <section key={section.id} id={section.anchor} className="course" aria-labelledby={`${section.anchor}-h`}>
                  <h3 id={`${section.anchor}-h`}>{section.name}</h3>
                  <ul className="plain">
                    {section.products.map((item) => (
                      <li key={item.id}>
                        <button type="button" className={cx("dish", !item.isAvailable && "out")} data-item-id={item.id}>
                          <span className="dish-line">
                            <span className="dish-name">{item.name}</span>
                            <span className="leader" aria-hidden="true" />
                            <span className="price">{item.priceText}</span>
                          </span>
                          {(item.description || item.labelText || !item.isAvailable) && (
                            <span className="dish-desc">
                              {item.labelText && <span className="tag">{item.labelText}</span>}
                              {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                              {item.description}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {note && <p className="note">{note}</p>}
          </section>

          {story && (
            <section id="story" className="story" data-section="story" aria-labelledby="story-title">
              {ornaments && <Flourish />}
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
                  <h3>{c.contact}</h3>
                  <ContactList ctx={ctx} />
                  <div className="actions">
                    {ctx.contact.whatsapp && (
                      <a className="button" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                        <WhatsApp /> {c.order}
                      </a>
                    )}
                    {ctx.contact.maps && (
                      <a className="button ghost" href={ctx.contact.maps} rel="noopener" target="_blank">
                        {ctx.t.directions}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="foot" data-section="footer">
          {ornaments && <Flourish />}
          <Credits ctx={ctx} />
        </footer>
      </div>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
