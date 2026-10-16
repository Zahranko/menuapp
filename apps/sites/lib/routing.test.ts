import { describe, expect, it } from "vitest";
import { apiBaseUrl, mainHosts, route, siteBase } from "./routing";

const main = new Set(["example.test", "www.example.test", "localhost"]);

describe("route", () => {
  it("rewrites a slug on the main host", () => {
    expect(route("example.test", "/vanillamenu", main)).toEqual({ kind: "rewrite", path: "/s/vanillamenu", base: "/vanillamenu" });
    expect(route("localhost:3000", "/VanillaMenu/menu", main)).toEqual({ kind: "rewrite", path: "/s/vanillamenu/menu", base: "/vanillamenu" });
  });

  it("serves reserved paths, the home page and files as they are", () => {
    for (const path of ["/", "/pricing", "/api/revalidate", "/_next/static/x.js", "/robots.txt", "/s/abc", "/s-preview/t"]) {
      expect(route("example.test", path, main)).toEqual({ kind: "pass" });
    }
  });

  it("serves files on custom domains too", () => {
    expect(route("shop.example.com", "/presets/counter.svg", main)).toEqual({ kind: "pass" });
    expect(route("example.test", "/samples/food/latte.svg", main)).toEqual({ kind: "pass" });
  });

  it("passes paths that cannot be slugs", () => {
    expect(route("example.test", "/ab", main)).toEqual({ kind: "pass" });
    expect(route("example.test", "/has-dash", main)).toEqual({ kind: "pass" });
  });

  it("rewrites preview links on any host", () => {
    expect(route("example.test", "/_preview/abc.def", main)).toEqual({ kind: "rewrite", path: "/s-preview/abc.def", base: "/_preview/abc.def" });
    expect(route("shop.example.com", "/_preview/abc", main)).toEqual({ kind: "rewrite", path: "/s-preview/abc", base: "/_preview/abc" });
    expect(route("example.test", "/_preview/abc/c/coffee-1234abcd", main)).toEqual({ kind: "rewrite", path: "/s-preview/abc/c/coffee-1234abcd", base: "/_preview/abc" });
  });

  it("looks up custom domains", () => {
    expect(route("Shop.Example.com", "/", main)).toEqual({ kind: "lookup-host", host: "shop.example.com", path: "" });
    expect(route("shop.example.com", "/menu", main)).toEqual({ kind: "lookup-host", host: "shop.example.com", path: "/menu" });
  });
});

describe("siteBase", () => {
  it("keeps plain paths and the empty custom-domain base", () => {
    expect(siteBase("/vanillamenu", "/x")).toBe("/vanillamenu");
    expect(siteBase("/_preview/abc.def", "/x")).toBe("/_preview/abc.def");
    expect(siteBase("", "/x")).toBe("");
  });

  it("falls back for a missing header or anything that is not a plain path", () => {
    expect(siteBase(null, "/x")).toBe("/x");
    for (const bad of ["javascript:alert(1)", "//evil.example", "/a b", "/a/b/c", "https://evil.example"]) expect(siteBase(bad, "/x")).toBe("/x");
  });
});

describe("mainHosts", () => {
  it("includes the Vercel project's own addresses", () => {
    const hosts = mainHosts({ VERCEL_PROJECT_PRODUCTION_URL: "menuapp.vercel.app", VERCEL_URL: "menuapp-abc123.vercel.app" });
    expect(hosts.has("menuapp.vercel.app")).toBe(true);
    expect(hosts.has("menuapp-abc123.vercel.app")).toBe(true);
    expect(route("menuapp.vercel.app", "/vanillamenu", hosts)).toEqual({ kind: "rewrite", path: "/s/vanillamenu", base: "/vanillamenu" });
  });
});

describe("apiBaseUrl", () => {
  it("prefers STOREFRONT_API_URL and trims the slash", () => {
    expect(apiBaseUrl({ STOREFRONT_API_URL: "https://api.example.com/", VERCEL_GIT_COMMIT_REF: "test" })).toBe("https://api.example.com");
  });

  it("uses the test server for the test branch on Vercel", () => {
    expect(apiBaseUrl({ VERCEL_GIT_COMMIT_REF: "test" })).toBe("https://alamalhosp-001-site7.itempurl.com");
  });

  it("falls back to localhost elsewhere", () => {
    expect(apiBaseUrl({})).toBe("http://localhost:5080");
  });
});
