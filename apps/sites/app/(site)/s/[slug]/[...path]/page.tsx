import type { Metadata } from "next";
import { getSiteBySlug } from "@/lib/api";
import { pageMetadata, SitePage } from "../../../site-page";

/** Inner pages of Pro templates: /<slug>/menu, /<slug>/c/<category>, /<slug>/gallery, ... */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; path: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, path } = await params;
  return pageMetadata(await getSiteBySlug(slug), path);
}

export default async function SiteInnerPage({ params }: Props) {
  const { slug, path } = await params;
  return <SitePage site={await getSiteBySlug(slug)} path={path} preview={false} fallbackBase={`/${slug}`} />;
}
