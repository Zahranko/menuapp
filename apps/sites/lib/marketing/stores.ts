import brandFile from "../../../../brand.json";

/**
 * Where the store buttons go. The app is not in the stores yet, so the buttons do nothing.
 * When it is, add "appStoreUrl" and "googlePlayUrl" to brand.json at the repo root; the buttons turn into links on the next build.
 */
export type StoreLinks = { appStore: string | null; googlePlay: string | null };

type MaybeStores = { appStoreUrl?: unknown; googlePlayUrl?: unknown };

const httpsUrl = (value: unknown): string | null => (typeof value === "string" && /^https:\/\/\S+$/.test(value) ? value : null);

export function storeLinks(source: MaybeStores = brandFile as MaybeStores): StoreLinks {
  return { appStore: httpsUrl(source.appStoreUrl), googlePlay: httpsUrl(source.googlePlayUrl) };
}
