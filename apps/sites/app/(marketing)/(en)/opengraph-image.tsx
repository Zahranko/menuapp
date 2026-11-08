import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { copy, fill } from "@/lib/marketing/copy";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Create your website from your phone";

/** Share picture of the marketing pages (both languages use it): the mark, the brand name and the hero line on the brand colors. */
export default function OpenGraphImage() {
  const h = copy("en").hero;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: brand.colorPrimary, color: brand.colorPaper }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg viewBox="0 0 100 100" width={96} height={96}>
            <rect width="100" height="100" rx="26" fill={brand.colorPaper} />
            <path d="M38 28V72 M64 28 L42 50 L66 72" fill="none" stroke={brand.colorPrimary} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="74" cy="30" r="9" fill={brand.colorAccent} />
          </svg>
          <div style={{ fontSize: 52, fontWeight: 700 }}>{brand.brandName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
          <span>{h.titleStart}</span>
          <span style={{ color: brand.colorAccent }}>{h.titleMark}.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30, color: brand.colorLine }}>
          <div style={{ width: 120, height: 12, borderRadius: 6, background: brand.colorHighlight }} />
          {fill("{domain}", "en")}
        </div>
      </div>
    ),
    size,
  );
}
