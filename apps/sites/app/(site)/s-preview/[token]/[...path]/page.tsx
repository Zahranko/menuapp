import type { Metadata } from "next";
import { getPreview } from "@/lib/api";
import { SitePage } from "../../../site-page";

/** Inner pages of a Pro template's draft, so links inside the editor's preview keep working. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function PreviewInnerPage({ params }: { params: Promise<{ token: string; path: string[] }> }) {
  const { token, path } = await params;
  return <SitePage site={await getPreview(token)} path={path} preview fallbackBase={`/_preview/${encodeURIComponent(token)}`} />;
}
