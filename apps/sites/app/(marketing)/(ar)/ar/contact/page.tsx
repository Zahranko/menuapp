import type { Metadata } from "next";
import { ContactPage } from "@/components/marketing/legal";
import { MarketingShell } from "@/components/marketing/shell";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("ar", "contact");

export default function Page() {
  return (
    <MarketingShell lang="ar" page="contact">
      <ContactPage lang="ar" />
    </MarketingShell>
  );
}
