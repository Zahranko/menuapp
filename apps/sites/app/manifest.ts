import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.brandName,
    short_name: brand.brandName,
    description: brand.tagline,
    start_url: "/",
    display: "standalone",
    background_color: brand.colorPaper,
    theme_color: brand.colorPrimary,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
