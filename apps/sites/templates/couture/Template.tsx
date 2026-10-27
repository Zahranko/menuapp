import type { CSSProperties, ReactNode } from "react";
import { initial, whatsappLink } from "@/lib/format";
import { flag, text } from "@/lib/settings";
import type { TemplateProps } from "@/lib/types";
import { BrandName, ContactList, Credits, FootName, HoursList, Logo, logoRoot, optionRoot, OrderFab, ProductPicture, SocialIcons, TopBars } from "../_kit/blocks";
import { cx, siteContext, type SiteContext } from "../_kit/context";
import { Drawer } from "../_kit/Drawer";
import { fontVariables } from "../_kit/fonts";
import { heroPhotos } from "../_kit/hero";
import { HeroPhotos } from "../_kit/HeroPhotos";
import { Arrow, Burger, Close, Pin, WhatsApp } from "../_kit/icons";
import { orderButton, socialAccounts } from "../_kit/options";
import { Picture } from "../_kit/Picture";
import { hasHours, type MenuItem } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { themeVars, type Palette } from "../_kit/theme";
import { fashionCopy, fill } from "../_fashion/copy";
import { details, sizeRange } from "../_fashion/details";
import { sheetItems, sheetLabels, viewerLabels } from "../_fashion/items";
import { PhotoViewer, type ViewerPhoto } from "../_fashion/PhotoViewer";
import { ProductSheet } from "../_fashion/ProductSheet";
import { copyFor } from "../_premium/copy";
import { bestSellers, categoryTree, galleryPhotos, PAGE_PATHS, resolvePage, type Category, type Page, type Tree } from "../_premium/pages";
import { coutureCopy, pieceCount } from "./copy";

/*
 * Template 029 "Couture" (Pro): a luxury fashion boutique with its own pages. A full-screen lookbook opening with the
 * headline rising in, tall collection tiles that step down the page, the edit as a sideways row, an editorial story,
 * most-loved pieces, a photos-only lookbook, private appointments on WhatsApp and a quiet multi-column footer.
 * Pages: home, all collections (/menu), each collection and sub-collection (/c/...), most loved (/best-sellers),
 * lookbook (/gallery) and the boutique (/visit). Styled in ./styles.css under .t-couture.
 */

const PALETTES = {
  ivory: { bg: "#F7F3EC", surf: "#EFE8DC", ink: "#1B1712", muted: "#6A5F52", line: "#DDD3C3" },
  noir: { bg: "#0F0E0C", surf: "#1A1815", ink: "#EFE9DF", muted: "#A79F92", line: "#2E2A24" },
  blush: { bg: "#F4E9E4", surf: "#FBF4F0", ink: "#2A1D1A", muted: "#6E5A54", line: "#E3CFC6" },
  sage: { bg: "#E8EAE2", surf: "#F3F4EE", ink: "#1D211B", muted: "#5A6055", line: "#CDD1C4" },
} satisfies Record<string, Palette>;

const FONTS = ["elegant", "classic", "naskh"] as const;

/** What the footer shows before the owner chooses (also the manifest's "social.show" default). */
const SOCIAL_DEFAULT = ["instagram", "whatsapp"] as const;

type View = {
  ctx: SiteContext;
  c: ReturnType<typeof copyFor>;
  k: ReturnType<typeof coutureCopy>;
  f: ReturnType<typeof fashionCopy>;
  tree: Tree;
  page: Page;
  href: (path: string) => string;
  best: MenuItem[];
  /** The lookbook: the owner's photos, then product photos (named for screen readers). */
  photos: ViewerPhoto[];
  /** Product id → its collection's name. */
  collectionOf: Map<string, string>;
  /** WhatsApp link for appointments, or null without WhatsApp. */
  appointment: string | null;
};

export default function CoutureTemplate({ site, path = [], base, now }: TemplateProps & { now?: Date }) {
  const ctx = siteContext(site, now);
  const tree = categoryTree(site);
  // An unknown address never gets here (the route answers 404); fall back to the home page to be safe.
  const page = resolvePage(site, path, tree) ?? { kind: "home" };
  const root = base ?? `/${site.business.slug}`;
  const k = coutureCopy(ctx.locale);
  const collectionOf = new Map<string, string>();
  for (const cat of tree.list) for (const p of cat.products) collectionOf.set(p.id, cat.parent ? `${cat.parent.name} · ${cat.name}` : cat.name);
  const v: View = {
    ctx,
    c: copyFor(ctx.locale),
    k,
    f: fashionCopy(ctx.locale),
    tree,
    page,
    href: (p: string) => (p ? `${root}${p}` : root || "/"),
    best: bestSellers(tree),
    photos: galleryPhotos(site, tree).map((p) => ({ src: p.src, alt: p.caption })),
    collectionOf,
    appointment: site.business.whatsApp ? whatsappLink(site.business.whatsApp, k.appointmentMessage) : null,
  };
  const order = orderButton(site, { label: text(site.settings, "cta.label") || undefined });
  const style: Record<string, string | number> = { ...(themeVars(site.settings, ctx.locale, { palettes: PALETTES, fonts: FONTS, defaultAccent: "#9A7445", radius: { rounded: "0px", sharp: "0px" } }) as Record<string, string | number>) };
  // Arabic headings in a calligraphic serif (Amiri) to match the Latin serif, unless the owner picked a font.
  if (ctx.locale === "ar" && !site.settings["font.family"] && style["--fd"]) style["--fd"] = "var(--f-amiri), Georgia, serif";
  if (ctx.locale === "ar" && site.settings["font.family"] === "default") style["--fd"] = "var(--f-amiri), Georgia, serif";

  return (
    <div
      data-template="couture"
      {...logoRoot(ctx)}
      {...optionRoot(ctx, order)}
      data-page={page.kind}
      className={cx("t-couture", fontVariables, flag(site.settings, "motion", true) && "motion")}
      style={style as CSSProperties}
    >
      <TemplateStyles id="couture" />
      <TopBars ctx={ctx} />
      <Header v={v} />
      {page.kind === "home" ? (
        <main>
          <Home v={v} />
        </main>
      ) : (
        <main id="menu" data-section="menu" className="cu-page">
          {page.kind === "menu" && <AllPage v={v} />}
          {page.kind === "category" && <CollectionPage v={v} category={page.category} />}
          {page.kind === "best" && <LovedPage v={v} />}
          {page.kind === "gallery" && <LookbookPage v={v} />}
          {page.kind === "visit" && <BoutiquePage v={v} />}
        </main>
      )}
      <Footer v={v} />
      <OrderFab order={order} />
      <ProductSheet items={sheetItems(ctx, tree.items.map((item) => ({ item, collection: collectionOf.get(item.id) ?? null })))} phone={site.business.whatsApp} labels={sheetLabels(ctx)} />
      {v.photos.length > 0 && <PhotoViewer photos={v.photos} labels={viewerLabels(ctx)} />}
    </div>
  );
}

/* ---------- header ---------- */

function Header({ v }: { v: View }) {
  const { ctx, c, k, page, href, tree } = v;
  const current = (kind: Page["kind"]) => (page.kind === kind ? ("page" as const) : undefined);
  const shopCurrent = page.kind === "menu" || page.kind === "category" ? ("page" as const) : undefined;
  const feature = tree.roots.find((r) => r.cover) ?? null;
  return (
    <header className="cu-head kit-head" data-section="header">
      <div className="cu-head-side">
        <Drawer openLabel={ctx.t.openMenu} closeLabel={ctx.t.close} buttonClassName="cu-burger" panelClassName="cu-drawer" icon={<Burger />} closeIcon={<Close />}>
          <nav className="cu-drawer-nav" aria-label={c.pages}>
            <a href={href("")} aria-current={current("home")}>
              {c.home}
            </a>
            <a href={href(PAGE_PATHS.menu)} aria-current={shopCurrent}>
              {k.allCollections}
            </a>
            {v.best.length > 0 && (
              <a href={href(PAGE_PATHS.best)} aria-current={current("best")}>
                {k.loved}
              </a>
            )}
            {v.photos.length > 0 && (
              <a href={href(PAGE_PATHS.gallery)} aria-current={current("gallery")}>
                {k.lookbook}
              </a>
            )}
            <a href={href(PAGE_PATHS.visit)} aria-current={current("visit")}>
              {k.boutique}
            </a>
          </nav>
          {tree.roots.length > 0 && (
            <ul className="plain cu-drawer-cats" aria-label={k.collections}>
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
          )}
        </Drawer>
        <nav className="cu-nav" aria-label={c.pages}>
          <div className="cu-mega">
            <a className="cu-mega-top" href={href(PAGE_PATHS.menu)} aria-current={shopCurrent}>
              {k.collections}
            </a>
            {tree.roots.length > 0 && (
              <div className="cu-mega-panel">
                <div className="cu-mega-in">
                  <div className="cu-mega-cols">
                    {tree.roots.map((cat) => (
                      <div key={cat.id} className="cu-mega-col">
                        <a className="cu-mega-cat" href={href(cat.path)}>
                          {cat.name}
                        </a>
                        {cat.children.length > 0 && (
                          <ul className="plain">
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
                  {feature && (
                    <a className="cu-mega-feature" href={href(feature.path)}>
                      <span className="cu-mega-img">
                        <Picture src={feature.cover!} sizes="280px" />
                      </span>
                      <span className="cu-mega-cap">{fill(k.shopName, { name: feature.name })}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          {v.best.length > 0 && (
            <a href={href(PAGE_PATHS.best)} aria-current={current("best")}>
              {k.loved}
            </a>
          )}
          {v.photos.length > 0 && (
            <a href={href(PAGE_PATHS.gallery)} aria-current={current("gallery")}>
              {k.lookbook}
            </a>
          )}
        </nav>
      </div>
      <a className="cu-lockup kit-lockup" href={href("")}>
        <Logo ctx={ctx} className="cu-logo" sizes="44px" />
        <BrandName ctx={ctx} className="cu-name" />
      </a>
      <div className="cu-head-side cu-head-end">
        <a className="cu-head-link" href={href(PAGE_PATHS.visit)} aria-current={current("visit")}>
          {k.boutique}
        </a>
        {v.appointment && (
          <a className="cu-head-wa" href={v.appointment} target="_blank" rel="noopener noreferrer" aria-label={k.appointment}>
            <WhatsApp />
          </a>
        )}
      </div>
    </header>
  );
}

/* ---------- building blocks ---------- */

function Head({ title, id, lead, link, center = false }: { title: string; id: string; lead?: string | null; link?: { href: string; label: string }; center?: boolean }) {
  return (
    <div className={cx("cu-sec-head", center && "is-center")}>
      <h2 id={id} className="cu-h2">
        {title}
      </h2>
      {lead && <p className="cu-lead">{lead}</p>}
      {link && (
        <a className="cu-more" href={link.href}>
          {link.label} <Arrow className="flip" />
        </a>
      )}
    </div>
  );
}

function Card({ v, item, sizes = "(min-width: 1100px) 24vw, (min-width: 760px) 32vw, 50vw" }: { v: View; item: MenuItem; sizes?: string }) {
  const range = sizeRange(details(item.description).sizes);
  return (
    <button type="button" className={cx("cu-card kit-card", !item.isAvailable && "is-out")} data-item-id={item.id}>
      <span className="cu-card-media kit-card-media kit-flush">
        <ProductPicture item={item} sizes={sizes} />
        {(item.labelText || !item.isAvailable) && (
          <span className="cu-badges">
            {item.labelText && <span className="tag">{item.labelText}</span>}
            {!item.isAvailable && <span className="tag tag-out">{v.ctx.t.soldOut}</span>}
          </span>
        )}
        <span className="cu-card-view" aria-hidden="true">
          {v.f.details}
        </span>
      </span>
      <span className="cu-card-body">
        <span className="cu-card-name">{item.name}</span>
        <span className="cu-card-price">{item.priceText}</span>
        {range && (
          <span className="cu-card-sizes">
            <span className="sr-only">{v.f.sizes}: </span>
            {range}
          </span>
        )}
      </span>
    </button>
  );
}

function Grid({ v, items }: { v: View; items: MenuItem[] }) {
  return (
    <ul className="plain cu-grid kit-cards">
      {items.map((item) => (
        <li key={item.id} className="rv">
          <Card v={v} item={item} />
        </li>
      ))}
    </ul>
  );
}

/** Collections as tall portrait tiles with their names on the photo. */
function Tiles({ v, categories }: { v: View; categories: Category[] }) {
  return (
    <ul className="plain cu-tiles kit-cards">
      {categories.map((cat) => (
        <li key={cat.id} className="rv">
          <a className="cu-tile kit-cat" href={v.href(cat.path)}>
            <span data-k="overlay" className="cu-tile-media kit-cat-media">{cat.cover ? <Picture src={cat.cover} sizes="(min-width: 760px) 25vw, 50vw" /> : <span className="cu-blank" aria-hidden="true">{initial(cat.name)}</span>}</span>
            <span className="cu-tile-text">
              <span className="cu-tile-name">{cat.name}</span>
              <span className="cu-tile-go">
                {v.k.discover} <Arrow className="flip" />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The lookbook: photos only in a masonry of portrait frames; each opens the viewer. */
function Lookbook({ v, max }: { v: View; max?: number }) {
  const photos = max ? v.photos.slice(0, max) : v.photos;
  return (
    <ul className="plain cu-look" data-gallery>
      {photos.map(({ src }, i) => (
        <li key={src} className="rv" style={{ "--cu-ar": ["3 / 4", "4 / 5", "2 / 3", "4 / 5", "3 / 4", "1 / 1"][i % 6] } as CSSProperties}>
          <button data-k="photo fill" type="button" className="fs-tile" data-photo={i} aria-label={fill(v.f.openPhoto, { n: i + 1 })}>
            <Picture src={src} sizes="(min-width: 760px) 33vw, 50vw" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Crumbs({ v, trail }: { v: View; trail: { label: string; href?: string }[] }) {
  const items = [{ label: v.c.home, href: v.href("") }, ...trail];
  return (
    <nav className="cu-crumbs" aria-label={v.c.breadcrumb}>
      <ol className="plain">
        {items.map((item, i) => (
          <li key={i}>{item.href && i < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

function PageHead({ v, trail, title, lead }: { v: View; trail: { label: string; href?: string }[]; title: string; lead?: string | null }) {
  return (
    <header className="cu-page-head">
      <Crumbs v={v} trail={trail} />
      <h1 className="cu-page-title">{title}</h1>
      {lead && <p className="cu-page-lead">{lead}</p>}
    </header>
  );
}

function Chips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav className="cu-chips" aria-label={label}>
      {children}
    </nav>
  );
}

/* ---------- home ---------- */

function Hero({ v }: { v: View }) {
  const { ctx, k, href } = v;
  const photos = heroPhotos(ctx.site.settings, "hero.image", v.tree.items.find((p) => p.imageUrl)?.imageUrl ?? null);
  const eyebrow = ctx.text("hero.eyebrow");
  const subtitle = ctx.text("hero.subtitle");
  return (
    <section className={cx("cu-hero kit-hero", photos.length === 0 && "is-plain")} data-section="hero" aria-labelledby="cu-title">
      {photos.length > 0 && (
        <div className="cu-hero-media kit-hero-media">
          <HeroPhotos ctx={ctx} photos={photos} sizes="100vw" placement="corner" />
        </div>
      )}
      <div className="cu-hero-text kit-hero-text">
        {eyebrow && <p className="cu-eyebrow">{eyebrow}</p>}
        <h1 id="cu-title" className="cu-hero-title">
          {ctx.text("hero.title") || ctx.site.business.name}
        </h1>
        {subtitle && <p className="cu-hero-sub">{subtitle}</p>}
        <div className="cu-hero-actions">
          <a data-k="btn" className="cu-btn cu-btn-light" href={href(PAGE_PATHS.menu)}>
            {k.discoverAll}
          </a>
          {v.appointment && (
            <a data-k="btn" className="cu-btn cu-btn-ghost" href={v.appointment} target="_blank" rel="noopener noreferrer">
              {k.appointment}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function Home({ v }: { v: View }) {
  const { ctx, c, k, href, tree } = v;
  const story = ctx.on("story") && ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  const edit = [...tree.items.filter((p) => p.isFeatured || p.label === "New"), ...tree.items.filter((p) => !(p.isFeatured || p.label === "New"))].filter((p) => p.isAvailable).slice(0, 8);
  return (
    <>
      <Hero v={v} />

      <section id="menu" className="cu-sec cu-home-shop" data-section="menu" aria-labelledby="cu-collections-title">
        <Head title={ctx.text("categories.title") || k.collections} id="cu-collections-title" link={{ href: href(PAGE_PATHS.menu), label: k.allCollections }} />
        {tree.roots.length > 0 && <Tiles v={v} categories={tree.roots} />}
        {ctx.on("edit") && edit.length > 0 && (
          <div className="cu-edit" data-section="highlights">
            <Head title={ctx.text("edit.title") || k.edit} id="cu-edit-title" />
            <ul className="plain cu-row kit-cards" tabIndex={0} aria-labelledby="cu-edit-title">
              {edit.map((item) => (
                <li key={item.id}>
                  <Card v={v} item={item} sizes="(min-width: 760px) 26vw, 70vw" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {story && (
        <section id="story" className={cx("cu-story", storyImage && "has-image")} data-section="story" aria-labelledby="cu-story-title">
          {storyImage && (
            <div data-k="photo" className="cu-story-img rv">
              <Picture src={storyImage} sizes="(min-width: 760px) 50vw, 100vw" />
            </div>
          )}
          <div className="cu-story-text rv">
            <p className="cu-eyebrow">{k.house}</p>
            <h2 id="cu-story-title" className="cu-h2">
              {ctx.text("story.title") || ctx.t.story}
            </h2>
            <p className="cu-story-body">{story}</p>
            <a className="cu-more" href={href(PAGE_PATHS.visit)}>
              {k.boutique} <Arrow className="flip" />
            </a>
          </div>
        </section>
      )}

      {ctx.on("best") && v.best.length > 0 && (
        <section id="best" className="cu-sec" data-section="best" aria-labelledby="cu-best-title">
          <Head title={ctx.text("best.title") || k.loved} id="cu-best-title" lead={k.lovedLead} link={{ href: href(PAGE_PATHS.best), label: c.viewAll }} />
          <Grid v={v} items={v.best.slice(0, 4)} />
        </section>
      )}

      {ctx.on("gallery") && v.photos.length > 0 && (
        <section id="gallery" className="cu-sec" data-section="gallery" aria-labelledby="cu-look-title">
          <Head title={ctx.text("gallery.title") || k.lookbook} id="cu-look-title" lead={k.lookLead} link={{ href: href(PAGE_PATHS.gallery), label: c.viewAll }} />
          <Lookbook v={v} max={6} />
        </section>
      )}

      {ctx.on("reviews") && ctx.reviews.length > 0 && <Reviews v={v} />}

      {ctx.on("visit") && <Appointment v={v} />}
    </>
  );
}

function Reviews({ v }: { v: View }) {
  return (
    <section id="reviews" className="cu-sec cu-reviews" data-section="reviews" aria-labelledby="cu-reviews-title">
      <Head title={v.k.clients} id="cu-reviews-title" center />
      <ul className="plain cu-quotes">
        {v.ctx.reviews.map((r, i) => (
          <li key={i} className="rv">
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

/** Appointments, opening hours and contact, as one band. */
function Appointment({ v, heading = true }: { v: View; heading?: boolean }) {
  const { ctx, k } = v;
  const { contact } = ctx;
  return (
    <section id="visit" className="cu-visit" data-section="visit" aria-labelledby={heading ? "cu-visit-title" : undefined} aria-label={heading ? undefined : ctx.t.visit}>
      <div className="cu-visit-call rv">
        {heading && (
          <h2 id="cu-visit-title" className="cu-h2">
            {k.appointment}
          </h2>
        )}
        <p className="cu-lead">{k.appointmentLead}</p>
        <div className="cu-visit-actions">
          {v.appointment && (
            <a data-k="btn" className="cu-btn" href={v.appointment} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> {k.appointment}
            </a>
          )}
          {contact.maps && (
            <a data-k="btn" className="cu-btn cu-btn-line" href={contact.maps} target="_blank" rel="noopener noreferrer">
              <Pin /> {ctx.t.directions}
            </a>
          )}
        </div>
      </div>
      <div className="cu-visit-info rv">
        {hasHours(ctx.hours) && (
          <div className="cu-cell">
            <h3 className="cu-h3">{ctx.t.hours}</h3>
            {ctx.today && <p className="cu-today">{ctx.today}</p>}
            <HoursList ctx={ctx} className="hours cu-hours" />
          </div>
        )}
        <div className="cu-cell">
          <h3 className="cu-h3">{ctx.t.contact}</h3>
          <ContactList ctx={ctx} className="contact cu-contact" />
        </div>
      </div>
    </section>
  );
}

/* ---------- pages ---------- */

function AllPage({ v }: { v: View }) {
  const { tree, k, href, ctx } = v;
  return (
    <>
      <PageHead v={v} trail={[{ label: k.allCollections }]} title={k.allCollections} lead={pieceCount(tree.items.length, ctx.locale)} />
      {tree.roots.length > 1 && (
        <Chips label={k.collections}>
          {tree.roots.map((cat) => (
            <a key={cat.id} className="cu-chip" href={`#m-${cat.id}`}>
              {cat.name}
            </a>
          ))}
        </Chips>
      )}
      {tree.roots.map((cat) => (
        <section key={cat.id} id={`m-${cat.id}`} className="cu-sec cu-block" aria-labelledby={`m-${cat.id}-h`}>
          <Head title={cat.name} id={`m-${cat.id}-h`} lead={pieceCount(cat.all.length, ctx.locale)} link={{ href: href(cat.path), label: fill(k.shopName, { name: cat.name }) }} />
          {cat.products.length > 0 && <Grid v={v} items={cat.products} />}
          {cat.children.map((sub) => (
            <div key={sub.id} className="cu-sub">
              <h3 className="cu-sub-title">
                <a href={href(sub.path)}>{sub.name}</a>
                <small>{pieceCount(sub.all.length, ctx.locale)}</small>
              </h3>
              <Grid v={v} items={sub.products} />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function CollectionPage({ v, category }: { v: View; category: Category }) {
  const { c, k, href, ctx, tree } = v;
  const parent = category.parent;
  const trail = [{ label: k.allCollections, href: href(PAGE_PATHS.menu) }, ...(parent ? [{ label: parent.name, href: href(parent.path) }] : []), { label: category.name }];
  const family = parent ?? category;
  const others = tree.roots.filter((r) => r !== family);
  return (
    <>
      <PageHead v={v} trail={trail} title={category.name} lead={pieceCount(category.all.length, ctx.locale)} />
      {family.children.length > 0 && (
        <Chips label={fill(c.subcategories, { name: family.name })}>
          <a className="cu-chip" href={href(family.path)} aria-current={category === family ? "page" : undefined}>
            {c.everything}
          </a>
          {family.children.map((sub) => (
            <a key={sub.id} className="cu-chip" href={href(sub.path)} aria-current={sub === category ? "page" : undefined}>
              {sub.name}
            </a>
          ))}
        </Chips>
      )}
      {category.products.length > 0 && (
        <section className="cu-sec cu-block" aria-labelledby="cu-own-title">
          {category.children.length > 0 ? <Head title={fill(c.inThis, { name: category.name })} id="cu-own-title" /> : <h2 id="cu-own-title" className="sr-only">{category.name}</h2>}
          <Grid v={v} items={category.products} />
        </section>
      )}
      {category.children.map((sub) => (
        <section key={sub.id} className="cu-sec cu-block" aria-labelledby={`s-${sub.id}`}>
          <Head title={sub.name} id={`s-${sub.id}`} lead={pieceCount(sub.all.length, ctx.locale)} link={{ href: href(sub.path), label: fill(k.shopName, { name: sub.name }) }} />
          <Grid v={v} items={sub.products} />
        </section>
      ))}
      {others.length > 0 && (
        <section className="cu-sec" aria-labelledby="cu-more-title">
          <Head title={k.more} id="cu-more-title" link={{ href: href(PAGE_PATHS.menu), label: k.allCollections }} />
          <Tiles v={v} categories={others} />
        </section>
      )}
    </>
  );
}

function LovedPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.k.loved }]} title={v.ctx.text("best.title") || v.k.loved} lead={v.k.lovedLead} />
      <section className="cu-sec" aria-label={v.k.loved}>
        <Grid v={v} items={v.best} />
      </section>
    </>
  );
}

function LookbookPage({ v }: { v: View }) {
  return (
    <>
      <PageHead v={v} trail={[{ label: v.k.lookbook }]} title={v.ctx.text("gallery.title") || v.k.lookbook} lead={v.k.lookLead} />
      <section className="cu-sec" aria-label={v.k.lookbook}>
        <Lookbook v={v} />
      </section>
    </>
  );
}

function BoutiquePage({ v }: { v: View }) {
  const { ctx, k } = v;
  const story = ctx.text("story.text");
  const storyImage = ctx.image("story.image");
  return (
    <>
      <PageHead v={v} trail={[{ label: k.boutique }]} title={k.boutique} lead={ctx.site.business.address} />
      <Appointment v={v} heading={false} />
      {story && (
        <section className={cx("cu-story", storyImage && "has-image")} data-section="story" aria-labelledby="cu-story-title">
          {storyImage && (
            <div data-k="photo" className="cu-story-img">
              <Picture src={storyImage} sizes="(min-width: 760px) 50vw, 100vw" />
            </div>
          )}
          <div className="cu-story-text">
            <p className="cu-eyebrow">{k.house}</p>
            <h2 id="cu-story-title" className="cu-h2">
              {ctx.text("story.title") || ctx.t.story}
            </h2>
            <p className="cu-story-body">{story}</p>
          </div>
        </section>
      )}
      {ctx.on("reviews") && ctx.reviews.length > 0 && <Reviews v={v} />}
    </>
  );
}

/* ---------- footer ---------- */

function Footer({ v }: { v: View }) {
  const { ctx, c, k, href, tree } = v;
  const { site } = ctx;
  const line = ctx.text("footer.text");
  const social = socialAccounts(site, SOCIAL_DEFAULT);
  return (
    <footer className="cu-foot" data-section="footer">
      <div className="cu-foot-grid">
        <div className="cu-foot-brand">
          {line && <p className="cu-foot-line">{line}</p>}
          {social.length > 0 && (
            <div className="cu-social kit-social" data-section="social">
              <SocialIcons accounts={social} className="cu-social-link" />
            </div>
          )}
        </div>
        {tree.roots.length > 0 && (
          <nav className="cu-foot-col" aria-label={k.collections}>
            <h2 className="cu-foot-title">{k.collections}</h2>
            <ul className="plain">
              {tree.roots.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <a href={href(cat.path)}>{cat.name}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <nav className="cu-foot-col" aria-label={c.pages}>
          <h2 className="cu-foot-title">{c.pages}</h2>
          <ul className="plain">
            <li>
              <a href={href(PAGE_PATHS.menu)}>{k.allCollections}</a>
            </li>
            {v.best.length > 0 && (
              <li>
                <a href={href(PAGE_PATHS.best)}>{k.loved}</a>
              </li>
            )}
            {v.photos.length > 0 && (
              <li>
                <a href={href(PAGE_PATHS.gallery)}>{k.lookbook}</a>
              </li>
            )}
            <li>
              <a href={href(PAGE_PATHS.visit)}>{k.boutique}</a>
            </li>
          </ul>
        </nav>
        {(ctx.today || site.business.address) && (
          <div className="cu-foot-col">
            <h2 className="cu-foot-title">{c.findUs}</h2>
            {site.business.address && <p>{site.business.address}</p>}
            {ctx.today && <p className="cu-foot-today">{ctx.today}</p>}
          </div>
        )}
      </div>
      <FootName ctx={ctx} className="cu-wordmark" decorative />
      <Credits ctx={ctx} className="credits cu-credits" />
    </footer>
  );
}
