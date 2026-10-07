import type { MetadataRoute } from "next";
import { getSiteByHost } from "@/lib/api";
import { brand } from "@/lib/brand";
import { requestHost } from "@/lib/host";
import { siteUrl } from "@/lib/seo";

/** On a custom domain: that business's site. On the brand domain: the marketing pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { host, main } = await requestHost();
  if (main) return [{ url: `https://${brand.domain}/`, changeFrequency: "weekly", priority: 1 }];

  const site = await getSiteByHost(host);
  if (!site) return [];
  return [{ url: siteUrl(site), lastModified: site.publishedAt ?? undefined, changeFrequency: "daily", priority: 1 }];
}
