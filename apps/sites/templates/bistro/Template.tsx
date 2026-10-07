import { choice } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
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
    special: "Today's dish",
    menu: "The menu",
    story: "The house",
    visit: "Visit",
    hours: "Hours",
    book: "Book a table on WhatsApp",
  },
  ar: {
    special: "طبق اليوم",
    menu: "القائمة",
    story: "البيت",
    visit: "زورونا",
    hours: "ساعات العمل",
    book: "احجز طاولة عبر واتساب",
  },
};

const PALETTES = {
  gingham: {
    bg: "#FBF7EE",
    surf: "#F4EDDD",
    ink: "#231C16",
    muted: "#655A4D",
    line: "#DCCFB6",
    table: "#F3EEE7",
    cloth: "#C7363B",
  },
  blue: {
    bg: "#FBF8F1",
    surf: "#EFEADF",
    ink: "#1B2230",
    muted: "#5B6170",
    line: "#D8D1C2",
    table: "#EEF1F6",
    cloth: "#2D5DA8",
  },
  oak: {
    bg: "#FCF8F0",
    surf: "#F3ECDE",
    ink: "#2A2017",
    muted: "#665B4D",
    line: "#DDCFB8",
    table: "#8A5A35",
    cloth: "#6E4527",
  },
  noir: {
    bg: "#1C1A18",
    surf: "#24211E",
    ink: "#F1EBDF",
    muted: "#B0A797",
    line: "#3B3631",
    table: "#0E0D0C",
    cloth: "#2A2622",
  },
};

function Clip() {
  return (
    <svg
      className="clip"
      viewBox="0 0 24 64"
      width="20"
      height="54"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 18V50a6 6 0 0 0 12 0V12a9 9 0 0 0-18 0v36"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Template 010 "Bistro Card": a folded menu card lying on a tablecloth, cover on one side, courses inside. */
export default function BistroCardTemplate({
  site,
  now,
}: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const special = ctx.on("special") ? ctx.picks[0] : undefined;
  const story = ctx.on("story") && ctx.text("story.text");
  const cloth = choice(
    site.settings,
    "theme",
    Object.keys(PALETTES) as (keyof typeof PALETTES)[],
    "gingham",
  );

  return (
    <div
      data-template="bistro"
      className={cx("t-bistro", fontVariables)}
      style={themeVars(site.settings, ctx.locale, {
        palettes: PALETTES,
        fonts: ["elegant", "classic", "soft"],
        defaultAccent: "#9E2A2B",
      })}
    >
      <TemplateStyles id="bistro" />
      <TopBars ctx={ctx} />
      <div className={cx("table", `cloth-${cloth}`)}>
        <div className="card">
          <header className="page cover" data-section="header">
            <Logo ctx={ctx} className="monogram" />
            <p className="est">{ctx.text("hero.eyebrow")}</p>
            <h1>{site.business.name}</h1>
            {ctx.text("hero.title") && (
              <p className="tagline">{ctx.text("hero.title")}</p>
            )}
            {ctx.today && <p className="today">{ctx.today}</p>}
            {special && (
              <section
                className="note"
                data-section="special"
                aria-labelledby="special-title"
              >
                <Clip />
                <h2 id="special-title">
                  {ctx.text("special.title") || c.special}
                </h2>
                <button
                  type="button"
                  className="note-item"
                  data-item-id={special.id}
                >
                  <span className="note-photo">
                    <ProductPicture item={special} sizes="88px" />
                  </span>
                  <span className="note-text">
                    <span className="note-name">{special.name}</span>
                    <span className="note-price">{special.priceText}</span>
                  </span>
                </button>
              </section>
            )}
          </header>

          <main className="page inside">
            <section
              id="menu"
              className="menu"
              data-section="menu"
              aria-labelledby="menu-title"
            >
              <h2 id="menu-title" className="sr-only">
                {c.menu}
              </h2>
              {ctx.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.anchor}
                  className="course"
                  aria-labelledby={`${section.anchor}-h`}
                >
                  <h3 id={`${section.anchor}-h`}>{section.name}</h3>
                  <ul className="plain">
                    {section.products.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cx("dish", !item.isAvailable && "out")}
                          data-item-id={item.id}
                        >
                          <span className="dish-name">
                            {item.name}
                            {item.labelText && (
                              <span className="tag">{item.labelText}</span>
                            )}
                            {!item.isAvailable && (
                              <span className="tag tag-out">
                                {ctx.t.soldOut}
                              </span>
                            )}
                          </span>
                          <span className="dish-price">{item.priceText}</span>
                          {item.description && (
                            <span className="dish-desc">
                              {item.description}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </section>

            {(story || ctx.on("visit")) && (
              <div className="back">
                {story && (
                  <section
                    id="story"
                    className="story"
                    data-section="story"
                    aria-labelledby="story-title"
                  >
                    <h2 id="story-title">
                      {ctx.text("story.title") || c.story}
                    </h2>
                    <p>{story}</p>
                  </section>
                )}
                {ctx.on("visit") && (
                  <section
                    id="visit"
                    className="visit"
                    data-section="visit"
                    aria-labelledby="visit-title"
                  >
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
                          <a
                            className="book"
                            href={ctx.contact.whatsapp}
                            rel="noopener"
                            target="_blank"
                          >
                            <WhatsApp /> {c.book}
                          </a>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
        <footer className="foot" data-section="footer">
          <Credits ctx={ctx} />
        </footer>
      </div>
      <ProductSheet ctx={ctx} />
    </div>
  );
}
