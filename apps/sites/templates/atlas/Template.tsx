import type { TemplateProps } from "@/lib/types";
import { PremiumSite, type PremiumConfig } from "../_premium/PremiumSite";

const PALETTES = {
  paper: { bg: "#FFFFFF", surf: "#F5F4F1", ink: "#111214", muted: "#5F6166", line: "#E6E4DF" },
  stone: { bg: "#F1EFEA", surf: "#FAF9F6", ink: "#16171A", muted: "#63646A", line: "#DAD7CF" },
  sand: { bg: "#EFE7DA", surf: "#F8F3EA", ink: "#1E1A15", muted: "#6D6456", line: "#DDD2BF" },
  ink: { bg: "#111214", surf: "#1B1C1F", ink: "#F2F1EE", muted: "#A4A5AA", line: "#2C2D31" },
};

const config: PremiumConfig<keyof typeof PALETTES> = {
  id: "atlas",
  className: "t-atlas",
  palettes: PALETTES,
  fonts: ["grotesk", "modern", "mono"],
  defaultAccent: "#111214",
  radius: { rounded: "10px", sharp: "0px" },
  shop: true,
};

/** Template 024 "Atlas" (Pro): a clean shop catalog with a department mega menu, dense product grids and a slideshow hero. */
export default function AtlasTemplate(props: TemplateProps & { now?: Date }) {
  return <PremiumSite {...props} config={config} />;
}
