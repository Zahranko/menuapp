import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { menu: "The wall", jump: "Menu sections", story: "Hello from us", visit: "Drop by", hours: "Hours", order: "Order on WhatsApp", picks: "Our favorites" },
  ar: { menu: "الحائط", jump: "أقسام القائمة", story: "مرحبًا منّا", visit: "مرّوا علينا", hours: "ساعات العمل", order: "اطلب عبر واتساب", picks: "المفضلة لدينا" },
};

const PALETTES = {
  pastel: { bg: "#FDF0F3", surf: "#FFFFFF", ink: "#2B1A22", muted: "#6E5560", line: "#F3D6DE", tape: "#F9C9D6", tapeink: "#2B1A22" },
  mint: { bg: "#EAF6F1", surf: "#FFFFFF", ink: "#16261F", muted: "#4F6359", line: "#CFE6DB", tape: "#BFE3D4", tapeink: "#16261F" },
  cork: { bg: "#D9B98F", surf: "#FFFFFF", ink: "#2A1C10", muted: "#4A3622", line: "#BE9A6C", tape: "#F4E3B5", tapeink: "#2A1C10" },
  night: { bg: "#1D1B24", surf: "#2A2733", ink: "#F4EEF6", muted: "#B9AFC0", line: "#3A3646", tape: "#6B5A8A", tapeink: "#FFFFFF" },
};

/** Template 016 "Polaroid": a dessert shop wall of instant photos, slightly tilted, taped up and captioned by hand. */
export default function PolaroidTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const story = ctx.on("story") && ctx.text("story.text");

  return (
    <div data-template="polaroid" className={cx("t-polaroid", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["hand", "round", "soft"], defaultAccent: "#E0457B" })}>
      <TemplateStyles id="polaroid" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <Logo ctx={ctx} />
        <h1>{site.business.name}</h1>
        {ctx.text("hero.title") && <p className="tagline">{ctx.text("hero.title")}</p>}
        {ctx.today && <p className="today">{ctx.today}</p>}
      </header>

      <main>
        {ctx.picks.length > 0 && (
          <section className="fan" data-section="hero" aria-label={c.picks}>
            <ul className="plain fan-list">
              {ctx.picks.map((item) => (
                <li key={item.id}>
                  <button type="button" className="photo" data-item-id={item.id}>
                    <span className="photo-img">
                      <ProductPicture item={item} sizes="240px" />
                    </span>
                    <span className="caption">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="menu" className="menu" data-section="menu" aria-label={c.menu}>
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
            <section key={section.id} id={section.anchor} className="album" aria-labelledby={`${section.anchor}-h`}>
              <h2 id={`${section.anchor}-h`}>
                <span>{section.name}</span>
              </h2>
              <ul className="plain wall">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("photo", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="tape" aria-hidden="true" />
                      <span className="photo-img">
                        <ProductPicture item={item} sizes="(min-width: 760px) 25vw, 50vw" />
                        {(item.labelText || !item.isAvailable) && (
                          <span className="stickers">
                            {item.labelText && <span className="sticker">{item.labelText}</span>}
                            {!item.isAvailable && <span className="sticker sticker-out">{ctx.t.soldOut}</span>}
                          </span>
                        )}
                      </span>
                      <span className="caption">{item.name}</span>
                      <span className="price">{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {story && (
          <section id="story" className="note" data-section="story" aria-labelledby="story-title">
            <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
            <p>{story}</p>
          </section>
        )}

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <h2 id="visit-title">{c.visit}</h2>
            <div className="visit-grid">
              {hasHours(ctx.hours) && (
                <div className="card">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              <div className="card">
                <h3>{ctx.t.findUs}</h3>
                <ContactList ctx={ctx} />
                {ctx.contact.whatsapp && (
                  <a className="order" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
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
