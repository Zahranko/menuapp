import type { components } from "./api-types";

type Schemas = components["schemas"];

export type PublicProduct = Omit<Schemas["PublicProductDto"], "price"> & { price: number };
/** A category; `parentId` is set on a sub-category (one level deep). */
export type PublicCategory = Omit<Schemas["PublicCategoryDto"], "products" | "parentId"> & { products: PublicProduct[]; parentId?: string | null };
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
  /** Pro templates have more than one page: the path after the site's home ([] on the home page). */
  path?: string[];
  /** Public address of the site's home page, for links between pages: "/<slug>", "/_preview/<token>" or "" on a custom domain. */
  base?: string;
};
