import type { CSSProperties } from "react";
import { itemCount } from "@/lib/i18n";
import type { TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, FootName, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, SocialIcons, TopBars } from "../_kit/blocks";
import { CategoryTabs } from "../_kit/CategoryTabs";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { Drawer } from "../_kit/Drawer";
import { fontVariables } from "../_kit/fonts";
import { heroPhotos } from "../_kit/hero";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { Arrow, Burger, Close, Pin, Search, WhatsApp } from "../_kit/icons";
import { MenuSearch } from "../_kit/MenuSearch";
import { Picture } from "../_kit/Picture";
import { hasHours, type MenuItem } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars, type Palette } from "../_kit/theme";
import { fashionCopy, fill } from "../_fashion/copy";
import { details, sizeRange } from "../_fashion/details";
import { sheetItems, sheetLabels, viewerLabels } from "../_fashion/items";
import { PhotoViewer } from "../_fashion/PhotoViewer";
import { ProductSheet } from "../_fashion/ProductSheet";
import { orderButton, socialAccounts } from "../_kit/options";
import { orderCta, pageTop, SiteHeader, SiteHero, type NavLink } from "../_kit/Top";
import { SiteMenu } from "../_kit/Menu";
import { ordered, SiteFooter, SiteGallery, SiteReviews, SiteStory, SiteVisit } from "../_kit/Sections";

/*
 * Template 027 "Folio": an editorial lookbook for a clothing store. A magazine-cover opening with an issue line, the
 * featured pieces as a spread, numbered collection chapters with large portrait photos (every fifth one runs wide),
 * a photos-only lookbook, an editor's-letter story and a big wordmark footer. Black and white with one quiet accent.
 */

const PALETTES = {
  paper: { bg: "#F4F1EC", surf: "#ECE7DF", ink: "#141414", muted: "#5F5A53", line: "#D9D2C7" },
  white: { bg: "#FFFFFF", surf: "#F3F3F1", ink: "#111111", muted: "#5C5C5C", line: "#E4E4E0" },
  stone: { bg: "#E7E4DE", surf: "#F1EFEA", ink: "#1A1917", muted: "#57534D", line: "#CFCAC1" },
  ink: { bg: "#121212", surf: "#1C1C1C", ink: "#EDEAE4", muted: "#A39F98", line: "#2E2E2E" },
} satisfies Record<string, Palette>;

const copy = {
  en: { menu: "Menu", collections: "Collections", issue: "N°", letter: "From the studio", notes: "Notes from our clients", store: "The store", visitUs: "Visit the studio", chapter: "Chapter", search: "Search the collection", open: "Open" },
  ar: { menu: "القائمة", collections: "المجموعات", issue: "العدد", letter: "من الاستوديو", notes: "كلمات من زبائننا", store: "المحل", visitUs: "زورونا في الاستوديو", chapter: "الفصل", search: "ابحث في المجموعة", open: "افتح" },
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function FolioTemplate({ site, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copy[ctx.locale];
  const f = fashionCopy(ctx.locale);
  const order = orderButton(site);
  const all = ctx.sections.flatMap((s) => s.products.map((item) => ({ item, collection: s.name })));
  const photos = ctx.on("gallery") ? ctx.gallery : [];
  const top = pageTop(ctx, { photos: heroPhotos(site.settings, "hero.image"), backdrop: false });
  const links: NavLink[] = [
    { href: "#menu", label: f.shop },
    ...[...(photos.length > 0 ? [{ href: "#lookbook", label: f.lookbook }] : [])],
    ...(ctx.on("story") && ctx.text("story.text") ? [{ href: "#story", label: ctx.t.story }] : []),
    ...(ctx.on("visit") ? [{ href: "#visit", label: c.store }] : []),
  ];
  const style = themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: ["classic", "grotesk", "soft"], defaultAccent: "#1A1A1A", radius: { rounded: "0px", sharp: "0px" } });

  return (
    <div data-template="folio" {...logoRoot(ctx)} {...optionRoot(ctx, order)} className={cx("t-folio", fontVariables)} style={style}>
      <TemplateStyles id="folio" />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={top} links={links} cta={orderCta(order)}>
        <Header ctx={ctx} c={c} f={f} photos={photos.length > 0} />
      </SiteHeader>
      <main id="top">
        <SiteHero ctx={ctx} top={top} actions={[{ href: "#menu", label: f.shop }]}>
          <Cover ctx={ctx} f={f} />
        </SiteHero>
        {ordered(ctx, {
          picks: ctx.on("edit") && <Edit ctx={ctx} f={f} />,
          menu: <Catalog ctx={ctx} c={c} f={f} />,
          gallery: photos.length > 0 && (
            <SiteGallery ctx={ctx} id="lookbook" title={ctx.text("gallery.title") || f.lookbook} photos={photos.map((src) => ({ src }))} viewer>
              <Lookbook ctx={ctx} f={f} photos={photos} />
            </SiteGallery>
          ),
          story: ctx.on("story") && ctx.text("story.text") && (
            <SiteStory ctx={ctx} eyebrow={c.letter} title={ctx.text("story.title") || ctx.t.story}>
              <Letter ctx={ctx} c={c} />
            </SiteStory>
          ),
          reviews: ctx.on("reviews") && ctx.reviews.length > 0 && (
            <SiteReviews ctx={ctx} title={c.notes}>
              <Notes ctx={ctx} c={c} />
            </SiteReviews>
          ),
          visit: ctx.on("visit") && (
            <SiteVisit ctx={ctx} title={c.visitUs} cta={ctx.contact.whatsapp ? { href: ctx.contact.whatsapp, label: f.askSize } : null}>
              <Store ctx={ctx} c={c} f={f} />
            </SiteVisit>
          ),
        })}
      </main>
      <SiteFooter ctx={ctx} links={links}>
        <Footer ctx={ctx} c={c} />
      </SiteFooter>
      <OrderFab order={order} />
      <ProductSheet items={sheetItems(ctx, all)} phone={site.business.whatsApp} labels={sheetLabels(ctx)} />
      {photos.length > 0 && <PhotoViewer photos={photos.map((src) => ({ src, alt: null }))} labels={viewerLabels(ctx)} />}
    </div>
  );
}

type C = (typeof copy)["en"];
type F = ReturnType<typeof fashionCopy>;

function Header({ ctx, c, f, photos }: { ctx: SiteContext; c: C; f: F; photos: boolean }) {
  const order = ctx.contact.whatsapp;
  const links = (
    <>
      <a href="#menu">{f.shop}</a>
      {photos && <a href="#lookbook">{f.lookbook}</a>}
      {ctx.on("story") && ctx.text("story.text") && <a href="#story">{ctx.t.story}</a>}
      {ctx.on("visit") && <a href="#visit">{c.store}</a>}
    </>
  );
  return (
    <header className="fo-head kit-head" data-section="header">
      <div className="fo-head-side">
        <Drawer openLabel={ctx.t.openMenu} closeLabel={ctx.t.close} buttonClassName="fo-burger" panelClassName="fo-drawer" icon={<Burger />} closeIcon={<Close />}>
          <nav className="fo-drawer-nav" aria-label={c.menu}>
            {links}
            {ctx.sections.length > 1 && (
              <ul className="plain fo-drawer-cats">
                {ctx.sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.anchor}`}>
                      <span className="fo-num">{pad(i + 1)}</span> {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </Drawer>
        <nav className="fo-nav" aria-label={c.menu}>
          {links}
        </nav>
      </div>
      <a className="fo-lockup kit-lockup" href="#top">
        <Logo ctx={ctx} className="fo-logo" sizes="44px" />
        <BrandName ctx={ctx} className="fo-name" />
      </a>
      <div className="fo-head-side fo-head-end">
        {order && (
          <a className="fo-order" href={order} target="_blank" rel="noopener noreferrer" aria-label={f.order}>
            <WhatsApp />
            <span className="fo-order-text">{f.order}</span>
          </a>
        )}
      </div>
    </header>
  );
}

/** The opening: a magazine cover. Portrait photo in its frame, an issue line and a large headline beside it. */
function Cover({ ctx, f }: { ctx: SiteContext; f: F }) {
  const s = ctx.site.settings;
  const first = ctx.sections.flatMap((x) => x.products).find((p) => p.imageUrl)?.imageUrl ?? null;
  const photos = heroPhotos(s, "hero.image", first);
  const eyebrow = ctx.text("hero.eyebrow");
  const subtitle = ctx.text("hero.subtitle");
  const year = ctx.now.getFullYear();
  return (
    <section className={cx("fo-cover kit-hero", photos.length === 0 && "is-text")} data-section="hero" aria-labelledby="fo-title">
      {photos.length > 0 && (
        <div className="fo-cover-frame">
          <div className="fo-cover-media kit-hero-media">
            <HeroPhotos ctx={ctx} photos={photos} sizes="(min-width: 760px) 50vw, 100vw" />
          </div>
        </div>
      )}
      <div className="fo-cover-text kit-hero-text">
        <p className="fo-issue">
          <span>{eyebrow || f.newIn}</span>
          <span aria-hidden="true" className="fo-issue-rule" />
          <span>{year}</span>
        </p>
        <h1 id="fo-title" className="fo-title">
          {ctx.text("hero.title") || ctx.site.business.name}
        </h1>
        {subtitle && <p className="fo-sub">{subtitle}</p>}
        <a className="fo-link" href="#menu">
          {f.shopAll} <Arrow className="flip" />
        </a>
      </div>
    </section>
  );
}

function Badges({ ctx, item }: { ctx: SiteContext; item: MenuItem }) {
  if (!item.labelText && item.isAvailable) return null;
  return (
    <span className="fo-badges">
      {item.labelText && <span className="tag">{item.labelText}</span>}
      {!item.isAvailable && <span className="tag tag-out">{ctx.t.soldOut}</span>}
    </span>
  );
}

/** The featured pieces as a magazine spread: one large photo with its caption, two smaller ones beside it. */
function Edit({ ctx, f }: { ctx: SiteContext; f: F }) {
  const picks = ctx.sections.flatMap((s) => s.products).filter((p) => p.isFeatured && p.isAvailable).slice(0, 3);
  if (picks.length === 0) return null;
  return (
    <section className="fo-edit" data-section="highlights" aria-labelledby="fo-edit-title">
      <h2 id="fo-edit-title" className="fo-h2">
        {ctx.text("edit.title") || f.newIn}
      </h2>
      <ul className="plain fo-spread">
        {picks.map((item, i) => (
          <li key={item.id} className={i === 0 ? "is-lead" : undefined}>
            <button type="button" className="fo-pick" data-item-id={item.id}>
              <span data-k="photo" className="fo-pick-media">
                <ProductPicture item={item} sizes={i === 0 ? "(min-width: 760px) 50vw, 100vw" : "(min-width: 760px) 25vw, 50vw"} />
              </span>
              <span className="fo-pick-cap">
                <span className="fo-num">{pad(i + 1)}</span>
                <span className="fo-pick-name">{item.name}</span>
                <span className="fo-pick-price">{item.priceText}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Catalog({ ctx, c, f }: { ctx: SiteContext; c: C; f: F }) {
  return (
    <section id="menu" className="fo-catalog" data-section="menu" aria-labelledby="fo-catalog-title">
      <div className="fo-catalog-head">
        <h2 id="fo-catalog-title" className="fo-h2">
          {ctx.text("menu.title") || f.shop}
        </h2>
        <MenuSearch menuId="fo-chapters" placeholder={c.search} className="fo-search" inputClassName="fo-search-input" icon={<Search aria-hidden="true" />} />
      </div>
      <SiteMenu ctx={ctx} like="masonry" id="fo-chapters" empty={f.empty}>
      {ctx.sections.length > 1 && (
        <CategoryTabs categories={ctx.sections.map((s) => ({ anchor: s.anchor, name: s.name }))} label={c.collections} className="fo-tabs" tabClassName="fo-tab" activeClassName="is-active" />
      )}
      <div id="fo-chapters">
        {ctx.sections.map((section, si) => (
          <section key={section.id} id={section.anchor} className="fo-chapter" data-menu-cat aria-labelledby={`${section.anchor}-h`}>
            <header className="fo-chapter-head">
              <span className="fo-chapter-num" aria-hidden="true">
                {pad(si + 1)}
              </span>
              <h3 id={`${section.anchor}-h`} className="fo-chapter-title">
                {section.name}
              </h3>
              <span className="fo-chapter-count">{itemCount(section.products.length, ctx.locale)}</span>
            </header>
            <ul className="plain fo-grid kit-cards">
              {section.products.map((item, i) => {
                const sizes = sizeRange(details(item.description).sizes);
                return (
                  <li key={item.id} data-q={item.search} className={cx(i % 5 === 0 && section.products.length > 2 && "is-wide")}>
                    <button type="button" className={cx("fo-card kit-card", !item.isAvailable && "is-out")} data-item-id={item.id}>
                      <span className="fo-card-media kit-card-media kit-flush">
                        <ProductPicture item={item} sizes={i % 5 === 0 ? "(min-width: 760px) 50vw, 100vw" : "(min-width: 1100px) 25vw, (min-width: 760px) 33vw, 50vw"} />
                        <Badges ctx={ctx} item={item} />
                      </span>
                      <span className="fo-card-text">
                        <span className="fo-card-name">{item.name}</span>
                        <span className="fo-card-price">{item.priceText}</span>
                      </span>
                      {sizes && (
                        <span className="fo-card-sizes">
                          <span className="sr-only">{f.sizes}: </span>
                          {sizes}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <p className="fo-empty" data-menu-empty hidden>
          {f.empty}
        </p>
      </div>
      </SiteMenu>
    </section>
  );
}

/** The lookbook: photos only, in a magazine grid of tall and wide frames. Each opens the viewer. */
function Lookbook({ ctx, f, photos }: { ctx: SiteContext; f: F; photos: string[] }) {
  return (
    <section id="lookbook" className="fo-look" data-section="gallery" aria-labelledby="fo-look-title">
      <h2 id="fo-look-title" className="fo-h2">
        {ctx.text("gallery.title") || f.lookbook}
      </h2>
      <ul className="plain fo-look-grid" data-gallery>
        {photos.map((src, i) => (
          <li key={src + i} style={{ "--fo-ar": ["3 / 4", "4 / 5", "3 / 4", "1 / 1", "4 / 5", "3 / 4"][i % 6] } as CSSProperties}>
            <button data-k="photo fill" type="button" className="fs-tile" data-photo={i} aria-label={fill(f.openPhoto, { n: i + 1 })}>
              <Picture src={src} sizes="(min-width: 760px) 33vw, 50vw" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Letter({ ctx, c }: { ctx: SiteContext; c: C }) {
  return (
    <section id="story" className="fo-letter" data-section="story" aria-labelledby="fo-letter-title">
      <p className="fo-kicker">{c.letter}</p>
      <h2 id="fo-letter-title" className="fo-letter-title">
        {ctx.text("story.title") || ctx.t.story}
      </h2>
      <p className="fo-letter-text">{ctx.text("story.text")}</p>
      <p className="fo-sign">— {ctx.site.business.name}</p>
    </section>
  );
}

function Notes({ ctx, c }: { ctx: SiteContext; c: C }) {
  return (
    <section id="reviews" className="fo-notes" data-section="reviews" aria-labelledby="fo-notes-title">
      <h2 id="fo-notes-title" className="fo-h2">
        {c.notes}
      </h2>
      <ul className="plain fo-notes-list">
        {ctx.reviews.map((r, i) => (
          <li key={i}>
            <figure>
              <blockquote>
                <p>{r.quote}</p>
              </blockquote>
              {r.name && <figcaption>{r.name}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Store({ ctx, c, f }: { ctx: SiteContext; c: C; f: F }) {
  const { contact } = ctx;
  return (
    <section id="visit" className="fo-store" data-section="visit" aria-labelledby="fo-store-title">
      <h2 id="fo-store-title" className="fo-h2">
        {c.visitUs}
      </h2>
      <div className="fo-store-grid">
        <div className="fo-store-col">
          <ContactList ctx={ctx} className="contact fo-contact" />
          <div className="fo-store-actions">
            {contact.whatsapp && (
              <a data-k="btn" className="fo-btn" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> {f.askSize}
              </a>
            )}
            {contact.maps && (
              <a data-k="btn" className="fo-btn fo-btn-line" href={contact.maps} target="_blank" rel="noopener noreferrer">
                <Pin /> {ctx.t.directions}
              </a>
            )}
          </div>
        </div>
        {hasHours(ctx.hours) && (
          <div className="fo-store-col">
            <h3 className="fo-kicker">{ctx.t.hours}</h3>
            {ctx.today && <p className="fo-today">{ctx.today}</p>}
            <HoursList ctx={ctx} className="hours fo-hours" />
          </div>
        )}
      </div>
    </section>
  );
}

function Footer({ ctx, c }: { ctx: SiteContext; c: C }) {
  const social = socialAccounts(ctx.site);
  const line = ctx.text("footer.text");
  return (
    <footer className="fo-foot" data-section="footer">
      <FootName ctx={ctx} className="fo-wordmark" decorative />
      <div className="fo-foot-row">
        {ctx.sections.length > 0 && (
          <nav className="fo-foot-nav" aria-label={c.collections}>
            {ctx.sections.slice(0, 8).map((s) => (
              <a key={s.id} href={`#${s.anchor}`}>
                {s.name}
              </a>
            ))}
          </nav>
        )}
        {line && <p className="fo-foot-line">{line}</p>}
        {social.length > 0 && (
          <div className="fo-social kit-social" data-section="social">
            <SocialIcons accounts={social} className="fo-social-link" />
          </div>
        )}
      </div>
      <Credits ctx={ctx} className="credits fo-credits" />
    </footer>
  );
}
