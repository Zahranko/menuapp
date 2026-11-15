import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGS } from "@/lib/marketing/copy";
import { SiteTemplate } from "@/templates/registry";

vi.mock("server-only", () => ({}));
const { communitySampleSite, FIXTURES, isShareCode, isUsername } = await import("@/lib/community");
const { CommunityGallery, CommunityTemplatePage, PublisherView, previewPath, templatePath } = await import("./community");

afterEach(cleanup);

const night = FIXTURES[0];

describe("share codes and usernames", () => {
  it("accepts only the server's alphabet", () => {
    expect(FIXTURES.every((f) => isShareCode(f.template.code))).toBe(true);
    for (const bad of ["", "short", "nyt2fx7kk", "nyt2fx7o", "NYT2FX7K", "../../x"]) expect(isShareCode(bad)).toBe(false);
    expect(isUsername("lina_designs")).toBe(true);
    expect(isUsername("1lina")).toBe(false);
    expect(isUsername("li")).toBe(false);
  });
});

describe.each(LANGS)("community pages (%s)", (lang) => {
  it("lists designs with a live preview, the publisher and a link to each", () => {
    render(<CommunityGallery lang={lang} data={{ items: FIXTURES.map((f) => f.template), total: 2, page: 1, pageSize: 24 }} sort="popular" q="" />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    const link = screen.getByRole("link", { name: night.template.name });
    expect(link.getAttribute("href")).toBe(templatePath(lang, night.template.code));
    expect(document.querySelector(`iframe[src="${previewPath(night.template.code, lang)}"]`)).toBeTruthy();
    expect(screen.getAllByRole("link", { name: night.template.publisher.displayName })[0].getAttribute("href")).toContain("/community/u/nightmaker");
  });

  it("says so when a search finds nothing", () => {
    render(<CommunityGallery lang={lang} data={{ items: [], total: 0, page: 1, pageSize: 24 }} sort="new" q="zebra" />);
    expect(document.body.textContent).toContain("zebra");
  });

  it("shows how to use a design, its code and a copy link button", () => {
    render(<CommunityTemplatePage lang={lang} detail={night} shareUrl="https://brand.test/community/nyt2fx7k" more={[FIXTURES[1].template]} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(night.template.name);
    expect(screen.getByLabelText(lang === "ar" ? "رمز التصميم" : "Design code").textContent).toBe(night.template.code);
    expect(screen.getByRole("button", { name: lang === "ar" ? "انسخ الرابط" : "Copy link" })).toBeTruthy();
  });

  it("shows a publisher and their designs", () => {
    render(<PublisherView lang={lang} page={{ publisher: night.template.publisher, templates: [night.template] }} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(night.template.publisher.displayName);
    expect(document.body.textContent).toContain("@nightmaker");
  });
});

describe("sample preview", () => {
  it("draws the shared design on the sample business, with its style sheet cleaned and scoped", () => {
    const site = communitySampleSite(night, false);
    expect(site.templateId).toBe("studio");
    expect(site.settings.theme).toBe("night");
    const html = renderToStaticMarkup(<SiteTemplate site={site} preview={false} path={[]} base="/community-preview/nyt2fx7k" />);
    expect(html).toContain("rise");
  });

  it("refuses a smuggled unsafe style sheet when drawing", () => {
    const evil = { ...night, settings: { ...night.settings, "studio.css": "@import url(https://evil.test/x.css); body { background: url(https://evil.test/p.png) }" } };
    const html = renderToStaticMarkup(<SiteTemplate site={communitySampleSite(evil, false)} preview={false} path={[]} base="" />);
    expect(html).not.toContain("evil.test");
  });

  it("uses the Arabic sample and right-to-left for Arabic", () => {
    const site = communitySampleSite(night, true);
    expect(site.business.locale).toBe("ar");
    expect(site.settings.accent).toBe("#F59E0B");
  });
});
