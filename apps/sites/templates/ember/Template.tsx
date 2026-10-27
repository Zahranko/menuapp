import { Fragment, type CSSProperties, type ReactNode } from "react";
import { whatsappLink } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { choice, flag, image, list, number, text } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, FootName, HoursList, Logo, logoRoot, optionRoot, OrderContent, orderLink, ProductPicture, ProductSheet, SocialIcons, TopBars } from "../_kit/blocks";
import { orderButton, socialAccounts } from "../_kit/options";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { Drawer } from "../_kit/Drawer";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Close, Pin } from "../_kit/icons";
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
import { emberCopy } from "./copy";
import { SiteFooter, SiteGallery, SiteReviews, SiteStory, SiteVisit, ordered } from "../_kit/Sections";

/*
 * Template 025 "Ember" (Pro): a street-food drop. Huge condensed caps that slam in, film grain, diagonal cuts,
 * a specials ticker, numbered menu sections, stacked combo cards with price stickers, a "Hall of Flame"
 * leaderboard, a tilted photo collage and one sticky "Order now" pill. Its own component tree; the page
 * logic (category tree, best sellers, gallery, addresses) comes from ../_premium/pages.ts.
 */

/** Extra palette keys: pop (sticker color), popink (text on it), hard (offset shadow color). */
const PALETTES = {
  charcoal: { bg: "#121110", surf: "#1C1A18", ink: "#F6EFE4", muted: "#ABA197", line: "#34302B", pop: "#FFC21A", popink: "#141110", hard: "var(--acc)" },
  ketchup: { bg: "#9E150D", surf: "#86110A", ink: "#FFF4E6", muted: "#F9D2C2", line: "#C2372A", pop: "#FFC21A", popink: "#141110", hard: "#1A0806" },
  mustard: { bg: "#F5B800", surf: "#FFCB2E", ink: "#17120E", muted: "#3F3216", line: "#17120E", pop: "#C41E16", popink: "#FFFFFF", hard: "#17120E" },
  diner: { bg: "#F6F4F1", surf: "#FFFFFF", ink: "#161412", muted: "#59524B", line: "#161412", pop: "#FFC21A", popink: "#161412", hard: "#161412" },
} satisfies Record<string, Palette>;

const FONTS = ["condensed", "bold", "modern"] as const;
const HERO = ["poster", "full", "slides", "type"] as const;
const CARDS = ["combo", "board"] as const;

type View = {
  /** The owner\'s header and opening layout (_kit/Top.tsx). */
  top: Top;
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  e: ReturnType<typeof emberCopy>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  cards: (typeof CARDS)[number];
  best: MenuItem[];
  photos: { src: string; caption: string | null }[];
  order: string | null;
  orderLabel: string;
};

const two = (n: number) => String(n).padStart(2, "0");

export default function EmberTemplate({ site, path = [], base, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copyFor(ctx.locale);
  const e = emberCopy(ctx.locale);
  const tree = categoryTree(site);
  // An unknown address never gets here (the route answers 404); fall back to the home page to be safe.
  const page = resolvePage(site, path, tree) ?? { kind: "home" };
  const root = base ?? `/${site.business.slug}`;
  const phone = site.business.whatsApp;
  const v: View = {
    ctx,
    top: pageTop(ctx, { photos: heroPhotos(site.settings, "hero.images"), backdrop: ["full", "slides"].includes(text(site.settings, "hero.layout")), home: page.kind === "home" }),
    c,
    e,
    tree,
    page,
    href: (p: string) => (p ? `${root}${p}` : root || "/"),
    cards: choice(site.settings, "cards", CARDS, "combo"),
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree),
    order: phone ? whatsappLink(phone) : null,
    orderLabel: text(site.settings, "cta.label") || e.orderNow,
  };
  const style = themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: FONTS, defaultAccent: "#FF5A1F", radius: { rounded: "16px", sharp: "0px" } });
  const order = orderButton(site, { label: v.orderLabel });

  return (
    <div
      data-template="ember"
      {...logoRoot(ctx)}
      {...optionRoot(ctx, order, true)}
      data-page={page.kind}
      className={cx("em", fontVariables, `cards-${v.cards}`, ctx.rtl && "is-ar", flag(site.settings, "grain", true) && "grain", flag(site.settings, "motion", true) && "motion", order && "has-pill")}
      style={style}
    >
      <TemplateStyles id="ember" />
      <TopBars ctx={ctx} announcement={false} />
      {page.kind !== "home" && <Ticker v={v} />}
      <SiteHeader ctx={ctx} top={v.top} links={pageLinks(v, { home: c.home, menu: c.menu, best: e.hall, gallery: c.gallery, visit: c.visit })} cta={orderCta(order)} home={v.href("")}>
        <Header v={v} />
      </SiteHeader>
      {page.kind === "home" ? (
        <main>
          <Home v={v} />
        </main>
      ) : (
        <main id="menu" data-section="menu" className="page">
          {page.kind === "menu" && <MenuPage v={v} />}
          {page.kind === "category" && <CategoryPage v={v} category={page.category} />}
          {page.kind === "best" && <BestPage v={v} />}
          {page.kind === "gallery" && <GalleryPage v={v} />}
          {page.kind === "visit" && <VisitPage v={v} />}
        </main>
      )}
      <SiteFooter ctx={ctx} links={pageLinks(v, { home: c.home, menu: c.menu, best: e.hall, gallery: c.gallery, visit: c.visit })} social={socialAccounts(site, SOCIAL_DEFAULT)}>
        <Footer v={v} />
      </SiteFooter>
      {order && (
        <a className="pill kit-order" {...orderLink(order)} data-section="order">
          <OrderContent order={order} icon />
        </a>
      )}
      <ProductSheet ctx={ctx} />
      {v.photos.length > 0 && <Lightbox photos={v.photos} labels={{ close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo }} />}
    </div>
  );
}

/* ---------- ticker and navigation ---------- */

/** The announcement, then the specials (best sellers in stock) with their prices, scrolling sideways. */
function Ticker({ v }: { v: View }) {
  const { ctx } = v;
  const note = ctx.on("announcement") ? ctx.text("announcement") : "";
  const items: ReactNode[] = [];
  if (note) items.push(<b key="note">{note}</b>);
  for (const p of v.best.filter((x) => x.isAvailable).slice(0, 6)) {
    items.push(
      <span key={p.id}>
        {p.name} <em>{p.priceText}</em>
      </span>,
    );
  }
  if (!ctx.on("announcement") || items.length === 0) return null;
  // Enough copies to cover a wide screen; only the first set is read out.
  const copies = Math.max(1, Math.ceil(8 / items.length));
  const run = (hidden: boolean) =>
    Array.from({ length: copies }, (_, k) =>
      items.map((item, i) => (
        <li key={`${k}-${i}`} aria-hidden={hidden || k > 0 ? true : undefined}>
          {item}
        </li>
      )),
    );
  return (
    <section className="tick" data-section="announcement" aria-label={v.e.specials}>
      <div className="tick-track">
        <ul className="plain tick-run">{run(false)}</ul>
        <ul className="plain tick-run" aria-hidden="true">
          {run(true)}
        </ul>
      </div>
    </section>
  );
}

function Header({ v }: { v: View }) {
  const { ctx, c, e, page, href, tree } = v;
  const current = (kind: Page["kind"]) => (page.kind === kind ? ("page" as const) : undefined);
  const links: { href: string; label: string; current?: "page" }[] = [
    { href: href(PAGE_PATHS.menu), label: c.menu, current: page.kind === "menu" || page.kind === "category" ? "page" : undefined },
    ...(v.best.length > 0 ? [{ href: href(PAGE_PATHS.best), label: e.hall, current: current("best") }] : []),
    ...(v.photos.length > 0 ? [{ href: href(PAGE_PATHS.gallery), label: c.gallery, current: current("gallery") }] : []),
    { href: href(PAGE_PATHS.visit), label: c.visit, current: current("visit") },
  ];

  return (
    <header className="bar kit-head" data-section="header">
      <a className="brand kit-lockup" href={href("")} aria-current={current("home")}>
        <Logo ctx={ctx} className="brand-logo" sizes="40px" />
        <BrandName ctx={ctx} className="brand-name" />
      </a>
      <nav className="bar-links" aria-label={c.pages}>
        {links.map((l) => (
          <a key={l.href} href={l.href} aria-current={l.current}>
            {l.label}
          </a>
        ))}
      </nav>
      <Drawer
        openLabel={ctx.t.openMenu}
        closeLabel={ctx.t.close}
        buttonClassName="bar-toggle"
        panelClassName="drawer"
        icon={<span className="bar-toggle-word">{c.menu}</span>}
        closeIcon={<Close />}
      >
        <nav aria-label={c.pages}>
          <ol className="plain drawer-big">
            <li>
              <a href={href("")} aria-current={current("home")}>
                <span className="n" aria-hidden="true">
                  00
                </span>
                {c.home}
              </a>
            </li>
            {links.map((l, i) => (
              <li key={l.href}>
                <a href={l.href} aria-current={l.current}>
                  <span className="n" aria-hidden="true">
                    {two(i + 1)}
                  </span>
                  {l.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {tree.roots.length > 0 && (
          <nav className="drawer-cats" aria-label={c.categories}>
            {tree.roots.map((cat) => (
              <a key={cat.id} href={href(cat.path)}>
                {cat.name}
              </a>
            ))}
          </nav>
        )}
      </Drawer>
    </header>
  );
}

/* ---------- building blocks ---------- */

/** A section heading that slams in: optional big number, the title and an optional link. */
function Head({ title, id, num, link, as = "h2" }: { title: string; id?: string; num?: string; link?: { href: string; label: string }; as?: "h2" | "h3" }) {
  const H = as;
  return (
    <div className="head">
      {num && (
        <span className="head-n" aria-hidden="true">
          {num}
        </span>
      )}
      <H id={id} className="head-t slam">
        {title}
      </H>
      {link && (
        <a className="more" href={link.href}>
          {link.label} <Arrow className="flip" />
        </a>
      )}
    </div>
  );
}

function Combo({ v, item }: { v: View; item: MenuItem }) {
  if (v.cards === "board") {
    return (
      <button type="button" className={cx("row kit-card kit-card-pad", !item.isAvailable && "out")} data-item-id={item.id}>
        <span className="row-media kit-card-media">
          <ProductPicture item={item} sizes="64px" />
        </span>
        <span className="row-main">
          <span className="row-name">
            {item.name}
            {item.labelText && <span className="tape">{item.labelText}</span>}
            {!item.isAvailable && <span className="tape tape-out">{v.ctx.t.soldOut}</span>}
          </span>
          {item.description && <span className="row-desc">{item.description}</span>}
        </span>
        <span className="row-price">{item.priceText}</span>
      </button>
    );
  }
  return (
    <button type="button" className={cx("combo kit-card", !item.isAvailable && "out")} data-item-id={item.id}>
      <span data-k="overlay" className="combo-media kit-card-media">
        <ProductPicture item={item} sizes="(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw" />
        {item.labelText && <span className="tape">{item.labelText}</span>}
        {!item.isAvailable && <span className="stamp">{v.ctx.t.soldOut}</span>}
      </span>
      <span className="combo-body">
        <span className="combo-name">{item.name}</span>
        {item.description && <span className="combo-desc">{item.description}</span>}
      </span>
      <span className="sticker">{item.priceText}</span>
    </button>
  );
}

function Products({ v, items }: { v: View; items: MenuItem[] }) {
  return (
    <ul className={cx("plain kit-cards", v.cards === "board" ? "board kit-rows" : "combos")}>
      {items.map((item) => (
        <li key={item.id} className="rise">
          <Combo v={v} item={item} />
        </li>
      ))}
    </ul>
  );
}

/** Categories as big numbered rows: number, name, what is inside, a photo that pops out on hover. */
function Index({ v, categories, prefix = "" }: { v: View; categories: Category[]; prefix?: string }) {
  return (
    <ol className="plain idx kit-cards kit-rows">
      {categories.map((cat, i) => (
        <li key={cat.id} className="rise">
          <a className="idx-row kit-cat kit-card-pad" href={v.href(cat.path)}>
            <span className="idx-n" aria-hidden="true">
              {prefix}
              {prefix ? i + 1 : two(i + 1)}
            </span>
            <span className="idx-main">
              <span className="idx-name">{cat.name}</span>
              <span className="idx-meta">
                {cat.children.length > 0 ? `${cat.children.map((s) => s.name).join(" / ")}, ` : ""}
                {itemCount(cat.all.length, v.ctx.locale)}
              </span>
            </span>
            <span className="idx-pic" aria-hidden="true">
              {cat.cover ? <Picture src={cat.cover} sizes="120px" /> : null}
            </span>
            <Arrow className="flip idx-go" />
          </a>
        </li>
      ))}
    </ol>
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

function PageHead({ v, trail, title, lead, num, children }: { v: View; trail: { label: string; href?: string }[]; title: string; lead?: string | null; num?: string; children?: ReactNode }) {
  return (
    <header className="phead" data-n={num}>
      <Crumbs v={v} trail={trail} />
      <h1 className="phead-t slam">{title}</h1>
      {lead && <p className="phead-lead">{lead}</p>}
      {children}
    </header>
  );
}

/** The Hall of Flame: number one gets the big card, the rest line up as a leaderboard. */
function Leaderboard({ v, items, podium = 1 }: { v: View; items: MenuItem[]; podium?: number }) {
  const top = items.slice(0, podium);
  const rest = items.slice(podium);
  return (
    <div className={cx("hall", podium > 1 && "hall-podium")}>
      <ol className="plain hall-top">
        {top.map((item, i) => (
          <li key={item.id} className={cx("rise", `hall-${i + 1}`)}>
            <button type="button" className={cx("champ", !item.isAvailable && "out")} data-item-id={item.id}>
              <span data-k="photo overlay" className="champ-media">
                <ProductPicture item={item} sizes={i === 0 ? "(min-width: 900px) 40vw, 100vw" : "(min-width: 900px) 25vw, 50vw"} />
                {!item.isAvailable && <span className="stamp">{v.ctx.t.soldOut}</span>}
              </span>
              <span className="champ-n">{fill(v.e.rank, { n: i + 1 })}</span>
              <span className="champ-name">{item.name}</span>
              {item.description && i === 0 && <span className="champ-desc">{item.description}</span>}
              <span className="sticker">{item.priceText}</span>
            </button>
          </li>
        ))}
      </ol>
      {rest.length > 0 && (
        <ol className="plain hall-list" start={podium + 1}>
          {rest.map((item, i) => (
            <li key={item.id} className="rise">
              <button type="button" className={cx("lb", !item.isAvailable && "out")} data-item-id={item.id}>
                <span className="lb-n" aria-hidden="true">
                  {podium + i + 1}
                </span>
                <span data-k="photo" className="lb-pic">
                  <ProductPicture item={item} sizes="72px" />
                </span>
                <span className="lb-main">
                  <span className="lb-name">{item.name}</span>
                  <span className="lb-meta">
                    {item.labelText && <span className="tape">{item.labelText}</span>}
                    {!item.isAvailable && <span className="tape tape-out">{v.ctx.t.soldOut}</span>}
                  </span>
                </span>
                <span className="lb-price">{item.priceText}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Photos pinned up at angles, with tape. */
function Collage({ v, photos, big = false }: { v: View; photos: { src: string; caption: string | null }[]; big?: boolean }) {
  return (
    <ul className={cx("plain collage", big && "collage-all")} data-gallery>
      {photos.map((p, i) => (
        <li key={p.src} className="rise">
          <button type="button" className="snap" data-photo={i} aria-label={p.caption ?? fill(v.c.photo, { n: i + 1 })}>
            <span data-k="photo fill" className="snap-pic">
              <Picture src={p.src} sizes={big ? "(min-width: 900px) 25vw, 50vw" : i === 0 ? "(min-width: 900px) 45vw, 90vw" : "(min-width: 900px) 25vw, 50vw"} />
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
  const layout = choice(s, "hero.layout", HERO, "poster");
  const images = list(s, "hero.images")
    .map((x) => image(x))
    .filter((x): x is string => !!x)
    .slice(0, 3);
  const fallback = v.tree.items.find((p) => p.imageUrl)?.imageUrl ?? null;
  const pics = images.length ? images : fallback ? [fallback] : [];
  const kind = layout !== "type" && pics.length ? layout : "type";
  const title = text(s, "hero.title") || ctx.site.business.name;
  const eyebrow = text(s, "hero.eyebrow");
  const subtitle = text(s, "hero.subtitle");
  const shade = Math.min(90, Math.max(0, number(s, "hero.shade", 40)));
  const star = v.best.find((p) => p.isAvailable && p.imageUrl) ?? null;
  const words = title.split(/\s+/).filter(Boolean);

  return (
    <section className={cx("hero", kind === "slides" ? "hero-full hero-slides" : `hero-${kind}`)} data-section="hero" style={{ "--shade": shade / 100 } as CSSProperties}>
      {(kind === "full" || kind === "slides") && (
        <div className="hero-bg">
          <HeroPhotos ctx={ctx} photos={kind === "slides" ? pics : pics.slice(0, 1)} sizes="100vw" placement="corner" />
        </div>
      )}
      <div className="hero-copy">
        {eyebrow && <p className="hero-tag">{eyebrow}</p>}
        <h1 className="hero-t">
          <span className="sr-only">{title}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className="hero-w" style={{ "--i": i } as CSSProperties}>
                  {w}
                </span>{" "}
              </Fragment>
            ))}
          </span>
        </h1>
        {subtitle && <p className="hero-sub">{subtitle}</p>}
        <div className="hero-do">
          <a data-k="btn" className="btn" href={href(PAGE_PATHS.menu)}>
            {c.browse} <Arrow className="flip" />
          </a>
          {ctx.today && <span className="hero-open">{ctx.today}</span>}
        </div>
      </div>
      {kind === "poster" && (
        <div className={cx("pile", `pile-${pics.length}`)}>
          {pics.map((src, i) => (
            <div key={src + i} className="pile-card" style={{ "--i": i } as CSSProperties}>
              <Picture src={src} sizes="(min-width: 900px) 40vw, 80vw" priority={i === 0} />
            </div>
          ))}
          {star?.imageUrl && pics.length < 3 && (
            <div className="pile-card pile-food" style={{ "--i": pics.length } as CSSProperties}>
              <Picture src={star.imageUrl} sizes="(min-width: 900px) 20vw, 40vw" />
            </div>
          )}
          {star && (
            <button type="button" className="pile-star" data-item-id={star.id}>
              <span className="pile-star-n">{fill(v.e.rank, { n: 1 })}</span>
              <span className="pile-star-name">{star.name}</span>
              <span className="pile-star-p">{star.priceText}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Home({ v }: { v: View }) {
  const { ctx, c, e, href } = v;
  const story = ctx.on("story") && ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  return (
    <>
      <SiteHero ctx={ctx} top={v.top} menuHref={href(PAGE_PATHS.menu)} actions={[{ href: href(PAGE_PATHS.menu), label: c.browse }, { href: href(PAGE_PATHS.visit), label: c.visit }]}>
        <Hero v={v} />
      </SiteHero>
      <Ticker v={v} />

      {ordered(ctx, {
        menu: (
          <section id="menu" className="sec sec-menu" data-section="menu" aria-labelledby="menu-title">
            <Head title={ctx.text("categories.title") || e.menuIndex} id="menu-title" link={{ href: href(PAGE_PATHS.menu), label: c.viewAll }} />
            {v.tree.roots.length > 0 && <Index v={v} categories={v.tree.roots} />}
          </section>
        ),
        best: ctx.on("best") && v.best.length > 0 && (
          <section id="best" className="sec sec-hall" data-section="best" aria-labelledby="best-title">
            <Head title={e.hall} id="best-title" link={{ href: href(PAGE_PATHS.best), label: c.viewAll }} />
            <p className="lead">{ctx.text("best.title") || c.bestLead}</p>
            <Leaderboard v={v} items={v.best.slice(0, 5)} />
          </section>
        ),
        story: story && (
          <SiteStory ctx={ctx} title={ctx.text("story.title") || ctx.t.story} more={{ href: href(PAGE_PATHS.visit), label: c.about }}>
            <section id="story" className={cx("band", storyImage && "band-pic")} data-section="story" aria-labelledby="story-title">
              <div className="band-in">
                <div className="band-copy">
                  <h2 id="story-title" className="band-t slam">
                    {ctx.text("story.title") || ctx.t.story}
                  </h2>
                  <p className="band-text">{story}</p>
                  <a className="more" href={href(PAGE_PATHS.visit)}>
                    {c.about} <Arrow className="flip" />
                  </a>
                </div>
                {storyImage && (
                  <div data-k="photo" className="band-pic-frame">
                    <Picture src={storyImage} sizes="(min-width: 900px) 40vw, 90vw" />
                  </div>
                )}
              </div>
            </section>
          </SiteStory>
        ),
        gallery: ctx.on("gallery") && v.photos.length > 0 && (
          <SiteGallery ctx={ctx} title={ctx.text("gallery.title") || c.gallery} photos={v.photos} viewer more={{ href: href(PAGE_PATHS.gallery), label: e.allPhotos }}>
            <section id="gallery" className="sec sec-gallery" data-section="gallery" aria-labelledby="gallery-title">
              <Head title={ctx.text("gallery.title") || c.gallery} id="gallery-title" link={{ href: href(PAGE_PATHS.gallery), label: e.allPhotos }} />
              <Collage v={v} photos={v.photos.slice(0, 5)} />
            </section>
          </SiteGallery>
        ),
        reviews: ctx.on("reviews") && ctx.reviews.length > 0 && (
          <SiteReviews ctx={ctx} title={ctx.t.reviews}>
            <Reviews v={v} />
          </SiteReviews>
        ),
        visit: ctx.on("visit") && (
          <SiteVisit ctx={ctx} title={ctx.t.visit} cta={v.order ? { href: v.order, label: v.orderLabel } : null}>
            <VisitBlock v={v} />
          </SiteVisit>
        ),
      })}
    </>
  );
}

function Reviews({ v }: { v: View }) {
  return (
    <section id="reviews" className="sec sec-reviews" data-section="reviews" aria-labelledby="reviews-title">
      <Head title={v.ctx.t.reviews} id="reviews-title" />
      <ul className="plain shouts">
        {v.ctx.reviews.map((r, i) => (
          <li key={i} className="rise">
            <figure className="shout">
              <span className="stars" aria-hidden="true">
                ★★★★★
              </span>
              <blockquote>{r.quote}</blockquote>
              {r.name && <figcaption>{r.name}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisitBlock({ v, heading = true }: { v: View; heading?: boolean }) {
  const { ctx, e } = v;
  const { contact, site } = ctx;
  return (
    <section id="visit" className="sec sec-visit" data-section="visit" aria-labelledby={heading ? "visit-title" : undefined} aria-label={heading ? undefined : ctx.t.visit}>
      {heading && <Head title={e.pullUp} id="visit-title" />}
      <div className="visit">
        {site.business.address && (
          <div className="visit-where">
            <p className="visit-addr">{site.business.address}</p>
            {ctx.today && <p className="visit-today">{ctx.today}</p>}
            {contact.maps && (
              <a data-k="btn" className="btn btn-line" href={contact.maps} target="_blank" rel="noopener noreferrer">
                <Pin /> {ctx.t.directions}
              </a>
            )}
          </div>
        )}
        {hasHours(ctx.hours) && (
          <div className="visit-hours">
            <h3 className="visit-h">{ctx.t.hours}</h3>
            <HoursList ctx={ctx} />
          </div>
        )}
        <div className="visit-contact">
          <h3 className="visit-h">{ctx.t.contact}</h3>
          <ContactList ctx={ctx} />
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
          <nav className="jump" data-k="catnav" aria-label={c.categories}>
            {tree.roots.map((cat, i) => (
              <a key={cat.id} className="jump-a" href={`#m-${cat.id}`}>
                <span aria-hidden="true">{two(i + 1)}</span> {cat.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>
      <SiteMenu ctx={ctx} like={v.cards === "board" ? "compact" : "grid"} level={2} page ownNav sections={menuSections(tree.roots, href, () => c.viewAll)}>
      {tree.roots.map((cat, i) => (
        <section key={cat.id} id={`m-${cat.id}`} className="sec chapter" aria-labelledby={`m-${cat.id}-h`}>
          <Head title={cat.name} num={two(i + 1)} id={`m-${cat.id}-h`} link={{ href: href(cat.path), label: c.viewAll }} />
          {cat.products.length > 0 && <Products v={v} items={cat.products} />}
          {cat.children.map((sub, j) => (
            <div key={sub.id} className="chapter-sub">
              <h3 className="sub-t">
                <span aria-hidden="true">
                  {two(i + 1)}.{j + 1}
                </span>
                <a href={href(sub.path)}>{sub.name}</a>
              </h3>
              <Products v={v} items={sub.products} />
            </div>
          ))}
        </section>
      ))}
</SiteMenu>
    </>
  );
}

function CategoryPage({ v, category }: { v: View; category: Category }) {
  const { c, href, ctx, tree } = v;
  const parent = category.parent;
  const family = parent ?? category;
  const at = tree.roots.indexOf(family) + 1;
  const num = parent ? `${two(at)}.${parent.children.indexOf(category) + 1}` : two(at);
  const trail = [{ label: c.menu, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];
  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} num={num} lead={itemCount(category.all.length, ctx.locale)}>
        {family.children.length > 0 && (
          <nav className="jump" aria-label={fill(c.subcategories, { name: family.name })}>
            <a className="jump-a" href={href(family.path)} aria-current={category === family ? "page" : undefined}>
              {c.everything}
            </a>
            {family.children.map((sub) => (
              <a key={sub.id} className="jump-a" href={href(sub.path)} aria-current={sub === category ? "page" : undefined}>
                {sub.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>

      {category.children.length > 0 && (
        <section className="sec" aria-labelledby="subs-title">
          <Head title={fill(c.subcategories, { name: category.name })} id="subs-title" />
          <Index v={v} categories={category.children} prefix={`${two(at)}.`} />
        </section>
      )}

      <SiteMenu ctx={ctx} like={v.cards === "board" ? "compact" : "grid"} level={2} page sections={categorySections(category, href, fill(c.inThis, { name: category.name }), () => c.viewAll)} flat={category.children.length === 0 ? { label: category.name } : undefined}>
      {category.products.length > 0 && (
        <section className="sec" aria-labelledby="own-title">
          {category.children.length > 0 ? (
            <Head title={fill(c.inThis, { name: category.name })} id="own-title" />
          ) : (
            <h2 id="own-title" className="sr-only">
              {category.name}
            </h2>
          )}
          <Products v={v} items={category.products} />
        </section>
      )}

      {category.children.map((sub, j) => (
        <section key={sub.id} className="sec chapter" aria-labelledby={`s-${sub.id}`}>
          <Head title={sub.name} num={`${two(at)}.${j + 1}`} id={`s-${sub.id}`} link={{ href: href(sub.path), label: c.viewAll }} />
          <Products v={v} items={sub.products.slice(0, 8)} />
        </section>
      ))}
</SiteMenu>
    </>
  );
}

function BestPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.c.best }]} title={v.e.hall} lead={v.ctx.text("best.title") || v.c.bestLead} />
      <section className="sec sec-hall" aria-label={v.c.best}>
        <Leaderboard v={v} items={v.best} podium={Math.min(3, v.best.length)} />
      </section>
    </>
  );
}

function GalleryPage({ v }: { v: View }) {
  const { c } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: c.gallery }]} title={c.gallery} lead={v.ctx.text("gallery.title") || c.galleryLead} />
      <section className="sec" aria-label={c.gallery}>
        <Collage v={v} photos={v.photos} big />
      </section>
    </>
  );
}

function VisitPage({ v }: { v: View }) {
  const { ctx, c } = v;
  const story = ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  return (
    <>
      <PageHead v={v} trail={[{ label: c.visit }]} title={ctx.t.visit} lead={ctx.today} />
      <SiteVisit ctx={ctx} heading={false} title={ctx.t.visit} cta={v.order ? { href: v.order, label: v.orderLabel } : null}>
        <VisitBlock v={v} heading={false} />
      </SiteVisit>
      {story && (
        <SiteStory ctx={ctx} title={ctx.text("story.title") || ctx.t.story}>
          <section className={cx("band", storyImage && "band-pic")} data-section="story" aria-labelledby="story-title">
            <div className="band-in">
              <div className="band-copy">
                <h2 id="story-title" className="band-t slam">
                  {ctx.text("story.title") || ctx.t.story}
                </h2>
                <p className="band-text">{story}</p>
              </div>
              {storyImage && (
                <div data-k="photo" className="band-pic-frame">
                  <Picture src={storyImage} sizes="(min-width: 900px) 40vw, 90vw" />
                </div>
              )}
            </div>
          </section>
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
  const { ctx, c, e, href, tree } = v;
  const { site, contact } = ctx;
  const tagline = ctx.text("footer.text");
  const social = socialAccounts(site, SOCIAL_DEFAULT);
  return (
    <footer className="foot" data-section="footer">
      <div className="foot-in">
        <div className="foot-brand">
          {tagline && <p className="foot-text">{tagline}</p>}
          <div className="socials">
            <SocialIcons accounts={social} />
            {contact.maps && (
              <a href={contact.maps} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.directions}>
                <Pin />
              </a>
            )}
          </div>
        </div>
        <nav className="foot-col" aria-label={c.pages}>
          <h2 className="foot-h">{c.pages}</h2>
          <ul className="plain">
            <li>
              <a href={href(PAGE_PATHS.menu)}>{c.menu}</a>
            </li>
            {v.best.length > 0 && (
              <li>
                <a href={href(PAGE_PATHS.best)}>{e.hall}</a>
              </li>
            )}
            {v.photos.length > 0 && (
              <li>
                <a href={href(PAGE_PATHS.gallery)}>{c.gallery}</a>
              </li>
            )}
            <li>
              <a href={href(PAGE_PATHS.visit)}>{c.visit}</a>
            </li>
          </ul>
        </nav>
        {tree.roots.length > 0 && (
          <nav className="foot-col" aria-label={c.categories}>
            <h2 className="foot-h">{c.categories}</h2>
            <ul className="plain">
              {tree.roots.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <a href={href(cat.path)}>{cat.name}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <FootName ctx={ctx} className="foot-mark" decorative />
      <Credits ctx={ctx} />
    </footer>
  );
}
