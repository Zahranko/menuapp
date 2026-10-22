import type { Metadata, Viewport } from "next";
import { arabicFont } from "@/components/marketing/fonts-arabic";
import { MarketingDocument } from "@/components/marketing/shell";
import { brand } from "@/lib/brand";
import "../../../globals.css";
import "@/components/marketing/marketing.css";

export const metadata: Metadata = { metadataBase: new URL(`https://${brand.domain}`) };
export const viewport: Viewport = { themeColor: brand.colorPaper };

/** Root layout of the Arabic marketing pages ("/ar", "/ar/privacy", "/ar/contact"): lang="ar", right to left, the Arabic brand font. */
export default function ArabicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MarketingDocument lang="ar" fontClassName={arabicFont.variable}>
      {children}
    </MarketingDocument>
  );
}
