import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl, route, SITE_BASE_HEADER, sitePath } from "./lib/routing";

const HOST_TTL_MS = 60_000;
const HOST_CACHE_MAX = 2_000;
const hostCache = new Map<string, { slug: string | null; until: number }>();
const HOSTNAME = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Custom domain → slug, cached for 60 seconds per server process. Made-up Host headers are never looked up. */
async function slugForHost(host: string): Promise<string | null> {
  if (!HOSTNAME.test(host)) return null;
  const cached = hostCache.get(host);
  if (cached && cached.until > Date.now()) return cached.slug;

  let slug: string | null = null;
  if (process.env.APP_FIXTURES === "1") {
    slug = host === "vanillamenu.example.com" ? "vanillamenu" : null;
  } else {
    const api = apiBaseUrl();
    const response = await fetch(`${api}/api/public/v1/sites/by-host/${encodeURIComponent(host)}`, { cache: "no-store" });
    if (response.ok) slug = ((await response.json()) as { business: { slug: string } }).business.slug;
    else if (response.status !== 404) throw new Error(`by-host lookup failed with ${response.status}`);
  }

  // Bounded, so a flood of different Host headers can't grow memory: the oldest entry goes first.
  if (hostCache.size >= HOST_CACHE_MAX) hostCache.delete(hostCache.keys().next().value!);
  hostCache.set(host, { slug, until: Date.now() + HOST_TTL_MS });
  return slug;
}

/** Rewrites to `path` and tells the page where the site's home page is, so its links work on every kind of address. */
function rewrite(request: NextRequest, path: string, base: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  const headers = new Headers(request.headers);
  headers.set(SITE_BASE_HEADER, base);
  return NextResponse.rewrite(url, { request: { headers } });
}

export async function proxy(request: NextRequest) {
  const decision = route(request.headers.get("host") ?? "", request.nextUrl.pathname);
  if (decision.kind === "pass") {
    // Only the proxy sets the site base; drop one sent by the visitor.
    if (!request.headers.has(SITE_BASE_HEADER)) return NextResponse.next();
    const headers = new Headers(request.headers);
    headers.delete(SITE_BASE_HEADER);
    return NextResponse.next({ request: { headers } });
  }

  if (decision.kind === "rewrite") return rewrite(request, decision.path, decision.base);

  const slug = await slugForHost(decision.host);
  const response = rewrite(request, slug ? sitePath(slug) + decision.path : "/unknown-site", "");
  response.headers.set("x-site-host", decision.host);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
