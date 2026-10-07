import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/api";
import { siteMetadata } from "@/lib/seo";
import { SiteTemplate } from "@/templates/registry";

// Pages are rendered on first visit and cached until the API revalidates the site's tag.
export const dynamicParams = true;
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSiteBySlug((await params).slug);
  return site ? siteMetadata(site) : { title: "Not found", robots: { index: false } };
}

export default async function SitePage({ params }: Props) {
  const site = await getSiteBySlug((await params).slug);
  if (!site) notFound();
  return <SiteTemplate site={site} preview={false} />;
}
