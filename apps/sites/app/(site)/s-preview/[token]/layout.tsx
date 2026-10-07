import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { getPreview } from "@/lib/api";
import { SiteDocument } from "../../site-layout";

export const metadata: Metadata = { metadataBase: new URL(`https://${brand.domain}`) };

export default async function PreviewLayout({ children, params }: { children: React.ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SiteDocument site={await getPreview(token)}>{children}</SiteDocument>;
}
