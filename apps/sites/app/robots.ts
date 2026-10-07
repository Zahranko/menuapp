import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { requestHost } from "@/lib/host";

/** Per host: the brand domain and every custom domain point crawlers at their own sitemap. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { host, main } = await requestHost();
  const origin = main ? `https://${brand.domain}` : `https://${host}`;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/_preview/", "/s-preview/", "/api/"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
