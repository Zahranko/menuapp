import { getPreview } from "@/lib/api";
import { SiteDocument } from "../../site-layout";

export default async function PreviewLayout({ children, params }: { children: React.ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SiteDocument site={await getPreview(token)}>{children}</SiteDocument>;
}
