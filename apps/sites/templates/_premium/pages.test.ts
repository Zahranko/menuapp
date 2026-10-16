import { describe, expect, it } from "vitest";
import { fixtureFor } from "@/lib/fixtures";
import { allPaths, bestSellers, categoryTree, resolvePage } from "./pages";

describe("Pro site pages", () => {
  const site = fixtureFor("lumen");
  const tree = categoryTree(site);

  it("nests sub-categories under their main category and counts their products", () => {
    const coffee = tree.roots.find((c) => c.name === "Coffee")!;
    expect(coffee.children.map((c) => c.name)).toEqual(["Espresso bar", "Filter", "Iced"]);
    expect(coffee.products).toEqual([]);
    expect(coffee.all).toHaveLength(6);
    expect(coffee.cover).toBeTruthy();
    expect(tree.list.indexOf(coffee)).toBeLessThan(tree.list.indexOf(coffee.children[0]));
  });

  it("resolves every listed page and rejects unknown ones", () => {
    for (const path of allPaths(site)) expect(resolvePage(site, path), path.join("/")).not.toBeNull();
    expect(resolvePage(site, ["nope"])).toBeNull();
    expect(resolvePage(site, ["c", "coffee-ffffffff"])).toBeNull();
    expect(resolvePage(site, ["menu", "extra"])).toBeNull();
  });

  it("finds a category by the end of its address, whatever the name part says", () => {
    const iced = tree.list.find((c) => c.name === "Iced")!;
    const id8 = iced.path.slice(-8);
    expect(resolvePage(site, ["c", `renamed-${id8}`])).toMatchObject({ kind: "category", category: { name: "Iced" } });
    expect(resolvePage(site, ["C", id8.toUpperCase()])).toMatchObject({ kind: "category" });
  });

  it("lists labelled best sellers before featured products", () => {
    const best = bestSellers(tree);
    const firstFeatured = best.findIndex((p) => p.label !== "Best seller");
    expect(best.slice(0, firstFeatured).every((p) => p.label === "Best seller")).toBe(true);
    expect(best.slice(firstFeatured).every((p) => p.isFeatured)).toBe(true);
  });

  it("drops a best-sellers page and a gallery that would be empty", () => {
    const bare = fixtureFor("lumen");
    bare.categories = bare.categories.map((c) => ({ ...c, products: c.products.map((p) => ({ ...p, label: null, isFeatured: false, imageUrl: null })) }));
    bare.settings = { ...bare.settings, gallery: [] };
    expect(resolvePage(bare, ["best-sellers"])).toBeNull();
    expect(resolvePage(bare, ["gallery"])).toBeNull();
  });

  it("shows a sub-category at the top when its parent is itself a sub-category", () => {
    const odd = fixtureFor("lumen");
    const [a, b, c] = odd.categories;
    odd.categories = [a, { ...b, parentId: a.id }, { ...c, parentId: b.id }];
    const t = categoryTree(odd);
    expect(t.roots.map((r) => r.id)).toContain(c.id);
  });
});
