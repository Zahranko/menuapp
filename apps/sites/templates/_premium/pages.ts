import { image, list } from "@/lib/settings";
import type { PublicSite } from "@/lib/types";
import { menuItem, type MenuItem } from "../_kit/site-data";
import { copyFor } from "./copy";

/*
 * The pages of a Pro (multi-page) site and the category tree they are built from.
 * Pure functions: the route handlers use them to answer 404s and page titles, the templates to render.
 *
 * Addresses, after the site's home page:
 *   /menu               every category and product
 *   /c/<name>-<id8>     a category: its sub-categories, then its own products
 *   /best-sellers       products labelled "Best seller" or featured
 *   /gallery            the owner's gallery and product photos
 *   /visit              about, hours and contact
 */

export type Category = {
  id: string;
  name: string;
  /** Address after the site's home, for example "/c/coffee-0000a1b2". */
  path: string;
  parent: Category | null;
  children: Category[];
  /** The category's own products. */
  products: MenuItem[];
  /** Its own products, then its sub-categories' products. */
  all: MenuItem[];
  /** First product photo in the category or its sub-categories. */
  cover: string | null;
};

export type Tree = {
  /** Top-level categories that have products (their own or in sub-categories), in menu order. */
  roots: Category[];
  /** Every category with products, parents before their children. */
  list: Category[];
  items: MenuItem[];
};

/** ASCII part of a category address; Arabic names keep only the id part. */
const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const shortId = (id: string) => id.replace(/-/g, "").slice(-8).toLowerCase();

export function categoryTree(site: PublicSite): Tree {
  const byId = new Map<string, Category>();
  for (const c of site.categories) {
    const slug = slugify(c.name);
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      path: `/c/${slug ? `${slug}-` : ""}${shortId(c.id)}`,
      parent: null,
      children: [],
      products: c.products.map((p) => menuItem(site, c, p)),
      all: [],
      cover: null,
    });
  }
  const top: Category[] = [];
  for (const c of site.categories) {
    const node = byId.get(c.id)!;
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    // One level only: a child of a child, or a missing parent, shows at the top.
    if (parent && parent !== node && !site.categories.find((x) => x.id === parent.id)?.parentId) {
      node.parent = parent;
      parent.children.push(node);
    } else top.push(node);
  }
  const fill = (c: Category) => {
    c.children = c.children.filter((child) => (fill(child), child.all.length > 0));
    c.all = [...c.products, ...c.children.flatMap((child) => child.all)];
    c.cover = c.all.find((p) => p.imageUrl)?.imageUrl ?? null;
  };
  top.forEach(fill);
  const roots = top.filter((c) => c.all.length > 0);
  const flat = roots.flatMap((c) => [c, ...c.children]);
  return { roots, list: flat, items: roots.flatMap((c) => c.all) };
}

/** Best sellers: labelled "Best seller" first, then featured, at most `max`. */
export function bestSellers(tree: Tree, max = 24): MenuItem[] {
  const labelled = tree.items.filter((p) => p.label === "Best seller");
  const picks = tree.items.filter((p) => p.isFeatured && p.label !== "Best seller");
  return [...labelled, ...picks].slice(0, max);
}

/** The owner's gallery photos, then (when switched on) product photos, without repeats. */
export function galleryPhotos(site: PublicSite, tree: Tree): { src: string; caption: string | null }[] {
  const own = list(site.settings, "gallery")
    .map((v) => image(v))
    .filter((v): v is string => !!v)
    .map((src) => ({ src, caption: null as string | null }));
  const withProducts = site.settings["gallery.products"] !== false;
  const products = withProducts ? tree.items.filter((p) => p.imageUrl).map((p) => ({ src: p.imageUrl!, caption: p.name })) : [];
  const seen = new Set<string>();
  return [...own, ...products].filter((p) => (seen.has(p.src) ? false : (seen.add(p.src), true))).slice(0, 48);
}

export type Page =
  | { kind: "home" }
  | { kind: "menu" }
  | { kind: "category"; category: Category }
  | { kind: "best" }
  | { kind: "gallery" }
  | { kind: "visit" };

export const PAGE_PATHS = { menu: "/menu", best: "/best-sellers", gallery: "/gallery", visit: "/visit" } as const;

/** The page at `path`, or null when it does not exist (a 404). */
export function resolvePage(site: PublicSite, path: string[], tree: Tree = categoryTree(site)): Page | null {
  const [first, second, ...more] = path.map((s) => decodeURIComponent(s).toLowerCase());
  if (!first) return { kind: "home" };
  if (more.length) return null;
  if (first === "c" && second) {
    const id = second.slice(-8);
    const category = tree.list.find((c) => shortId(c.id) === id);
    return category ? { kind: "category", category } : null;
  }
  if (second) return null;
  if (first === "menu") return { kind: "menu" };
  if (first === "best-sellers") return bestSellers(tree).length ? { kind: "best" } : null;
  if (first === "gallery") return galleryPhotos(site, tree).length ? { kind: "gallery" } : null;
  if (first === "visit") return { kind: "visit" };
  return null;
}

/** Every page address of a site (for tests and the sitemap). */
export function allPaths(site: PublicSite): string[][] {
  const tree = categoryTree(site);
  const paths = [[], ["menu"], ["visit"], ...tree.list.map((c) => c.path.slice(1).split("/"))];
  if (bestSellers(tree).length) paths.push(["best-sellers"]);
  if (galleryPhotos(site, tree).length) paths.push(["gallery"]);
  return paths;
}

/** Browser tab title for a page: "Coffee · Vanilla Menu". Null on the home page. */
export function pageTitle(site: PublicSite, page: Page): string | null {
  const c = copyFor(site.business.locale);
  const name = site.business.name;
  switch (page.kind) {
    case "home":
      return null;
    case "category":
      return `${page.category.parent ? `${page.category.name} · ${page.category.parent.name}` : page.category.name} · ${name}`;
    case "menu":
      return `${c.menu} · ${name}`;
    case "best":
      return `${c.best} · ${name}`;
    case "gallery":
      return `${c.gallery} · ${name}`;
    case "visit":
      return `${c.visit} · ${name}`;
  }
}
