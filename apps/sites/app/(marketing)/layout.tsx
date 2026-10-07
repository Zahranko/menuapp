import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${brand.domain}`),
  title: brand.brandName,
  description: brand.tagline,
};

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
