import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { jsonLdScript, siteJsonLd } from "@/lib/jsonld";
import { SITE_BASE_HEADER, siteBase } from "@/lib/routing";
import { siteMetadata, siteUrl } from "@/lib/seo";
import type { PublicSite } from "@/lib/types";
import { pageOf, SiteTemplate, titleOf } from "@/templates/registry";

/** Shared by the published and preview routes, for the home page and the inner pages of Pro templates. */

/** Metadata for a page: the site's, with the page's own title and address. */
export function pageMetadata(site: PublicSite | null, path: string[]): Metadata {
  if (!site) return { title: "Not found", robots: { index: false } };
  const page = pageOf(site, path);
  if (!page) return { title: "Not found", robots: { index: false } };
  const meta = siteMetadata(site);
  const title = titleOf(site, page);
  if (!title) return meta;
  const url = `${siteUrl(site)}/${path.map(encodeURIComponent).join("/")}`;
  return { ...meta, title, alternates: { canonical: url }, openGraph: { ...meta.openGraph, title, url } };
}

/** Renders a page of the site, or answers 404 when the template has no such page. */
export async function SitePage({ site, path, preview, fallbackBase }: { site: PublicSite | null; path: string[]; preview: boolean; fallbackBase: string }) {
  if (!site || !pageOf(site, path)) notFound();
  const base = siteBase((await headers()).get(SITE_BASE_HEADER), fallbackBase);
  return (
    <>
      {!preview && path.length === 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd(site)) }} />}
      <SiteTemplate site={site} preview={preview} path={path} base={base} />
    </>
  );
}
