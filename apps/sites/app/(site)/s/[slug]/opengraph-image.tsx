import { ImageResponse } from "next/og";
import { getSiteBySlug } from "@/lib/api";
import { text } from "@/lib/settings";
import { accentTokens } from "@/templates/_kit/color";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Preview of the menu website";
export const revalidate = 3600;

/** Share picture: the business name and headline on the site's colors. */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getSiteBySlug((await params).slug);
  const name = site?.business.name ?? "";
  const headline = site ? text(site.settings, "hero.title") : "";
  const dark = site?.settings.theme === "night";
  const bg = dark ? "#121714" : "#FBF7EE";
  const ink = dark ? "#F2EFE6" : "#1E1A14";
  const accent = accentTokens(site ? text(site.settings, "accent", "#D9542C") : "#D9542C", bg, bg, ink);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: bg, color: ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, background: accent.fill, color: accent.onFill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 700 }}>
            {name.trim()[0]?.toUpperCase() ?? ""}
          </div>
          <div style={{ fontSize: 48, fontWeight: 700 }}>{name}</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>{headline || name}</div>
        <div style={{ height: 14, width: 220, background: accent.fill, borderRadius: 7 }} />
      </div>
    ),
    size,
  );
}
