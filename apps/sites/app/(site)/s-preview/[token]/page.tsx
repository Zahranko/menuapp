import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPreview } from "@/lib/api";
import { SiteTemplate } from "@/templates/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const site = await getPreview((await params).token);
  if (!site) notFound();
  return <SiteTemplate site={site} preview />;
}
