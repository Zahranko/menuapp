import { NextResponse, type NextRequest } from "next/server";
import { route, sitePath } from "./lib/routing";

const HOST_TTL_MS = 60_000;
const hostCache = new Map<string, { slug: string | null; until: number }>();

/** Custom domain → slug, cached for 60 seconds per server process. */
async function slugForHost(host: string): Promise<string | null> {
  const cached = hostCache.get(host);
  if (cached && cached.until > Date.now()) return cached.slug;

  let slug: string | null = null;
  if (process.env.APP_FIXTURES === "1") {
    slug = host === "vanillamenu.example.com" ? "vanillamenu" : null;
  } else {
    const api = (process.env.STOREFRONT_API_URL ?? "http://localhost:5080").replace(/\/$/, "");
    const response = await fetch(`${api}/api/public/v1/sites/by-host/${encodeURIComponent(host)}`, { cache: "no-store" });
    if (response.ok) slug = ((await response.json()) as { business: { slug: string } }).business.slug;
    else if (response.status !== 404) throw new Error(`by-host lookup failed with ${response.status}`);
  }

  hostCache.set(host, { slug, until: Date.now() + HOST_TTL_MS });
  return slug;
}

export async function proxy(request: NextRequest) {
  const decision = route(request.headers.get("host") ?? "", request.nextUrl.pathname);
  if (decision.kind === "pass") return NextResponse.next();

  const url = request.nextUrl.clone();
  if (decision.kind === "rewrite") {
    url.pathname = decision.path;
    return NextResponse.rewrite(url);
  }

  const slug = await slugForHost(decision.host);
  url.pathname = slug ? sitePath(slug) + decision.path : "/unknown-site";
  const response = NextResponse.rewrite(url);
  response.headers.set("x-site-host", decision.host);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
