import type { TemplateProps } from "@/lib/types";
import { PremiumSite, type PremiumConfig } from "../_premium/PremiumSite";

const PALETTES = {
  noir: { bg: "#0E0D0B", surf: "#17150F", ink: "#F3EBDD", muted: "#A89D8A", line: "#2E2A22" },
  bordeaux: { bg: "#1C0E12", surf: "#26141A", ink: "#F5E9E4", muted: "#B79C9F", line: "#3A2329" },
  ivory: { bg: "#F7F2E8", surf: "#EFE7D8", ink: "#1E1A14", muted: "#6B6255", line: "#DDD2BE" },
  olive: { bg: "#151A13", surf: "#1E251B", ink: "#EEF0E6", muted: "#A2AA94", line: "#2F3829" },
};

const config: PremiumConfig<keyof typeof PALETTES> = {
  id: "maison",
  className: "t-maison",
  palettes: PALETTES,
  fonts: ["elegant", "classic", "naskh"],
  defaultAccent: "#C9A45C",
  radius: { rounded: "6px", sharp: "0px" },
  ornament: <svg viewBox="0 0 40 12" aria-hidden="true" className="orn"><path d="M0 6h14M26 6h14" stroke="currentColor" /><path d="M20 1l5 5-5 5-5-5z" fill="currentColor" /></svg>,
};

/** Template 022 "Maison" (Pro): a dark, gold-lined restaurant site with centered navigation, banner categories and a quiet luxury feel. */
export default function MaisonTemplate(props: TemplateProps & { now?: Date }) {
  return <PremiumSite {...props} config={config} />;
}
