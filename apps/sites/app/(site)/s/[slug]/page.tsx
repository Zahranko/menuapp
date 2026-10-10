import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/api";
import { jsonLdScript, siteJsonLd } from "@/lib/jsonld";
import { siteMetadata } from "@/lib/seo";
import { SiteTemplate } from "@/templates/registry";

// Rendered on every visit so edits show at once. The site data itself is cached when the API
// revalidates it on change (see getSiteBySlug), so this stays cheap.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSiteBySlug((await params).slug);
  return site ? siteMetadata(site) : { title: "Not found", robots: { index: false } };
}

export default async function SitePage({ params }: Props) {
  const site = await getSiteBySlug((await params).slug);
  if (!site) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd(site)) }} />
      <SiteTemplate site={site} preview={false} />
    </>
  );
}
