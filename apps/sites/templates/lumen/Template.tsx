import type { TemplateProps } from "@/lib/types";
import { PremiumSite, type PremiumConfig } from "../_premium/PremiumSite";

const PALETTES = {
  daylight: { bg: "#FBF8F3", surf: "#FFFFFF", ink: "#1D1B18", muted: "#6C665E", line: "#E9E2D6" },
  oat: { bg: "#F3ECE1", surf: "#FBF7F0", ink: "#2A221B", muted: "#74685A", line: "#E0D5C4" },
  mist: { bg: "#EEF2F1", surf: "#FFFFFF", ink: "#17201E", muted: "#5E6B68", line: "#D8E0DE" },
  espresso: { bg: "#1B1714", surf: "#25201C", ink: "#F4ECE2", muted: "#B2A595", line: "#39312B" },
};

const config: PremiumConfig<keyof typeof PALETTES> = {
  id: "lumen",
  className: "t-lumen",
  palettes: PALETTES,
  fonts: ["modern", "soft", "grotesk"],
  defaultAccent: "#2F6B57",
  radius: { rounded: "22px", sharp: "4px" },
  ornament: <svg viewBox="0 0 16 16" aria-hidden="true" className="orn"><circle cx="8" cy="8" r="3.2" fill="currentColor" /><path d="M8 0.8v2.4M8 12.8v2.4M0.8 8h2.4M12.8 8h2.4M2.9 2.9l1.7 1.7M11.4 11.4l1.7 1.7M2.9 13.1l1.7-1.7M11.4 4.6l1.7-1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
};

/** Template 023 "Lumen" (Pro): a bright café site with a floating menu bar, split hero and soft rounded cards. */
export default function LumenTemplate(props: TemplateProps & { now?: Date }) {
  return <PremiumSite {...props} config={config} />;
}
