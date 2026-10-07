import { CategoryTabs } from "../_kit/CategoryTabs";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Clock, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";
import { itemCount } from "@/lib/i18n";
import type { TemplateProps } from "@/lib/types";

const copy = {
  en: { picks: "Tonight's favorites", menu: "The menu", findUs: "Find us", order: "Order on WhatsApp", photos: "From the grill", swipe: "Swipe for more", hours: "Hours" },
  ar: { picks: "الأكثر طلبًا الليلة", menu: "القائمة", findUs: "موقعنا", order: "اطلب عبر واتساب", photos: "من المطبخ", swipe: "اسحب للمزيد", hours: "ساعات العمل" },
};

const PALETTES = {
  midnight: { bg: "#0D0C14", surf: "#17151F", ink: "#F5F3EE", muted: "#ABA7B6", line: "#2A2735", card: "#1E1B28" },
  charcoal: { bg: "#17181A", surf: "#202124", ink: "#F2F1EE", muted: "#A9AAAE", line: "#303236", card: "#26272B" },
  ember: { bg: "#1C0F0B", surf: "#261511", ink: "#FBEFE6", muted: "#C2A99C", line: "#3A231C", card: "#2E1A14" },
  concrete: { bg: "#E9E7E2", surf: "#F4F2EE", ink: "#121212", muted: "#55524C", line: "#CFCBC2", card: "#FFFFFF" },
};

/** Template 003 "Night Market": dark street-food site with big photo cards in a sideways row per category. */
export default function NightMarketTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const hero = ctx.image("hero.image");
  const sticker = ctx.text("hero.sticker");
  const [lead, ...rest] = ctx.picks;

  return (
    <div
      data-template="nightmarket"
      className={cx("t-night", fontVariables, ctx.contact.whatsapp && "has-order")}
      style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["condensed", "bold", "grotesk"], defaultAccent: "#FFD23F", radius: { rounded: "20px", sharp: "0px" } })}
    >
      <TemplateStyles id="nightmarket" />
      <TopBars ctx={ctx} />
      <header className="bar" data-section="header">
        <a href="#top" className="brand">
          <Logo ctx={ctx} />
          <span>{site.business.name}</span>
        </a>
        {ctx.today && (
          <span className="open">
            <Clock /> {ctx.today}
          </span>
        )}
      </header>

      <main>
        <section className="hero" id="top" data-section="hero" aria-labelledby="hero-title">
          {hero && (
            <div className="hero-media">
              <Picture src={hero} sizes="100vw" priority />
            </div>
          )}
          <div className="hero-in">
            {sticker && <span className="sticker">{sticker}</span>}
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
            <div className="hero-actions">
              <a className="btn" href="#menu">
                {ctx.t.viewMenu} <Arrow className="flip" />
              </a>
              {ctx.contact.whatsapp && (
                <a className="btn ghost" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                  <WhatsApp /> {c.order}
                </a>
              )}
            </div>
          </div>
        </section>

        {ctx.on("picks") && lead && (
          <section className="picks" data-section="picks" aria-labelledby="picks-title">
            <h2 id="picks-title" className="kicker">
              {c.picks}
            </h2>
            <div className={cx("picks-grid", rest.length === 0 && "single")}>
              {[lead, ...rest].map((item, i) => (
                <button key={item.id} type="button" className={cx("pick", i === 0 && "lead")} data-item-id={item.id}>
                  <span className="pick-media">
                    <ProductPicture item={item} sizes={i === 0 ? "(min-width: 760px) 60vw, 100vw" : "(min-width: 760px) 30vw, 50vw"} />
                  </span>
                  <span className="pick-info">
                    {item.labelText && <span className="tag">{item.labelText}</span>}
                    <span className="pick-name">{item.name}</span>
                    <span className="price-sticker">{item.priceText}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section id="menu" className="menu" data-section="menu" aria-labelledby="menu-title">
          <h2 id="menu-title" className="kicker">
            {c.menu}
          </h2>
          {ctx.sections.length > 1 && (
            <CategoryTabs categories={ctx.sections.map(({ anchor, name }) => ({ anchor, name }))} label={ctx.t.categories} className="chips" tabClassName="chip" activeClassName="on" />
          )}
          {ctx.sections.map((section) => (
            <section key={section.id} id={section.anchor} className="row" aria-labelledby={`${section.anchor}-h`}>
              <div className="row-head">
                <h3 id={`${section.anchor}-h`}>{section.name}</h3>
                <span>{itemCount(section.products.length, ctx.locale)}</span>
              </div>
              <ul className="plain cards" tabIndex={0} aria-label={`${section.name}. ${c.swipe}`}>
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cx("card", !item.isAvailable && "out")} data-item-id={item.id}>
                      <span className="card-media">
                        <ProductPicture item={item} sizes="(min-width: 760px) 25vw, 70vw" />
                      </span>
                      <span className="card-body">
                        <span className="card-tags">
                          {item.labelText && <span className="tag">{item.labelText}</span>}
                          {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                        </span>
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
        </section>

        {ctx.on("gallery") && ctx.gallery.length > 0 && (
          <section className="strip" data-section="gallery" aria-labelledby="strip-title">
            <h2 id="strip-title" className="kicker">
              {c.photos}
            </h2>
            <ul className="plain strip-row" tabIndex={0} aria-labelledby="strip-title">
              {ctx.gallery.map((src, i) => (
                <li key={src + i}>
                  <Picture src={src} alt={ctx.t.photoOf.replace("{n}", String(i + 1)).replace("{name}", site.business.name)} sizes="(min-width: 760px) 22vw, 60vw" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {ctx.on("visit") && (
          <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
            <h2 id="visit-title" className="big">
              {c.findUs}
            </h2>
            <div className="visit-grid">
              <div className="panel">
                <ContactList ctx={ctx} />
                {ctx.contact.maps && (
                  <a className="btn" href={ctx.contact.maps} rel="noopener" target="_blank">
                    {ctx.t.directions} <Arrow className="flip" />
                  </a>
                )}
              </div>
              {hasHours(ctx.hours) && (
                <div className="panel">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="foot" data-section="footer">
        <span className="foot-name">{site.business.name}</span>
        <Credits ctx={ctx} />
      </footer>

      {ctx.contact.whatsapp && (
        <a className="order-bar" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
          <WhatsApp /> {c.order}
        </a>
      )}
      <ProductSheet ctx={ctx} />
    </div>
  );
}
