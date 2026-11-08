import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

/*
 * The brand fonts from brand.json for English pages: fontDisplay (headings) and fontBody (text). Arabic pages use
 * fontArabic (fonts-arabic.ts). next/font needs fonts named in code, so a brand font change means changing these
 * imports too; lib/marketing/marketing.test.ts fails until they match brand.json again.
 */
export const displayFont = Bricolage_Grotesque({ display: "swap", subsets: ["latin"], variable: "--mk-font-display" });
export const bodyFont = DM_Sans({ display: "swap", subsets: ["latin"], variable: "--mk-font-body" });

export const LATIN_FONTS = { fontDisplay: "Bricolage Grotesque", fontBody: "DM Sans" };
