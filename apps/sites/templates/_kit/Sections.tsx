import { type CSSProperties, Fragment, type ReactNode } from "react";
import { initial } from "@/lib/format";
import { madeWith } from "@/lib/i18n";
import { MadeWithLink } from "@/components/brand/logo-mark";
import { FootName, HoursList, Logo, SocialIcons } from "./blocks";
import { cx, type SiteContext } from "./context";
import { Check, Clock, Heart, Leaf, Mail, Pin, Spark, Star, WhatsApp } from "./icons";
import { socialAccounts, type SocialAccount } from "./options";
import { Picture } from "./Picture";
import { orderChanged, sectionLayouts, sectionOrder, sortLinks, type SectionKind, type SectionLayouts } from "./sections";
import { highlights as highlightPairs } from "./services";
import { hasHours } from "./site-data";
import type { NavLink } from "./Top";

/*
 * The shared sections of the "Sections" options (_kit/sections.ts, styled by _kit/sections.css). A template wraps each
 * of its own sections, which stay the children:
 *
 *   {story && <SiteStory ctx={ctx} title={...}>{its own story section}</SiteStory>}
 *
 * With the layout on "Template default" the template's own markup renders untouched. Otherwise the shared section takes
 * its place, with the same id (so links to "#story" keep working), data-section and the template's colors, fonts and
 * corners. Each shared section reads its content from the settings the templates share (story.*, gallery, reviews.*,
 * highlights.*, hours and the business's contact details), shows only what the owner filled in and leaves out parts it
 * has nothing for. The order of the sections comes from ordered().
 */

const COPY = {
  en: {
    highlights: "Why people come back",
    photo: "Photo {n} of {name}",
    photos: "Photos, scroll sideways for more",
    reviews: "Reviews, scroll sideways for more",
    kind: (n: number) => (n === 1 ? "One kind word from our guests" : `${n} kind words from our guests`),
    openToday: "Today",
    pages: "Pages",
    findUs: "Find us",
    follow: "Follow us",
    write: "Message us",
  },
  ar: {
    highlights: "لماذا يعود إلينا الناس",
    photo: "الصورة {n} من {name}",
    photos: "الصور، مرّر جانبيًا لرؤية المزيد",
    reviews: "الآراء، مرّر جانبيًا لرؤية المزيد",
    kind: (n: number) => (n === 1 ? "كلمة طيبة من ضيوفنا" : n === 2 ? "كلمتان طيبتان من ضيوفنا" : `${n} كلمات طيبة من ضيوفنا`),
    openToday: "اليوم",
    pages: "الصفحات",
    findUs: "موقعنا",
    follow: "تابعونا",
    write: "راسلونا",
  },
};

const copy = (ctx: SiteContext) => COPY[ctx.locale];
const layoutOf = <K extends keyof SectionLayouts>(ctx: SiteContext, kind: K) => sectionLayouts(ctx.site.settings)[kind];

/* ---------- order ---------- */

/**
 * The template's sections in the owner's order ("sections.order"). `parts` are the template's sections in its own order,
 * keyed by their names in the manifest's "sectionsLayout.order" (a part may be null when it does not show). With the
 * template's own order the page renders exactly as before.
 */
export function ordered(ctx: SiteContext, parts: Record<string, ReactNode>): ReactNode[] {
  return sectionOrder(ctx.site.settings, Object.keys(parts)).map((name) => <Fragment key={name}>{parts[name]}</Fragment>);
}

/**
 * For templates that draw some sections together (the story beside the hours in one grid): true while the owner kept the
 * template's own order (`own`, its "sectionsLayout.order") and the layouts of `kinds` on "Template default", so the
 * template keeps its grid. Otherwise the template renders those sections one by one, each in its own place.
 */
export const together = (ctx: SiteContext, own: readonly string[], kinds: SectionKind[]) =>
  !orderChanged(ctx.site.settings, own) && kinds.every((k) => sectionLayouts(ctx.site.settings)[k] === "auto");

/**
 * Chapter numbers for templates that number their sections (01, 02, ...): the sections in `shown` (the template's own
 * order, true when the section shows) numbered in the owner's order, leaving out those drawn by a shared layout. With
 * the template's own order and layouts the numbers are the ones the template always had.
 */
export function numbered(ctx: SiteContext, shown: Record<string, unknown>): Record<string, number> {
  const layouts: Record<string, string> = sectionLayouts(ctx.site.settings);
  const out: Record<string, number> = {};
  let n = 0;
  for (const name of sectionOrder(ctx.site.settings, Object.keys(shown))) if (shown[name] && (layouts[name] ?? "auto") === "auto") out[name] = ++n;
  return out;
}

/** True when the owner picked a shared layout for this kind of section (not "Template default"). */
export const sharedLayout = (ctx: SiteContext, kind: SectionKind) => sectionLayouts(ctx.site.settings)[kind] !== "auto";

/** Section links ("#story") in the owner's order; other links stay where they are. */
export const orderedLinks = <T extends { href: string }>(ctx: SiteContext, links: T[]) => sortLinks(ctx.site.settings, links);

/* ---------- shared parts ---------- */

type Heading = {
  /** The section's id (links point at it). */
  id?: string;
  /** The template's own title for the section. */
  title: string;
  /** A small line above the title, as the template's own section has. */
  eyebrow?: string | null;
  /** False on a page whose h1 already names the section (the section is then named for screen readers only). */
  heading?: boolean;
};

function Section({
  kind,
  layout,
  id,
  title,
  eyebrow,
  heading = true,
  children,
  className,
}: Heading & { kind: string; layout: string; children: ReactNode; className?: string }) {
  const hid = `${id ?? kind}-kh`;
  return (
    <section
      id={id}
      className={cx("kit-sc", `kit-sc-${kind}`, className)}
      data-section={kind}
      data-sc={layout}
      {...(heading ? { "aria-labelledby": hid } : { "aria-label": title })}
    >
      <div className="kit-sc-in">
        {heading && (
          <div className="kit-sc-head">
            {eyebrow && <p className="kit-sc-eyebrow">{eyebrow}</p>}
            <h2 id={hid} className="kit-sc-h">
              {title}
            </h2>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** A link styled as the template's button (data-k="btn", so the page style's button shapes reach it). */
function Button({ href, children, ghost = false, external = true }: { href: string; children: ReactNode; ghost?: boolean; external?: boolean }) {
  return (
    <a data-k="btn" className={cx("kit-sc-btn", ghost && "is-ghost")} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

/** Product photos (featured first), for layouts that want a picture where the owner gave none. */
function productPhotos(ctx: SiteContext): string[] {
  const items = ctx.sections.flatMap((s) => s.products);
  const ordered = [...items.filter((p) => p.isFeatured), ...items.filter((p) => !p.isFeatured)];
  return [...new Set(ordered.map((p) => p.imageUrl).filter((u): u is string => !!u))];
}

/** A text split into short parts: its paragraphs, or its sentences when it is one paragraph. */
function parts(text: string): string[] {
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  const sentences = text.split(/(?<=[.!?؟])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.length > 0 ? sentences : [text];
}

/* ---------- highlights ---------- */

const HIGHLIGHT_ICONS = [Spark, Heart, Leaf, Check];

/** The owner's highlights (highlights.<n>.title / .text) in the owner's layout, or the template's own. */
export function SiteHighlights({
  ctx,
  items = highlightPairs(ctx),
  title,
  children,
}: {
  ctx: SiteContext;
  items?: { title: string; text: string }[];
  /** A title the template shows above them; without one the list is named for screen readers only. */
  title?: string;
  children?: ReactNode;
}) {
  const layout = layoutOf(ctx, "highlights");
  if (layout === "auto") return <>{children}</>;
  if (items.length === 0) return null;
  const name = title || copy(ctx).highlights;
  const photos = layout === "alternating" ? productPhotos(ctx) : [];
  const own = ctx.gallery;
  const pics = [...own, ...photos];
  const item = (h: { title: string; text: string }, i: number) => {
    const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
    const pic = pics.length > 0 ? pics[i % pics.length] : null;
    return (
      <li key={i} className={cx("kit-sc-hl-item", (layout === "cards" || layout === "numbered") && "kit-sc-card")}>
        {layout === "alternating" && (
          <span data-k="photo" className={cx("kit-sc-hl-pic", !pic && "is-empty")} aria-hidden={pic ? undefined : true}>
            {pic ? <Picture src={pic} sizes="(min-width: 760px) 40vw, 100vw" /> : <Icon />}
          </span>
        )}
        {(layout === "icons" || layout === "cards") && (
          <span className="kit-sc-hl-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
        {layout === "numbered" && (
          <span className="kit-sc-hl-num" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
        )}
        <span className="kit-sc-hl-text">
          <h3 className="kit-sc-hl-title">{h.title}</h3>
          {h.text && <p className="kit-sc-hl-desc">{h.text}</p>}
        </span>
      </li>
    );
  };

  if (layout === "marquee") {
    const run = (hidden: boolean) => (
      <ul className="plain kit-sc-mq-run" aria-hidden={hidden || undefined}>
        {items.map((h, i) => (
          <li key={i} className="kit-sc-mq-item">
            <Spark className="kit-sc-mq-dot" />
            {hidden ? (
              <span className="kit-sc-mq-title">{h.title}</span>
            ) : (
              <h3 className="kit-sc-mq-title">{h.title}</h3>
            )}
            {h.text && <span className="kit-sc-mq-desc">{h.text}</span>}
          </li>
        ))}
      </ul>
    );
    return (
      <section className="kit-sc kit-sc-highlights" data-section="highlights" data-sc="marquee" aria-label={name}>
        <h2 className="sr-only">{name}</h2>
        <div className="kit-sc-mq">
          <div className="kit-sc-mq-track">
            {run(false)}
            {run(true)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="kit-sc kit-sc-highlights" data-section="highlights" data-sc={layout} aria-label={title ? undefined : name} aria-labelledby={title ? "highlights-kh" : undefined}>
      <div className="kit-sc-in">
        {title ? (
          <div className="kit-sc-head">
            <h2 id="highlights-kh" className="kit-sc-h">
              {title}
            </h2>
          </div>
        ) : (
          <h2 className="sr-only">{name}</h2>
        )}
        {layout === "statement" ? (
          <>
            <p className="kit-sc-st" aria-hidden="true">
              {items.map((h, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="kit-sc-st-dot"> · </span>}
                  <span className="kit-sc-st-word">{h.title}</span>
                </Fragment>
              ))}
            </p>
            <ul className="plain kit-sc-hl kit-sc-st-list">
              {items.map((h, i) => (
                <li key={i} className="kit-sc-hl-item">
                  <h3 className="kit-sc-hl-title">{h.title}</h3>
                  {h.text && <p className="kit-sc-hl-desc">{h.text}</p>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ul className="plain kit-sc-hl" data-count={items.length}>
            {items.map(item)}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ---------- story ---------- */

/** The owner's story (story.title, story.text, story.image, story.since) in the owner's layout, or the template's own. */
export function SiteStory({
  ctx,
  id = "story",
  title,
  eyebrow,
  heading = true,
  text = ctx.text("story.text"),
  photo = ctx.image("story.image"),
  since = ctx.text("story.since"),
  more,
  children,
}: Heading & {
  ctx: SiteContext;
  text?: string;
  photo?: string | null;
  since?: string;
  /** A link the template's story ends with ("Visit us"). */
  more?: { href: string; label: string } | null;
  children?: ReactNode;
}) {
  const layout = layoutOf(ctx, "story");
  if (layout === "auto") return <>{children}</>;
  if (!text) return null;
  const name = ctx.site.business.name;
  const t = ctx.t;
  const bits = parts(text);
  const link = more && (
    <p className="kit-sc-actions">
      <Button href={more.href} ghost external={false}>
        {more.label}
      </Button>
    </p>
  );
  const sinceBadge = since && (
    <p className="kit-sc-since">
      <span>{t.since}</span> <b>{since}</b>
    </p>
  );
  const picture = (sizes: string, behind = false) =>
    photo ? (
      <span data-k={behind ? undefined : "photo"} className={cx("kit-sc-story-pic", behind && "is-behind")}>
        <Picture src={photo} sizes={sizes} />
      </span>
    ) : null;

  let body: ReactNode;
  switch (layout) {
    case "beside":
      body = (
        <div className={cx("kit-sc-story-grid", !photo && "is-bare")}>
          {photo ? (
            picture("(min-width: 760px) 45vw, 100vw")
          ) : (
            <span className="kit-sc-story-pic is-empty" aria-hidden="true">
              {initial(name)}
            </span>
          )}
          <div className="kit-sc-story-copy">
            {sinceBadge}
            {bits.length > 1 ? bits.map((b, i) => <p key={i}>{b}</p>) : <p>{text}</p>}
            {link}
          </div>
        </div>
      );
      break;
    case "behind":
      body = (
        <div className={cx("kit-sc-story-cover", !photo && "is-bare")}>
          {picture("100vw", true)}
          <div className="kit-sc-story-copy">
            {sinceBadge}
            <p>{text}</p>
            {link}
          </div>
        </div>
      );
      break;
    case "quote": {
      const [first, ...rest] = bits;
      body = (
        <figure className="kit-sc-story-quote">
          <blockquote>
            <p className="kit-sc-big">{first}</p>
          </blockquote>
          <figcaption>{name}</figcaption>
          {rest.length > 0 && <p className="kit-sc-story-rest">{rest.join(" ")}</p>}
          {sinceBadge}
          {link}
        </figure>
      );
      break;
    }
    case "timeline":
      body = (
        <>
          <ol className="plain kit-sc-tl">
            {bits.map((b, i) => (
              <li key={i} className="kit-sc-tl-item">
                <span className="kit-sc-tl-mark" aria-hidden="true">
                  {i === 0 && since ? since : String(i + 1).padStart(2, "0")}
                </span>
                <p>{b}</p>
              </li>
            ))}
          </ol>
          {photo && picture("(min-width: 760px) 60vw, 100vw")}
          {link}
        </>
      );
      break;
    case "columns":
      body = (
        <>
          {photo && <div className="kit-sc-story-band">{picture("100vw")}</div>}
          <div className="kit-sc-story-cols">
            {bits.length > 1 ? bits.map((b, i) => <p key={i}>{b}</p>) : <p>{text}</p>}
          </div>
          {sinceBadge}
          {link}
        </>
      );
      break;
    default:
      body = (
        <div className="kit-sc-letter kit-sc-card">
          {photo && picture("160px")}
          {bits.length > 1 ? bits.map((b, i) => <p key={i}>{b}</p>) : <p>{text}</p>}
          <p className="kit-sc-sign">{name}</p>
          {sinceBadge}
          {link}
        </div>
      );
  }

  return (
    <Section kind="story" layout={layout} id={id} title={title} eyebrow={eyebrow} heading={heading} className={cx(!photo && "is-bare")}>
      {body}
    </Section>
  );
}

/* ---------- gallery ---------- */

export type GalleryPhoto = { src: string; caption?: string | null };

/** How many photos each layout shows at most. */
const GALLERY_MAX = { grid: 12, masonry: 12, carousel: 12, polaroid: 6, feature: 7, strip: 10 } as const;

/** The owner's photos (gallery) in the owner's layout, or the template's own. */
export function SiteGallery({
  ctx,
  id = "gallery",
  title,
  eyebrow,
  heading = true,
  photos = ctx.gallery.map((src) => ({ src })),
  viewer = false,
  more,
  children,
}: Heading & {
  ctx: SiteContext;
  photos?: GalleryPhoto[];
  /** The template has a photo viewer: each photo is a button with data-photo="<index>" that opens it. */
  viewer?: boolean;
  more?: { href: string; label: string } | null;
  children?: ReactNode;
}) {
  const layout = layoutOf(ctx, "gallery");
  if (layout === "auto") return <>{children}</>;
  const shown = photos.slice(0, GALLERY_MAX[layout]);
  if (shown.length === 0) return null;
  const c = copy(ctx);
  const name = ctx.site.business.name;
  const alt = (p: GalleryPhoto, i: number) => p.caption || c.photo.replace("{n}", String(i + 1)).replace("{name}", name);
  const sizes = layout === "strip" || layout === "carousel" ? "(min-width: 760px) 34vw, 72vw" : layout === "feature" ? "(min-width: 760px) 50vw, 100vw" : "(min-width: 760px) 30vw, 50vw";
  const scroll = layout === "carousel" || layout === "strip";
  const tiles = (
    <ul className="plain kit-sc-gal" data-count={Math.min(shown.length, 7)}>
      {shown.map((p, i) => (
        <li key={p.src + i} className="kit-sc-gal-li">
          {viewer ? (
            <button type="button" data-k="photo fill" className="kit-sc-gal-pic" data-photo={i} aria-label={alt(p, i)}>
              <Picture src={p.src} sizes={sizes} />
            </button>
          ) : (
            <span data-k="photo fill" className="kit-sc-gal-pic">
              <Picture src={p.src} alt={alt(p, i)} sizes={sizes} />
            </span>
          )}
          {layout === "polaroid" && p.caption && (
            <span className="kit-sc-gal-cap" aria-hidden="true">
              {p.caption}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <Section kind="gallery" layout={layout} id={id} title={title} eyebrow={eyebrow} heading={heading}>
      {scroll ? (
        <div className="kit-sc-scroll" tabIndex={0} role="region" aria-label={c.photos}>
          {tiles}
        </div>
      ) : (
        tiles
      )}
      {more && (
        <p className="kit-sc-actions">
          <Button href={more.href} ghost external={false}>
            {more.label}
          </Button>
        </p>
      )}
    </Section>
  );
}

/* ---------- reviews ---------- */

/** The owner's reviews (reviews.<n>.quote / .name, only the filled-in ones) in the owner's layout, or the template's own. */
export function SiteReviews({
  ctx,
  id = "reviews",
  title,
  eyebrow,
  heading = true,
  reviews = ctx.reviews,
  children,
}: Heading & { ctx: SiteContext; reviews?: { quote: string; name: string }[]; children?: ReactNode }) {
  const layout = layoutOf(ctx, "reviews");
  if (layout === "auto") return <>{children}</>;
  if (reviews.length === 0) return null;
  const c = copy(ctx);
  const card = (r: { quote: string; name: string }, i: number, big = false) => (
    <li key={i} className={cx("kit-sc-rv", layout !== "quote" && layout !== "summary" && "kit-sc-card", big && "is-big")}>
      <figure>
        <blockquote>
          <p dir="auto">{r.quote}</p>
        </blockquote>
        {r.name && (
          <figcaption>
            {layout === "cards" || layout === "carousel" ? (
              <span className="kit-sc-rv-who" aria-hidden="true">
                {initial(r.name)}
              </span>
            ) : null}
            <span dir="auto">{r.name}</span>
          </figcaption>
        )}
      </figure>
    </li>
  );
  let body: ReactNode;
  if (layout === "quote") {
    const [first, ...rest] = reviews;
    body = (
      <ul className="plain kit-sc-rvs">
        {card(first, 0, true)}
        {rest.map((r, i) => card(r, i + 1))}
      </ul>
    );
  } else if (layout === "summary") {
    body = (
      <>
        <div className="kit-sc-rv-sum">
          <span className="kit-sc-stars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} />
            ))}
          </span>
          <p>{c.kind(reviews.length)}</p>
        </div>
        <ul className="plain kit-sc-rvs">{reviews.map((r, i) => card(r, i))}</ul>
      </>
    );
  } else if (layout === "carousel") {
    body = (
      <div className="kit-sc-scroll" tabIndex={0} role="region" aria-label={c.reviews}>
        <ul className="plain kit-sc-rvs">{reviews.map((r, i) => card(r, i))}</ul>
      </div>
    );
  } else {
    body = (
      <ul className="plain kit-sc-rvs" data-count={reviews.length}>
        {reviews.map((r, i) => card(r, i))}
      </ul>
    );
  }
  return (
    <Section kind="reviews" layout={layout} id={id} title={title} eyebrow={eyebrow} heading={heading}>
      {body}
    </Section>
  );
}

/* ---------- visit ---------- */

/** A drawn street map with a pin (no map service: it links to directions when the business has an address). */
function MapArt() {
  return (
    <svg className="kit-sc-map-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="400" height="300" className="m-land" />
      <path className="m-park" d="M250 30h110v80H250zM30 190h90v80H30z" />
      <path className="m-water" d="M0 120c60-20 90 10 150-5s90-40 150-20 70 30 100 20v40c-40 10-60-10-100-15s-90 25-150 25-100-25-150-5z" />
      <path className="m-road" d="M0 70h400M0 230h400M80 0v300M200 0v300M320 0v300M0 0l400 300" />
      <path className="m-street" d="M0 30h400M0 110h400M0 190h400M0 270h400M40 0v300M140 0v300M260 0v300M360 0v300" />
      <g className="m-pin" transform="translate(200 150)">
        <path d="M0 0c-3-14-22-24-22-44a22 22 0 0 1 44 0C22-24 3-14 0 0z" />
        <circle cy="-44" r="8" className="m-pin-dot" />
      </g>
    </svg>
  );
}

/** The opening hours, address and ways to get in touch in the owner's layout, or the template's own. */
export function SiteVisit({
  ctx,
  id = "visit",
  title,
  eyebrow,
  heading = true,
  cta,
  children,
}: Heading & {
  ctx: SiteContext;
  /** The template's main call to action here (book or order on WhatsApp). */
  cta?: { href: string; label: string } | null;
  children?: ReactNode;
}) {
  const layout = layoutOf(ctx, "visit");
  if (layout === "auto") return <>{children}</>;
  const { business } = ctx.site;
  const { contact, t } = ctx;
  const c = copy(ctx);
  const hours = hasHours(ctx.hours);
  const action = cta ?? (contact.whatsapp ? { href: contact.whatsapp, label: t.whatsapp } : null);
  const buttons = (contact.maps || action) && (
    <p className="kit-sc-actions">
      {action && (
        <Button href={action.href}>
          <WhatsApp /> {action.label}
        </Button>
      )}
      {contact.maps && (
        <Button href={contact.maps} ghost>
          <Pin /> {t.directions}
        </Button>
      )}
    </p>
  );
  const address = business.address && (
    <p className="kit-sc-line">
      <Pin />
      <bdi>{business.address}</bdi>
    </p>
  );
  const today = ctx.today && (
    <p className="kit-sc-line kit-sc-today">
      <Clock />
      <span>{ctx.today}</span>
    </p>
  );
  const reach = (business.whatsApp || business.email) && (
    <ul className="plain kit-sc-reach">
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
    </ul>
  );
  const hoursList = hours && <HoursList ctx={ctx} className="kit-sc-hours" />;

  let body: ReactNode;
  switch (layout) {
    case "map": {
      const map = contact.maps ? (
        <a className="kit-sc-map" data-k="photo" href={contact.maps} target="_blank" rel="noopener noreferrer" aria-label={t.directions}>
          <MapArt />
        </a>
      ) : (
        <span className="kit-sc-map" data-k="photo">
          <MapArt />
        </span>
      );
      body = (
        <div className="kit-sc-visit-grid">
          {map}
          <div className="kit-sc-visit-info">
            {address}
            {today}
            {reach}
            {hoursList}
            {buttons}
          </div>
        </div>
      );
      break;
    }
    case "cards":
      body = (
        <ul className="plain kit-sc-vcards">
          {hours && (
            <li className="kit-sc-card kit-sc-vcard">
              <h3 className="kit-sc-small">
                <Clock /> {t.hours}
              </h3>
              {hoursList}
            </li>
          )}
          {(business.address || contact.maps) && (
            <li className="kit-sc-card kit-sc-vcard">
              <h3 className="kit-sc-small">
                <Pin /> {c.findUs}
              </h3>
              {business.address && (
                <p>
                  <bdi>{business.address}</bdi>
                </p>
              )}
              {contact.maps && (
                <p className="kit-sc-actions">
                  <Button href={contact.maps} ghost>
                    {t.directions}
                  </Button>
                </p>
              )}
            </li>
          )}
          {(reach || action) && (
            <li className="kit-sc-card kit-sc-vcard">
              <h3 className="kit-sc-small">
                <WhatsApp /> {c.write}
              </h3>
              {reach}
              {action && (
                <p className="kit-sc-actions">
                  <Button href={action.href}>{action.label}</Button>
                </p>
              )}
            </li>
          )}
        </ul>
      );
      break;
    case "table":
      body = (
        <>
          {hours && (
            <div className="kit-sc-table kit-sc-card">
              <HoursList ctx={ctx} className="kit-sc-hours is-table" />
            </div>
          )}
          <div className="kit-sc-visit-row">
            {address}
            {reach}
          </div>
          {buttons}
        </>
      );
      break;
    case "centered":
      body = (
        <div className="kit-sc-visit-center">
          {ctx.today && <p className="kit-sc-big">{ctx.today}</p>}
          {address}
          {reach}
          {buttons}
          {hoursList}
        </div>
      );
      break;
    default:
      body = (
        <>
          <div className="kit-sc-banner">
            <div className="kit-sc-banner-copy">
              {ctx.today && <p className="kit-sc-big">{ctx.today}</p>}
              {address}
            </div>
            {buttons}
          </div>
          {(hoursList || reach) && (
            <div className="kit-sc-visit-row">
              {hoursList}
              {reach}
            </div>
          )}
        </>
      );
  }

  return (
    <Section kind="visit" layout={layout} id={id} title={title} eyebrow={eyebrow} heading={heading}>
      {body}
    </Section>
  );
}

/* ---------- footer ---------- */

/** The footer in the owner's layout, or the template's own. */
export function SiteFooter({
  ctx,
  links = [],
  social,
  tagline = ctx.text("footer.text"),
  children,
}: {
  ctx: SiteContext;
  /** The template's links (its sections, or its pages on a multi-page site). */
  links?: NavLink[];
  /** The social accounts the template's own footer shows by default (socialAccounts(site, its default)). */
  social?: SocialAccount[];
  /** A short line under the name. */
  tagline?: string;
  children?: ReactNode;
}) {
  const layout = layoutOf(ctx, "footer");
  if (layout === "auto") return <>{children}</>;
  const { business } = ctx.site;
  const c = copy(ctx);
  const accounts = social ?? socialAccounts(ctx.site);
  const navLinks = orderedLinks(ctx, links);
  const year = ctx.now.getFullYear();
  const credits = (
    <div className="kit-sc-credits kit-credits">
      <span className="kit-credits-text">
        © {year} {business.name}. {ctx.t.rights}
      </span>
      <MadeWithLink label={madeWith(ctx.locale)} />
    </div>
  );
  const icons = accounts.length > 0 && (
    <div className="kit-sc-social kit-social" data-section="social">
      <SocialIcons accounts={accounts} />
    </div>
  );
  const nav = navLinks.length > 0 && (
    <nav className="kit-sc-ft-nav" aria-label={c.pages}>
      <ul className="plain">
        {navLinks.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
  const brand = (
    <div className="kit-sc-ft-brand">
      <Logo ctx={ctx} className="kit-sc-ft-logo" />
      <FootName ctx={ctx} className="kit-sc-ft-name" />
    </div>
  );
  const line = tagline && <p className="kit-sc-ft-tag">{tagline}</p>;

  let body: ReactNode;
  switch (layout) {
    case "simple":
      body = (
        <>
          <div className="kit-sc-ft-row">
            {brand}
            {icons}
          </div>
          {line}
          {credits}
        </>
      );
      break;
    case "columns":
      body = (
        <>
          <div className="kit-sc-ft-cols">
            <div className="kit-sc-ft-col">
              {brand}
              {line}
              {icons}
            </div>
            {nav && (
              <div className="kit-sc-ft-col">
                <h2 className="kit-sc-small">{c.pages}</h2>
                {nav}
              </div>
            )}
            {(business.address || ctx.today || business.whatsApp) && (
              <div className="kit-sc-ft-col">
                <h2 className="kit-sc-small">{c.findUs}</h2>
                {business.address && (
                  <p>
                    <bdi>{business.address}</bdi>
                  </p>
                )}
                {ctx.today && <p>{ctx.today}</p>}
                {business.whatsApp && (
                  <p>
                    <bdi dir="ltr">{business.whatsApp}</bdi>
                  </p>
                )}
              </div>
            )}
          </div>
          {credits}
        </>
      );
      break;
    case "big":
      body = (
        <>
          {/* The longest word sets the size, so a long name shrinks to fit instead of breaking mid-word. */}
          <div style={{ "--ks-long": Math.max(4, ...ctx.site.business.name.split(/\s+/).map((w) => [...w].length)) } as CSSProperties}>
            <FootName ctx={ctx} className="kit-sc-ft-giant" />
          </div>
          <div className="kit-sc-ft-row">
            {nav}
            {icons}
          </div>
          {credits}
        </>
      );
      break;
    case "centered":
      body = (
        <>
          {brand}
          {line}
          {icons}
          {nav}
          {credits}
        </>
      );
      break;
    default:
      body = (
        <div className="kit-sc-ft-line">
          {credits}
          {icons}
        </div>
      );
  }

  return (
    <footer className="kit-sc-ft" data-section="footer" data-sc={layout}>
      <div className="kit-sc-in">{body}</div>
    </footer>
  );
}
