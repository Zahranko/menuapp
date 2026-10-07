import reservedSlugs from "./reserved-slugs.generated.json";
import { brand } from "./brand";

export type Route =
  | { kind: "pass" }
  | { kind: "rewrite"; path: string }
  | { kind: "lookup-host"; host: string; path: string };

const reserved = new Set<string>([...reservedSlugs, brand.brandShortName.toLowerCase()]);

/** Hosts that serve the marketing pages and {domain}/<slug> sites. */
export function mainHosts(): Set<string> {
  const extra = (process.env.SITES_MAIN_HOSTS ?? "localhost,127.0.0.1").split(",");
  return new Set([brand.domain, `www.${brand.domain}`, ...extra].map((h) => h.trim().toLowerCase()).filter(Boolean));
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

  if (first === "_next" || first === "api" || (segments.length === 1 && first.includes("."))) {
    return { kind: "pass" };
  }

  if (first === "_preview" && segments[1]) {
    return { kind: "rewrite", path: previewPath(decodeURIComponent(segments[1])) };
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
