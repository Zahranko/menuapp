import type { CSSProperties, ReactNode } from "react";
import { whatsappLink } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { choice, flag, image, list, text } from "@/lib/settings";
import type { PublicSite, Settings, TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, FootName, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, ProductSheet, SocialIcons, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Pin, WhatsApp } from "../_kit/icons";
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
import { CameraIcon, CupcakeIcon, Doodles, Heart, HeartIcon, HomeIcon, PinIcon, Swash, Wave } from "./art";
import { Carousel } from "./Carousel";
import { wordsFor } from "./words";
import { SiteFooter, SiteGallery, SiteReviews, SiteStory, SiteVisit, ordered } from "../_kit/Sections";

/*
 * Template 026 "Bloom" (Pro): a dreamy pastel patisserie. Its own component tree (not PremiumSite):
 * a floating icon dock for navigation (bottom of the phone screen, top of the desktop), a hero photo in a
 * breathing blob, categories as floating bubbles, cakes on scalloped lace doilies, a "today's bakes" carousel,
 * a scrapbook gallery of taped polaroids and a visit card with the week drawn as a little schedule.
 */

const PALETTES = {
  strawberry: {
    bg: "#FFF5F7",
    surf: "#FFFFFF",
    ink: "#4A1D2B",
    muted: "#85505F",
    line: "#F6D5DE",
    band: "#FFE4EB",
    foot: "#FFD9E3",
    blob1: "#FFC7D6",
    blob2: "#FFE7CF",
    blob3: "#F3DDF7",
    sp1: "#F27BA3",
    sp2: "#7FCDB4",
    sp3: "#FFC65C",
  },
  pistachio: {
    bg: "#F6FAF1",
    surf: "#FFFFFF",
    ink: "#22351F",
    muted: "#536A4D",
    line: "#DCEAD2",
    band: "#E6F2DB",
    foot: "#D9EBCB",
    blob1: "#CBE7B8",
    blob2: "#FFEDC2",
    blob3: "#F8D9E1",
    sp1: "#8CC46F",
    sp2: "#F49AB5",
    sp3: "#F7C95A",
  },
  lavender: {
    bg: "#F8F5FE",
    surf: "#FFFFFF",
    ink: "#2C2146",
    muted: "#625785",
    line: "#E6DEF8",
    band: "#EEE7FC",
    foot: "#E4D9FA",
    blob1: "#DCCDFA",
    blob2: "#FFDCE8",
    blob3: "#D4EAFB",
    sp1: "#A88BEB",
    sp2: "#F59BBE",
    sp3: "#8FD0EE",
  },
  vanilla: {
    bg: "#FFFBEF",
    surf: "#FFFFFF",
    ink: "#45291E",
    muted: "#7A5A47",
    line: "#F3E6C4",
    band: "#FFF2CF",
    foot: "#FFEAB8",
    blob1: "#FFE6A6",
    blob2: "#FFD9CF",
    blob3: "#E5F0D2",
    sp1: "#F2A65A",
    sp2: "#E98AA6",
    sp3: "#86C7A9",
  },
} satisfies Record<string, Palette>;

const LAYOUTS = ["blob", "slider", "bubbles", "text"] as const;

/** Sites saved with Bloom's first version keep a close look: old theme and hero names map onto the new ones. */
const OLD_THEMES: Record<string, keyof typeof PALETTES> = { blush: "strawberry", butter: "vanilla", lilac: "lavender", cocoa: "strawberry" };
const OLD_LAYOUTS: Record<string, (typeof LAYOUTS)[number]> = { cover: "blob", split: "blob", slides: "bubbles" };

function upgrade(site: PublicSite): PublicSite {
  const s: Settings = site.settings;
  const theme = typeof s.theme === "string" ? OLD_THEMES[s.theme] : undefined;
  const layout = typeof s["hero.layout"] === "string" ? OLD_LAYOUTS[s["hero.layout"]] : undefined;
  if (!theme && !layout) return site;
  return { ...site, settings: { ...s, ...(theme && { theme }), ...(layout && { "hero.layout": layout }) } };
}

type View = {
  /** The owner\'s header and opening layout (_kit/Top.tsx). */
  top: Top;
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  w: ReturnType<typeof wordsFor>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  best: MenuItem[];
  photos: { src: string; caption: string | null }[];
  order: string | null;
  cta: string;
};

/** Template 026 "Bloom" (Pro): a dreamy pastel bakery site with cake-stand cards, floating bubbles and a scrapbook gallery. */
export default function BloomTemplate(props: TemplateProps & { now?: Date }) {
  const site = upgrade(props.site);
  const ctx = siteContext(site, props.now);
  const c = copyFor(ctx.locale);
  const tree = categoryTree(site);
  const page = resolvePage(site, props.path ?? [], tree) ?? { kind: "home" };
  const root = props.base ?? `/${site.business.slug}`;
  const s = site.settings;
  const v: View = {
    ctx,
    top: pageTop(ctx, { photos: heroPhotos(site.settings, "hero.images"), backdrop: false, home: page.kind === "home" }),
    c,
    w: wordsFor(ctx.locale),
    tree,
    page,
    href: (p) => (p ? `${root}${p}` : root || "/"),
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree),
    order: site.business.whatsApp ? whatsappLink(site.business.whatsApp) : null,
    cta: text(s, "cta.label") || c.order,
  };
  const order = orderButton(site, { label: v.cta });
  const style = themeVars(s, ctx.locale, { palettes: PALETTES, fonts: ["soft", "round", "classic"], defaultAccent: "#D6467A", radius: { rounded: "28px", sharp: "28px" } });

  return (
    <div
      data-template="bloom"
      {...logoRoot(ctx)}
      {...optionRoot(ctx, order)}
      data-page={page.kind}
      className={cx("bl", fontVariables, ctx.rtl && "is-ar", flag(s, "motion", true) && "motion", flag(s, "doodles", true) && "doodly")}
      style={style}
    >
      <TemplateStyles id="bloom" />
      <TopBars ctx={ctx} />
      <SiteHeader ctx={ctx} top={v.top} links={pageLinks(v, { home: c.home, menu: c.menu, best: c.best, gallery: c.gallery, visit: c.visit })} cta={orderCta(order)} home={v.href("")}>
        <Header v={v} />
      </SiteHeader>
      {page.kind === "home" ? (
        <main className="home">
          <Home v={v} />
        </main>
      ) : (
        <main id="menu" data-section="menu" className="inner">
          {page.kind === "menu" && <MenuPage v={v} />}
          {page.kind === "category" && <CategoryPage v={v} category={page.category} />}
          {page.kind === "best" && <BestPage v={v} />}
          {page.kind === "gallery" && <GalleryPage v={v} />}
          {page.kind === "visit" && <VisitPage v={v} />}
        </main>
      )}
      <SiteFooter ctx={ctx} links={pageLinks(v, { home: c.home, menu: c.menu, best: c.best, gallery: c.gallery, visit: c.visit })} social={socialAccounts(site, SOCIAL_DEFAULT)}>
        <Footer v={v} />
      </SiteFooter>
      <OrderFab order={order} />
      <ProductSheet ctx={ctx} />
      {v.photos.length > 0 && <Lightbox photos={v.photos} labels={{ close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo }} />}
    </div>
  );
}

/* ---------- header and the floating dock ---------- */

function Header({ v }: { v: View }) {
  const { ctx, c, page, href } = v;
  const current = (...kinds: Page["kind"][]) => (kinds.includes(page.kind) ? ("page" as const) : undefined);
  const links: { href: string; label: string; icon: ReactNode; current?: "page" }[] = [
    { href: href(""), label: c.home, icon: <HomeIcon />, current: current("home") },
    { href: href(PAGE_PATHS.menu), label: c.menu, icon: <CupcakeIcon />, current: current("menu", "category") },
    ...(v.best.length > 0 ? [{ href: href(PAGE_PATHS.best), label: c.best, icon: <HeartIcon />, current: current("best") }] : []),
    ...(v.photos.length > 0 ? [{ href: href(PAGE_PATHS.gallery), label: c.gallery, icon: <CameraIcon />, current: current("gallery") }] : []),
    { href: href(PAGE_PATHS.visit), label: c.visit, icon: <PinIcon />, current: current("visit") },
  ];
  return (
    <header className="top" data-section="header">
      <div className="top-in kit-head">
        <a className="brand kit-lockup" href={href("")}>
          <Logo ctx={ctx} className="brand-logo" sizes="48px" />
          <BrandName ctx={ctx} className="brand-name" />
        </a>
        <nav className="dock" aria-label={c.pages} data-k="bar">
          {links.map((l) => (
            <a key={l.href} href={l.href} aria-current={l.current}>
              <span className="dock-ic">{l.icon}</span>
              <span className="dock-label">{l.label}</span>
            </a>
          ))}
        </nav>
        {v.order && (
          <a data-k="btn" className="order-pill" href={v.order} target="_blank" rel="noopener noreferrer">
            <WhatsApp />
            <span>{v.cta}</span>
          </a>
        )}
      </div>
    </header>
  );
}

/* ---------- building blocks ---------- */

/** A product on a cake stand: round photo on a scalloped lace doily, stickers for labels, then name and price. */
function CakeCard({ v, item, rank }: { v: View; item: MenuItem; rank?: number }) {
  return (
    <button type="button" className={cx("cake kit-card kit-card-pad", !item.isAvailable && "out")} data-item-id={item.id}>
      <span className="stand">
        <span className="doily" aria-hidden="true" />
        <span data-k="photo" className="plate">
          <ProductPicture item={item} sizes="(min-width: 1100px) 220px, (min-width: 700px) 30vw, 45vw" />
        </span>
        {rank !== undefined && <span className="rosette">{rank}</span>}
        {(item.labelText || !item.isAvailable) && (
          <span className="stickers">
            {item.labelText && <span className="sticker-tag">{item.labelText}</span>}
            {!item.isAvailable && <span className="sticker-tag sticker-out">{v.ctx.t.soldOut}</span>}
          </span>
        )}
      </span>
      <span className="pedestal" aria-hidden="true" />
      <span className="cake-name">{item.name}</span>
      {item.description && <span className="cake-desc">{item.description}</span>}
      <span className="cake-price">{item.priceText}</span>
    </button>
  );
}

function Cakes({ v, items, rank = false }: { v: View; items: MenuItem[]; rank?: boolean }) {
  return (
    <ul className="plain cakes kit-cards">
      {items.map((item, i) => (
        <li key={item.id} className="reveal" style={{ "--i": i % 4 } as CSSProperties}>
          <CakeCard v={v} item={item} rank={rank ? i + 1 : undefined} />
        </li>
      ))}
    </ul>
  );
}

/** Categories as floating bubbles: a round photo, the name and how many treats are inside. */
function Bubbles({ v, categories, current }: { v: View; categories: Category[]; current?: Category }) {
  return (
    <ul className="plain bubbles kit-cards">
      {categories.map((cat, i) => (
        <li key={cat.id} style={{ "--i": i } as CSSProperties}>
          <a className="bubble kit-cat" href={v.href(cat.path)} aria-current={cat === current ? "page" : undefined}>
            <span className="bubble-pic kit-cat-media">{cat.cover ? <Picture src={cat.cover} sizes="56px" /> : <Heart className="bubble-heart" />}</span>
            <span className="bubble-txt">
              <b>{cat.name}</b>
              <small>{itemCount(cat.all.length, v.ctx.locale)}</small>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Crumbs({ v, trail }: { v: View; trail: { label: string; href?: string }[] }) {
  const items = [{ label: v.c.home, href: v.href("") }, ...trail];
  return (
    <nav className="crumbs" aria-label={v.c.breadcrumb}>
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
    <header className="page-head">
      <span className="mesh" aria-hidden="true" />
      <Doodles set="head" />
      <div className="page-head-in">
        <Crumbs v={v} trail={trail} />
        <h1 className="page-title">
          <span>{title}</span>
          <Swash />
        </h1>
        {lead && <p className="page-lead">{lead}</p>}
        {children}
      </div>
      <Wave to="var(--bg)" />
    </header>
  );
}

function Heading({ id, title, link }: { id: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="heading">
      <h2 id={id}>{title}</h2>
      {link && (
        <a className="link" href={link.href}>
          {link.label} <Arrow className="flip" />
        </a>
      )}
    </div>
  );
}

/** Taped polaroids. Each one opens the lightbox at its photo. */
function Scrapbook({ v, photos, offset = 0 }: { v: View; photos: { src: string; caption: string | null }[]; offset?: number }) {
  return (
    <ul className="plain scrapbook" data-gallery>
      {photos.map((p, i) => (
        <li key={p.src} className="reveal" style={{ "--i": i } as CSSProperties}>
          <button type="button" className="polaroid" data-photo={i + offset} aria-label={p.caption ?? fill(v.c.photo, { n: i + offset + 1 })}>
            <span data-k="photo fill" className="pol-pic">
              <Picture src={p.src} sizes="(min-width: 900px) 280px, 45vw" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- home ---------- */

function Hero({ v }: { v: View }) {
  const { ctx, c, href } = v;
  const s = ctx.site.settings;
  const layout = choice(s, "hero.layout", LAYOUTS, "blob");
  const images = list(s, "hero.images")
    .map((x) => image(x))
    .filter((x): x is string => !!x)
    .slice(0, 3);
  const fallback = v.tree.items.find((p) => p.imageUrl)?.imageUrl ?? null;
  const pics = images.length ? images : fallback ? [fallback] : [];
  const art = layout !== "text" && pics.length > 0;
  const title = text(s, "hero.title") || ctx.site.business.name;
  const eyebrow = text(s, "hero.eyebrow");
  const subtitle = text(s, "hero.subtitle");

  return (
    <section className={cx("hero", art ? (layout === "slider" ? "hero-blob hero-slider" : `hero-${layout}`) : "hero-text")} data-section="hero">
      <span className="mesh" aria-hidden="true" />
      <Doodles set="hero" />
      <div className="hero-in">
        <div className="hero-copy">
          {eyebrow && (
            <p className="hand-note">
              <span>{eyebrow}</span>
              <Swash />
            </p>
          )}
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-sub">{subtitle}</p>}
          <div className="actions">
            <a data-k="btn" className="btn" href={href(PAGE_PATHS.menu)}>
              {c.browse} <Arrow className="flip" />
            </a>
            {v.order && (
              <a data-k="btn" className="btn btn-soft" href={v.order} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> {v.cta}
              </a>
            )}
          </div>
        </div>
        {art && (
          <div className="hero-art">
            {layout === "blob" || layout === "slider" ? (
              <div className="blob">
                <HeroPhotos ctx={ctx} photos={layout === "slider" ? pics : pics.slice(0, 1)} sizes="(min-width: 900px) 46vw, 92vw" />
              </div>
            ) : (
              <div className={`orbs orbs-${pics.length}`}>
                {pics.map((src, i) => (
                  <div key={src + i} className={`orb orb-${i + 1}`}>
                    <Picture src={src} sizes={i === 0 ? "(min-width: 900px) 34vw, 64vw" : "(min-width: 900px) 18vw, 34vw"} priority={i === 0} />
                  </div>
                ))}
              </div>
            )}
            {ctx.today && (
              <p className="today-sticker">
                <span>{ctx.today}</span>
              </p>
            )}
          </div>
        )}
      </div>
      {!art && ctx.today && <p className="today-line hero-today">{ctx.today}</p>}
      <Wave to="var(--band)" />
    </section>
  );
}

function Home({ v }: { v: View }) {
  const { ctx, c, href, tree } = v;
  const story = ctx.on("story") && ctx.text("story.text");
  const bakes = v.best.length > 0 ? v.best.slice(0, 10) : tree.items.filter((p) => p.imageUrl).slice(0, 8);
  return (
    <>
      <SiteHero ctx={ctx} top={v.top} menuHref={href(PAGE_PATHS.menu)} actions={[{ href: href(PAGE_PATHS.menu), label: c.browse }, { href: href(PAGE_PATHS.visit), label: c.visit }]}>
        <Hero v={v} />
      </SiteHero>

      {ordered(ctx, {
        menu: (
          <section id="menu" className="band sec-cats" data-section="menu" aria-labelledby="cats-title">
            <div className="wrap">
              <Heading id="cats-title" title={ctx.text("categories.title") || c.categories} link={{ href: href(PAGE_PATHS.menu), label: c.viewAll }} />
              {tree.roots.length > 0 && <Bubbles v={v} categories={tree.roots} />}
            </div>
            <Wave to="var(--bg)" />
          </section>
        ),
        best: ctx.on("best") && bakes.length > 0 && (
          <section id="best" className="sec sec-bakes" data-section="best" aria-labelledby="bakes-title">
            <div className="wrap">
              <Heading id="bakes-title" title={ctx.text("best.title") || c.best} link={v.best.length > 0 ? { href: href(PAGE_PATHS.best), label: c.viewAll } : undefined} />
            </div>
            <Carousel autoplay={flag(ctx.site.settings, "carousel.autoplay", true)} label={ctx.text("best.title") || c.best} labels={{ pause: v.w.pause, play: v.w.play, prev: v.w.prev, next: v.w.next }}>
              {bakes.map((item) => (
                <li key={item.id}>
                  <CakeCard v={v} item={item} />
                </li>
              ))}
            </Carousel>
          </section>
        ),
        story: story && (
          <SiteStory ctx={ctx} eyebrow={c.about} title={ctx.text("story.title") || ctx.t.story} more={{ href: href(PAGE_PATHS.visit), label: c.visit }}>
            <Story v={v} text={story} />
          </SiteStory>
        ),
        gallery: ctx.on("gallery") && v.photos.length > 0 && (
          <SiteGallery ctx={ctx} title={ctx.text("gallery.title") || c.gallery} photos={v.photos} viewer more={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }}>
            <section id="gallery" className="band sec-gallery" data-section="gallery" aria-labelledby="gallery-title">
              <Wave to="var(--band)" flip className="wave-top" />
              <div className="wrap">
                <Heading id="gallery-title" title={ctx.text("gallery.title") || c.gallery} link={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }} />
                <Scrapbook v={v} photos={v.photos.slice(0, 6)} />
              </div>
              <Wave to="var(--bg)" />
            </section>
          </SiteGallery>
        ),
        reviews: ctx.on("reviews") && ctx.reviews.length > 0 && (
          <SiteReviews ctx={ctx} title={ctx.t.reviews}>
            <Reviews v={v} />
          </SiteReviews>
        ),
        visit: ctx.on("visit") && (
          <SiteVisit ctx={ctx} title={ctx.t.visit} cta={v.order ? { href: v.order, label: v.cta } : null}>
            <VisitCard v={v} />
          </SiteVisit>
        ),
      })}
    </>
  );
}

function Story({ v, text: body }: { v: View; text: string }) {
  const { ctx, c } = v;
  const pic = ctx.image("story.image");
  return (
    <section id="story" className={cx("sec sec-story", pic && "with-pic")} data-section="story" aria-labelledby="story-title">
      <div className="wrap story-in">
        {pic && (
          <div className="story-pic reveal">
            <span data-k="photo" className="arch">
              <Picture src={pic} sizes="(min-width: 900px) 40vw, 80vw" />
            </span>
            <Heart className="story-heart" />
          </div>
        )}
        <div className="recipe reveal">
          <span className="tape" aria-hidden="true" />
          <p className="hand-note hand-small">
            <span>{c.about}</span>
          </p>
          <h2 id="story-title">{ctx.text("story.title") || ctx.t.story}</h2>
          <p className="recipe-text">{body}</p>
          {v.page.kind === "home" && (
            <a className="link" href={v.href(PAGE_PATHS.visit)}>
              {c.visit} <Arrow className="flip" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function Reviews({ v }: { v: View }) {
  return (
    <section id="reviews" className="sec sec-notes" data-section="reviews" aria-labelledby="reviews-title">
      <div className="wrap">
        <Heading id="reviews-title" title={v.ctx.t.reviews} />
        <ul className="plain notes">
          {v.ctx.reviews.map((r, i) => (
            <li key={i} className="reveal" style={{ "--i": i } as CSSProperties}>
              <figure className="note">
                <Heart className="note-heart" />
                <blockquote>{r.quote}</blockquote>
                {r.name && <figcaption>{r.name}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Opening hours as a little week planner: each day's open time drawn as a bar on a shared clock. */
function Schedule({ ctx }: { ctx: SiteContext }) {
  const toH = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  };
  const rows = ctx.hours.map((r) => {
    const m = r.time?.match(/(\d{2}:\d{2})\D+(\d{2}:\d{2})/);
    if (!m) return { ...r, span: null };
    const open = toH(m[1]);
    let close = toH(m[2]);
    if (close <= open) close += 24;
    return { ...r, span: [open, close] as const };
  });
  const spans = rows.flatMap((r) => (r.span ? [r.span] : []));
  const start = Math.floor(Math.min(...spans.map((x) => x[0])));
  const end = Math.ceil(Math.max(...spans.map((x) => x[1])));
  const range = Math.max(1, end - start);
  return (
    <ol className="plain schedule">
      {rows.map((r) => (
        <li key={r.day} className={cx(r.today && "is-today", !r.span && "is-closed")}>
          <span className="sch-day">
            {r.name}
            {r.today && <span className="sch-today">{ctx.t.today}</span>}
          </span>
          <span className="sch-track" aria-hidden="true">
            {r.span && <span className="sch-bar" style={{ insetInlineStart: `${((r.span[0] - start) / range) * 100}%`, width: `${((r.span[1] - r.span[0]) / range) * 100}%` }} />}
          </span>
          <span className="sch-time">
            <bdi>{r.time ?? ctx.t.closed}</bdi>
          </span>
        </li>
      ))}
    </ol>
  );
}

function VisitCard({ v, heading = true }: { v: View; heading?: boolean }) {
  const { ctx } = v;
  const { contact } = ctx;
  return (
    <section id="visit" className="sec sec-visit" data-section="visit" aria-labelledby="visit-title">
      <div className="wrap">
        <div className="visit-card reveal">
          <span className="ribbon" aria-hidden="true" />
          <div className="visit-head">
            {heading ? <h2 id="visit-title">{ctx.t.visit}</h2> : <h2 id="visit-title" className="sr-only">{ctx.t.visit}</h2>}
            {ctx.today && (
              <p className="today-line">
                <Heart className="beat" />
                {ctx.today}
              </p>
            )}
          </div>
          <div className="visit-grid">
            {hasHours(ctx.hours) && (
              <div className="visit-hours">
                <h3>{ctx.t.hours}</h3>
                <Schedule ctx={ctx} />
              </div>
            )}
            <div className="visit-info">
              <h3>{ctx.t.contact}</h3>
              <ContactList ctx={ctx} />
              {(contact.whatsapp || contact.maps) && (
                <div className="actions">
                  {contact.whatsapp && (
                    <a data-k="btn" className="btn" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                      <WhatsApp /> {v.cta}
                    </a>
                  )}
                  {contact.maps && (
                    <a data-k="btn" className="btn btn-soft" href={contact.maps} target="_blank" rel="noopener noreferrer">
                      <Pin /> {ctx.t.directions}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- pages ---------- */

function MenuPage({ v }: { v: View }) {
  const { tree, c, href, ctx } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: c.menu }]} title={c.menu} lead={itemCount(tree.items.length, ctx.locale)}>
        {tree.roots.length > 1 && (
          <nav className="hop" data-k="catnav" aria-label={c.categories}>
            {tree.roots.map((cat) => (
              <a key={cat.id} href={`#m-${cat.id}`}>
                {cat.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>
      <SiteMenu ctx={ctx} like="grid" level={2} page ownNav sections={menuSections(tree.roots, href, () => c.viewAll)}>
      {tree.roots.map((cat) => (
        <section key={cat.id} id={`m-${cat.id}`} className="sec shelf" aria-labelledby={`m-${cat.id}-h`}>
          <div className="wrap">
            <Heading id={`m-${cat.id}-h`} title={cat.name} link={{ href: href(cat.path), label: c.viewAll }} />
            {cat.products.length > 0 && <Cakes v={v} items={cat.products} />}
            {cat.children.map((sub) => (
              <div key={sub.id} className="shelf-sub">
                <h3 className="sub-note">
                  <a href={href(sub.path)}>{sub.name}</a>
                </h3>
                <Cakes v={v} items={sub.products} />
              </div>
            ))}
          </div>
        </section>
      ))}
</SiteMenu>
    </>
  );
}

function CategoryPage({ v, category }: { v: View; category: Category }) {
  const { c, href, ctx } = v;
  const parent = category.parent;
  const family = parent ?? category;
  const trail = [{ label: c.menu, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];
  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} lead={itemCount(category.all.length, ctx.locale)}>
        {family.children.length > 0 && (
          <nav className="hop" aria-label={fill(c.subcategories, { name: family.name })}>
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

      {category.children.length > 0 && (
        <section className="sec" aria-labelledby="subs-title">
          <div className="wrap">
            <Heading id="subs-title" title={fill(c.subcategories, { name: category.name })} />
            <Bubbles v={v} categories={category.children} />
          </div>
        </section>
      )}

      <SiteMenu ctx={ctx} like="grid" level={2} page sections={categorySections(category, href, fill(c.inThis, { name: category.name }), () => c.viewAll)} flat={category.children.length === 0 ? { label: category.name } : undefined}>
      {category.products.length > 0 && (
        <section className="sec shelf" aria-labelledby="own-title">
          <div className="wrap">
            {category.children.length > 0 ? (
              <Heading id="own-title" title={fill(c.inThis, { name: category.name })} />
            ) : (
              <h2 id="own-title" className="sr-only">
                {category.name}
              </h2>
            )}
            <Cakes v={v} items={category.products} />
          </div>
        </section>
      )}

      {category.children.map((sub) => (
        <section key={sub.id} className="sec shelf" aria-labelledby={`s-${sub.id}`}>
          <div className="wrap">
            <Heading id={`s-${sub.id}`} title={sub.name} link={{ href: href(sub.path), label: c.viewAll }} />
            <Cakes v={v} items={sub.products.slice(0, 8)} />
          </div>
        </section>
      ))}
</SiteMenu>

      {parent === null && v.tree.roots.length > 1 && (
        <section className="sec sec-more" aria-labelledby="more-title">
          <div className="wrap">
            <Heading id="more-title" title={c.categories} />
            <Bubbles v={v} categories={v.tree.roots} current={category} />
          </div>
        </section>
      )}
    </>
  );
}

function BestPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.c.best }]} title={v.c.best} lead={v.c.bestLead} />
      <section className="sec shelf" aria-label={v.c.best}>
        <div className="wrap">
          <Cakes v={v} items={v.best} rank />
        </div>
      </section>
    </>
  );
}

function GalleryPage({ v }: { v: View }) {
  const { c, ctx } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: c.gallery }]} title={c.gallery} lead={ctx.text("gallery.title") || c.galleryLead} />
      <section className="sec" aria-label={c.gallery}>
        <div className="wrap">
          <Scrapbook v={v} photos={v.photos} />
        </div>
      </section>
    </>
  );
}

function VisitPage({ v }: { v: View }) {
  const { ctx, c } = v;
  const story = ctx.text("story.text");
  return (
    <>
      <PageHead v={v} trail={[{ label: c.visit }]} title={ctx.t.visit} lead={ctx.site.business.address} />
      <SiteVisit ctx={ctx} heading={false} title={ctx.t.visit} cta={v.order ? { href: v.order, label: v.cta } : null}>
        <VisitCard v={v} heading={false} />
      </SiteVisit>
      {story && (
        <SiteStory ctx={ctx} eyebrow={c.about} title={ctx.text("story.title") || ctx.t.story}>
          <Story v={v} text={story} />
        </SiteStory>
      )}
      {ctx.reviews.length > 0 && ctx.on("reviews") && (
        <SiteReviews ctx={ctx} title={ctx.t.reviews}>
          <Reviews v={v} />
        </SiteReviews>
      )}
    </>
  );
}

/* ---------- footer ---------- */

/** What the footer showed before the owner could choose (also the manifest's "social.show" default). */
const SOCIAL_DEFAULT = ["instagram", "whatsapp"] as const;

function Footer({ v }: { v: View }) {
  const { ctx, c, href, tree } = v;
  const { site, contact } = ctx;
  const tagline = ctx.text("footer.text");
  const social = socialAccounts(site, SOCIAL_DEFAULT);
  return (
    <footer className="foot" data-section="footer">
      <Doodles set="foot" />
      <div className="foot-in">
        <a className="brand foot-brand" href={href("")}>
          <Logo ctx={ctx} className="brand-logo" sizes="64px" />
          <FootName ctx={ctx} as="span" className="brand-name kit-name" />
        </a>
        {tagline && <p className="foot-note">{tagline}</p>}
        <nav className="foot-links" aria-label={c.pages}>
          <a href={href(PAGE_PATHS.menu)}>{c.menu}</a>
          {v.best.length > 0 && <a href={href(PAGE_PATHS.best)}>{c.best}</a>}
          {v.photos.length > 0 && <a href={href(PAGE_PATHS.gallery)}>{c.gallery}</a>}
          <a href={href(PAGE_PATHS.visit)}>{c.visit}</a>
        </nav>
        {tree.roots.length > 0 && (
          <nav className="foot-cats" aria-label={c.categories}>
            {tree.roots.slice(0, 8).map((cat) => (
              <a key={cat.id} href={href(cat.path)}>
                {cat.name}
              </a>
            ))}
          </nav>
        )}
        {(social.length > 0 || contact.maps) && (
          <div className="socials">
            <SocialIcons accounts={social} />
            {contact.maps && (
              <a href={contact.maps} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.directions}>
                <Pin />
              </a>
            )}
          </div>
        )}
        {site.business.address && <p className="foot-addr">{site.business.address}</p>}
      </div>
      <Credits ctx={ctx} />
    </footer>
  );
}
