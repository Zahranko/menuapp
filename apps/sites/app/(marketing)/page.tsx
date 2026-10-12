import { LogoMark } from "@/components/brand/logo-mark";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <main style={{ padding: "4rem 1.5rem", maxWidth: 640, margin: "0 auto", color: brand.colorInk }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.45em", margin: 0, fontSize: "2.5rem", letterSpacing: "-0.02em" }}>
        <LogoMark size="1.5em" />
        {brand.brandName}
      </h1>
      <p style={{ color: brand.colorMuted, fontSize: "1.125rem" }}>{brand.tagline}</p>
    </main>
  );
}
