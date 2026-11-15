import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/lib/brand";
import { communitySampleSite, getCommunityTemplate } from "@/lib/community";
import { SiteDocument } from "../../../site-layout";

export const metadata: Metadata = { metadataBase: new URL(`https://${brand.domain}`), robots: { index: false, follow: false } };

type Params = Promise<{ code: string; lang?: string[] }>;

/** "/community-preview/<code>" (English sample) and "/community-preview/<code>/ar" (Arabic sample, right to left). */
export default async function CommunityPreviewLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { code, lang } = await params;
  const detail = await getCommunityTemplate(code);
  if (!detail || (lang && (lang.length > 1 || lang[0] !== "ar"))) notFound();
  return <SiteDocument site={communitySampleSite(detail, lang?.[0] === "ar")}>{children}</SiteDocument>;
}
