import { flag } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";

const copy = {
  en: { special: "Today's special", menu: "On the board", story: "Hello!", visit: "Come say hi", hours: "Hours", order: "Order on WhatsApp", jump: "Jump to" },
  ar: { special: "طبق اليوم", menu: "على اللوح", story: "أهلًا!", visit: "تعالوا زورونا", hours: "ساعات العمل", order: "اطلب عبر واتساب", jump: "انتقل إلى" },
};

const PALETTES = {
  board: { bg: "#22302A", surf: "#2A3A33", ink: "#F4F1E8", muted: "#B9C2BC", line: "#55665E", frame: "#7A5134" },
  slate: { bg: "#25282B", surf: "#2E3236", ink: "#F2F2EE", muted: "#B4B8BC", line: "#565B61", frame: "#5B4636" },
  black: { bg: "#151515", surf: "#1E1E1E", ink: "#F5F2EA", muted: "#B3AFA6", line: "#4A4844", frame: "#3B2B20" },
  kraft: { bg: "#D2B48C", surf: "#DCC29E", ink: "#22180F", muted: "#4E3C2A", line: "#A88660", frame: "#8E6A45" },
};

const DOODLES = ["cup", "star", "leaf", "heart"] as const;

function Doodle({ kind }: { kind: (typeof DOODLES)[number] }) {
  const paths = {
    cup: "M6 14h20v8a9 9 0 0 1-9 9h-2a9 9 0 0 1-9-9zM26 16h3a4 4 0 0 1 0 8h-3M11 4c-2 3 2 4 0 7M17 3c-2 3 2 4 0 7",
    star: "M18 3l4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1z",
    leaf: "M5 31C5 15 15 5 31 5c0 16-10 26-26 26zM5 31L22 14",
    heart: "M18 31S4 22 4 12a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 10-14 19-14 19z",
  };
  return (
    <svg className="doodle" viewBox="0 0 36 36" width="34" height="34" aria-hidden="true" focusable="false">
      <path d={paths[kind]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Squiggle() {
  return (
    <svg className="squiggle" viewBox="0 0 240 16" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3 10c20-8 34 6 54-1s34-7 56 0 36 6 58-1 40-6 66 1" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 80 50" width="70" height="44" aria-hidden="true" focusable="false">
      <path d="M4 8c18 30 40 36 64 30M56 28l13 10-15 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Template 006 "Chalk Board": a café blackboard. Hand lettering, a daily special and boxed menu sections. */
export default function ChalkBoardTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const dust = flag(site.settings, "texture", true);
  const doodles = flag(site.settings, "doodles", true);
  const special = ctx.on("special") ? ctx.picks[0] : undefined;
  const story = ctx.on("story") && ctx.text("story.text");

  return (
    <div
      data-template="chalkboard"
      className={cx("t-chalk", dust && "dust", fontVariables)}
      style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["hand", "round", "condensed"], defaultAccent: "#F2C14E" })}
    >
      <TemplateStyles id="chalkboard" />
      <TopBars ctx={ctx} />
      <div className="board">
        <header className="head" data-section="header">
          <Logo ctx={ctx} />
          <h1>{site.business.name}</h1>
          <Squiggle />
          {ctx.text("hero.title") && <p className="tagline">{ctx.text("hero.title")}</p>}
          {ctx.today && <p className="today">{ctx.today}</p>}
        </header>

        <main>
          {special && (
            <section className="special" data-section="special" aria-labelledby="special-title">
              <h2 id="special-title">{ctx.text("special.title") || c.special}</h2>
              <button type="button" className="special-card" data-item-id={special.id}>
                <span className="special-photo">
                  <ProductPicture item={special} sizes="(min-width: 760px) 320px, 70vw" />
                </span>
                <span className="special-text">
                  <span className="special-name">{special.name}</span>
                  {special.description && <span className="special-desc">{special.description}</span>}
                  <span className="special-price">{special.priceText}</span>
                </span>
              </button>
              {ctx.text("special.note") && (
                <p className="special-note">
                  <Arrow />
                  <span>{ctx.text("special.note")}</span>
                </p>
              )}
            </section>
          )}

          <section id="menu" className="menu" data-section="menu" aria-labelledby="menu-title">
            <h2 id="menu-title" className="menu-title">
              {c.menu}
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
            <div className="boxes">
              {ctx.sections.map((section, i) => (
                <section key={section.id} id={section.anchor} className="box" aria-labelledby={`${section.anchor}-h`}>
                  <h3 id={`${section.anchor}-h`}>
                    {doodles && <Doodle kind={DOODLES[i % DOODLES.length]} />}
                    <span>{section.name}</span>
                  </h3>
                  <ul className="plain">
                    {section.products.map((item) => (
                      <li key={item.id}>
                        <button type="button" className={cx("line", !item.isAvailable && "out")} data-item-id={item.id}>
                          <span className="line-top">
                            <span className="line-name">{item.name}</span>
                            <span className="line-price">{item.priceText}</span>
                          </span>
                          {(item.description || item.labelText || !item.isAvailable) && (
                            <span className="line-desc">
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
          </section>

          {story && (
            <section id="story" className="story" data-section="story" aria-labelledby="story-title">
              {doodles && <Doodle kind="heart" />}
              <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
              <p>{story}</p>
            </section>
          )}

          {ctx.on("visit") && (
            <section id="visit" className="visit" data-section="visit" aria-labelledby="visit-title">
              <h2 id="visit-title">{c.visit}</h2>
              <div className="visit-grid">
                {hasHours(ctx.hours) && (
                  <div className="box">
                    <h3>{c.hours}</h3>
                    <HoursList ctx={ctx} />
                  </div>
                )}
                <div className="box">
                  <h3>{ctx.t.findUs}</h3>
                  <ContactList ctx={ctx} />
                  <div className="actions">
                    {ctx.contact.whatsapp && (
                      <a className="chalk-btn" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                        <WhatsApp /> {c.order}
                      </a>
                    )}
                    {ctx.contact.maps && (
                      <a className="chalk-btn ghost" href={ctx.contact.maps} rel="noopener" target="_blank">
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
          <Credits ctx={ctx} />
        </footer>
      </div>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
