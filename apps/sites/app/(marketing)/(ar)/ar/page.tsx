import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home";
import { MarketingShell } from "@/components/marketing/shell";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("ar", "home");

export default function Page() {
  return (
    <MarketingShell lang="ar" page="home">
      <HomePage lang="ar" />
    </MarketingShell>
  );
}
