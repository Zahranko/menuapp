import type { CSSProperties, ReactNode } from "react";
import { whatsappLink } from "@/lib/format";
import { itemCount } from "@/lib/i18n";
import { choice, flag, image, list, number, text } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { ContactList, Credits, HoursList, Logo, ProductPicture, ProductSheet, TopBars } from "../_kit/blocks";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { Drawer } from "../_kit/Drawer";
import { fontVariables, type FontName } from "../_kit/fonts";
import { Arrow, Burger, Close, Instagram, Pin, WhatsApp } from "../_kit/icons";
import { Picture } from "../_kit/Picture";
import { hasHours, type MenuItem } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars, type Palette } from "../_kit/theme";
import { copyFor, fill } from "./copy";
import { Lightbox } from "./Lightbox";
import { bestSellers, categoryTree, galleryPhotos, PAGE_PATHS, resolvePage, type Category, type Page, type Tree } from "./pages";

/*
 * The shared body of the Pro templates: a multi-page site with a navigation bar and category mega menu,
 * a home page, the full menu, category and sub-category pages, best sellers, a gallery and a visit page.
 * Each template passes its palettes and fonts and styles the same class names in its own styles.css,
 * which starts with @import "../_premium/base.css".
 */

export type PremiumConfig<T extends string> = {
  id: string;
  /** Root class, for example "t-maison". */
  className: string;
  palettes: Record<T, Palette>;
  fonts: readonly FontName[];
  defaultAccent: string;
  radius?: { rounded: string; sharp: string };
  /** Shops say "Shop" instead of "Menu". */
  shop?: boolean;
  /** A small decoration the template shows next to section titles. */
  ornament?: ReactNode;
};

const NAV = ["classic", "centered", "floating"] as const;
const HERO = ["cover", "split", "slides", "text"] as const;
const CARDS = ["classic", "overlay", "minimal"] as const;
const CATS = ["tiles", "circles", "banners"] as const;
const DENSITY = ["comfy", "dense"] as const;

type View = {
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  cards: (typeof CARDS)[number];
  menuWord: string;
  best: MenuItem[];
  photos: { src: string; caption: string | null }[];
  ornament?: ReactNode;
};

export function PremiumSite<T extends string>({ site, path = [], base, now, config }: TemplateProps & { now?: Date; config: PremiumConfig<T> }) {
  const ctx = siteContext(site, now);
  const c = copyFor(ctx.locale);
  const tree = categoryTree(site);
  // An unknown address never gets here (the route answers 404); fall back to the home page to be safe.
  const page = resolvePage(site, path, tree) ?? { kind: "home" };
  const root = base ?? `/${site.business.slug}`;
  const href = (p: string) => (p ? `${root}${p}` : root || "/");
  const v: View = {
    ctx,
    c,
    tree,
    page,
    href,
    cards: choice(site.settings, "cards", CARDS, "classic"),
    menuWord: config.shop ? c.shop : c.menu,
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree),
    ornament: config.ornament,
  };
  const style = themeVars(site.settings, ctx.locale, { palettes: config.palettes, fonts: config.fonts, defaultAccent: config.defaultAccent, radius: config.radius });

  return (
    <div
      data-template={config.id}
      data-page={page.kind}
      className={cx(
        "pm",
        config.className,
        fontVariables,
        `nav-${choice(site.settings, "nav.style", NAV, "classic")}`,
        `cards-${v.cards}`,
        `cats-${choice(site.settings, "categories.style", CATS, "tiles")}`,
        `density-${choice(site.settings, "density", DENSITY, "comfy")}`,
        flag(site.settings, "motion", true) && "motion",
      )}
      style={style}
    >
      <TemplateStyles id={config.id} />
      <TopBars ctx={ctx} />
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
      <ProductSheet ctx={ctx} />
      {v.photos.length > 0 && <Lightbox photos={v.photos} labels={{ close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo }} />}
    </div>
  );
}

/* ---------- navigation ---------- */

function orderLink(v: View): string | null {
  const phone = v.ctx.site.business.whatsApp;
  return phone ? whatsappLink(phone) : null;
}

function Header({ v }: { v: View }) {
  const { ctx, c, page, href, tree } = v;
  const current = (kind: Page["kind"]) => (page.kind === kind ? ("page" as const) : undefined);
  const cta = text(ctx.site.settings, "cta.label") || c.order;
  const order = orderLink(v);
  const links = (
    <>
      <a href={href("")} aria-current={current("home")}>
        {c.home}
      </a>
      <a href={href(PAGE_PATHS.menu)} aria-current={page.kind === "menu" || page.kind === "category" ? "page" : undefined}>
        {v.menuWord}
      </a>
      {v.best.length > 0 && (
        <a href={href(PAGE_PATHS.best)} aria-current={current("best")}>
          {c.best}
        </a>
      )}
      {v.photos.length > 0 && (
        <a href={href(PAGE_PATHS.gallery)} aria-current={current("gallery")}>
          {c.gallery}
        </a>
      )}
      <a href={href(PAGE_PATHS.visit)} aria-current={current("visit")}>
        {c.visit}
      </a>
    </>
  );

  return (
    <header className="nav" data-section="header">
      <div className="nav-in">
        <a className="brand" href={href("")}>
          <Logo ctx={ctx} className="brand-logo" sizes="44px" />
          <span className="brand-name">{ctx.site.business.name}</span>
        </a>
        <nav className="links" aria-label={c.pages}>
          <a href={href("")} aria-current={current("home")}>
            {c.home}
          </a>
          <div className="mega">
            <a className="mega-top" href={href(PAGE_PATHS.menu)} aria-current={page.kind === "menu" || page.kind === "category" ? "page" : undefined}>
              {v.menuWord}
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </a>
            {tree.roots.length > 0 && (
              <div className="mega-panel">
                <div className="mega-grid">
                  {tree.roots.map((cat) => (
                    <div key={cat.id} className="mega-col">
                      <a className="mega-cat" href={href(cat.path)}>
                        <span className="mega-thumb">{cat.cover && <Picture src={cat.cover} sizes="56px" />}</span>
                        <span>
                          <b>{cat.name}</b>
                          <small>{itemCount(cat.all.length, ctx.locale)}</small>
                        </span>
                      </a>
                      {cat.children.length > 0 && (
                        <ul className="plain mega-subs">
                          {cat.children.map((sub) => (
                            <li key={sub.id}>
                              <a href={href(sub.path)}>{sub.name}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <a className="mega-all" href={href(PAGE_PATHS.menu)}>
                  {c.viewAll} <Arrow className="flip" />
                </a>
              </div>
            )}
          </div>
          {v.best.length > 0 && (
            <a href={href(PAGE_PATHS.best)} aria-current={current("best")}>
              {c.best}
            </a>
          )}
          {v.photos.length > 0 && (
            <a href={href(PAGE_PATHS.gallery)} aria-current={current("gallery")}>
              {c.gallery}
            </a>
          )}
          <a href={href(PAGE_PATHS.visit)} aria-current={current("visit")}>
            {c.visit}
          </a>
        </nav>
        {order && (
          <a className="btn nav-cta" href={order} target="_blank" rel="noopener noreferrer">
            <WhatsApp />
            <span>{cta}</span>
          </a>
        )}
        <Drawer openLabel={ctx.t.openMenu} closeLabel={ctx.t.close} buttonClassName="nav-toggle" panelClassName="drawer" icon={<Burger />} closeIcon={<Close />}>
          <nav className="drawer-links" aria-label={c.pages}>
            {links}
          </nav>
          {tree.roots.length > 0 && (
            <div className="drawer-cats">
              <p className="eyebrow">{c.categories}</p>
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
            </div>
          )}
          {order && (
            <a className="btn drawer-cta" href={order} target="_blank" rel="noopener noreferrer">
              <WhatsApp />
              <span>{cta}</span>
            </a>
          )}
        </Drawer>
      </div>
    </header>
  );
}

/* ---------- building blocks ---------- */

function SectionHead({ v, eyebrow, title, link, id }: { v: View; eyebrow?: string; title: string; link?: { href: string; label: string }; id?: string }) {
  return (
    <div className="sec-head">
      <div>
        {eyebrow && (
          <p className="eyebrow">
            {v.ornament}
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="sec-title">
          {title}
        </h2>
      </div>
      {link && (
        <a className="more" href={link.href}>
          {link.label} <Arrow className="flip" />
        </a>
      )}
    </div>
  );
}

function ProductCard({ v, item, rank }: { v: View; item: MenuItem; rank?: number }) {
  return (
    <button type="button" className={cx("card", !item.isAvailable && "out")} data-item-id={item.id}>
      <span className="card-media">
        <ProductPicture item={item} sizes="(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw" />
        {rank !== undefined && <span className="rank">{rank}</span>}
        {(item.labelText || !item.isAvailable) && (
          <span className="badges">
            {item.labelText && <span className="badge">{item.labelText}</span>}
            {!item.isAvailable && <span className="badge badge-out">{v.ctx.t.soldOut}</span>}
          </span>
        )}
      </span>
      <span className="card-body">
        <span className="card-name">{item.name}</span>
        {item.description && v.cards !== "overlay" && <span className="card-desc">{item.description}</span>}
        <span className="card-price">{item.priceText}</span>
      </span>
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

function CategoryTiles({ v, categories, sizes = "(min-width: 900px) 33vw, 50vw" }: { v: View; categories: Category[]; sizes?: string }) {
  return (
    <ul className="plain cats">
      {categories.map((cat) => (
        <li key={cat.id} className="reveal">
          <a className="cat" href={v.href(cat.path)}>
            <span className="cat-media">{cat.cover ? <Picture src={cat.cover} sizes={sizes} /> : <span className="cat-blank" aria-hidden="true" />}</span>
            <span className="cat-body">
              <span className="cat-name">{cat.name}</span>
              <span className="cat-count">
                {cat.children.length > 0 ? cat.children.map((s) => s.name).join(" · ") : itemCount(cat.all.length, v.ctx.locale)}
              </span>
            </span>
            <span className="cat-go" aria-hidden="true">
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
          <li key={i}>
            {item.href && i < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function PageHead({ v, trail, title, lead, children }: { v: View; trail: { label: string; href?: string }[]; title: string; lead?: string | null; children?: ReactNode }) {
  return (
    <header className="page-head">
      <Crumbs v={v} trail={trail} />
      <h1 className="page-title">{title}</h1>
      {lead && <p className="page-lead">{lead}</p>}
      {children}
    </header>
  );
}

function Photo({ src, sizes, priority }: { src: string | null; sizes: string; priority?: boolean }) {
  return src ? <Picture src={src} sizes={sizes} priority={priority} /> : <span className="cat-blank" aria-hidden="true" />;
}

/* ---------- home ---------- */

function Hero({ v }: { v: View }) {
  const { ctx, c, href } = v;
  const s = ctx.site.settings;
  const layout = choice(s, "hero.layout", HERO, "cover");
  const images = list(s, "hero.images")
    .map((x) => image(x))
    .filter((x): x is string => !!x)
    .slice(0, 4);
  const fallback = v.tree.items.find((p) => p.imageUrl)?.imageUrl ?? null;
  const first = images[0] ?? fallback;
  const slides = layout === "slides" && images.length > 1 ? images : null;
  const title = text(s, "hero.title") || ctx.site.business.name;
  const eyebrow = text(s, "hero.eyebrow");
  const subtitle = text(s, "hero.subtitle");
  const shade = Math.min(90, Math.max(0, number(s, "hero.shade", 45)));
  const order = orderLink(v);
  const media = layout !== "text" && first;

  return (
    <section className={cx("hero", `hero-${layout === "slides" && !slides ? "cover" : layout}`, !media && "hero-plain")} data-section="hero" style={{ "--shade": shade / 100 } as CSSProperties}>
      {media && (
        <div className={cx("hero-media", slides && `slides slides-${slides.length}`)}>
          {(slides ?? [first]).map((src, i) => (
            <div key={src + i} className="hero-slide" style={{ "--i": i } as CSSProperties}>
              <Picture src={src} sizes={layout === "split" ? "(min-width: 900px) 50vw, 100vw" : "100vw"} priority={i === 0} />
            </div>
          ))}
        </div>
      )}
      <div className="hero-copy">
        {eyebrow && <p className="eyebrow hero-eyebrow">{eyebrow}</p>}
        <h1 className="hero-title">{title}</h1>
        {subtitle && <p className="hero-sub">{subtitle}</p>}
        <div className="hero-actions">
          <a className="btn" href={href(PAGE_PATHS.menu)}>
            {c.browse} <Arrow className="flip" />
          </a>
          {order && (
            <a className="btn btn-ghost" href={order} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> {text(s, "cta.label") || c.order}
            </a>
          )}
        </div>
        {ctx.today && (
          <p className="hero-today">
            <span className="dot" aria-hidden="true" />
            {ctx.today}
          </p>
        )}
      </div>
    </section>
  );
}

function Home({ v }: { v: View }) {
  const { ctx, c, href } = v;
  const story = ctx.on("story") && ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  return (
    <>
      <Hero v={v} />

      <section id="menu" className="sec sec-cats" data-section="menu" aria-labelledby="cats-title">
        <SectionHead v={v} eyebrow={c.categories} title={ctx.text("categories.title") || c.browse} id="cats-title" link={{ href: href(PAGE_PATHS.menu), label: c.viewAll }} />
        {v.tree.roots.length > 0 ? <CategoryTiles v={v} categories={v.tree.roots} /> : null}
      </section>

      {ctx.on("best") && v.best.length > 0 && (
        <section id="best" className="sec sec-best" data-section="best" aria-labelledby="best-title">
          <SectionHead v={v} eyebrow={c.best} title={ctx.text("best.title") || c.bestLead} id="best-title" link={{ href: href(PAGE_PATHS.best), label: c.viewAll }} />
          <ul className="plain rail">
            {v.best.slice(0, 8).map((item) => (
              <li key={item.id}>
                <ProductCard v={v} item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {story && (
        <section id="story" className={cx("sec sec-story", storyImage && "with-image")} data-section="story" aria-labelledby="story-title">
          {storyImage && (
            <div className="story-media reveal">
              <Picture src={storyImage} sizes="(min-width: 900px) 50vw, 100vw" />
            </div>
          )}
          <div className="story-copy reveal">
            <p className="eyebrow">
              {v.ornament}
              {c.about}
            </p>
            <h2 id="story-title" className="sec-title">
              {ctx.text("story.title") || ctx.t.story}
            </h2>
            <p className="story-text">{story}</p>
            <a className="more" href={href(PAGE_PATHS.visit)}>
              {c.visit} <Arrow className="flip" />
            </a>
          </div>
        </section>
      )}

      {ctx.on("gallery") && v.photos.length > 0 && (
        <section id="gallery" className="sec sec-gallery" data-section="gallery" aria-labelledby="gallery-title">
          <SectionHead v={v} eyebrow={c.gallery} title={ctx.text("gallery.title") || c.galleryLead} id="gallery-title" link={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }} />
          <ul className="plain mosaic">
            {v.photos.slice(0, 5).map((p, i) => (
              <li key={p.src} className="reveal">
                <button type="button" className="shot" data-photo={i} aria-label={p.caption ?? fill(c.photo, { n: i + 1 })}>
                  <Picture src={p.src} sizes={i === 0 ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 25vw, 50vw"} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctx.on("reviews") && ctx.reviews.length > 0 && <Reviews v={v} />}

      {ctx.on("visit") && <VisitBlock v={v} />}
    </>
  );
}

function Reviews({ v }: { v: View }) {
  return (
    <section id="reviews" className="sec sec-reviews" data-section="reviews" aria-labelledby="reviews-title">
      <SectionHead v={v} title={v.ctx.t.reviews} id="reviews-title" />
      <ul className="plain quotes">
        {v.ctx.reviews.map((r, i) => (
          <li key={i} className="reveal">
            <figure className="quote">
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
  const { ctx, c } = v;
  const { contact, site } = ctx;
  return (
    <section id="visit" className="sec sec-visit" data-section="visit" aria-labelledby={heading ? "visit-title" : undefined}>
      {heading && <SectionHead v={v} eyebrow={c.findUs} title={ctx.t.visit} id="visit-title" />}
      <div className="visit-grid">
        {hasHours(ctx.hours) && (
          <div className="panel">
            <h3 className="panel-title">{ctx.t.hours}</h3>
            <HoursList ctx={ctx} />
          </div>
        )}
        <div className="panel">
          <h3 className="panel-title">{ctx.t.contact}</h3>
          <ContactList ctx={ctx} />
          <div className="panel-actions">
            {contact.whatsapp && (
              <a className="btn" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsApp /> {text(site.settings, "cta.label") || c.order}
              </a>
            )}
            {contact.maps && (
              <a className="btn btn-ghost" href={contact.maps} target="_blank" rel="noopener noreferrer">
                <Pin /> {ctx.t.directions}
              </a>
            )}
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
      <PageHead v={v} trail={[{ label: v.menuWord }]} title={v.menuWord} lead={itemCount(tree.items.length, ctx.locale)}>
        {tree.roots.length > 1 && (
          <nav className="chips" aria-label={c.categories}>
            {tree.roots.map((cat) => (
              <a key={cat.id} className="chip" href={`#m-${cat.id}`}>
                {cat.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>
      {tree.roots.map((cat) => (
        <section key={cat.id} id={`m-${cat.id}`} className="sec menu-block" aria-labelledby={`m-${cat.id}-h`}>
          <SectionHead v={v} title={cat.name} id={`m-${cat.id}-h`} link={{ href: href(cat.path), label: c.viewAll }} />
          {cat.products.length > 0 && <Products v={v} items={cat.products} />}
          {cat.children.map((sub) => (
            <div key={sub.id} className="menu-sub">
              <h3 className="sub-title">
                <a href={href(sub.path)}>{sub.name}</a>
              </h3>
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
  const trail = [{ label: v.menuWord, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];
  const family = parent ?? category;
  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} lead={itemCount(category.all.length, ctx.locale)}>
        {family.children.length > 0 && (
          <nav className="chips" aria-label={fill(c.subcategories, { name: family.name })}>
            <a className="chip" href={href(family.path)} aria-current={category === family ? "page" : undefined}>
              {c.everything}
            </a>
            {family.children.map((sub) => (
              <a key={sub.id} className="chip" href={href(sub.path)} aria-current={sub === category ? "page" : undefined}>
                {sub.name}
              </a>
            ))}
          </nav>
        )}
      </PageHead>

      {category.children.length > 0 && (
        <section className="sec sec-subs" aria-labelledby="subs-title">
          <SectionHead v={v} title={fill(c.subcategories, { name: category.name })} id="subs-title" />
          <CategoryTiles v={v} categories={category.children} />
        </section>
      )}

      {category.products.length > 0 && (
        <section className="sec" aria-labelledby="own-title">
          {category.children.length > 0 ? <SectionHead v={v} title={fill(c.inThis, { name: category.name })} id="own-title" /> : <h2 id="own-title" className="sr-only">{category.name}</h2>}
          <Products v={v} items={category.products} />
        </section>
      )}

      {category.children.map((sub) => (
        <section key={sub.id} className="sec" aria-labelledby={`s-${sub.id}`}>
          <SectionHead v={v} title={sub.name} id={`s-${sub.id}`} link={{ href: href(sub.path), label: c.viewAll }} />
          <Products v={v} items={sub.products.slice(0, 8)} />
        </section>
      ))}
    </>
  );
}

function BestPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.c.best }]} title={v.c.best} lead={v.ctx.text("best.title") || v.c.bestLead} />
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
      <PageHead v={v} trail={[{ label: c.gallery }]} title={c.gallery} lead={v.ctx.text("gallery.title") || c.galleryLead} />
      <section className="sec" aria-label={c.gallery}>
        <ul className="plain masonry">
          {v.photos.map((p, i) => (
            <li key={p.src} className="reveal">
              <button type="button" className="shot" data-photo={i} aria-label={p.caption ?? fill(c.photo, { n: i + 1 })}>
                {/* eslint-disable-next-line @next/next/no-img-element -- natural height for the masonry layout */}
                <img src={p.src} alt="" loading={i < 6 ? "eager" : "lazy"} />
              </button>
            </li>
          ))}
        </ul>
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
      <PageHead v={v} trail={[{ label: c.visit }]} title={ctx.t.visit} lead={ctx.site.business.address} />
      {story && (
        <section className={cx("sec sec-story", storyImage && "with-image")} data-section="story" aria-labelledby="story-title">
          {storyImage && (
            <div className="story-media">
              <Photo src={storyImage} sizes="(min-width: 900px) 50vw, 100vw" />
            </div>
          )}
          <div className="story-copy">
            <p className="eyebrow">
              {v.ornament}
              {c.about}
            </p>
            <h2 id="story-title" className="sec-title">
              {ctx.text("story.title") || ctx.t.story}
            </h2>
            <p className="story-text">{story}</p>
          </div>
        </section>
      )}
      <VisitBlock v={v} heading={false} />
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
      <div className="foot-grid">
        <div className="foot-brand">
          <a className="brand" href={href("")}>
            <Logo ctx={ctx} className="brand-logo" sizes="44px" />
            <span className="brand-name">{site.business.name}</span>
          </a>
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
              <a href={href(PAGE_PATHS.menu)}>{v.menuWord}</a>
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
        {(ctx.today || site.business.address) && (
          <div className="foot-col">
            <h2 className="foot-title">{c.findUs}</h2>
            {site.business.address && <p>{site.business.address}</p>}
            {ctx.today && <p className="foot-today">{ctx.today}</p>}
          </div>
        )}
      </div>
      <Credits ctx={ctx} />
    </footer>
  );
}
