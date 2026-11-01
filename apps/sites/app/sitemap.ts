import type { MetadataRoute } from "next";
import { getSiteByHost } from "@/lib/api";
import { requestHost } from "@/lib/host";
import { marketingUrls } from "@/lib/marketing/seo";
import { siteUrl } from "@/lib/seo";

/** On a custom domain: that business's site. On the brand domain: the marketing pages, in English and Arabic. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { host, main } = await requestHost();
  if (main) {
    return marketingUrls().map(({ url, languages, priority }) => ({ url, alternates: { languages }, changeFrequency: "monthly", priority }));
  }

  const site = await getSiteByHost(host);
  if (!site) return [];
  return [{ url: siteUrl(site), lastModified: site.publishedAt ?? undefined, changeFrequency: "daily", priority: 1 }];
}
