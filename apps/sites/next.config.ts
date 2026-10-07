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
};

export default nextConfig;
