import reservedSlugs from "./reserved-slugs.generated.json";
import { brand } from "./brand";

export type Route =
  | { kind: "pass" }
  | { kind: "rewrite"; path: string }
  | { kind: "lookup-host"; host: string; path: string };

const reserved = new Set<string>([...reservedSlugs, brand.brandShortName.toLowerCase()]);

/**
 * Hosts that serve the marketing pages and {domain}/<slug> sites. On Vercel the project's own addresses
 * (set by Vercel) count too, so sites work at <project>.vercel.app/<slug> before the brand domain is connected.
 */
export function mainHosts(env: Record<string, string | undefined> = process.env): Set<string> {
  const extra = (env.SITES_MAIN_HOSTS ?? "localhost,127.0.0.1").split(",");
  const vercel = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_BRANCH_URL, env.VERCEL_URL].filter((h): h is string => !!h);
  return new Set([brand.domain, `www.${brand.domain}`, ...extra, ...vercel].map((h) => h.trim().toLowerCase()).filter(Boolean));
}

export const isReserved = (segment: string) => reserved.has(segment.toLowerCase());

/** Internal path that renders a site page. Slugs never contain "-", so "s-preview" can never be a slug. */
export const sitePath = (slug: string) => `/s/${slug.toLowerCase()}`;
export const previewPath = (token: string) => `/s-preview/${encodeURIComponent(token)}`;

/**
 * Decides how a request is served.
 * Main host: a reserved first segment (pricing, api, _next, ...) or a file is served as is; "/_preview/<token>" shows a draft;
 * any other first segment is a slug. Other hosts are custom domains, resolved through the API.
 */
export function route(hostHeader: string, pathname: string, main: Set<string> = mainHosts()): Route {
  const host = hostHeader.toLowerCase().split(":")[0];
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  // Preview tokens contain dots, so this comes before the file rule.
  if (first === "_preview" && segments[1]) {
    return { kind: "rewrite", path: previewPath(decodeURIComponent(segments[1])) };
  }

  // Next.js internals, the API and files (anything whose last segment has an extension) are served as they are on every host.
  const last = segments[segments.length - 1] ?? "";
  if (first === "_next" || first === "api" || last.includes(".")) {
    return { kind: "pass" };
  }

  if (main.has(host)) {
    if (!first || isReserved(first) || first === "s" || first === "s-preview" || !/^[a-z0-9]{3,30}$/i.test(first)) {
      return { kind: "pass" };
    }

    return { kind: "rewrite", path: sitePath(first) + rest(segments.slice(1)) };
  }

  return { kind: "lookup-host", host, path: rest(segments) };
}

const rest = (segments: string[]) => (segments.length ? `/${segments.join("/")}` : "");

/** The test server, used by Vercel builds of the `test` branch when STOREFRONT_API_URL is not set. */
const TEST_API_URL = "https://alamalhosp-001-site7.itempurl.com";

/** Base URL of the Storefront API, for example http://localhost:5080. */
export function apiBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const fallback = env.VERCEL_GIT_COMMIT_REF === "test" ? TEST_API_URL : "http://localhost:5080";
  return (env.STOREFRONT_API_URL || fallback).replace(/\/$/, "");
}
