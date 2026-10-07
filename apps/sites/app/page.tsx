import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <main style={{ padding: "4rem 1.5rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>{brand.brandName}</h1>
      <p>{brand.tagline}</p>
    </main>
  );
}
