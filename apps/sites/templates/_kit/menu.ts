import { choice } from "@/lib/settings";
import type { Settings } from "@/lib/types";
import menuSettings from "./menu-settings.json";

/*
 * The owner's menu layout, shared by every template (fields in menu-settings.json, added to every template by
 * scripts/build-registry.mjs in a "Menu layout" group after "Page layout"): how the products are laid out, the columns on
 * big screens, where the product photos go and their proportions, where the prices go, the category links and the
 * category titles. With every option on "auto" the template's own menu renders untouched. Any other choice swaps in the
 * shared menu of _kit/Menu.tsx, styled by _kit/menu.css with the template's own colors, fonts and corners; an option left
 * on "auto" then takes what fits the layout best (resolveMenu()), and the layout itself, when left on "auto", is the
 * shared layout closest to the template's own menu (each template says which: `like`).
 * The card options (_kit/cards.ts: card style, border, corners, photo shape, space between cards) apply to the shared
 * menu's products too: they are .kit-card, their photos .kit-card-media, their lists .kit-cards.
 */

const options = <T extends string>(key: string) => menuSettings.fields.find((f) => f.key === key)!.options as T[];

export type MenuLayout = "auto" | "grid" | "list" | "compact" | "large" | "magazine" | "masonry" | "carousel" | "tiles";
export type MenuColumns = "auto" | "one" | "two" | "three" | "four";
export type MenuPhotos = "auto" | "top" | "side" | "none";
export type MenuPhotoShape = "auto" | "square" | "wide" | "tall";
export type MenuPrice = "auto" | "inline" | "badge" | "corner" | "under" | "large";
export type MenuNav = "auto" | "chips" | "tabs" | "sidebar" | "dropdown" | "none";
export type MenuTitle = "auto" | "simple" | "line" | "number" | "banner" | "ornament";

export const MENU_LAYOUTS = options<MenuLayout>("menu.layout");
export const MENU_COLUMNS = options<MenuColumns>("menu.columns");
export const MENU_PHOTOS = options<MenuPhotos>("menu.photos");
export const MENU_PHOTO_SHAPES = options<MenuPhotoShape>("menu.photoShape");
export const MENU_PRICES = options<MenuPrice>("menu.price");
export const MENU_NAVS = options<MenuNav>("menu.categoryNav");
export const MENU_TITLES = options<MenuTitle>("menu.categoryTitle");

export type MenuOptions = {
  layout: MenuLayout;
  columns: MenuColumns;
  photos: MenuPhotos;
  shape: MenuPhotoShape;
  price: MenuPrice;
  nav: MenuNav;
  title: MenuTitle;
};

/** Each option's setting key and the data attribute it sets on the shared menu (.kit-mn). */
const FIELDS: { [K in keyof MenuOptions]: { key: string; attr: string } } = {
  layout: { key: "menu.layout", attr: "data-mn" },
  columns: { key: "menu.columns", attr: "data-mn-cols" },
  photos: { key: "menu.photos", attr: "data-mn-photos" },
  shape: { key: "menu.photoShape", attr: "data-mn-shape" },
  price: { key: "menu.price", attr: "data-mn-price" },
  nav: { key: "menu.categoryNav", attr: "data-mn-nav" },
  title: { key: "menu.categoryTitle", attr: "data-mn-title" },
};

export const MENU_LAYOUT_KEYS = Object.values(FIELDS).map((f) => f.key);
export const MENU_LAYOUT_ATTRIBUTES = Object.values(FIELDS).map((f) => f.attr);

/** The owner's menu options; anything missing or unknown is "auto". */
export function menuOptions(settings: Settings): MenuOptions {
  return {
    layout: choice(settings, FIELDS.layout.key, MENU_LAYOUTS, "auto"),
    columns: choice(settings, FIELDS.columns.key, MENU_COLUMNS, "auto"),
    photos: choice(settings, FIELDS.photos.key, MENU_PHOTOS, "auto"),
    shape: choice(settings, FIELDS.shape.key, MENU_PHOTO_SHAPES, "auto"),
    price: choice(settings, FIELDS.price.key, MENU_PRICES, "auto"),
    nav: choice(settings, FIELDS.nav.key, MENU_NAVS, "auto"),
    title: choice(settings, FIELDS.title.key, MENU_TITLES, "auto"),
  };
}

/** True when the owner changed any menu option: the shared menu replaces the template's own. */
export const kitMenuOn = (settings: Settings) => Object.values(menuOptions(settings)).some((v) => v !== "auto");

type Layout = Exclude<MenuLayout, "auto">;
export type ResolvedMenu = {
  [K in keyof MenuOptions]: Exclude<MenuOptions[K], "auto">;
};

/** What "auto" means for each option once the shared menu shows, per layout. */
const LAYOUT_DEFAULTS: Record<Layout, Omit<ResolvedMenu, "layout" | "nav" | "title">> = {
  grid: { columns: "three", photos: "top", shape: "wide", price: "inline" },
  list: { columns: "two", photos: "side", shape: "square", price: "inline" },
  compact: { columns: "two", photos: "none", shape: "square", price: "inline" },
  large: { columns: "two", photos: "top", shape: "wide", price: "large" },
  magazine: { columns: "one", photos: "side", shape: "wide", price: "under" },
  masonry: { columns: "three", photos: "top", shape: "wide", price: "under" },
  carousel: { columns: "three", photos: "top", shape: "wide", price: "under" },
  tiles: { columns: "four", photos: "top", shape: "square", price: "badge" },
};

/**
 * Every option worked out for the shared menu: "auto" becomes what fits the layout (the layout itself becomes `like`, the
 * shared layout closest to the template's own menu). Combinations that cannot show are mended: a price "on the photo's
 * corner" without photos is a pill, tiles and the magazine always lay text over or beside the photo.
 */
export function resolveMenu(o: MenuOptions, like: Layout, { categories = 2, catalog = false }: { categories?: number; catalog?: boolean } = {}): ResolvedMenu {
  const layout = o.layout === "auto" ? like : o.layout;
  const d = LAYOUT_DEFAULTS[layout];
  let photos = o.photos === "auto" ? d.photos : o.photos;
  if (layout === "tiles" && photos === "side") photos = "top";
  if (layout === "magazine" && photos === "top") photos = "side";
  let price = o.price === "auto" ? d.price : o.price;
  if (price === "corner" && photos === "none") price = "badge";
  // Category links only help with more than one category; catalog templates filter with their own buttons.
  const nav = categories < 2 ? "none" : o.nav === "auto" ? (catalog ? "none" : "chips") : o.nav;
  return {
    layout,
    columns: o.columns === "auto" ? d.columns : o.columns,
    photos,
    shape: o.shape === "auto" ? d.shape : o.shape,
    price,
    nav,
    title: o.title === "auto" ? "simple" : o.title,
  };
}

/** Data attributes for the shared menu (read by _kit/menu.css), from the worked-out options. */
export function menuAttributes(r: ResolvedMenu): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [name, { attr }] of Object.entries(FIELDS) as [keyof MenuOptions, { attr: string }][]) attrs[attr] = r[name];
  return attrs;
}
