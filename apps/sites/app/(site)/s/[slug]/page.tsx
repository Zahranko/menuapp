import type { Metadata } from "next";
import { getSiteBySlug } from "@/lib/api";
import { pageMetadata, SitePage } from "../../site-page";

// Rendered on every visit so edits show at once. The site data itself is cached when the API
// revalidates it on change (see getSiteBySlug), so this stays cheap.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata(await getSiteBySlug((await params).slug), []);
}

export default async function SiteHome({ params }: Props) {
  const { slug } = await params;
  return <SitePage site={await getSiteBySlug(slug)} path={[]} preview={false} fallbackBase={`/${slug}`} />;
}
