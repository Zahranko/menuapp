import type { TemplateProps } from "@/lib/types";
import { flag } from "@/lib/settings";
import {
  ContactList,
  Credits,
  HoursList,
  Logo,
  ProductPicture,
  ProductSheet,
  TopBars,
} from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: {
    open: "Open",
    closed: "Closed",
    no: "No.",
    jump: "Menu sections",
    story: "Our story",
    visit: "Pull up a stool",
    hours: "Hours",
    order: "Order on WhatsApp",
    menu: "Menu",
  },
  ar: {
    open: "مفتوح",
    closed: "مغلق",
    no: "رقم",
    jump: "أقسام القائمة",
    story: "حكايتنا",
    visit: "تفضلوا عندنا",
    hours: "ساعات العمل",
    order: "اطلب عبر واتساب",
    menu: "القائمة",
  },
};

const PALETTES = {
  diner: {
    bg: "#FFF6E5",
    surf: "#FFFFFF",
    ink: "#1C1A17",
    muted: "#5F584D",
    line: "#EAD9BB",
    sign: "#1B1B22",
    check: "#1C1A17",
  },
  cherry: {
    bg: "#FCEDEE",
    surf: "#FFFFFF",
    ink: "#2A1316",
    muted: "#6B4B50",
    line: "#F1CDD2",
    sign: "#2A1316",
    check: "#2A1316",
  },
  mint: {
    bg: "#E6F5EF",
    surf: "#FFFFFF",
    ink: "#132520",
    muted: "#4A625A",
    line: "#C7E5D9",
    sign: "#132520",
    check: "#132520",
  },
  midnight: {
    bg: "#121826",
    surf: "#1B2335",
    ink: "#F3F1EA",
    muted: "#AAB1C2",
    line: "#2C3650",
    sign: "#0B0F19",
    check: "#F3F1EA",
  },
};

const Strip = ({ on }: { on: boolean }) =>
  on ? <div className="checks" aria-hidden="true" /> : null;

/** Template 008 "Neon Diner": a retro diner with a neon sign, checkered strips and numbered combo cards. */
export default function NeonDinerTemplate({
  site,
  now,
}: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const checks = flag(site.settings, "checks", true);
  const story = ctx.on("story") && ctx.text("story.text");
  const openToday = ctx.hours.find((h) => h.today)?.time;
  const numbers = new Map(
    ctx.sections.flatMap((s) => s.products).map((p, i) => [p.id, i + 1]),
  );

  return (
    <div
      data-template="neondiner"
      className={cx("t-diner", fontVariables)}
      style={themeVars(site.settings, ctx.locale, {
        palettes: PALETTES,
        fonts: ["condensed", "bold", "round"],
        defaultAccent: "#D7263D",
      })}
    >
      <TemplateStyles id="neondiner" />
      <TopBars ctx={ctx} />
      <header className="sign" data-section="header">
        <div className="sign-top">
          <Logo ctx={ctx} />
          {ctx.hours.some((h) => h.time) && (
            <span className={cx("open", openToday && "lit")}>
              {openToday ? c.open : c.closed}
            </span>
          )}
        </div>
        <h1 className="neon">{site.business.name}</h1>
        {ctx.text("hero.title") && (
          <p className="sign-sub">{ctx.text("hero.title")}</p>
        )}
        {ctx.today && <p className="sign-today">{ctx.today}</p>}
      </header>
      <Strip on={checks} />

      <main>
        <section
          id="menu"
          className="menu"
          data-section="menu"
          aria-label={c.menu}
        >
          {ctx.sections.length > 1 && (
            <nav className="jukebox" aria-label={c.jump}>
              {ctx.sections.map((s, i) => (
                <a key={s.id} href={`#${s.anchor}`}>
                  <span className="key" aria-hidden="true">
                    {String.fromCharCode(65 + (i % 26))}
                  </span>
                  {s.name}
                </a>
              ))}
            </nav>
          )}
          {ctx.sections.map((section) => (
            <section
              key={section.id}
              id={section.anchor}
              className="group"
              aria-labelledby={`${section.anchor}-h`}
            >
              <h2 id={`${section.anchor}-h`} className="ribbon">
                <span>{section.name}</span>
              </h2>
              <ul className="plain combos">
                {section.products.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cx("combo", !item.isAvailable && "out")}
                      data-item-id={item.id}
                    >
                      <span className="combo-no" aria-hidden="true">
                        <small>{c.no}</small>
                        {numbers.get(item.id)}
                      </span>
                      <span className="combo-photo">
                        <ProductPicture item={item} sizes="120px" />
                      </span>
                      <span className="combo-text">
                        <span className="combo-name">{item.name}</span>
                        {item.description && (
                          <span className="combo-desc">{item.description}</span>
                        )}
                        {(item.labelText || !item.isAvailable) && (
                          <span className="tags">
                            {item.labelText && (
                              <span className="tag">{item.labelText}</span>
                            )}
                            {!item.isAvailable && (
                              <span className="tag tag-out">
                                {ctx.t.soldOut}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      <span className="combo-price">{item.priceText}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {story && (
          <>
            <Strip on={checks} />
            <section
              id="story"
              className="story"
              data-section="story"
              aria-labelledby="story-title"
            >
              <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
              <p>{story}</p>
            </section>
          </>
        )}

        {ctx.on("visit") && (
          <section
            id="visit"
            className="visit"
            data-section="visit"
            aria-labelledby="visit-title"
          >
            <h2 id="visit-title" className="neon small">
              {c.visit}
            </h2>
            <div className="visit-grid">
              {hasHours(ctx.hours) && (
                <div className="ticket">
                  <h3>{c.hours}</h3>
                  <HoursList ctx={ctx} />
                </div>
              )}
              <div className="ticket">
                <h3>{ctx.t.findUs}</h3>
                <ContactList ctx={ctx} />
                {ctx.contact.whatsapp && (
                  <a
                    className="order"
                    href={ctx.contact.whatsapp}
                    rel="noopener"
                    target="_blank"
                  >
                    <WhatsApp /> {c.order}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <Strip on={checks} />
      <footer className="foot" data-section="footer">
        <Credits ctx={ctx} />
      </footer>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
