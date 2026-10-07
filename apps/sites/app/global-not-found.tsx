import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="nf">
        <main>
          <p className="nf-code">404</p>
          <h1>We couldn’t find that page</h1>
          <p>The link may be mistyped, or this menu has moved.</p>
          <a href={`https://${brand.domain}`}>Go to {brand.brandName}</a>
        </main>
      </body>
    </html>
  );
}
