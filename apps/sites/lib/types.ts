import type { components } from "./api-types";

type Schemas = components["schemas"];

export type PublicProduct = Omit<Schemas["PublicProductDto"], "price"> & { price: number };
export type PublicCategory = Omit<Schemas["PublicCategoryDto"], "products"> & { products: PublicProduct[] };
export type PublicBusiness = Schemas["PublicBusinessDto"];

/** A site as the public API returns it, with settings as a flat key → value object. */
export type PublicSite = Omit<Schemas["PublicSiteDto"], "settings" | "categories"> & {
  settings: Settings;
  categories: PublicCategory[];
};

export type Settings = Record<string, unknown>;

export type Locale = "en" | "ar";

/** Props every template component receives. */
export type TemplateProps = {
  site: PublicSite;
  /** The draft shown in the editor's preview. */
  preview: boolean;
};
