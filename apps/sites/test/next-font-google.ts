// Vitest stand-in for next/font/google, which only works inside the Next.js compiler.
type Font = { className: string; variable: string; style: { fontFamily: string } };
const font = (): Font => ({ className: "", variable: "", style: { fontFamily: "sans-serif" } });
export const Amiri = font;
export const Baloo_2 = font;
export const Bebas_Neue = font;
export const Bricolage_Grotesque = font;
export const Caveat = font;
export const Cormorant_Garamond = font;
export const DM_Sans = font;
export const Fraunces = font;
export const IBM_Plex_Mono = font;
export const IBM_Plex_Sans_Arabic = font;
export const Manrope = font;
export const Playfair_Display = font;
export const Space_Grotesk = font;
export const Syne = font;
