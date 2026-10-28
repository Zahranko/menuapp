import type { TemplateProps } from "@/lib/types";
import { logoRoot, OrderFab, optionRoot } from "../_kit/blocks";
import { orderButton } from "../_kit/options";
import { fontVariables } from "../_kit/fonts";
import { ItemSheet, type SheetItem } from "../_kit/ItemSheet";
import { tintFor } from "../_kit/site-data";
import { TemplateStyles } from "../_kit/TemplateStyles";
import { souqContext } from "./context";
import { choice } from "@/lib/settings";
import { heroPhotos } from "../_kit/hero";
import { navOf, orderCta, pageTop, SiteHeader, SiteHero } from "../_kit/Top";
import { Footer } from "./sections/Footer";
import { Header, navLinks } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { Highlights } from "./sections/Highlights";
import { Menu } from "./sections/Menu";
import { Reviews } from "./sections/Reviews";
import { Signature } from "./sections/Signature";
import { Gallery } from "./sections/Gallery";
import { Story } from "./sections/Story";
import { Visit } from "./sections/Visit";
import { dotted, souqVars } from "./theme";
import { ordered, SiteFooter, SiteGallery, SiteHighlights, SiteReviews, SiteStory, SiteVisit } from "../_kit/Sections";
import { socialAccounts } from "../_kit/options";
import { SOUQ_SOCIAL } from "./sections/Footer";

/** Template 001 "Souq": a warm café site with a big hero, signature picks and a searchable menu. */
export default function SouqTemplate({ site, preview, now }: TemplateProps & { now?: Date }) {
  const ctx = souqContext(site, now);
  const announcement = ctx.text("announcement");
  const order = orderButton(site);
  const split = choice(site.settings, "hero.layout", ["full", "split"] as const, "full") === "split";
  const top = pageTop(ctx, { photos: heroPhotos(site.settings, "hero.image"), backdrop: !split });
  const sheetItems: SheetItem[] = ctx.sections.flatMap((section) =>
    section.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.priceText,
      image: p.imageUrl,
      tint: tintFor(p.name),
      label: p.labelText,
      soldOut: !p.isAvailable,
    })),
  );

  return (
    <div data-template="souq" {...logoRoot(ctx)} {...optionRoot(ctx, order)} className={`t-souq ${fontVariables} ${dotted(site.settings) ? "pat" : ""}`} style={souqVars(site.settings, site.business.locale)}>
      <TemplateStyles id="souq" />
      <a className="skip" href="#menu">
        {ctx.c.viewMenu}
      </a>
      {preview && <div className="preview">{ctx.t.preview}</div>}
      {ctx.on("announcement") && announcement && (
        <div className="ann" data-section="announcement">
          {announcement}
        </div>
      )}
      <SiteHeader ctx={ctx} top={top} links={navOf(navLinks(ctx))} cta={orderCta(order)}>
        <Header ctx={ctx} />
      </SiteHeader>
      <main>
        <SiteHero ctx={ctx} top={top}>
          <Hero ctx={ctx} />
        </SiteHero>
        {ordered(ctx, {
          highlights: ctx.on("highlights") && (
            <SiteHighlights ctx={ctx}>
              <Highlights ctx={ctx} />
            </SiteHighlights>
          ),
          signature: ctx.on("signature") && <Signature ctx={ctx} />,
          menu: <Menu ctx={ctx} />,
          story: ctx.on("story") && (
            <SiteStory ctx={ctx} title={ctx.text("story.title") || ctx.t.story} eyebrow={ctx.c.storyEyebrow}>
              <Story ctx={ctx} />
            </SiteStory>
          ),
          gallery: ctx.on("gallery") && (
            <SiteGallery ctx={ctx} title={ctx.c.galleryTitle.replace("{name}", site.business.name)} eyebrow={ctx.c.galleryEyebrow}>
              <Gallery ctx={ctx} />
            </SiteGallery>
          ),
          reviews: ctx.on("reviews") && (
            <SiteReviews ctx={ctx} title={ctx.c.reviewsTitle} eyebrow={ctx.c.reviewsEyebrow} reviews={ctx.reviews.slice(0, 3)}>
              <Reviews ctx={ctx} />
            </SiteReviews>
          ),
          visit: ctx.on("visit") && (
            <SiteVisit ctx={ctx} title={ctx.c.visitTitle} eyebrow={ctx.c.visitEyebrow}>
              <Visit ctx={ctx} />
            </SiteVisit>
          ),
        })}
      </main>
      <SiteFooter ctx={ctx} links={navOf(navLinks(ctx))} social={socialAccounts(site, SOUQ_SOCIAL)} tagline={ctx.text("hero.subtitle")}>
        <Footer ctx={ctx} />
      </SiteFooter>
      <OrderFab order={order} />
      <ItemSheet
        items={sheetItems}
        closeLabel={ctx.t.close}
        soldOutLabel={ctx.t.soldOut}
        classes={{ dialog: "sheet", media: "sheetMedia", body: "sheetBody", title: "sheetTitle", text: "sheetText", row: "sheetRow", close: `btn pri`, tag: "tag" }}
      />
    </div>
  );
}
