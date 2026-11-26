import type { NextConfig } from "next";
import path from "node:path";

// The repo root, so the app can read brand.json and the template registry from outside apps/sites.
const repoRoot = path.join(__dirname, "../..");

// Hosts that serve uploaded images (the API's /media in development, the storage CDN in production).
// Only development falls back to localhost: in production the image optimizer fetches from the hosts in IMAGE_HOSTS and nowhere else.
const imageHosts = (process.env.IMAGE_HOSTS ?? (process.env.NODE_ENV === "production" ? "" : "localhost"))
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  output: "standalone",
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ hostname })),
  },
  // Every site shares this origin, so pages may not be framed elsewhere or have their file types guessed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
      // Template stylesheets carry a content hash in their name (scripts/build-styles.mjs), so browsers can keep them for good.
      // Next.js serves public files with max-age=0, which made every visit re-check the stylesheet before showing the page.
      {
        source: "/styles/:file([^/]+\\.css)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Preset pictures, sample photos and editor previews keep their names when they change, so a day, then refreshed in the background.
      // Files only (a name with an extension); those folder names are also reserved slugs, so no site page lives there.
      ...["presets", "samples", "kit", "templates", "marketing"].map((folder) => ({
        source: `/${folder}/:file(.+\\.[a-zA-Z0-9]+)`,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      })),
    ];
  },
};

export default nextConfig;
