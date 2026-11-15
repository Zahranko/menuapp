import type { TemplateProps } from "@/lib/types";
import { flag } from "@/lib/settings";
import { BrandName, ContactList, Credits, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, ProductSheet, SocialLinks, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext } from "../_kit/context";
import { heroPhotos } from "../_kit/hero";
import { HeroBand } from "../_kit/HeroPhotos";
import { fontVariables } from "../_kit/fonts";
import { hasHours } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { StudioStyle } from "../_kit/StudioStyle";
import { themeVars } from "../_kit/theme";
import { basicLinks, orderCta, pageTop, SiteHeader, SiteHero } from "../_kit/Top";
import { SiteMenu } from "../_kit/Menu";
import { SiteFooter, SiteStory, SiteVisit, ordered } from "../_kit/Sections";

const copy = {
  en: { menu: "Menu", story: "Our story", visit: "Visit", hours: "Hours", jump: "Menu sections" },
  ar: { menu: "القائمة", story: "قصتنا", visit: "زورونا", hours: "ساعات العمل", jump: "أقسام القائمة" },
};

const PALETTES = {
  light: { bg: "#FAFAF9", surf: "#FFFFFF", ink: "#18181B", muted: "#62626B", line: "#E4E4E7" },
  sand: { bg: "#F4EDE3", surf: "#FBF7F1", ink: "#2A2118", muted: "#6E6253", line: "#E2D6C5" },
  slate: { bg: "#E7EAEE", surf: "#F5F7F9", ink: "#151A21", muted: "#566170", line: "#CDD3DB" },
  night: { bg: "#111318", surf: "#191C23", ink: "#EEF0F3", muted: "#A2A8B3", line: "#2A2E37" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Template 031 "Studio": a quiet, neutral base for the AI design studio. Its look comes from the design recipe (the shared
 * layout and style options) and from "studio.css", the style sheet the design agent writes (StudioStyle cleans and scopes it).
 */
export default function StudioTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const photos = flag(site.settings, "photos", true);
  const story = ctx.on("story") && ctx.text("story.text");

  const order = orderButton(site);
  const top = pageTop(ctx, { photos: heroPhotos(site.settings, null) });
  return (
    <div data-template="studio" {...logoRoot(ctx)} {...optionRoot(ctx, order)} className={cx("t-studio", fontVariables)} style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["elegant", "modern", "mono"], defaultAccent: "#2F6FEB", radius: { rounded: "4px", sharp: "0px" } })}>
      <TemplateStyles id="studio" />
      <StudioStyle css={site.settings["studio.css"]} />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={top} links={basicLinks(ctx, { story })} cta={orderCta(order)}>
        <header className="head kit-head" data-section="header">
          <a className="brand kit-lockup" href="#top">
            <Logo ctx={ctx} className="seal" />
            <BrandName ctx={ctx} />
          </a>
          <nav aria-label={c.jump}>
            <a href="#menu">{c.menu}</a>
            {story && <a href="#story">{c.story}</a>}
            {ctx.on("visit") && <a href="#visit">{c.visit}</a>}
          </nav>
        </header>
      </SiteHeader>

      <main id="top">
        <SiteHero ctx={ctx} top={top}>
          <section className="hero" data-section="hero" aria-labelledby="hero-title">
            <div className="hero-text">
              <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
              {ctx.text("hero.subtitle") && <p>{ctx.text("hero.subtitle")}</p>}
              {ctx.today && <p className="today">{ctx.today}</p>}
            </div>
          </section>
        </SiteHero>
        {top.layout.hero === "auto" && <HeroBand ctx={ctx} photos={heroPhotos(site.settings, null)} className="studio-band" />}

        {ordered(ctx, {
          menu: (
            <section id="menu" className="menu" data-section="menu" aria-label={c.menu}>
              <SiteMenu ctx={ctx} like="list" level={2}>
              {ctx.sections.map((section, si) => (
                <section key={section.id} id={section.anchor} className="course" aria-labelledby={`${section.anchor}-h`}>
                  <h2 data-k="label" id={`${section.anchor}-h`}>
                    <span className="course-no">{pad(si + 1)}</span>
                    <span className="course-name">{section.name}</span>
                  </h2>
                  <ol className="plain dishes kit-cards kit-rows">
                    {section.products.map((item, i) => (
                      <li key={item.id}>
                        <button type="button" className={cx("dish kit-card kit-card-pad", !item.isAvailable && "out")} data-item-id={item.id}>
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
                            <span className="dish-photo kit-card-media">
                              <ProductPicture item={item} sizes="72px" />
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
              </SiteMenu>
            </section>
          ),
          story: story && (
            <SiteStory ctx={ctx} title={ctx.text("story.title") || c.story}>
              <section id="story" className="story" data-section="story" aria-labelledby="story-title">
                <h2 id="story-title">{ctx.text("story.title") || c.story}</h2>
                <p>{story}</p>
              </section>
            </SiteStory>
          ),
          visit: ctx.on("visit") && (
            <SiteVisit ctx={ctx} title={c.visit}>
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
