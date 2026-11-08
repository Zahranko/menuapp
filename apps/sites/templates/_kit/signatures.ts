import type { PublicSite } from "@/lib/types";
import data from "./signatures.generated.json";

/*
 * Signature options: options of the shared layout fields that only one template has (its manifest's "signature", added by
 * scripts/build-registry.mjs right after "auto"). Each builds on a shared option of the field, its "base", which gives it
 * its markup, layout and accessibility; the template's own CSS (templates/<id>/signature.css) then turns it into the
 * template's own version, keyed on data-sig="<option>" on the shared header, opening, menu or section, and on the
 * template's root (data-sig lists every signature option in use, so the template can restyle around them).
 *
 * siteContext() reads the site through signatureSite(): a signature option of the site's template becomes its base in
 * the settings the kit reads, and signaturesOf() tells which signature each field shows. Every other site, and any
 * site without signature options, is the very same object, so its page stays byte for byte as it was.
 */

type Signatures = Record<string, Record<string, Record<string, string>>>;
const SIGNATURES = data as Signatures;

const chosen = new WeakMap<PublicSite, Readonly<Record<string, string>>>();
const NONE: Readonly<Record<string, string>> = Object.freeze({});

/** The template's signature options per field: option → the shared option it builds on. */
export const signatureOptions = (templateId: string): Record<string, Record<string, string>> => SIGNATURES[templateId] ?? {};

/** The site as the kit reads it: signature options of its template replaced by their base option (see above). */
export function signatureSite(site: PublicSite): PublicSite {
  const own = SIGNATURES[site.templateId];
  if (!own || chosen.has(site)) return site;
  const sigs: Record<string, string> = {};
  const settings = { ...site.settings };
  for (const [key, options] of Object.entries(own)) {
    const value = settings[key];
    if (typeof value === "string" && value in options) {
      sigs[key] = value;
      settings[key] = options[value];
    }
  }
  if (Object.keys(sigs).length === 0) return site;
  const out = { ...site, settings };
  chosen.set(out, Object.freeze(sigs));
  return out;
}

/** The signature option each field shows on this site (read from the site siteContext() made). */
export const signaturesOf = (site: PublicSite): Readonly<Record<string, string>> => chosen.get(site) ?? NONE;

/** The signature option of one field, or undefined. */
export const signatureOf = (site: PublicSite, key: string): string | undefined => signaturesOf(site)[key];

/** data-sig for the template's root: every signature option in use, space separated. Empty without any. */
export function signatureAttributes(site: PublicSite): Record<string, string> {
  const sigs = Object.values(signaturesOf(site));
  return sigs.length ? { "data-sig": sigs.join(" ") } : {};
}
