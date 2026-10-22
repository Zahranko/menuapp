import type { Metadata } from "next";
import { PrivacyPage } from "@/components/marketing/legal";
import { MarketingShell } from "@/components/marketing/shell";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("ar", "privacy");

export default function Page() {
  return (
    <MarketingShell lang="ar" page="privacy">
      <PrivacyPage lang="ar" />
    </MarketingShell>
  );
}
