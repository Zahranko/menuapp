import { getSiteBySlug } from "@/lib/api";
import { SiteDocument } from "../../site-layout";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SiteDocument site={await getSiteBySlug(slug)}>{children}</SiteDocument>;
}
