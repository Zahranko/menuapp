import type { CSSProperties, ReactNode } from "react";
import { whatsappLink } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { choice, flag, image, list, number, text } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { BrandName, Credits, FootName, Logo, logoRoot, optionRoot, OrderContent, orderLink, ProductPicture, ProductSheet, SocialIcons, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts, type OrderButton } from "../_kit/options";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Instagram, Mail, Pin, WhatsApp } from "../_kit/icons";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { Picture } from "../_kit/Picture";
import { hasHours, type MenuItem } from "../_kit/site-data";
import { heroPhotos } from "../_kit/hero";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { orderCta, pageTop, SiteHeader, SiteHero, type Top } from "../_kit/Top";
import { themeVars, type Palette } from "../_kit/theme";
import { SiteMenu } from "../_kit/Menu";
import { copyFor, fill } from "../_premium/copy";
import { Lightbox } from "../_premium/Lightbox";
import { bestSellers, categorySections, categoryTree, menuSections, galleryPhotos, PAGE_PATHS, pageLinks, resolvePage, type Category, type Page, type Tree } from "../_premium/pages";
import { HeroWatch, Overlay } from "./Overlay";
import { numbered, ordered, SiteFooter, SiteGallery, SiteReviews, SiteStory, SiteVisit } from "../_kit/Sections";

/*
 * Template 022 "Maison" (Pro): a fine-dining house in the manner of a printed carte and a magazine feature.
 * A full-screen opening shot with the name set large, a single "Menu" button that opens a full-screen index,
 * chapters numbered in roman numerals, the menu set like a carte (courses centred, dotted leaders to prices),
 * asymmetric photo spreads and a quiet reserve bar. Its own component tree; only the page helpers are shared.
 */

const PALETTES = {
  noir: { bg: "#0D0C0B", surf: "#161412", ink: "#F1EBE1", muted: "#A39A8C", line: "#2C2823", photo: "#0A0908" },
  bordeaux: { bg: "#170B0E", surf: "#211116", ink: "#F4E8E4", muted: "#B89DA1", line: "#3A2329", photo: "#0F0709" },
  nuit: { bg: "#0B0F16", surf: "#121823", ink: "#ECEEF2", muted: "#9AA3B2", line: "#252D3B", photo: "#070A10" },
  olive: { bg: "#11150F", surf: "#191E16", ink: "#EEF0E6", muted: "#A2AA94", line: "#2C3427", photo: "#0A0C08" },
  ivory: { bg: "#F3EEE5", surf: "#EAE3D6", ink: "#1C1915", muted: "#686053", line: "#D6CCBB", photo: "#14110D" },
} satisfies Record<string, Palette>;

const FONTS = ["elegant", "classic", "naskh"] as const;
const HERO = ["cover", "slides", "split", "text"] as const;
const CARTE = ["leaders", "pictures", "centered"] as const;

type View = {
  /** The owner\'s header and opening layout (_kit/Top.tsx). */
  top: Top;
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  best: MenuItem[];
  photos: { src: string; caption: string | null }[];
  order: string | null;
  cta: string;
  /** The reserve bar's button: the owner's order button options (action, text, shape). */
  fab: OrderButton | null;
  carte: (typeof CARTE)[number];
  menuWord: string;
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

/** Chapter numbers: roman numerals in English, Arabic-Indic digits in Arabic. */
function numeral(n: number, locale: string): string {
  if (locale === "ar") return n.toLocaleString("ar-EG");
  return ROMAN[n - 1] ?? String(n);
}

export default function MaisonTemplate({ site, path = [], base, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copyFor(ctx.locale);
  const tree = categoryTree(site);
  const page = resolvePage(site, path, tree) ?? { kind: "home" };
  const root = base ?? `/${site.business.slug}`;
  const href = (p: string) => (p ? `${root}${p}` : root || "/");
  const phone = site.business.whatsApp;
  const v: View = {
    ctx,
    top: pageTop(ctx, { photos: heroPhotos(site.settings, "hero.images"), backdrop: ["cover", "slides"].includes(text(site.settings, "hero.layout") || "cover"), home: page.kind === "home" }),
    c,
    tree,
    page,
    href,
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree),
    order: phone ? whatsappLink(phone) : null,
    cta: text(site.settings, "cta.label") || c.order,
    fab: orderButton(site, { label: text(site.settings, "cta.label") || c.order }),
    carte: choice(site.settings, "carte.style", CARTE, "leaders"),
    menuWord: c.menu,
  };

  const font = choice(site.settings, "font", FONTS, "elegant");
  const style = themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: FONTS, defaultAccent: "#C9A45C", radius: { rounded: "0px", sharp: "0px" } }) as Record<string, string | number>;
  // Arabic reads best in a naskh for a house like this; "Classic" keeps the plain Arabic sans for owners who want it.
  if (ctx.locale === "ar" && font !== "classic") style["--fd"] = "var(--f-amiri), Georgia, serif";

  const layout = choice(site.settings, "hero.layout", HERO, "cover");
  const home = page.kind === "home";

  return (
    <div
      data-template="maison"
      {...logoRoot(ctx)}
      {...optionRoot(ctx, v.fab, true)}
      data-page={page.kind}
      className={cx("mx", fontVariables, `font-${font}`, `carte-${v.carte}`, flag(site.settings, "motion", true) && "mx-motion")}
      style={style as CSSProperties}
    >
      <TemplateStyles id="maison" />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={v.top} links={pageLinks(v, { home: c.home, menu: v.menuWord, best: c.best, gallery: c.gallery, visit: c.visit })} cta={orderCta(v.fab)} home={v.href("")}>
        <Header v={v} />
      </SiteHeader>
      {home ? (
        <main>
          <Home v={v} layout={layout} />
        </main>
      ) : (
        <main id="menu" data-section="menu" className="mx-page">
          {page.kind === "menu" && <MenuPage v={v} />}
          {page.kind === "category" && <CategoryPage v={v} category={page.category} />}
          {page.kind === "best" && <BestPage v={v} />}
          {page.kind === "gallery" && <GalleryPage v={v} />}
          {page.kind === "visit" && <VisitPage v={v} />}
        </main>
      )}
      <SiteFooter ctx={ctx} links={pageLinks(v, { home: c.home, menu: v.menuWord, best: c.best, gallery: c.gallery, visit: c.visit })} social={socialAccounts(site, SOCIAL_DEFAULT)}>
        <Footer v={v} />
      </SiteFooter>
      <ReserveBar v={v} />
      <ProductSheet ctx={ctx} />
      {v.photos.length > 0 && <Lightbox photos={v.photos} labels={{ close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo }} />}
      {home && <HeroWatch />}
    </div>
  );
}

/* ---------- header and full-screen menu ---------- */

function Header({ v }: { v: View }) {
  const { ctx, c, page, href, tree } = v;
  const name = ctx.site.business.name;
  const here = (kind: Page["kind"]) => (page.kind === kind ? ("page" as const) : undefined);
  const pages: { label: string; to: string; current?: "page" }[] = [
    { label: c.home, to: href(""), current: here("home") },
    { label: v.menuWord, to: href(PAGE_PATHS.menu), current: page.kind === "menu" || page.kind === "category" ? "page" : undefined },
    ...(v.best.length > 0 ? [{ label: c.best, to: href(PAGE_PATHS.best), current: here("best") }] : []),
    ...(v.photos.length > 0 ? [{ label: c.gallery, to: href(PAGE_PATHS.gallery), current: here("gallery") }] : []),
    { label: c.visit, to: href(PAGE_PATHS.visit), current: here("visit") },
  ];

  return (
    <header className="mx-head" data-section="header">
      <div className="mx-head-in">
        <div className="mx-head-start">
          <Overlay word={v.menuWord} openLabel={ctx.t.openMenu} closeLabel={ctx.t.close} label={c.pages} head={<span className="mx-overlay-name">{name}</span>}>
            <div className="mx-overlay-body">
              <nav className="mx-index" aria-label={c.pages}>
                <ol className="plain">
                  {pages.map((p, i) => (
                    <li key={p.to} style={{ "--i": i } as CSSProperties}>
                      <a href={p.to} aria-current={p.current}>
                        <span className="mx-index-n" aria-hidden="true">
                          {numeral(i + 1, ctx.locale)}
                        </span>
                        <span className="mx-index-label">{p.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              {tree.roots.length > 0 && (
                <nav className="mx-index-courses" aria-label={c.categories}>
                  <p className="mx-small">{c.categories}</p>
                  <ul className="plain">
                    {tree.roots.map((cat) => (
                      <li key={cat.id}>
                        <a href={href(cat.path)}>{cat.name}</a>
                        {cat.children.length > 0 && (
                          <ul className="plain">
                            {cat.children.map((sub) => (
                              <li key={sub.id}>
                                <a href={href(sub.path)}>{sub.name}</a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="mx-index-foot">
                {ctx.today && <p>{ctx.today}</p>}
                {ctx.site.business.address && <p>{ctx.site.business.address}</p>}
                {v.order && (
                  <a data-k="btn" className="mx-btn" href={v.order} target="_blank" rel="noopener noreferrer">
                    {v.cta}
                  </a>
                )}
              </div>
            </div>
          </Overlay>
        </div>
        <a className="mx-mark kit-lockup" href={href("")}>
          {ctx.image("logo") && <Logo ctx={ctx} className="mx-logo" sizes="40px" />}
          <BrandName ctx={ctx} className="mx-mark-name" />
        </a>
        <div className="mx-head-end">
          {v.order && (
            <a data-k="btn" className="mx-reserve" href={v.order} target="_blank" rel="noopener noreferrer" aria-label={v.cta}>
              <WhatsApp className="mx-reserve-icon" />
              <span className="mx-reserve-word">{v.cta}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- small pieces ---------- */

function Chapter({ n, title, id, locale, children, align = "center" }: { n: number; title: string; id: string; locale: string; children?: ReactNode; align?: "center" | "start" }) {
  return (
    <header className={cx("mx-chap-head", align === "start" && "is-start")}>
      <span className="mx-numeral" aria-hidden="true">
        {numeral(n, locale)}
      </span>
      <h2 id={id} className="mx-chap-title mx-clip">
        {title}
      </h2>
      {children}
    </header>
  );
}

function More({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="mx-more" href={href}>
      <span>{children}</span>
      <Arrow className="flip" />
    </a>
  );
}

/** One line of the carte: name, dotted leader, price; the description and labels beneath. Opens the dish sheet. */
function Dish({ v, item }: { v: View; item: MenuItem }) {
  const pictures = v.carte === "pictures";
  return (
    <li className="mx-dish-li">
      <button type="button" className={cx("mx-dish kit-card kit-card-pad", !item.isAvailable && "is-out", pictures && item.imageUrl && "has-pic")} data-item-id={item.id}>
        {pictures && item.imageUrl && (
          <span className="mx-dish-pic kit-card-media">
            <ProductPicture item={item} sizes="72px" />
          </span>
        )}
        <span className="mx-dish-main">
          <span className="mx-dish-row">
            <span className="mx-dish-name">{item.name}</span>
            <span className="mx-leader" aria-hidden="true" />
            <span className="mx-dish-price">{item.priceText}</span>
          </span>
          {item.description && <span className="mx-dish-desc">{item.description}</span>}
          {(item.labelText || !item.isAvailable) && (
            <span className="mx-dish-tags">
              {item.labelText && <span className="mx-tag">{item.labelText}</span>}
              {!item.isAvailable && <span className="mx-tag is-out">{v.ctx.t.soldOut}</span>}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function Dishes({ v, items }: { v: View; items: MenuItem[] }) {
  return (
    <ul className="plain mx-dishes kit-cards kit-rows">
      {items.map((item) => (
        <Dish key={item.id} v={v} item={item} />
      ))}
    </ul>
  );
}

function Rule() {
  return <span className="mx-rule" aria-hidden="true" />;
}

/* ---------- home ---------- */

function Hero({ v, layout }: { v: View; layout: (typeof HERO)[number] }) {
  const { ctx, c, href } = v;
  const s = ctx.site.settings;
  const images = list(s, "hero.images")
    .map((x) => image(x))
    .filter((x): x is string => !!x)
    .slice(0, 6);
  const first = images[0] ?? v.tree.items.find((p) => p.imageUrl)?.imageUrl ?? null;
  const media = layout !== "text" && first ? (layout === "slides" && images.length > 1 ? images : [first]) : null;
  const kind = !media ? "text" : layout === "slides" && media.length === 1 ? "cover" : layout;
  const eyebrow = text(s, "hero.eyebrow");
  const tagline = text(s, "hero.title");
  const shade = Math.min(90, Math.max(0, number(s, "hero.shade", 35)));

  return (
    <section className={cx("mx-hero", `is-${kind}`)} data-section="hero" aria-labelledby="mx-name" style={{ "--shade": shade / 100 } as CSSProperties}>
      {media && (
        <div className={cx("mx-hero-media", media.length > 1 && "is-slider")}>
          {media.length > 1 ? (
            // The slideshow: the shared hero slider (transition, autoplay, speed and buttons from the owner's options).
            <HeroPhotos ctx={ctx} photos={media} sizes="100vw" placement="corner" defaults={{ transition: "fade", controls: [] }} />
          ) : (
            <div className="mx-slide" style={{ "--i": 0 } as CSSProperties}>
              <Picture src={media[0]} sizes={kind === "split" ? "(min-width: 900px) 60vw, 100vw" : "100vw"} priority />
            </div>
          )}
        </div>
      )}
      <div className="mx-hero-copy">
        {eyebrow && <p className="mx-kicker mx-in">{eyebrow}</p>}
        <h1 id="mx-name" className={cx("mx-name", nameSize(ctx.site.business.name))}>
          <span className="mx-in">{ctx.site.business.name}</span>
        </h1>
        {tagline && <p className="mx-tagline mx-in">{tagline}</p>}
        <div className="mx-hero-actions mx-in">
          <a data-k="btn" className="mx-btn" href={href(PAGE_PATHS.menu)}>
            {c.browse}
          </a>
          {v.order && (
            <a className="mx-link" href={v.order} target="_blank" rel="noopener noreferrer">
              {v.cta}
            </a>
          )}
        </div>
      </div>
      {ctx.today && <p className="mx-hero-today">{ctx.today}</p>}
    </section>
  );
}

/** Very long names step down a size so the opening never runs to four lines or off the screen. */
function nameSize(name: string): string | null {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length));
  if (name.length > 30 || longest > 15) return "is-longer";
  if (name.length > 16 || longest > 10) return "is-long";
  return null;
}

function Home({ v, layout }: { v: View; layout: (typeof HERO)[number] }) {
  const { ctx, c, href, tree } = v;
  const prelude = ctx.text("hero.subtitle");
  const story = ctx.on("story") && ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  const showBest = ctx.on("best") && v.best.length > 0;
  const showGallery = ctx.on("gallery") && v.photos.length > 0;
  const showReviews = ctx.on("reviews") && ctx.reviews.length > 0;
  const num = numbered(ctx, { menu: true, best: showBest, story, gallery: showGallery, reviews: showReviews, visit: ctx.on("visit") });

  return (
    <>
      <SiteHero ctx={ctx} top={v.top} menuHref={href(PAGE_PATHS.menu)} actions={[{ href: href(PAGE_PATHS.menu), label: c.browse }, { href: href(PAGE_PATHS.visit), label: c.visit }]} title={ctx.site.business.name} subtitle={ctx.text("hero.title")}>
        <Hero v={v} layout={layout} />
      </SiteHero>

      {prelude && (
        <div className="mx-prelude">
          <Rule />
          <p className="mx-clip">{prelude}</p>
        </div>
      )}

      {ordered(ctx, {
        menu: (
          <section id="menu" className="mx-chap mx-carte" data-section="menu" aria-labelledby="carte-title">
            <Chapter n={num.menu} title={ctx.text("categories.title") || v.menuWord} id="carte-title" locale={ctx.locale} />
            <SiteMenu ctx={ctx} like={v.carte === "pictures" ? "list" : "compact"} id="kit-carte" sections={tree.roots.slice(0, 6).map((cat) => ({ id: cat.id, anchor: `h-${cat.id}`, name: cat.name, products: cat.all.slice(0, 3), link: { href: href(cat.path), label: fill(c.seeAll, { name: cat.name }) } }))}>
            {tree.roots.length > 0 && (
              <div className="mx-courses">
                {tree.roots.slice(0, 6).map((cat) => (
                  <div key={cat.id} className="mx-course">
                    <h3 className="mx-course-title">
                      <a href={href(cat.path)}>{cat.name}</a>
                    </h3>
                    {cat.children.length > 0 && <p className="mx-course-subs">{cat.children.map((s) => s.name).join("  /  ")}</p>}
                    <Dishes v={v} items={cat.all.slice(0, 3)} />
                    {cat.all.length > 3 && <More href={href(cat.path)}>{fill(c.seeAll, { name: cat.name })}</More>}
                  </div>
                ))}
              </div>
            )}
    </SiteMenu>
            <div className="mx-center">
              <a data-k="btn" className="mx-btn is-quiet" href={href(PAGE_PATHS.menu)}>
                {c.viewAll}
              </a>
            </div>
          </section>
        ),
        best: showBest && (
          <Signatures v={v} n={num.best} />
        ),
        story: story && (
          <SiteStory ctx={ctx} eyebrow={c.about} title={ctx.text("story.title") || ctx.t.story} more={{ href: href(PAGE_PATHS.visit), label: c.visit }}>
            <section id="story" className={cx("mx-chap mx-story", storyImage && "has-image")} data-section="story" aria-labelledby="story-title">
              <div className="mx-story-copy">
                <Chapter n={num.story} title={ctx.text("story.title") || ctx.t.story} id="story-title" locale={ctx.locale} align="start" />
                <p className="mx-story-text mx-drop">{story}</p>
                <More href={href(PAGE_PATHS.visit)}>{c.visit}</More>
              </div>
              {storyImage && (
                <figure data-k="photo" className="mx-story-media mx-frame mx-reveal">
                  <Picture src={storyImage} sizes="(min-width: 900px) 45vw, 100vw" />
                </figure>
              )}
            </section>
          </SiteStory>
        ),
        gallery: showGallery && (
          <SiteGallery ctx={ctx} title={ctx.text("gallery.title") || c.gallery} photos={v.photos} viewer more={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }}>
            <section id="gallery" className="mx-chap mx-film" data-section="gallery" aria-labelledby="gallery-title">
              <Chapter n={num.gallery} title={ctx.text("gallery.title") || c.gallery} id="gallery-title" locale={ctx.locale} />
              <ul className="plain mx-film-strip" data-gallery>
                {v.photos.slice(0, 8).map((p, i) => (
                  <li key={p.src} className={`mx-film-${i % 3}`}>
                    <button data-k="photo fill" type="button" className="mx-shot" data-photo={i} aria-label={p.caption ?? fill(c.photo, { n: i + 1 })}>
                      <Picture src={p.src} sizes="(min-width: 900px) 40vw, 80vw" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mx-center">
                <More href={href(PAGE_PATHS.gallery)}>{c.viewAll}</More>
              </div>
            </section>
          </SiteGallery>
        ),
        reviews: showReviews && (
          <SiteReviews ctx={ctx} title={ctx.t.reviews}>
            <Reviews v={v} n={num.reviews} />
          </SiteReviews>
        ),
        visit: ctx.on("visit") && (
          <SiteVisit ctx={ctx} title={ctx.t.visit} cta={v.order ? { href: v.order, label: v.cta } : null}>
            <Visit v={v} n={num.visit} />
          </SiteVisit>
        ),
      })}
    </>
  );
}

/** Best sellers on the home page: a tall photograph beside a numbered list. */
function Signatures({ v, n }: { v: View; n: number }) {
  const { ctx, c, href } = v;
  const items = v.best.slice(0, 5);
  const pics = v.best.filter((p) => p.imageUrl).slice(0, 2);
  return (
    <section id="best" className={cx("mx-chap mx-sig", pics.length > 0 && "has-image")} data-section="best" aria-labelledby="best-title">
      {pics.length > 0 && (
        <div className="mx-sig-media">
          <figure data-k="photo" className="mx-sig-main mx-reveal">
            <Picture src={pics[0].imageUrl!} sizes="(min-width: 900px) 45vw, 100vw" />
          </figure>
          {pics[1] && (
            <figure data-k="photo" className="mx-sig-second mx-reveal">
              <Picture src={pics[1].imageUrl!} sizes="(min-width: 900px) 18vw, 40vw" />
            </figure>
          )}
        </div>
      )}
      <div className="mx-sig-copy">
        <Chapter n={n} title={ctx.text("best.title") || c.best} id="best-title" locale={ctx.locale} align="start">
          <p className="mx-lead">{c.bestLead}</p>
        </Chapter>
        <ol className="plain mx-sig-list">
          {items.map((item, i) => (
            <li key={item.id}>
              <button type="button" className={cx("mx-sig-item", !item.isAvailable && "is-out")} data-item-id={item.id}>
                <span className="mx-sig-n" aria-hidden="true">
                  {numeral(i + 1, ctx.locale)}
                </span>
                <span className="mx-sig-body">
                  <span className="mx-sig-name">{item.name}</span>
                  {item.description && <span className="mx-dish-desc">{item.description}</span>}
                  {!item.isAvailable && <span className="mx-tag is-out">{ctx.t.soldOut}</span>}
                </span>
                <span className="mx-dish-price">{item.priceText}</span>
              </button>
            </li>
          ))}
        </ol>
        <More href={href(PAGE_PATHS.best)}>{c.viewAll}</More>
      </div>
    </section>
  );
}

function Reviews({ v, n }: { v: View; n: number }) {
  const { ctx } = v;
  return (
    <section id="reviews" className="mx-chap mx-reviews" data-section="reviews" aria-labelledby="reviews-title">
      <Chapter n={n} title={ctx.t.reviews} id="reviews-title" locale={ctx.locale} />
      <ul className="plain mx-quotes">
        {ctx.reviews.map((r, i) => (
          <li key={i}>
            <figure className="mx-quote mx-clip">
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

function Hours({ v }: { v: View }) {
  const { ctx } = v;
  return (
    <dl className="mx-hours">
      {ctx.hours.map((row) => (
        <div key={row.day} className={cx("mx-hours-row", row.today && "is-today")}>
          <dt>
            {row.name}
            {row.today && <span className="mx-tag">{ctx.t.today}</span>}
          </dt>
          <dd>{row.time ?? ctx.t.closed}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Hours, address and the ways to get in touch. */
function Visit({ v, n, heading = true }: { v: View; n?: number; heading?: boolean }) {
  const { ctx, c } = v;
  const { business } = ctx.site;
  const { contact } = ctx;
  return (
    <section id="visit" className="mx-chap mx-visit" data-section="visit" aria-labelledby={heading ? "visit-title" : "visit-hours"}>
      {heading && n !== undefined && <Chapter n={n} title={ctx.t.visit} id="visit-title" locale={ctx.locale} />}
      <div className="mx-visit-grid">
        {hasHours(ctx.hours) && (
          <div className="mx-visit-hours">
            <h3 id="visit-hours" className="mx-small">
              {ctx.t.hours}
            </h3>
            <Hours v={v} />
          </div>
        )}
        <div className="mx-visit-where">
          {!hasHours(ctx.hours) && (
            <h3 id="visit-hours" className="mx-small">
              {c.findUs}
            </h3>
          )}
          {business.address && (
            <address className="mx-address">
              <span className="mx-small">{ctx.t.address}</span>
              <bdi>{business.address}</bdi>
            </address>
          )}
          <ul className="plain mx-ways">
            {contact.maps && (
              <li>
                <a href={contact.maps} target="_blank" rel="noopener noreferrer">
                  <Pin /> {ctx.t.directions}
                </a>
              </li>
            )}
            {business.whatsApp && contact.whatsapp && (
              <li>
                <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                  <WhatsApp /> <bdi dir="ltr">{business.whatsApp}</bdi>
                </a>
              </li>
            )}
            {business.email && contact.email && (
              <li>
                <a href={contact.email}>
                  <Mail /> <bdi>{business.email}</bdi>
                </a>
              </li>
            )}
            {contact.instagram && (
              <li>
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram /> {ctx.t.instagram}
                </a>
              </li>
            )}
          </ul>
          {v.order && (
            <a data-k="btn" className="mx-btn" href={v.order} target="_blank" rel="noopener noreferrer">
              {v.cta}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- inner pages ---------- */

function Crumbs({ v, trail }: { v: View; trail: { label: string; href?: string }[] }) {
  const items = [{ label: v.c.home, href: v.href("") }, ...trail];
  return (
    <nav className="mx-crumbs" aria-label={v.c.breadcrumb}>
      <ol className="plain">
        {items.map((item, i) => (
          <li key={i}>{item.href && i < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

function PageHead({ v, trail, title, lead, children }: { v: View; trail: { label: string; href?: string }[]; title: string; lead?: string | null; children?: ReactNode }) {
  return (
    <header className="mx-page-head">
      <Crumbs v={v} trail={trail} />
      <h1 className="mx-page-title">
        <span className="mx-in">{title}</span>
      </h1>
      {lead && <p className="mx-page-lead">{lead}</p>}
      {children}
    </header>
  );
}

/** A course of the carte: centred title between rules, its dishes, then each sub-course. */
function Course({ v, cat, n, link = true }: { v: View; cat: Category; n: number; link?: boolean }) {
  const { ctx, href } = v;
  return (
    <section id={`m-${cat.id}`} className="mx-course-full" aria-labelledby={`m-${cat.id}-h`}>
      <header className="mx-course-head">
        <span className="mx-numeral" aria-hidden="true">
          {numeral(n, ctx.locale)}
        </span>
        <h2 id={`m-${cat.id}-h`} className="mx-course-big mx-clip">
          {link ? <a href={href(cat.path)}>{cat.name}</a> : cat.name}
        </h2>
        <p className="mx-small">{itemCount(cat.all.length, ctx.locale)}</p>
      </header>
      {cat.products.length > 0 && <Dishes v={v} items={cat.products} />}
      {cat.children.map((sub) => (
        <div key={sub.id} className="mx-subcourse">
          <h3 className="mx-sub-title">
            <a href={href(sub.path)}>{sub.name}</a>
          </h3>
          <Dishes v={v} items={sub.products} />
        </div>
      ))}
    </section>
  );
}

function MenuPage({ v }: { v: View }) {
  const { tree, c, ctx, href } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: v.menuWord }]} title={ctx.text("categories.title") || v.menuWord} lead={itemCount(tree.items.length, ctx.locale)}>
        {tree.roots.length > 1 && (
          <nav className="mx-tabs" data-k="catnav" aria-label={c.categories}>
            {tree.roots.map((cat) => (
              <a key={cat.id} href={`#m-${cat.id}`}>
                {cat.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>
      <SiteMenu ctx={ctx} like={v.carte === "pictures" ? "list" : "compact"} level={2} page ownNav sections={menuSections(tree.roots, href, (cat) => fill(c.seeAll, { name: cat.name }))}>
      <div className="mx-carte-page">
        {tree.roots.map((cat, i) => (
          <Course key={cat.id} v={v} cat={cat} n={i + 1} />
        ))}
      </div>
</SiteMenu>
    </>
  );
}

function CategoryPage({ v, category }: { v: View; category: Category }) {
  const { c, href, ctx } = v;
  const parent = category.parent;
  const family = parent ?? category;
  const trail = [{ label: v.menuWord, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];

  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} lead={itemCount(category.all.length, ctx.locale)}>
        {family.children.length > 0 && (
          <nav className="mx-tabs" aria-label={fill(c.subcategories, { name: family.name })}>
            <a href={href(family.path)} aria-current={category === family ? "page" : undefined}>
              {c.everything}
            </a>
            {family.children.map((sub) => (
              <a key={sub.id} href={href(sub.path)} aria-current={sub === category ? "page" : undefined}>
                {sub.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>

      {category.cover && (
        <figure className="mx-band mx-reveal">
          <Picture src={category.cover} sizes="100vw" priority />
        </figure>
      )}

      {category.children.length > 0 && (
        <section className="mx-contents" aria-labelledby="subs-title">
          <h2 id="subs-title" className="mx-small">
            {fill(c.subcategories, { name: category.name })}
          </h2>
          <ol className="plain">
            {category.children.map((sub, i) => (
              <li key={sub.id}>
                <a href={href(sub.path)}>
                  <span className="mx-contents-n" aria-hidden="true">
                    {numeral(i + 1, ctx.locale)}
                  </span>
                  <span className="mx-contents-name">{sub.name}</span>
                  <span className="mx-leader" aria-hidden="true" />
                  <span className="mx-contents-count">{itemCount(sub.all.length, ctx.locale)}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <SiteMenu ctx={ctx} like={v.carte === "pictures" ? "list" : "compact"} level={2} page sections={categorySections(category, href, fill(c.inThis, { name: category.name }), (sub) => fill(c.seeAll, { name: sub.name }))} flat={category.children.length === 0 ? { label: category.name } : undefined}>
      <div className="mx-carte-page">
        <section className="mx-course-full" aria-label={category.name}>
          {category.products.length > 0 && (
            <>
              {category.children.length > 0 && <h2 className="mx-sub-title">{fill(c.inThis, { name: category.name })}</h2>}
              <Dishes v={v} items={category.products} />
            </>
          )}
          {category.children.map((sub) => (
            <div key={sub.id} id={`s-${sub.id}`} className="mx-subcourse">
              <h2 className="mx-sub-title">
                <a href={href(sub.path)}>{sub.name}</a>
              </h2>
              <Dishes v={v} items={sub.products} />
            </div>
          ))}
        </section>
      </div>
</SiteMenu>
    </>
  );
}

function BestPage({ v }: { v: View }) {
  const { ctx, c } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: c.best }]} title={ctx.text("best.title") || c.best} lead={c.bestLead} />
      <section className="mx-plates-wrap" aria-label={c.best}>
        <ol className="plain mx-plates">
          {v.best.map((item, i) => (
            <li key={item.id} className={cx(!item.imageUrl && "no-pic")}>
              <button type="button" className={cx("mx-plate", !item.isAvailable && "is-out")} data-item-id={item.id}>
                {item.imageUrl && (
                  <span className="mx-plate-pic mx-reveal">
                    <ProductPicture item={item} sizes="(min-width: 900px) 40vw, 100vw" />
                  </span>
                )}
                <span className="mx-plate-n" aria-hidden="true">
                  {numeral(i + 1, ctx.locale)}
                </span>
                <span className="mx-plate-name">{item.name}</span>
                {item.description && <span className="mx-dish-desc">{item.description}</span>}
                <span className="mx-plate-foot">
                  <span className="mx-dish-price">{item.priceText}</span>
                  {item.labelText && <span className="mx-tag">{item.labelText}</span>}
                  {!item.isAvailable && <span className="mx-tag is-out">{ctx.t.soldOut}</span>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

/** Frame shapes the gallery wall cycles through; every photo is cropped to its frame, whatever its own shape. */
const WALL_SHAPES = ["3 / 4", "4 / 5", "1 / 1", "2 / 3", "4 / 3"];

function GalleryPage({ v }: { v: View }) {
  const { c, ctx } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: c.gallery }]} title={ctx.text("gallery.title") || c.gallery} lead={c.galleryLead} />
      <section className="mx-wall-wrap" aria-label={c.gallery}>
        <ul className="plain mx-wall" data-gallery>
          {v.photos.map((p, i) => (
            <li key={p.src} style={{ "--ar": WALL_SHAPES[i % WALL_SHAPES.length] } as CSSProperties}>
              <button type="button" className="mx-wall-shot" data-photo={i} aria-label={p.caption ?? fill(c.photo, { n: i + 1 })}>
                <Picture src={p.src} sizes="(min-width: 900px) 33vw, 50vw" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function VisitPage({ v }: { v: View }) {
  const { ctx } = v;
  const story = ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  return (
    <>
      <PageHead v={v} trail={[{ label: v.c.visit }]} title={ctx.t.visit} lead={ctx.today} />
      <SiteVisit ctx={ctx} heading={false} title={ctx.t.visit} cta={v.order ? { href: v.order, label: v.cta } : null}>
        <Visit v={v} heading={false} />
      </SiteVisit>
      {story && (
        <SiteStory ctx={ctx} eyebrow={v.c.about} title={ctx.text("story.title") || ctx.t.story}>
          <section className={cx("mx-chap mx-story", storyImage && "has-image")} data-section="story" aria-labelledby="story-title">
            <div className="mx-story-copy">
              <Chapter n={1} title={ctx.text("story.title") || ctx.t.story} id="story-title" locale={ctx.locale} align="start" />
              <p className="mx-story-text mx-drop">{story}</p>
            </div>
            {storyImage && (
              <figure data-k="photo" className="mx-story-media mx-frame mx-reveal">
                <Picture src={storyImage} sizes="(min-width: 900px) 45vw, 100vw" />
              </figure>
            )}
          </section>
        </SiteStory>
      )}
      {ctx.on("reviews") && ctx.reviews.length > 0 && (
        <SiteReviews ctx={ctx} title={ctx.t.reviews}>
          <Reviews v={v} n={story ? 2 : 1} />
        </SiteReviews>
      )}
    </>
  );
}

/* ---------- footer and reserve bar ---------- */

/** What the footer showed before the owner could choose (also the manifest's "social.show" default). */
const SOCIAL_DEFAULT = ["instagram", "whatsapp"] as const;

function Footer({ v }: { v: View }) {
  const { ctx, c, href, tree } = v;
  const { site, contact } = ctx;
  const tagline = ctx.text("footer.text");
  const social = socialAccounts(site, SOCIAL_DEFAULT);
  return (
    <footer className="mx-foot" data-section="footer">
      <div className="mx-foot-in">
        <Rule />
        <FootName ctx={ctx} className="mx-foot-name" />
        {tagline && <p className="mx-foot-text">{tagline}</p>}
        <nav className="mx-foot-nav" aria-label={c.pages}>
          <a href={href(PAGE_PATHS.menu)}>{v.menuWord}</a>
          {v.best.length > 0 && <a href={href(PAGE_PATHS.best)}>{c.best}</a>}
          {v.photos.length > 0 && <a href={href(PAGE_PATHS.gallery)}>{c.gallery}</a>}
          <a href={href(PAGE_PATHS.visit)}>{c.visit}</a>
        </nav>
        {tree.roots.length > 0 && (
          <nav className="mx-foot-courses" aria-label={c.categories}>
            {tree.roots.slice(0, 8).map((cat) => (
              <a key={cat.id} href={href(cat.path)}>
                {cat.name}
              </a>
            ))}
          </nav>
        )}
        {(site.business.address || ctx.today) && (
          <p className="mx-foot-where">
            {site.business.address && <bdi>{site.business.address}</bdi>}
            {site.business.address && ctx.today && <br />}
            {ctx.today}
          </p>
        )}
        {(social.length > 0 || contact.maps) && (
          <div className="mx-socials">
            <SocialIcons accounts={social} />
            {contact.maps && (
              <a href={contact.maps} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.directions}>
                <Pin />
              </a>
            )}
          </div>
        )}
      </div>
      <Credits ctx={ctx} className="mx-credits" />
    </footer>
  );
}

/** A slim bar at the foot of the screen: today's hours and the reserve button (or the menu when there is no WhatsApp). */
function ReserveBar({ v }: { v: View }) {
  const { ctx, href, page } = v;
  const toMenu = page.kind !== "menu" && page.kind !== "category";
  const order = v.fab;
  if (!order && !toMenu) return null;
  return (
    <div className="mx-bar">
      <p className="mx-bar-note">{ctx.today ?? ctx.site.business.name}</p>
      <div className="mx-bar-actions">
        {toMenu && (
          <a className={cx("mx-bar-menu", order && "is-secondary")} href={href(PAGE_PATHS.menu)}>
            {v.menuWord}
          </a>
        )}
        {order && (
          <a className="mx-bar-cta kit-order" {...orderLink(order)}>
            <OrderContent order={order} />
          </a>
        )}
      </div>
    </div>
  );
}
