import type { TemplateProps } from "@/lib/types";
import { flag } from "@/lib/settings";
import { ContactList, Credits, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, ProductSheet, SocialLinks, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { WhatsApp } from "../_kit/icons";
import { heroPhotos } from "../_kit/hero";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";
import { basicLinks, orderCta, pageTop, SiteHero, SiteMasthead } from "../_kit/Top";
import { SiteMenu } from "../_kit/Menu";
import { SiteFooter, SiteStory, SiteVisit, ordered } from "../_kit/Sections";

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
  const heroPics = heroPhotos(site.settings, "hero.image");
  const hero = heroPics[0] ?? null;
  const story = ctx.on("story") && ctx.text("story.text");

  const order = orderButton(site, { label: c.reserve });
  const top = pageTop(ctx, { photos: heroPics });
  return (
    <div data-template="spiceroute" {...logoRoot(ctx)} {...optionRoot(ctx, order)} className={cx("t-spice", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["naskh", "classic", "elegant"], defaultAccent: "#1F5F5B" })}>
      <TemplateStyles id="spiceroute" />
      <TopBars ctx={ctx} />
      {pattern && <StarBand id="stars-top" />}
      <SiteMasthead ctx={ctx} top={top} links={basicLinks(ctx, { story })} cta={orderCta(order)} fallback="centered">
        <header className="head" data-section="header" data-k="masthead">
          <Logo ctx={ctx} className="medallion" />
          <p className="welcome">{ctx.text("hero.eyebrow") || c.welcome}</p>
          <h1 className="kit-name">{site.business.name}</h1>
          {ctx.text("hero.title") && <p className="tagline">{ctx.text("hero.title")}</p>}
          {ctx.today && <p className="today">{ctx.today}</p>}
        </header>
      </SiteMasthead>

      <main>
        <SiteHero ctx={ctx} top={top} title={site.business.name} subtitle={ctx.text("hero.title")}>
          {hero && (
            <div className="window" data-section="hero">
              <HeroPhotos ctx={ctx} photos={heroPics} sizes="(min-width: 760px) 560px, 90vw" />
            </div>
          )}
        </SiteHero>

        {ordered(ctx, {
          menu: (
            <section id="menu" className="menu" data-section="menu" aria-labelledby="menu-title">
              <h2 id="menu-title" className="menu-title">
                <Star className="star" />
                <span>{c.menu}</span>
                <Star className="star" />
              </h2>
              <SiteMenu ctx={ctx} like="list">
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
                  <ul className="plain dishes kit-cards">
                    {section.products.map((item) => (
                      <li key={item.id}>
                        <button type="button" className={cx("dish kit-card", !item.isAvailable && "out")} data-item-id={item.id}>
                          <span className="dish-photo kit-card-media">
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
              </SiteMenu>
            </section>
          ),
          story: story && (
            <SiteStory ctx={ctx} title={ctx.text("story.title") || c.story}>
              <section id="story" className="story" data-section="story" aria-labelledby="story-title">
                <Star className="story-star" />
                <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
                <p>{story}</p>
              </section>
            </SiteStory>
          ),
          visit: ctx.on("visit") && (
            <SiteVisit ctx={ctx} title={c.visit} cta={ctx.contact.whatsapp ? { href: ctx.contact.whatsapp, label: c.reserve } : null}>
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
                        <a data-k="btn" className="reserve" href={ctx.contact.whatsapp} rel="noopener" target="_blank">
                          <WhatsApp /> {c.reserve}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </SiteVisit>
          ),
        })}
      </main>

      <SiteFooter ctx={ctx} links={basicLinks(ctx, { story })}>
        <footer className="foot" data-section="footer">
          <SocialLinks accounts={socialAccounts(site)} className="foot-social" />
          <Credits ctx={ctx} />
        </footer>
      </SiteFooter>
      {pattern && <StarBand id="stars-bottom" />}
      <OrderFab order={order} />
      <ProductSheet ctx={ctx} />
    </div>
  );
}
