import type { Metadata } from "next";
import { getPreview } from "@/lib/api";
import { SitePage } from "../../site-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SitePage site={await getPreview(token)} path={[]} preview fallbackBase={`/_preview/${encodeURIComponent(token)}`} />;
}
