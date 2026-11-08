import type { TemplateProps } from "@/lib/types";
import { flag } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { BrandName, ContactList, Credits, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, ProductSheet, SocialLinks, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext } from "../_kit/context";
import { heroPhotos } from "../_kit/hero";
import { HeroBand } from "../_kit/HeroPhotos";
import { fontVariables } from "../_kit/fonts";
import { hasHours, type MenuSection } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars } from "../_kit/theme";
import { basicLinks, orderCta, pageTop, SiteHeader, SiteHero } from "../_kit/Top";
import { SiteMenu } from "../_kit/Menu";
import { SiteFooter, SiteStory, SiteVisit, ordered } from "../_kit/Sections";

const copy = {
  en: { menu: "Menu", story: "Our story", visit: "Visit", hours: "Hours", jump: "Menu sections", from: "From", browse: "See the menu", open: "Show" },
  ar: { menu: "القائمة", story: "قصتنا", visit: "زورونا", hours: "ساعات العمل", jump: "أقسام القائمة", from: "يبدأ من", browse: "شوف المنيو", open: "عرض" },
};

/* Each theme is a stone: the page color, a lighter slab for panels, the text, and two vein colors for the marble art. */
const PALETTES = {
  noir: { bg: "#111012", surf: "#1B191D", ink: "#EFE9DF", muted: "#A39B92", line: "#2E2A30", vein: "#3B373E", vein2: "#262328" },
  carrara: { bg: "#F1EEEA", surf: "#FAF8F5", ink: "#1D1A18", muted: "#6B645D", line: "#DCD5CC", vein: "#CFC8C0", vein2: "#E2DDD6" },
  emerald: { bg: "#0E1F1A", surf: "#152A23", ink: "#ECEEE6", muted: "#A0AEA4", line: "#24392F", vein: "#2B4A3D", vein2: "#1B3229" },
  cocoa: { bg: "#1E1411", surf: "#2A1D18", ink: "#F3E7DC", muted: "#B7A193", line: "#3A2A23", vein: "#4A352C", vein2: "#33241E" },
};

/** The marble: soft veins across the whole page, drawn once and kept still behind everything. */
function Veins() {
  return (
    <svg className="mb-veins" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <path className="v2" d="M-20 80C60 120 90 40 170 90s120 130 250 60" />
      <path className="v1" d="M-30 260c70-30 120 60 200 20s90-110 160-70 60 70 100 60" />
      <path className="v2" d="M-10 430c90 40 140-50 220 10s110 80 210 30" />
      <path className="v1" d="M-40 640c60-50 150 30 210-10s100-90 170-40 40 60 90 50" />
      <path className="v2" d="M-20 820c80-20 130 50 210 10s130-60 230-20" />
      <path className="v3" d="M120 -20c-10 90 40 160 10 260s30 180-10 280 20 220-20 400" />
    </svg>
  );
}

/** The gold line under the headline: it draws itself in once when the page opens. */
function GoldVein() {
  return (
    <svg className="mb-gold" viewBox="0 0 320 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path pathLength={1} d="M2 26C40 10 70 34 110 22S170 4 210 18s70 14 108-6" />
    </svg>
  );
}

/** The lowest price in a category, written like every price on the site. */
function fromPrice(section: MenuSection, currency: string, locale: string): string | null {
  const prices = section.products.map((p) => p.price).filter((p) => typeof p === "number" && p > 0);
  return prices.length ? formatPrice(Math.min(...prices), currency, locale) : null;
}

/** Template 030 "Marble": a dark, polished dessert site. Veined marble, a gold line, and a menu of categories that open. */
export default function MarbleTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const photos = flag(site.settings, "photos", true);
  const story = ctx.on("story") && ctx.text("story.text");
  const { currencyCode } = site.business;

  const order = orderButton(site);
  const top = pageTop(ctx, { photos: heroPhotos(site.settings, null) });
  return (
    <div
      data-template="marble"
      {...logoRoot(ctx)}
      {...optionRoot(ctx, order)}
      className={cx("t-marble", fontVariables)}
      style={themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["elegant", "modern", "bold"], defaultAccent: "#C9A45C", radius: { rounded: "14px", sharp: "2px" } })}
    >
      <TemplateStyles id="marble" />
      <Veins />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={top} links={basicLinks(ctx, { story })} cta={orderCta(order)}>
        <header className="head kit-head" data-section="header">
          <a className="brand kit-lockup" href="#top">
            <Logo ctx={ctx} className="crest" />
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
            {ctx.text("hero.eyebrow") && <p className="eyebrow">{ctx.text("hero.eyebrow")}</p>}
            <h1 id="hero-title">{ctx.text("hero.title") || site.business.name}</h1>
            <GoldVein />
            {ctx.text("hero.subtitle") && <p className="lead">{ctx.text("hero.subtitle")}</p>}
            <a data-k="btn" className="browse" href="#menu">
              {c.browse}
            </a>
            {ctx.today && <p className="today">{ctx.today}</p>}
          </section>
        </SiteHero>
        {top.layout.hero === "auto" && <HeroBand ctx={ctx} photos={heroPhotos(site.settings, null)} className="mb-band" />}

        {ordered(ctx, {
          menu: (
            <section id="menu" className="menu" data-section="menu" aria-labelledby="menu-title">
              <h2 id="menu-title" className="menu-title">
                {c.menu}
              </h2>
              <SiteMenu ctx={ctx} like="list" level={3}>
                <ul className="plain slabs">
                  {ctx.sections.map((section, si) => {
                    const from = fromPrice(section, currencyCode, ctx.locale);
                    return (
                      <li key={section.id} id={section.anchor} className="slab" style={{ "--i": si } as React.CSSProperties}>
                        <details open={si === 0}>
                          <summary>
                            <span className="slab-head">
                              <h3 data-k="label" className="slab-name">
                                {section.name}
                              </h3>
                              <span className="slab-count">{itemCount(section.products.length, ctx.locale)}</span>
                            </span>
                            {from && (
                              <span className="slab-from">
                                <span className="slab-from-word">{c.from}</span> {from}
                              </span>
                            )}
                            <span className="slab-toggle" aria-hidden="true" />
                          </summary>
                          <ul className="plain sweets kit-cards kit-rows">
                            {section.products.map((item) => (
                              <li key={item.id}>
                                <button type="button" className={cx("sweet kit-card kit-card-pad", !item.isAvailable && "out")} data-item-id={item.id}>
                                  {photos && (
                                    <span className="sweet-photo kit-card-media">
                                      <ProductPicture item={item} sizes="64px" />
                                    </span>
                                  )}
                                  <span className="sweet-text">
                                    <span className="sweet-name">{item.name}</span>
                                    {item.description && <span className="sweet-desc">{item.description}</span>}
                                    {(item.labelText || !item.isAvailable) && (
                                      <span className="tags">
                                        {item.labelText && <span className="tag">{item.labelText}</span>}
                                        {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
                                      </span>
                                    )}
                                  </span>
                                  <span className="sweet-price">{item.priceText}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    );
                  })}
                </ul>
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
                    <div className="visit-card">
                      <h3>{c.hours}</h3>
                      <HoursList ctx={ctx} />
                    </div>
                  )}
                  <div className="visit-card">
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
