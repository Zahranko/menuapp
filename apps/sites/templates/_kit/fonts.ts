import {
  Almarai,
  Amiri,
  Baloo_2,
  Bebas_Neue,
  Bricolage_Grotesque,
  Cairo,
  Caveat,
  Cormorant_Garamond,
  DM_Sans,
  El_Messiri,
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Lalezar,
  Manrope,
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Playfair_Display,
  Readex_Pro,
  Rubik,
  Space_Grotesk,
  Syne,
  Tajawal,
} from "next/font/google";

/*
 * Every font a template may use. Each one sets a CSS variable; a template picks a pair below.
 * preload is off because a page only uses two of them (the browser downloads only the fonts the page uses);
 * display "swap" keeps text visible while they load.
 */
const bricolage = Bricolage_Grotesque({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-bricolage" });
const dmSans = DM_Sans({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-dmsans" });
const cormorant = Cormorant_Garamond({ display: "swap", preload: false, subsets: ["latin"], weight: ["600", "700"], variable: "--f-cormorant" });
const manrope = Manrope({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-manrope" });
const syne = Syne({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-syne" });
const plexArabic = IBM_Plex_Sans_Arabic({ display: "swap", preload: false, subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--f-plexarabic" });
const playfair = Playfair_Display({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-playfair" });
const fraunces = Fraunces({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-fraunces" });
const spaceGrotesk = Space_Grotesk({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-spacegrotesk" });
const caveat = Caveat({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-caveat" });
const bebas = Bebas_Neue({ display: "swap", preload: false, subsets: ["latin"], weight: "400", variable: "--f-bebas" });
const plexMono = IBM_Plex_Mono({ display: "swap", preload: false, subsets: ["latin"], weight: ["400", "600"], variable: "--f-plexmono" });
const baloo = Baloo_2({ display: "swap", preload: false, subsets: ["latin"], variable: "--f-baloo" });
const amiri = Amiri({ display: "swap", preload: false, subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-amiri" });

/*
 * The owner's font choice (setting "font.family", see TYPEFACES below): pairs that cover Arabic and Latin, so a site
 * reads well in both. A page only downloads the files of the fonts it uses, so these cost nothing until chosen.
 */
const cairo = Cairo({ display: "swap", preload: false, subsets: ["arabic", "latin"], variable: "--f-cairo" });
const tajawal = Tajawal({ display: "swap", preload: false, subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800"], variable: "--f-tajawal" });
const almarai = Almarai({ display: "swap", preload: false, subsets: ["arabic", "latin"], weight: ["400", "700", "800"], variable: "--f-almarai" });
const plexSans = IBM_Plex_Sans({ display: "swap", preload: false, subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-plexsans" });
const kufi = Noto_Kufi_Arabic({ display: "swap", preload: false, subsets: ["arabic", "latin"], variable: "--f-kufi" });
const readex = Readex_Pro({ display: "swap", preload: false, subsets: ["arabic", "latin"], variable: "--f-readex" });
const messiri = El_Messiri({ display: "swap", preload: false, subsets: ["arabic", "latin"], variable: "--f-messiri" });
const naskh = Noto_Naskh_Arabic({ display: "swap", preload: false, subsets: ["arabic", "latin"], variable: "--f-naskh" });
const lalezar = Lalezar({ display: "swap", preload: false, subsets: ["arabic", "latin"], weight: "400", variable: "--f-lalezar" });
const rubik = Rubik({ display: "swap", preload: false, subsets: ["arabic", "latin"], variable: "--f-rubik" });

/** Put on the template's root element so the font variables exist. */
export const fontVariables = [
  bricolage,
  dmSans,
  cormorant,
  manrope,
  syne,
  plexArabic,
  playfair,
  fraunces,
  spaceGrotesk,
  caveat,
  bebas,
  plexMono,
  baloo,
  amiri,
  cairo,
  tajawal,
  almarai,
  plexSans,
  kufi,
  readex,
  messiri,
  naskh,
  lalezar,
  rubik,
]
  .map((f) => f.variable)
  .join(" ");

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

export const fontPairs = {
  modern: { display: "var(--f-bricolage), sans-serif", body: "var(--f-dmsans), system-ui, sans-serif", weight: 800, tracking: "-.03em", scale: 1 },
  elegant: { display: "var(--f-cormorant), Georgia, serif", body: "var(--f-manrope), system-ui, sans-serif", weight: 700, tracking: "-.01em", scale: 1.18 },
  bold: { display: "var(--f-syne), sans-serif", body: "var(--f-manrope), system-ui, sans-serif", weight: 800, tracking: "-.03em", scale: 0.92 },
  classic: { display: "var(--f-playfair), Georgia, serif", body: "var(--f-manrope), system-ui, sans-serif", weight: 700, tracking: "-.01em", scale: 1 },
  soft: { display: "var(--f-fraunces), Georgia, serif", body: "var(--f-dmsans), system-ui, sans-serif", weight: 600, tracking: "-.02em", scale: 1 },
  grotesk: { display: "var(--f-spacegrotesk), sans-serif", body: "var(--f-spacegrotesk), system-ui, sans-serif", weight: 700, tracking: "-.04em", scale: 1 },
  hand: { display: "var(--f-caveat), cursive", body: "var(--f-manrope), system-ui, sans-serif", weight: 700, tracking: "0", scale: 1.3 },
  condensed: { display: "var(--f-bebas), Impact, sans-serif", body: "var(--f-dmsans), system-ui, sans-serif", weight: 400, tracking: ".01em", scale: 1.25 },
  mono: { display: "var(--f-plexmono), ui-monospace, monospace", body: "var(--f-plexmono), ui-monospace, monospace", weight: 600, tracking: "-.02em", scale: 0.9 },
  round: { display: "var(--f-baloo), sans-serif", body: "var(--f-dmsans), system-ui, sans-serif", weight: 800, tracking: "-.01em", scale: 1.05 },
  naskh: { display: "var(--f-amiri), Georgia, serif", body: "var(--f-manrope), system-ui, sans-serif", weight: 700, tracking: "0", scale: 1.1 },
} satisfies Record<string, FontPair>;

export type FontName = keyof typeof fontPairs;

/** Arabic sites use IBM Plex Sans Arabic (or Amiri for the naskh pair), with the Latin font as fallback for numbers and names. */
export function forLocale(pair: FontPair, locale: string): FontPair {
  if (locale !== "ar") return pair;
  const arabicDisplay = pair.display.includes("--f-amiri") ? "var(--f-amiri)" : "var(--f-plexarabic)";
  return {
    ...pair,
    display: `${arabicDisplay}, ${pair.display}`,
    body: `var(--f-plexarabic), ${pair.body}`,
    weight: Math.min(pair.weight, 700),
    tracking: "0",
    scale: Math.min(pair.scale, 1.05),
  };
}

/**
 * The owner's font choice, shared by every template ("font.family"; "default" keeps the template's own fonts).
 * Every pair covers Arabic and Latin with the same fonts in both languages, so forLocale is not applied to it.
 */
export const TYPEFACES = {
  cairo: { display: "var(--f-cairo), sans-serif", body: "var(--f-cairo), system-ui, sans-serif", weight: 800, tracking: "-.01em", scale: 1 },
  tajawal: { display: "var(--f-tajawal), sans-serif", body: "var(--f-tajawal), system-ui, sans-serif", weight: 800, tracking: "-.01em", scale: 1.04 },
  almarai: { display: "var(--f-almarai), sans-serif", body: "var(--f-almarai), system-ui, sans-serif", weight: 800, tracking: "-.01em", scale: 1 },
  plex: { display: "var(--f-plexsans), var(--f-plexarabic), sans-serif", body: "var(--f-plexsans), var(--f-plexarabic), system-ui, sans-serif", weight: 700, tracking: "-.01em", scale: 1 },
  kufi: { display: "var(--f-kufi), sans-serif", body: "var(--f-kufi), system-ui, sans-serif", weight: 700, tracking: "-.01em", scale: 0.94 },
  readex: { display: "var(--f-readex), sans-serif", body: "var(--f-readex), system-ui, sans-serif", weight: 700, tracking: "-.02em", scale: 0.98 },
  messiri: { display: "var(--f-messiri), Georgia, serif", body: "var(--f-cairo), system-ui, sans-serif", weight: 700, tracking: "0", scale: 1.04 },
  amiri: { display: "var(--f-amiri), Georgia, serif", body: "var(--f-naskh), Georgia, serif", weight: 700, tracking: "0", scale: 1.1 },
  lalezar: { display: "var(--f-lalezar), Impact, sans-serif", body: "var(--f-tajawal), system-ui, sans-serif", weight: 400, tracking: "0", scale: 1.08 },
  rubik: { display: "var(--f-rubik), sans-serif", body: "var(--f-rubik), system-ui, sans-serif", weight: 700, tracking: "-.02em", scale: 1 },
} satisfies Record<string, FontPair>;

export type TypefaceName = keyof typeof TYPEFACES;
export const TYPEFACE_NAMES = Object.keys(TYPEFACES) as TypefaceName[];
