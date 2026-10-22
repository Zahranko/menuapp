import { render, screen, within, cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { LANGS, type Lang } from "@/lib/marketing/copy";
import { HomePage } from "./home";
import { ContactPage, PrivacyPage } from "./legal";
import { MarketingDocument, MarketingShell } from "./shell";
import { StoreButtons } from "./store-buttons";

afterEach(cleanup);

const page = (lang: Lang, which: "home" | "privacy" | "contact") => (
  <MarketingShell lang={lang} page={which}>
    {which === "home" ? <HomePage lang={lang} /> : which === "privacy" ? <PrivacyPage lang={lang} /> : <ContactPage lang={lang} />}
  </MarketingShell>
);

describe("marketing document", () => {
  it("sets language and direction", () => {
    expect(renderToStaticMarkup(<MarketingDocument lang="en" fontClassName="">x</MarketingDocument>)).toMatch(/<html lang="en" dir="ltr"/);
    expect(renderToStaticMarkup(<MarketingDocument lang="ar" fontClassName="">x</MarketingDocument>)).toMatch(/<html lang="ar" dir="rtl"/);
  });

  it("takes its colors from brand.json", () => {
    const html = renderToStaticMarkup(<MarketingDocument lang="en" fontClassName="">x</MarketingDocument>);
    expect(html).toContain(`--mk-primary:${brand.colorPrimary}`);
    expect(html).toContain(`--mk-accent:${brand.colorAccent}`);
  });
});

describe.each(LANGS)("home page (%s)", (lang) => {
  it("shows the headline, both phones and the brand name", () => {
    render(page(lang, "home"));
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain(lang === "ar" ? "أنشئ موقعك من هاتفك" : "Create your website from your phone");
    const srcs = [...document.querySelectorAll("img")].map((img) => decodeURIComponent(img.getAttribute("src") ?? ""));
    expect(srcs.some((s) => s.includes(`products-${lang}.webp`))).toBe(true);
    expect(srcs.some((s) => s.includes(`site-${lang}.webp`))).toBe(true);
    expect(document.body.textContent).toContain(lang === "ar" ? brand.brandNameAr : brand.brandName);
  });

  it("has inert App Store and Google Play buttons", () => {
    render(page(lang, "home"));
    for (const store of ["app-store", "google-play"]) {
      const buttons = document.querySelectorAll(`[data-store="${store}"]`);
      expect(buttons.length).toBeGreaterThan(0);
      for (const b of buttons) {
        expect(b.tagName).toBe("BUTTON");
        expect(b.getAttribute("aria-disabled")).toBe("true");
        expect(b.getAttribute("href")).toBeNull();
      }
    }
  });

  it("shows both plans with their prices", () => {
    render(page(lang, "home"));
    const plans = document.querySelectorAll("[data-plan]");
    expect([...plans].map((p) => p.getAttribute("data-plan"))).toEqual(["basic", "pro"]);
    expect(plans[0].textContent).toContain(lang === "ar" ? "5$" : "$5");
    expect(plans[1].textContent).toContain(lang === "ar" ? "10$" : "$10");
    expect(plans[0].textContent).toContain(`${brand.domain}/yourname`);
  });

  it("links to the same page in the other language", () => {
    render(page(lang, "home"));
    const switches = document.querySelectorAll("[data-lang-switch]");
    expect(switches.length).toBe(2);
    for (const s of switches) expect(s.getAttribute("href")).toBe(lang === "ar" ? "/" : "/ar");
  });

  it("has no unfilled placeholders", () => {
    render(page(lang, "home"));
    expect(document.body.textContent).not.toMatch(/\{(brandName|domain|email)\}/);
  });
});

describe.each(LANGS)("privacy page (%s)", (lang) => {
  it("names the support email, Gemini and the last update", () => {
    render(page(lang, "privacy"));
    const main = screen.getByRole("main");
    expect(within(main).getAllByRole("link", { name: brand.supportEmail })[0].getAttribute("href")).toBe(`mailto:${brand.supportEmail}`);
    expect(main.textContent).toContain("Gemini");
    expect(main.querySelector("time")?.getAttribute("datetime")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(main.textContent).not.toMatch(/\{(brandName|domain|email|date)\}/);
  });

  it("lists every section in its table of contents", () => {
    render(page(lang, "privacy"));
    const toc = screen.getByRole("navigation", { name: lang === "ar" ? "في هذه الصفحة" : "On this page" });
    for (const link of within(toc).getAllByRole("link")) expect(document.querySelector(link.getAttribute("href")!)).not.toBeNull();
  });
});

describe.each(LANGS)("contact page (%s)", (lang) => {
  it("offers the support email as a mailto link", () => {
    render(page(lang, "contact"));
    const main = screen.getByRole("main");
    const link = main.querySelector(`a[href="mailto:${brand.supportEmail}"]`);
    expect(link?.textContent).toContain(brand.supportEmail);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(lang === "ar" ? "نحن هنا لمساعدتك" : "We're here to help");
  });

  it("links the footer to privacy and contact in the same language", () => {
    render(page(lang, "contact"));
    const prefix = lang === "ar" ? "/ar" : "";
    const footer = screen.getByRole("contentinfo");
    expect(footer.querySelector(`a[href="${prefix}/privacy"]`)).not.toBeNull();
    expect(footer.querySelector(`a[href="${prefix}/contact"]`)?.getAttribute("aria-current")).toBe("page");
  });
});

describe("store buttons", () => {
  it("become links once store addresses are configured", () => {
    render(<StoreButtons lang="en" links={{ appStore: "https://apps.example/app", googlePlay: "https://play.example/app" }} />);
    expect(document.querySelector('[data-store="app-store"]')?.getAttribute("href")).toBe("https://apps.example/app");
    expect(document.querySelector('[data-store="google-play"]')?.tagName).toBe("A");
    expect(document.body.textContent).not.toContain("Coming soon");
  });
});
