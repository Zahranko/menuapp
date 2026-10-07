import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { index: "Index", items: "Items", info: "Information", hours: "Hours", contact: "Contact", about: "About", menu: "Catalog" },
  ar: { index: "الفهرس", items: "الأصناف", info: "معلومات", hours: "ساعات العمل", contact: "تواصل", about: "عنّا", menu: "الكتالوج" },
};

const PALETTES = {
  white: { bg: "#FFFFFF", surf: "#F3F3F1", ink: "#0B0B0B", muted: "#5A5A57", line: "#0B0B0B" },
  concrete: { bg: "#E9E8E4", surf: "#F2F1EE", ink: "#121212", muted: "#575652", line: "#121212" },
  black: { bg: "#0B0B0B", surf: "#161616", ink: "#F2F2F0", muted: "#A3A39E", line: "#F2F2F0" },
  blueprint: { bg: "#0F2A5C", surf: "#163469", ink: "#F3F6FC", muted: "#B5C3DE", line: "#F3F6FC" },
};

const pad = (n: number, size = 3) => String(n).padStart(size, "0");

/** Template 014 "Mono Grid": a Swiss-style catalog. Hairline grid, index numbers, one accent color. */
export default function MonoGridTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const story = ctx.on("story") && ctx.text("story.text");
  const numbers = new Map(ctx.sections.flatMap((s) => s.products).map((p, i) => [p.id, i + 1]));

  return (
    <div data-template="monogrid" className={cx("t-mono", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["grotesk", "modern", "mono"], defaultAccent: "#FF3B00", radius: { rounded: "0px", sharp: "0px" } })}>
      <TemplateStyles id="monogrid" />
      <TopBars ctx={ctx} />
      <header className="head" data-section="header">
        <div className="meta">
          <span>{site.business.address}</span>
          {ctx.today && <span>{ctx.today}</span>}
        </div>
        <h1 className="name">{site.business.name}</h1>
        {ctx.text("hero.title") && <p className="lede">{ctx.text("hero.title")}</p>}
      </header>

      <main>
        <section id="menu" className="catalog" data-section="menu" aria-label={c.menu}>
          {ctx.sections.length > 1 && (
            <nav className="index" aria-label={c.index}>
              <h2 className="label">{c.index}</h2>
              <ol className="plain">
                {ctx.sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.anchor}`}>
                      <span className="num">{pad(i + 1, 2)}</span>
                      <span className="index-name">{s.name}</span>
                      <span className="num">({s.products.length})</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {ctx.sections.map((section, si) => (
            <section key={section.id} id={section.anchor} className="block" aria-labelledby={`${section.anchor}-h`}>
              <h2 id={`${section.anchor}-h`} className="block-head">
                <span className="num">{pad(si + 1, 2)}</span>
                <span>{section.name}</span>
              </h2>
              <ul className="plain grid">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("cell", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="cell-top">
                        <span className="num">{pad(numbers.get(item.id) ?? 0)}</span>
                        {item.labelText && <span className="flag">{item.labelText}</span>}
                        {!item.isAvailable && <span className="flag flag-out">{ctx.t.soldOut}</span>}
                      </span>
                      <span className="cell-media">
                        <ProductPicture item={item} sizes="(min-width: 760px) 25vw, 50vw" />
                      </span>
                      <span className="cell-bottom">
                        <span className="cell-name">{item.name}</span>
                        <span className="cell-price">{item.priceText}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {(story || ctx.on("visit")) && (
          <section id="visit" className="info" data-section="visit" aria-labelledby="info-title">
            <h2 id="info-title" className="block-head">
              <span className="num">{pad(ctx.sections.length + 1, 2)}</span>
              <span>{c.info}</span>
            </h2>
            <div className="info-grid">
              {story && (
                <div id="story" className="info-cell" data-section="story">
                  <h3 className="label">{ctx.text("story.title") || c.about}</h3>
                  <p>{story}</p>
                </div>
              )}
              {ctx.on("visit") && hasHours(ctx.hours) && (
                <div className="info-cell">
                  <h3 className="label">{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              {ctx.on("visit") && (
                <div className="info-cell">
                  <h3 className="label">{c.contact}</h3>
                  <ContactList ctx={ctx} />
                </div>
              )}
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
