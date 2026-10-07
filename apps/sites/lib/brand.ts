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
