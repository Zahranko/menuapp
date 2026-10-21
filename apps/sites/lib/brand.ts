import brandFile from "../../../brand.json";

/** Brand values from brand.json at the repo root. The only place the public name, domain and colors come from. */
export type Brand = typeof brandFile;

export const brand: Brand = {
  ...brandFile,
  // Lets staging run under another domain without touching brand.json.
  domain: process.env.BRAND_DOMAIN ?? brandFile.domain,
};

/** Replaces {brandName} placeholders in user-facing strings. */
export function withBrand(text: string): string {
  return text.replaceAll("{brandName}", brand.brandName);
}

/**
 * Slug of the demo business named after the brand (fixtures, template previews, thumbnails): "<short name>menu",
 * because the short name on its own is a reserved slug.
 */
export const demoSlug = `${brand.brandShortName.toLowerCase().replace(/[^a-z0-9]/g, "")}menu`.slice(0, 30);
