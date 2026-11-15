import "server-only";
import type { components } from "./api-types";
import { arabicDefaultsFor, fixtureFor, sampleFor } from "./fixtures";
import { apiBaseUrl } from "./routing";
import type { PublicSite, Settings } from "./types";

type Schemas = components["schemas"];
/** The API's types with whole numbers as numbers (the OpenAPI document also allows them as strings). */
export type CommunityCard = Omit<Schemas["CommunityTemplateDto"], "uses"> & { uses: number };
export type CommunityPage = { items: CommunityCard[]; total: number; page: number; pageSize: number };
export type CommunityDetail = { template: CommunityCard; settings: Settings };
export type PublisherPage = { publisher: Schemas["PublisherDto"]; templates: CommunityCard[] };

const card = (c: Schemas["CommunityTemplateDto"]): CommunityCard => ({ ...c, uses: Number(c.uses) });
export type CommunitySort = "popular" | "new";

/** Share codes: 8 letters and digits without look-alikes (CommunityTemplate.NewCode on the server). */
export const isShareCode = (code: string) => /^[a-hjkmnp-z2-9]{8}$/.test(code);
export const isUsername = (name: string) => /^[a-z][a-z0-9_]{2,19}$/.test(name);

const fixturesOn = () => process.env.APP_FIXTURES === "1";

/** The gallery changes often but not by the second; a minute of caching keeps the API calm. */
async function read<T>(path: string): Promise<T | null> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { headers: { accept: "application/json" }, next: { revalidate: 60 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Storefront API ${path} returned ${response.status}`);
  return (await response.json()) as T;
}

export async function browseCommunity(sort: CommunitySort, q: string, page: number): Promise<CommunityPage> {
  if (fixturesOn()) return fixtureBrowse(sort, q, page);
  const query = new URLSearchParams({ sort, page: String(page) });
  if (q) query.set("q", q);
  const data = await read<Schemas["CommunityPage"]>(`/api/public/v1/community/templates?${query}`);
  if (!data) return { items: [], total: 0, page, pageSize: 24 };
  return { items: data.items.map(card), total: Number(data.total), page: Number(data.page), pageSize: Number(data.pageSize) };
}

export async function getCommunityTemplate(code: string): Promise<CommunityDetail | null> {
  const key = code.toLowerCase();
  if (!isShareCode(key)) return null;
  if (fixturesOn()) return FIXTURES.find((f) => f.template.code === key) ?? null;
  const data = await read<Schemas["CommunityTemplateDetailDto"]>(`/api/public/v1/community/templates/${encodeURIComponent(key)}`);
  return data && { template: card(data.template), settings: data.settings as Settings };
}

export async function getPublisherPage(username: string): Promise<PublisherPage | null> {
  const key = username.toLowerCase().replace(/^@/, "");
  if (!isUsername(key)) return null;
  if (fixturesOn()) {
    const templates = FIXTURES.filter((f) => f.template.publisher.username === key).map((f) => f.template);
    return templates.length ? { publisher: templates[0].publisher, templates } : null;
  }
  const data = await read<Schemas["PublisherPageDto"]>(`/api/public/v1/community/publishers/${encodeURIComponent(key)}`);
  return data && { publisher: data.publisher, templates: data.templates.map(card) };
}

/**
 * A community design drawn on its base template's sample business, in English or Arabic. Only the design comes from the
 * publisher; the business, its menu and texts are the sample's, and the style sheet is cleaned again when the page draws it.
 */
export function communitySampleSite(detail: CommunityDetail, arabic: boolean): PublicSite {
  const templateId = detail.template.baseTemplateId;
  const site = fixtureFor(templateId, { isPreview: false }, sampleFor(templateId), arabic);
  if (arabic) site.business = { ...site.business, locale: "ar" };
  site.settings = { ...site.settings, ...(arabic ? arabicDefaultsFor(templateId) : {}), ...detail.settings };
  return site;
}

// Fixture mode (APP_FIXTURES=1): two sample community designs on the Studio template, for development and the e2e checks.
const publisher = (username: string, displayName: string): CommunityCard["publisher"] => ({
  username,
  displayName,
  bio: "Calm designs for cafés.",
  createdAt: "2026-11-01T00:00:00Z",
  url: `/community/u/${username}`,
});

function fixture(code: string, name: string, description: string, uses: number, colors: string[], by: CommunityCard["publisher"], settings: Settings): CommunityDetail {
  return {
    template: {
      code,
      name,
      description,
      baseTemplateId: "studio",
      isPro: true,
      publisher: by,
      colors,
      uses,
      createdAt: "2026-11-10T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
      shareUrl: `/community/${code}`,
      previewUrl: `/community-preview/${code}`,
    },
    settings,
  };
}

const maker = publisher("nightmaker", "Night Maker");
export const FIXTURES: CommunityDetail[] = [
  fixture("nyt2fx7k", "Night shift", "Dark, amber and quiet, with titles that rise in.", 42, ["#111827", "#F59E0B"], maker, {
    font: "mono",
    theme: "night",
    accent: "#F59E0B",
    "style.tracking": "wide",
    "header.layout": "centered",
    "hero.variant": "ring",
    "menu.layout": "compact",
    "studio.css": "@keyframes rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } } h1, h2 { animation: rise .7s ease both }",
  }),
  fixture("snd4kq9m", "Warm sand", "Soft sand colors and airy spacing for bakeries.", 7, ["#F1E6D2", "#C2410C"], publisher("sandstudio", "Sand Studio"), {
    font: "elegant",
    theme: "sand",
    accent: "#C2410C",
    "style.spacing": "airy",
    "header.layout": "centered",
    "hero.variant": "ring",
    "menu.layout": "canvas",
  }),
];

function fixtureBrowse(sort: CommunitySort, q: string, page: number): CommunityPage {
  const text = q.trim().toLowerCase();
  const items = FIXTURES.map((f) => f.template)
    .filter((t) => !text || t.name.toLowerCase().includes(text))
    .sort((a, b) => (sort === "new" ? b.createdAt.localeCompare(a.createdAt) : b.uses - a.uses));
  return { items: page === 1 ? items : [], total: items.length, page, pageSize: 24 };
}
