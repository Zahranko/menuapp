import type { Metadata, Viewport } from "next";
import { bodyFont, displayFont } from "@/components/marketing/fonts";
import { MarketingDocument } from "@/components/marketing/shell";
import { brand } from "@/lib/brand";
import "../../globals.css";
import "@/components/marketing/marketing.css";

export const metadata: Metadata = { metadataBase: new URL(`https://${brand.domain}`) };
export const viewport: Viewport = { themeColor: brand.colorPaper };

/** Root layout of the English marketing pages ("/", "/privacy", "/contact"). Arabic ones live under (ar)/ar. */
export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MarketingDocument lang="en" fontClassName={`${displayFont.variable} ${bodyFont.variable}`}>
      {children}
    </MarketingDocument>
  );
}
