import "server-only";
import { fixtureBySlug, fixturePreview, fixtureSite } from "./fixtures";
import { apiBaseUrl } from "./routing";
import type { PublicSite } from "./types";

const apiUrl = () => apiBaseUrl();
const fixturesOn = () => process.env.APP_FIXTURES === "1";

export const siteTag = (slug: string) => `site:${slug.toLowerCase()}`;
export const hostTag = (host: string) => `host:${host.toLowerCase()}`;

function normalize(site: PublicSite): PublicSite {
  return {
    ...site,
    categories: site.categories.map((c) => ({
      ...c,
      products: c.products.map((p) => ({ ...p, price: Number(p.price) })),
    })),
  };
}

async function read(path: string, init: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } }) {
  const response = await fetch(`${apiUrl()}${path}`, { ...init, headers: { accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Storefront API ${path} returned ${response.status}`);
  return normalize((await response.json()) as PublicSite);
}

/** A published site. Cached until the API revalidates the "site:<slug>" tag (and at most an hour). */
export async function getSiteBySlug(slug: string): Promise<PublicSite | null> {
  const key = slug.toLowerCase();
  if (fixturesOn()) return fixtureBySlug(key);
  return read(`/api/public/v1/sites/by-slug/${encodeURIComponent(key)}`, {
    next: { tags: [siteTag(key)], revalidate: 3600 },
  });
}

/** A published site by custom domain. */
export async function getSiteByHost(host: string): Promise<PublicSite | null> {
  const key = host.toLowerCase();
  if (fixturesOn()) return fixtureSite.business.customDomains.includes(key) ? fixtureSite : null;
  return read(`/api/public/v1/sites/by-host/${encodeURIComponent(key)}`, {
    next: { tags: [hostTag(key)], revalidate: 60 },
  });
}

/** The draft behind a preview token. Never cached. */
export async function getPreview(token: string): Promise<PublicSite | null> {
  if (fixturesOn()) return fixturePreview(token);
  return read(`/api/public/v1/preview/${encodeURIComponent(token)}`, { cache: "no-store" });
}
