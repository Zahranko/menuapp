// Vitest stand-in for next/font/google, which only works inside the Next.js compiler.
type Font = { className: string; variable: string; style: { fontFamily: string } };
const font = (): Font => ({ className: "", variable: "", style: { fontFamily: "sans-serif" } });
export const Bricolage_Grotesque = font;
export const DM_Sans = font;
export const Cormorant_Garamond = font;
export const Manrope = font;
export const Syne = font;
export const IBM_Plex_Sans_Arabic = font;
