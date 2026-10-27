import type { TemplateProps } from "@/lib/types";
import { itemCount } from "@/lib/i18n";
import { BrandName, ContactList, Credits, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, ProductSheet, SocialLinks, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Clock, Instagram, Pin } from "../_kit/icons";
import { heroPhotos } from "../_kit/hero";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";
import { basicLinks, orderCta, pageTop, SiteHeader, SiteHero } from "../_kit/Top";
import { SiteMenu } from "../_kit/Menu";
import { ordered, SiteFooter, SiteStory, SiteVisit, together } from "../_kit/Sections";

/** The sections in the order the template draws them (manifest "sectionsLayout.order"). */
const ORDER = ["menu", "story", "visit"];

const copy = {
  en: { see: "See the menu", today: "Today", where: "Where", about: "About us", hours: "Opening hours", contact: "Say hello", jump: "Menu sections", closed: "Closed today" },
  ar: { see: "شاهد القائمة", today: "اليوم", where: "العنوان", about: "من نحن", hours: "ساعات العمل", contact: "تواصل معنا", jump: "أقسام القائمة", closed: "مغلق اليوم" },
};

const PALETTES = {
  fresh: { bg: "#F7F7F2", surf: "#FFFFFF", ink: "#16211B", muted: "#55605A", line: "#E3E5DC", t1: "#E4F2D7", t2: "#FFE7CC", t3: "#FCE1E4", t4: "#DDEBF7" },
  lime: { bg: "#F1F6E4", surf: "#FFFFFF", ink: "#17220E", muted: "#4F5C42", line: "#DCE6C5", t1: "#D9EDB0", t2: "#FFF2B8", t3: "#CFEBD9", t4: "#F7DCC2" },
  berry: { bg: "#FBF1F4", surf: "#FFFFFF", ink: "#2A1320", muted: "#6A4D5C", line: "#F0D9E1", t1: "#F8D3DF", t2: "#E9DDF7", t3: "#FFE3D3", t4: "#D8EFE9" },
  night: { bg: "#111613", surf: "#1A201C", ink: "#F1F5EE", muted: "#A9B3AB", line: "#2C342F", t1: "#1E3325", t2: "#3A2A1A", t3: "#3A1E28", t4: "#1C2B3A" },
};

/** Template 007 "Bento": a juice bar laid out as a bento box of tiles; featured drinks get the big tiles. */
export default function BentoTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const heroPics = heroPhotos(site.settings, "hero.image");
  const hero = heroPics[0] ?? null;
  const story = ctx.on("story") && ctx.text("story.text");
  const pick = ctx.picks[0];

  const grouped = together(ctx, ORDER, ["story", "visit"]);
  const order = orderButton(site);
  const top = pageTop(ctx, { photos: heroPics });
  return (
    <div data-template="bento" {...logoRoot(ctx)} {...optionRoot(ctx, order)} className={cx("t-bento", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["round", "grotesk", "bold"], defaultAccent: "#2F8F4E", radius: { rounded: "26px", sharp: "4px" } })}>
      <TemplateStyles id="bento" />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={top} links={basicLinks(ctx, { story })} cta={orderCta(order)}>
        <header className="head kit-head" data-section="header">
          <a className="brand kit-lockup" href="#top">
            <Logo ctx={ctx} />
            <BrandName ctx={ctx} />
          </a>
          {ctx.contact.instagram && (
            <a className="round-link" href={ctx.contact.instagram} rel="noopener" target="_blank" aria-label="Instagram">
              <Instagram />
            </a>
          )}
        </header>
      </SiteHeader>

      <main id="top">
        {ctx.on("hero") ? (
          <SiteHero ctx={ctx} top={top}>
            <section className="bento intro" data-section="hero" aria-labelledby="hero-title">
              <div className="tile tile-hero c1">
                <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
                {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
                <a data-k="btn" className="go" href="#menu">
                  {c.see} <Arrow />
                </a>
              </div>
              {hero && (
                <div className="tile tile-photo">
                  <HeroPhotos ctx={ctx} photos={heroPics} sizes="(min-width: 760px) 30vw, 100vw" />
                </div>
              )}
              <div className="tile tile-small c2">
                <Clock />
                <span className="small-label">{c.today}</span>
                <span className="small-value">{ctx.today ?? c.closed}</span>
              </div>
              {ctx.contact.maps && (
                <a className="tile tile-small c4" href={ctx.contact.maps} rel="noopener" target="_blank">
                  <Pin />
                  <span className="small-label">{c.where}</span>
                  <span className="small-value">{site.business.address}</span>
                </a>
              )}
              {pick && (
                <button type="button" className="tile tile-pick c3" data-item-id={pick.id}>
                  <span data-k="photo" className="pick-media">
                    <ProductPicture item={pick} sizes="160px" />
                  </span>
                  <span className="pick-text">
                    {pick.labelText && <span className="tag">{pick.labelText}</span>}
                    <span className="pick-name">{pick.name}</span>
                    <span className="price">{pick.priceText}</span>
                  </span>
                </button>
              )}
            </section>
          </SiteHero>
        ) : (
          <h1 className="sr-only">{site.business.name}</h1>
        )}

        {ordered(ctx, {
          menu: (
            <section id="menu" className="menu" data-section="menu" aria-label={ctx.t.menu}>
              <SiteMenu ctx={ctx} like="tiles" level={2}>
              {ctx.sections.length > 1 && (
                <nav className="cats" aria-label={c.jump}>
                  {ctx.sections.map((s) => (
                    <a key={s.id} href={`#${s.anchor}`}>
                      {s.name}
                    </a>
                  ))}
                </nav>
              )}
              {ctx.sections.map((section, si) => (
                <section key={section.id} id={section.anchor} className="group" aria-labelledby={`${section.anchor}-h`}>
                  <div className="group-head">
                    <h2 id={`${section.anchor}-h`}>{section.name}</h2>
                    <span>{itemCount(section.products.length, ctx.locale)}</span>
                  </div>
                  <ul className="plain bento kit-cards">
                    {section.products.map((item, i) => (
                      <li key={item.id} className={cx("cell", item.isFeatured && item.isAvailable && "big", `c${((si + i) % 4) + 1}`)}>
                        <button type="button" className={cx("tile", "item", "kit-card", !item.isAvailable && "out")} data-item-id={item.id}>
                          <span className="item-media kit-card-media">
                            <ProductPicture item={item} sizes="(min-width: 760px) 25vw, 50vw" />
                          </span>
                          <span className="item-text">
                            {(item.labelText || !item.isAvailable) && (
                              <span className="tags">
                                {item.labelText && <span className="tag">{item.labelText}</span>}
                                {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                              </span>
                            )}
                            <span className="item-name">{item.name}</span>
                            {item.description && <span className="item-desc">{item.description}</span>}
                            <span className="price">{item.priceText}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              </SiteMenu>
            </section>
          ),
          // The story, hours and contact share one grid while the owner keeps them where they are.
          story: grouped
            ? (story || ctx.on("visit")) && (
                <div className="bento outro">
                  {story && (
                    <section id="story" className="tile tile-story c1" data-section="story" data-k="boxed" aria-labelledby="story-title">
                      <h2 data-k="label" id="story-title">{ctx.text("story.title") || c.about}</h2>
                      <p>{story}</p>
                    </section>
                  )}
                  {ctx.on("visit") && hasHours(ctx.hours) && (
                    <section className="tile tile-hours c2" data-section="visit" data-k="boxed" aria-labelledby="hours-title">
                      <h2 data-k="label" id="hours-title">{c.hours}</h2>
                      <HoursList ctx={ctx} />
                    </section>
                  )}
                  {ctx.on("visit") && (
                    <section id="visit" className="tile tile-contact c4" aria-labelledby="contact-title">
                      <h2 data-k="label" id="contact-title">{c.contact}</h2>
                      <ContactList ctx={ctx} />
                    </section>
                  )}
                </div>
              )
            : story && (
                <SiteStory ctx={ctx} title={ctx.text("story.title") || c.about}>
                  <div className="bento outro">
                    <section id="story" className="tile tile-story c1" data-section="story" data-k="boxed" aria-labelledby="story-title">
                      <h2 data-k="label" id="story-title">{ctx.text("story.title") || c.about}</h2>
                      <p>{story}</p>
                    </section>
                  </div>
                </SiteStory>
              ),
          visit: !grouped && ctx.on("visit") && (
            <SiteVisit ctx={ctx} title={c.contact}>
              <div className="bento outro">
                {hasHours(ctx.hours) && (
                  <section className="tile tile-hours c2" data-section="visit" data-k="boxed" aria-labelledby="hours-title">
                    <h2 data-k="label" id="hours-title">{c.hours}</h2>
                    <HoursList ctx={ctx} />
                  </section>
                )}
                <section id="visit" className="tile tile-contact c4" aria-labelledby="contact-title">
                  <h2 data-k="label" id="contact-title">{c.contact}</h2>
                  <ContactList ctx={ctx} />
                </section>
              </div>
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
      <OrderFab order={order} />
      <ProductSheet ctx={ctx} />
    </div>
  );
}
