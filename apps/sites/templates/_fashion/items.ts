import { initial } from "@/lib/format";
import type { SiteContext } from "../_kit/context";
import { tintFor, type MenuItem } from "../_kit/site-data";
import { fashionCopy, fill } from "./copy";
import { details, type Details } from "./details";
import type { FashionItem } from "./ProductSheet";

/** A product with its clothing details and the name of its collection. */
export type Piece = MenuItem & { details: Details; collection: string };

/** Every product of the site with its details, in menu order. */
export function pieces(ctx: SiteContext): Piece[] {
  return ctx.sections.flatMap((s) => s.products.map((p) => ({ ...p, details: details(p.description), collection: s.name })));
}

/** What the product sheet needs for each product: details, photo, label and the WhatsApp message to start from. */
export function sheetItems(ctx: SiteContext, all: { item: MenuItem; collection: string | null }[]): FashionItem[] {
  const c = fashionCopy(ctx.locale);
  const phone = ctx.site.business.whatsApp;
  return all.map(({ item, collection }) => {
    const d = details(item.description);
    return {
      id: item.id,
      name: item.name,
      text: d.text,
      sizes: d.sizes,
      colors: d.colors,
      price: item.priceText,
      image: item.imageUrl,
      tint: tintFor(item.name),
      initial: initial(item.name),
      label: item.labelText,
      soldOut: !item.isAvailable,
      category: collection,
      message: phone ? fill(c.orderMessage, { name: item.name, price: item.priceText }) : null,
    };
  });
}

/** The sheet's words in the site's language. */
export function sheetLabels(ctx: SiteContext) {
  const c = fashionCopy(ctx.locale);
  return { close: ctx.t.close, soldOut: ctx.t.soldOut, inStock: c.inStock, order: c.order, chooseSize: c.chooseSize, colors: c.colors, sizeMessage: c.sizeMessage };
}

/** The viewer's words in the site's language. */
export function viewerLabels(ctx: SiteContext) {
  const c = fashionCopy(ctx.locale);
  return { close: ctx.t.close, prev: c.prev, next: c.next, photo: c.photo };
}
