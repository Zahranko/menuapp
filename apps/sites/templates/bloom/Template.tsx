import type { TemplateProps } from "@/lib/types";
import { PremiumSite, type PremiumConfig } from "../_premium/PremiumSite";

const PALETTES = {
  blush: { bg: "#FFF5F6", surf: "#FFFFFF", ink: "#3A2228", muted: "#8A6870", line: "#F5DCE2" },
  butter: { bg: "#FFF8E7", surf: "#FFFFFF", ink: "#3A2C1C", muted: "#86735A", line: "#F1E3C0" },
  lilac: { bg: "#F6F2FD", surf: "#FFFFFF", ink: "#2C2440", muted: "#736A8C", line: "#E3DAF5" },
  cocoa: { bg: "#2B1D1A", surf: "#382622", ink: "#FBEFEA", muted: "#C6A9A0", line: "#4A332D" },
};

const config: PremiumConfig<keyof typeof PALETTES> = {
  id: "bloom",
  className: "t-bloom",
  palettes: PALETTES,
  fonts: ["round", "soft", "hand"],
  defaultAccent: "#E05A84",
  radius: { rounded: "26px", sharp: "8px" },
  ornament: <svg viewBox="0 0 18 18" aria-hidden="true" className="orn"><g fill="currentColor"><circle cx="9" cy="4.5" r="3.5" /><circle cx="13.5" cy="9" r="3.5" /><circle cx="9" cy="13.5" r="3.5" /><circle cx="4.5" cy="9" r="3.5" /></g><circle cx="9" cy="9" r="2.4" fill="#FFD36E" /></svg>,
};

/** Template 026 "Bloom" (Pro): a soft pastel bakery site with round category bubbles, playful shapes and a sweet gallery. */
export default function BloomTemplate(props: TemplateProps & { now?: Date }) {
  return <PremiumSite {...props} config={config} />;
}
