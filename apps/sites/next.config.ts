import type { NextConfig } from "next";
import path from "node:path";

// The repo root, so the app can read brand.json (and later the shared reserved slugs) from outside apps/sites.
const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
