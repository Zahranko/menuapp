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
        {ctx.on("highlights") && <Highlights ctx={ctx} />}
        {ctx.on("signature") && <Signature ctx={ctx} />}
        <Menu ctx={ctx} />
        {ctx.on("story") && <Story ctx={ctx} />}
        {ctx.on("gallery") && <Gallery ctx={ctx} />}
        {ctx.on("reviews") && <Reviews ctx={ctx} />}
        {ctx.on("visit") && <Visit ctx={ctx} />}
      </main>
      <Footer ctx={ctx} />
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
