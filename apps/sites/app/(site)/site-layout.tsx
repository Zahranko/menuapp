import type { PublicSite } from "@/lib/types";
import "../globals.css";
import "./kit.css";

/** The document shell for a business site: language and direction come from the business locale. */
export function SiteDocument({ site, children }: { site: PublicSite | null; children: React.ReactNode }) {
  const lang = site?.business.locale === "ar" ? "ar" : "en";
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
