import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { getSiteBySlug } from "@/lib/api";
import { SiteDocument } from "../../site-layout";

export const metadata: Metadata = { metadataBase: new URL(`https://${brand.domain}`) };

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SiteDocument site={await getSiteBySlug(slug)}>{children}</SiteDocument>;
}
