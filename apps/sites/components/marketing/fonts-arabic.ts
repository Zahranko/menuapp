import { Cairo } from "next/font/google";

/* fontArabic from brand.json, for every Arabic page (headings and text). Kept apart so English pages don't preload it. */
export const arabicFont = Cairo({ display: "swap", subsets: ["arabic", "latin"], variable: "--mk-font-arabic" });

export const ARABIC_FONT = { fontArabic: "Cairo" };
