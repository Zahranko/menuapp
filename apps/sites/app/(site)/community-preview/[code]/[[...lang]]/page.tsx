import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { communitySampleSite, getCommunityTemplate } from "@/lib/community";
import { SiteTemplate } from "@/templates/registry";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * A community design on the sample business, shown in the share page and in the app before an owner applies it.
 * Links inside the sample stay on this page ("#" base), since the sample has no address of its own.
 */
export default async function CommunityPreviewPage({ params }: { params: Promise<{ code: string; lang?: string[] }> }) {
  const { code, lang } = await params;
  const detail = await getCommunityTemplate(code);
  if (!detail) notFound();
  return <SiteTemplate site={communitySampleSite(detail, lang?.[0] === "ar")} preview={false} path={[]} base={`/community-preview/${detail.template.code}`} />;
}
