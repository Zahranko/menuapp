import type { NextConfig } from "next";
import path from "node:path";

// The repo root, so the app can read brand.json and the template registry from outside apps/sites.
const repoRoot = path.join(__dirname, "../..");

// Hosts that serve uploaded images (the API's /media in development, the storage CDN in production).
const imageHosts = (process.env.IMAGE_HOSTS ?? "localhost")
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
    ];
  },
};

export default nextConfig;
