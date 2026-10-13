import type { CSSProperties, ReactNode } from "react";
import { initial, whatsappLink } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { choice, flag, image, text } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, HoursList, Logo, logoRoot, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { fontVariables } from "../_kit/fonts";
import { Arrow, Instagram, Pin, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours, type MenuItem } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars, type Palette } from "../_kit/theme";
import { copyFor, fill } from "../_premium/copy";
import { Lightbox } from "../_premium/Lightbox";
import { bestSellers, categoryTree, galleryPhotos, PAGE_PATHS, resolvePage, type Category, type Page, type Tree } from "../_premium/pages";
import { HomeIcon, MenuIcon, PhotoIcon, PinIcon, StarIcon } from "./icons";

/*
 * Template 023 "Lumen" (Pro): a loud, happy specialty-coffee site. Neo-Swiss type meets sticker culture.
 * Oversized grotesk headlines, flat color blocks with chunky ink outlines and hard shadows, rotated sticker badges,
 * a bento home, a scrolling word ticker, colorful category tiles and snap-scroll product rails.
 * Phones get a bottom tab bar (no hamburger) and a round "order" sticker; desktops get the same tabs in the top bar.
 * Every color comes from the palette (c1..c5 are the tile colors, bink the text on them) and the owner's accent.
 */

const PALETTES = {
  cream: { bg: "#FFF4DE", surf: "#FFFCF4", ink: "#2A170E", muted: "#6B5243", line: "#EBD9BC", c1: "#FF8A5B", c2: "#FFD447", c3: "#9DD2FF", c4: "#B9E07E", c5: "#FFA9D0", bink: "#2A170E" },
  matcha: { bg: "#E7F1D5", surf: "#F7FBEE", ink: "#14301D", muted: "#47604B", line: "#C6DBAA", c1: "#BFE36A", c2: "#FFE36B", c3: "#8FDCC0", c4: "#FFB98E", c5: "#CDBEFF", bink: "#14301D" },
  pop: { bg: "#F3EFFF", surf: "#FFFFFF", ink: "#1C1460", muted: "#4F4985", line: "#DCD4FA", c1: "#FF7DB5", c2: "#FFE14D", c3: "#8FB2FF", c4: "#7FE5D3", c5: "#FF9F5A", bink: "#1C1460" },
  roast: { bg: "#1D130E", surf: "#2A1D16", ink: "#FFF0DC", muted: "#CDB6A0", line: "#46332A", c1: "#FF8A5B", c2: "#FFD447", c3: "#9DD2FF", c4: "#B9E07E", c5: "#FFA9D0", bink: "#1D130E" },
} satisfies Record<string, Palette>;

const FONTS = ["modern", "grotesk", "bold", "round"] as const;
const HERO = ["bento", "poster"] as const;
const CARDS = ["stickers", "list"] as const;
const TILE_COLORS = 5;

type View = {
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  cards: (typeof CARDS)[number];
  best: MenuItem[];
  photos: { src: string; caption: string | null }[];
  order: string | null;
  cta: string;
};

/** The tile color of a category: its position among the top-level categories (sub-categories share the parent's). */
const tileOf = (v: View, cat: Category) => {
  const root = cat.parent ?? cat;
  const i = Math.max(0, v.tree.roots.indexOf(root));
  return `var(--c${(i % TILE_COLORS) + 1})`;
};
const tint = (color: string): CSSProperties => {
  const vars: Record<string, string> = { "--tile": color };
  if (color === "var(--acc)") vars["--tile-ink"] = "var(--acc-ink)";
  return vars as CSSProperties;
};

export default function LumenTemplate({ site, path = [], base, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const c = copyFor(ctx.locale);
  const tree = categoryTree(site);
  // An unknown address never gets here (the route answers 404); fall back to the home page to be safe.
  const page = resolvePage(site, path, tree) ?? { kind: "home" };
  const root = base ?? `/${site.business.slug}`;
  const phone = site.business.whatsApp;
  const v: View = {
    ctx,
    c,
    tree,
    page,
    href: (p: string) => (p ? `${root}${p}` : root || "/"),
    cards: choice(site.settings, "cards", CARDS, "stickers"),
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree),
    order: phone ? whatsappLink(phone) : null,
    cta: text(site.settings, "cta.label") || c.order,
  };
  const style = themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: FONTS, defaultAccent: "#FF5A1F", radius: { rounded: "22px", sharp: "3px" } });

  return (
    <div
      data-template="lumen"
      {...logoRoot(ctx)}
      data-page={page.kind}
      className={cx("t-lumen", fontVariables, `cards-${v.cards}`, `corners-${choice(site.settings, "corners", ["rounded", "sharp"] as const, "rounded")}`, v.order && "has-order", flag(site.settings, "motion", true) && "motion")}
      style={style}
    >
      <TemplateStyles id="lumen" />
      <TopBars ctx={ctx} announcement={false} />
      <Header v={v} />
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
      <Footer v={v} />
      {v.order && <OrderSticker v={v} />}
      <ProductSheet ctx={ctx} />
      {v.photos.length > 0 && <Lightbox photos={v.photos} labels={{ close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo }} />}
    </div>
  );
}

/* ---------- navigation: top bar on every screen, tabs at the bottom on phones and in the top bar on desktops ---------- */

function Header({ v }: { v: View }) {
  const { ctx, c, page, href } = v;
  const tabs: { key: string; label: string; href: string; icon: ReactNode; current: boolean }[] = [
    { key: "home", label: c.home, href: href(""), icon: <HomeIcon />, current: page.kind === "home" },
    { key: "menu", label: c.menu, href: href(PAGE_PATHS.menu), icon: <MenuIcon />, current: page.kind === "menu" || page.kind === "category" },
    ...(v.best.length > 0 ? [{ key: "best", label: c.best, href: href(PAGE_PATHS.best), icon: <StarIcon />, current: page.kind === "best" }] : []),
    ...(v.photos.length > 0 ? [{ key: "gallery", label: c.gallery, href: href(PAGE_PATHS.gallery), icon: <PhotoIcon />, current: page.kind === "gallery" }] : []),
    { key: "visit", label: c.visit, href: href(PAGE_PATHS.visit), icon: <PinIcon />, current: page.kind === "visit" },
  ];
  return (
    <header className="top" data-section="header">
      <div className="top-in kit-head">
        <a className="brand kit-lockup" href={href("")}>
          <Logo ctx={ctx} className="brand-logo" sizes="44px" />
          <BrandName ctx={ctx} className="brand-name" />
        </a>
        {ctx.today && <span className="status">{ctx.today}</span>}
        <nav className="tabs" aria-label={c.pages}>
          <ul className="plain">
            {tabs.map((t) => (
              <li key={t.key}>
                <a className="tab" href={t.href} aria-current={t.current ? "page" : undefined}>
                  {t.icon}
                  <span>{t.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {v.order && (
          <a className="btn btn-acc top-order" href={v.order} target="_blank" rel="noopener noreferrer">
            <WhatsApp />
            <span>{v.cta}</span>
          </a>
        )}
      </div>
    </header>
  );
}

/** Phones: a round sticker above the tab bar with the order text running around its edge. */
function OrderSticker({ v }: { v: View }) {
  const label = v.cta.toUpperCase();
  const ring = label.length < 14 ? `${label} • ${label} •` : `${label} •`;
  // The ring is about 230 units long: shrink the letters for long labels instead of squeezing them.
  const size = Math.min(10.5, Math.max(6.5, 230 / (ring.length * 0.68)));
  return (
    <a className="fab" href={v.order!} target="_blank" rel="noopener noreferrer" aria-label={v.cta}>
      {/* Arabic letters do not join well along a curve, so Arabic sites get a dashed ring instead of running text. */}
      <svg className="fab-ring" viewBox="0 0 100 100" aria-hidden="true">
        {v.ctx.rtl ? (
          <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 5" />
        ) : (
          <>
            <defs>
              <path id="lu-ring" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0" />
            </defs>
            <text fontSize={size} textAnchor="middle">
              <textPath href="#lu-ring" startOffset="50%">
                {ring}
              </textPath>
            </text>
          </>
        )}
      </svg>
      <span className="fab-core">
        <WhatsApp />
      </span>
    </a>
  );
}

/* ---------- building blocks ---------- */

function SectionHead({ title, id, link, as: Tag = "h2" }: { title: string; id?: string; link?: { href: string; label: string }; as?: "h2" | "h3" }) {
  return (
    <div className="sec-head">
      <Tag id={id} className="sec-title">
        {title}
      </Tag>
      {link && (
        <a className="more" href={link.href}>
          <span>{link.label}</span> <Arrow className="flip" />
        </a>
      )}
    </div>
  );
}

function Stamps({ v, item }: { v: View; item: MenuItem }) {
  if (!item.labelText && item.isAvailable) return null;
  return (
    <span className="stamps">
      {item.labelText && <span className="stamp">{item.labelText}</span>}
      {!item.isAvailable && <span className="stamp stamp-out">{v.ctx.t.soldOut}</span>}
    </span>
  );
}

function ProductCard({ v, item, rank }: { v: View; item: MenuItem; rank?: number }) {
  return (
    <button type="button" className={cx("card", !item.isAvailable && "out")} data-item-id={item.id}>
      <span className="card-media">
        <ProductPicture item={item} sizes="(min-width: 1100px) 22vw, (min-width: 700px) 33vw, 60vw" />
        {rank !== undefined && <span className="rank">{rank}</span>}
      </span>
      <Stamps v={v} item={item} />
      <span className="card-body">
        <span className="card-name">{item.name}</span>
        {item.description && <span className="card-desc">{item.description}</span>}
      </span>
      <span className="price">{item.priceText}</span>
    </button>
  );
}

function Products({ v, items, rank = false }: { v: View; items: MenuItem[]; rank?: boolean }) {
  return (
    <ul className="plain grid">
      {items.map((item, i) => (
        <li key={item.id} className="reveal">
          <ProductCard v={v} item={item} rank={rank ? i + 1 : undefined} />
        </li>
      ))}
    </ul>
  );
}

function Tiles({ v, categories }: { v: View; categories: Category[] }) {
  return (
    <ul className="plain tiles">
      {categories.map((cat, i) => (
        <li key={cat.id} className="reveal" style={tint(cat.parent ? `var(--c${((Math.max(0, v.tree.roots.indexOf(cat.parent)) + i + 1) % TILE_COLORS) + 1})` : tileOf(v, cat))}>
          <a className="tile" href={v.href(cat.path)}>
            <span className="tile-name">{cat.name}</span>
            <span className="tile-meta">
              {(cat.children.length > 0 ? cat.children.map((s) => s.name) : cat.all.slice(0, 3).map((p) => p.name)).join(", ")}
            </span>
            <span className="tile-count" aria-hidden="true">
              {cat.all.length}
            </span>
            <span className="sr-only">{itemCount(cat.all.length, v.ctx.locale)}</span>
            {cat.cover && (
              <span className="tile-photo">
                <Picture src={cat.cover} sizes="140px" />
              </span>
            )}
            <span className="tile-go" aria-hidden="true">
              <Arrow className="flip" />
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

function PageHead({
  v,
  trail,
  title,
  lead,
  color,
  sticker,
  photo,
  children,
}: {
  v: View;
  trail: { label: string; href?: string }[];
  title: string;
  lead?: string | null;
  color: string;
  sticker?: string;
  photo?: string | null;
  children?: ReactNode;
}) {
  return (
    <>
      <header className={cx("phead", photo && "with-photo")} style={tint(color)}>
        <div className="phead-in">
          {photo && (
            <span className="phead-photo">
              <Picture src={photo} sizes="(min-width: 900px) 300px, 130px" priority />
            </span>
          )}
          <Crumbs v={v} trail={trail} />
          <h1 className="phead-title">{title}</h1>
          {lead && <p className="phead-lead">{lead}</p>}
          {sticker && <span className="sticker phead-sticker">{sticker}</span>}
        </div>
      </header>
      {children}
    </>
  );
}

/** Words of the ticker: the owner writes them separated by commas (or Arabic commas, dots or bars). */
const tickerWords = (value: string) =>
  value
    .split(/[,،·•|]/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 12);

function Ticker({ v }: { v: View }) {
  const words = tickerWords(v.ctx.text("ticker"));
  if (!v.ctx.on("ticker") || words.length === 0) return null;
  // Enough copies to fill a wide screen twice, so the loop (moving by half the track) never shows a gap.
  const copies = Math.max(2, Math.ceil(16 / words.length)) * 2;
  return (
    <div className="ticker" data-section="ticker">
      <p className="sr-only">{words.join(", ")}</p>
      <div className="ticker-track" aria-hidden="true">
        {Array.from({ length: copies }, (_, n) =>
          words.map((w, i) => (
            <span key={`${n}-${i}`} className="ticker-word">
              {w}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

/* ---------- home ---------- */

function Hero({ v }: { v: View }) {
  const { ctx, c, href } = v;
  const s = ctx.site.settings;
  const layout = choice(s, "hero.layout", HERO, "bento");
  const fallback = v.tree.items.find((p) => p.imageUrl)?.imageUrl ?? null;
  const photo = layout === "bento" ? (image(s["hero.image"]) ?? fallback) : null;
  const title = text(s, "hero.title") || ctx.site.business.name;
  const subtitle = text(s, "hero.subtitle");
  const sticker = text(s, "hero.sticker");
  const pick = v.best.find((p) => p.isAvailable) ?? v.tree.items.find((p) => p.isAvailable) ?? null;
  const hours = hasHours(ctx.hours);

  return (
    <section className={cx("bento", `hero-${layout}`, !photo && "no-photo-hero")} data-section="hero" aria-labelledby="hero-title">
      <div className="cell b-copy">
        {!photo && sticker && <span className="sticker b-sticker">{sticker}</span>}
        <h1 id="hero-title" className="hero-title">
          {title}
        </h1>
        {subtitle && <p className="hero-sub">{subtitle}</p>}
        <div className="hero-actions">
          <a className="btn btn-ink" href={href(PAGE_PATHS.menu)}>
            <span>{c.browse}</span> <Arrow className="flip" />
          </a>
        </div>
      </div>
      {photo && (
        <div className="cell b-photo">
          <Picture src={photo} sizes="(min-width: 900px) 30vw, 100vw" priority />
          {sticker && <span className="sticker b-sticker">{sticker}</span>}
        </div>
      )}
      <a className="cell b-status" href={href(PAGE_PATHS.visit)}>
        <span className="b-label">{hours ? ctx.t.hours : c.findUs}</span>
        <strong className="b-big">{(hours && ctx.today) || ctx.site.business.address || ctx.t.visit}</strong>
        <span className="b-go" aria-hidden="true">
          <Arrow className="flip" />
        </span>
      </a>
      {pick ? (
        <button type="button" className="cell b-pick" data-item-id={pick.id}>
          <span className="b-label">{v.best.length > 0 ? c.best : ctx.t.featured}</span>
          <span className="b-pick-photo">
            <ProductPicture item={pick} sizes="160px" />
          </span>
          <span className="b-pick-name">{pick.name}</span>
          <span className="price">{pick.priceText}</span>
        </button>
      ) : (
        <a className="cell b-pick" href={href(PAGE_PATHS.menu)}>
          <span className="b-label">{c.menu}</span>
          <strong className="b-big">{itemCount(v.tree.items.length, ctx.locale)}</strong>
        </a>
      )}
    </section>
  );
}

function Home({ v }: { v: View }) {
  const { ctx, c, href } = v;
  const story = ctx.on("story") && ctx.text("story.text");
  return (
    <>
      <Hero v={v} />
      <Ticker v={v} />

      <section id="menu" className="sec sec-tiles" data-section="menu" aria-labelledby="cats-title">
        <SectionHead title={ctx.text("categories.title") || c.browse} id="cats-title" link={{ href: href(PAGE_PATHS.menu), label: c.viewAll }} />
        {v.tree.roots.length > 0 && <Tiles v={v} categories={v.tree.roots} />}
      </section>

      {ctx.on("best") && v.best.length > 0 && (
        <section id="best" className="sec sec-rail" data-section="best" aria-labelledby="best-title">
          <SectionHead title={ctx.text("best.title") || c.best} id="best-title" link={{ href: href(PAGE_PATHS.best), label: c.viewAll }} />
          <ul className="plain rail">
            {v.best.slice(0, 10).map((item, i) => (
              <li key={item.id}>
                <ProductCard v={v} item={item} rank={i + 1} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {story && <Statement v={v} story={story} link />}

      {ctx.on("gallery") && v.photos.length > 0 && (
        <section id="gallery" className="sec" data-section="gallery" aria-labelledby="gallery-title">
          <SectionHead title={ctx.text("gallery.title") || c.galleryLead} id="gallery-title" link={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }} />
          <Wall v={v} photos={v.photos.slice(0, 6)} />
        </section>
      )}

      {ctx.on("reviews") && ctx.reviews.length > 0 && <Reviews v={v} />}

      {ctx.on("visit") && <VisitBlock v={v} />}
    </>
  );
}

/** About us as a big type poster on a color block, with the photo as a round sticker. */
function Statement({ v, story, link = false }: { v: View; story: string; link?: boolean }) {
  const { ctx, c, href } = v;
  const photo = ctx.image("story.image");
  return (
    <section id="story" className={cx("statement", photo && "with-photo")} data-section="story" aria-labelledby="story-title">
      <div className="statement-in reveal">
        <h2 id="story-title" className="statement-title">
          {ctx.text("story.title") || ctx.t.story}
        </h2>
        <p className="statement-text">{story}</p>
        {link && (
          <a className="btn btn-ink" href={href(PAGE_PATHS.visit)}>
            <span>{c.visit}</span> <Arrow className="flip" />
          </a>
        )}
      </div>
      {photo && (
        <span className="statement-photo">
          <Picture src={photo} sizes="(min-width: 900px) 360px, 70vw" />
        </span>
      )}
    </section>
  );
}

/** Photos pinned to the wall: slightly turned, they straighten up under the pointer. Each opens the lightbox. */
function Wall({ v, photos, full = false }: { v: View; photos: { src: string; caption: string | null }[]; full?: boolean }) {
  return (
    <ul className={cx("plain wall", full && "wall-full")}>
      {photos.map((p, i) => (
        <li key={p.src} className="reveal">
          <button type="button" className="shot" data-photo={i} aria-label={p.caption ?? fill(v.c.photo, { n: i + 1 })}>
            <span className="shot-img">
              <Picture src={p.src} sizes={full ? "(min-width: 900px) 33vw, 50vw" : "(min-width: 900px) 30vw, 50vw"} />
            </span>
            {p.caption && <span className="shot-cap">{p.caption}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Reviews({ v }: { v: View }) {
  return (
    <section id="reviews" className="sec" data-section="reviews" aria-labelledby="reviews-title">
      <SectionHead title={v.ctx.t.reviews} id="reviews-title" />
      <ul className="plain bubbles">
        {v.ctx.reviews.map((r, i) => (
          <li key={i} className="reveal" style={tint(`var(--c${((i + 2) % TILE_COLORS) + 1})`)}>
            <figure className="bubble">
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
  const { ctx } = v;
  const { contact, site } = ctx;
  return (
    <section id="visit" className="sec sec-visit" data-section="visit" aria-labelledby={heading ? "visit-title" : undefined} aria-label={heading ? undefined : ctx.t.contact}>
      {heading && <SectionHead title={ctx.t.visit} id="visit-title" />}
      <div className="visit-grid">
        {site.business.address && (
          <div className="where reveal">
            <Pin />
            <p className="where-address">
              <bdi>{site.business.address}</bdi>
            </p>
            {contact.maps && (
              <a className="btn btn-ink" href={contact.maps} target="_blank" rel="noopener noreferrer">
                <span>{ctx.t.directions}</span> <Arrow className="flip" />
              </a>
            )}
          </div>
        )}
        {hasHours(ctx.hours) && (
          <div className="ticket reveal">
            <h3 className="ticket-title">{ctx.t.hours}</h3>
            <HoursList ctx={ctx} />
          </div>
        )}
        <div className="reach reveal">
          <h3 className="ticket-title">{ctx.t.contact}</h3>
          <ContactList ctx={ctx} />
          {contact.whatsapp && (
            <a className="btn btn-acc" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> <span>{v.cta}</span>
            </a>
          )}
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
      <PageHead v={v} trail={[{ label: c.menu }]} title={c.menu} lead={itemCount(tree.items.length, ctx.locale)} color="var(--acc)" photo={tree.items.find((p) => p.imageUrl)?.imageUrl}>
        {tree.roots.length > 1 && (
          <nav className="chipbar" aria-label={c.categories}>
            <ul className="plain">
              {tree.roots.map((cat) => (
                <li key={cat.id} style={tint(tileOf(v, cat))}>
                  <a className="chip" href={`#m-${cat.id}`}>
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </PageHead>
      {tree.roots.map((cat) => (
        <section key={cat.id} id={`m-${cat.id}`} className="sec menu-block" aria-labelledby={`m-${cat.id}-h`} style={tint(tileOf(v, cat))}>
          <div className="band">
            <h2 id={`m-${cat.id}-h`} className="band-title">
              <a href={href(cat.path)}>{cat.name}</a>
            </h2>
            <span className="band-count">{itemCount(cat.all.length, ctx.locale)}</span>
          </div>
          {cat.products.length > 0 && <Products v={v} items={cat.products} />}
          {cat.children.map((sub) => (
            <div key={sub.id} className="menu-sub">
              <SectionHead title={sub.name} as="h3" link={{ href: href(sub.path), label: c.viewAll }} />
              <Products v={v} items={sub.products} />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function CategoryPage({ v, category }: { v: View; category: Category }) {
  const { c, href, ctx } = v;
  const parent = category.parent;
  const trail = [{ label: c.menu, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];
  const family = parent ?? category;
  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} color={tileOf(v, category)} sticker={itemCount(category.all.length, ctx.locale)} photo={category.cover}>
        {family.children.length > 0 && (
          <nav className="chipbar" aria-label={fill(c.subcategories, { name: family.name })}>
            <ul className="plain">
              <li>
                <a className="chip" href={href(family.path)} aria-current={category === family ? "page" : undefined}>
                  {c.everything}
                </a>
              </li>
              {family.children.map((sub) => (
                <li key={sub.id}>
                  <a className="chip" href={href(sub.path)} aria-current={sub === category ? "page" : undefined}>
                    {sub.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </PageHead>

      {category.children.length > 0 && (
        <section className="sec sec-tiles" aria-labelledby="subs-title">
          <SectionHead title={fill(c.subcategories, { name: category.name })} id="subs-title" />
          <Tiles v={v} categories={category.children} />
        </section>
      )}

      {category.products.length > 0 && (
        <section className="sec" aria-labelledby="own-title">
          {category.children.length > 0 ? (
            <SectionHead title={fill(c.inThis, { name: category.name })} id="own-title" />
          ) : (
            <h2 id="own-title" className="sr-only">
              {category.name}
            </h2>
          )}
          <Products v={v} items={category.products} />
        </section>
      )}

      {category.children.map((sub) => (
        <section key={sub.id} className="sec sec-rail" aria-labelledby={`s-${sub.id}`}>
          <SectionHead title={sub.name} id={`s-${sub.id}`} link={{ href: href(sub.path), label: c.viewAll }} />
          <ul className="plain rail">
            {sub.products.slice(0, 10).map((item) => (
              <li key={item.id}>
                <ProductCard v={v} item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function BestPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.c.best }]} title={v.c.best} lead={v.ctx.text("best.title") || v.c.bestLead} color="var(--c2)" photo={v.best.find((p) => p.imageUrl)?.imageUrl} />
      <section className="sec" aria-label={v.c.best}>
        <Products v={v} items={v.best} rank />
      </section>
    </>
  );
}

function GalleryPage({ v }: { v: View }) {
  const { c } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: c.gallery }]} title={c.gallery} lead={v.ctx.text("gallery.title") || c.galleryLead} color="var(--c3)" photo={v.photos[0]?.src} />
      <section className="sec" aria-label={c.gallery}>
        <Wall v={v} photos={v.photos} full />
      </section>
    </>
  );
}

function VisitPage({ v }: { v: View }) {
  const { ctx, c } = v;
  const story = ctx.text("story.text");
  return (
    <>
      <PageHead v={v} trail={[{ label: c.visit }]} title={ctx.t.visit} lead={ctx.today} color="var(--c4)" photo={ctx.image("story.image")} />
      <VisitBlock v={v} heading={false} />
      {story && <Statement v={v} story={story} />}
      {ctx.reviews.length > 0 && ctx.on("reviews") && <Reviews v={v} />}
    </>
  );
}

/* ---------- footer ---------- */

function Footer({ v }: { v: View }) {
  const { ctx, c, href, tree } = v;
  const { site, contact } = ctx;
  const tagline = ctx.text("footer.text");
  return (
    <footer className="foot" data-section="footer">
      <div className="foot-in">
        <p className="foot-mark" aria-hidden="true">
          {site.business.name}
          <span className="foot-dot">{initial(site.business.name)}</span>
        </p>
        <div className="foot-grid">
          <div className="foot-brand">
            {tagline && <p className="foot-text">{tagline}</p>}
            <div className="socials">
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.instagram}>
                  <Instagram />
                </a>
              )}
              {contact.whatsapp && (
                <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.phone}>
                  <WhatsApp />
                </a>
              )}
              {contact.maps && (
                <a href={contact.maps} target="_blank" rel="noopener noreferrer" aria-label={ctx.t.directions}>
                  <Pin />
                </a>
              )}
            </div>
          </div>
          <nav className="foot-col" aria-label={c.pages}>
            <h2 className="foot-title">{c.pages}</h2>
            <ul className="plain">
              <li>
                <a href={href(PAGE_PATHS.menu)}>{c.menu}</a>
              </li>
              {v.best.length > 0 && (
                <li>
                  <a href={href(PAGE_PATHS.best)}>{c.best}</a>
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
              <h2 className="foot-title">{c.categories}</h2>
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
      </div>
      <Credits ctx={ctx} />
    </footer>
  );
}
