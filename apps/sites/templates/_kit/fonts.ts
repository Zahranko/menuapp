import { Bricolage_Grotesque, Cormorant_Garamond, DM_Sans, IBM_Plex_Sans_Arabic, Manrope, Syne } from "next/font/google";

/*
 * Every font a template may use. Each one sets a CSS variable; a template picks its pair with font-family.
 * preload is off because a page only uses two of them; display "swap" keeps text visible while they load.
 */
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-bricolage", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--f-dmsans", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["600", "700"], variable: "--f-cormorant", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--f-manrope", display: "swap", preload: false });
const syne = Syne({ subsets: ["latin"], variable: "--f-syne", display: "swap", preload: false });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--f-plexarabic", display: "swap", preload: false });

/** Put on the template's root element so the font variables exist. */
export const fontVariables = [bricolage, dmSans, cormorant, manrope, syne, plexArabic].map((f) => f.variable).join(" ");

export type FontPair = {
  /** Headings. */
  display: string;
  /** Body text. */
  body: string;
  /** Heading weight, letter spacing and size scale. */
  weight: number;
  tracking: string;
  scale: number;
};

const arabic = "var(--f-plexarabic), system-ui, sans-serif";

export const fontPairs = {
  modern: { display: "var(--f-bricolage), sans-serif", body: "var(--f-dmsans), system-ui, sans-serif", weight: 800, tracking: "-.03em", scale: 1 },
  elegant: { display: "var(--f-cormorant), Georgia, serif", body: "var(--f-manrope), system-ui, sans-serif", weight: 700, tracking: "-.01em", scale: 1.18 },
  bold: { display: "var(--f-syne), sans-serif", body: "var(--f-manrope), system-ui, sans-serif", weight: 800, tracking: "-.03em", scale: 0.92 },
} satisfies Record<string, FontPair>;

/** Arabic sites use IBM Plex Sans Arabic for everything, with the Latin font as fallback for numbers and names. */
export function forLocale(pair: FontPair, locale: string): FontPair {
  if (locale !== "ar") return pair;
  return { ...pair, display: `${arabic.split(",")[0]}, ${pair.display}`, body: `${arabic.split(",")[0]}, ${pair.body}`, tracking: "0", scale: Math.min(pair.scale, 1) };
}
