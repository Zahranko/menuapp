import type { TemplateProps } from "@/lib/types";
import { PremiumSite, type PremiumConfig } from "../_premium/PremiumSite";

const PALETTES = {
  charcoal: { bg: "#0F0E0D", surf: "#1A1816", ink: "#F7F1E8", muted: "#ADA398", line: "#2E2A26" },
  smoke: { bg: "#1D1B19", surf: "#282522", ink: "#F5EFE6", muted: "#B3A99D", line: "#3B3632" },
  bone: { bg: "#F4EEE4", surf: "#FFFFFF", ink: "#1A1512", muted: "#6E6358", line: "#E2D8C9" },
  rust: { bg: "#2A120C", surf: "#3A1B12", ink: "#FCEDE3", muted: "#CDA796", line: "#4E2A1E" },
};

const config: PremiumConfig<keyof typeof PALETTES> = {
  id: "ember",
  className: "t-ember",
  palettes: PALETTES,
  fonts: ["condensed", "bold", "modern"],
  defaultAccent: "#FF6B1A",
  radius: { rounded: "14px", sharp: "0px" },
  ornament: <svg viewBox="0 0 14 18" aria-hidden="true" className="orn"><path d="M7 1c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-6 2 1 3 2 3 4 1-2 1-5 1-9z" fill="currentColor" /></svg>,
};

/** Template 025 "Ember" (Pro): a bold grill and burger site: poster type, text-on-photo cards and a fiery slideshow. */
export default function EmberTemplate(props: TemplateProps & { now?: Date }) {
  return <PremiumSite {...props} config={config} />;
}
