import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fixtureFor, fixtureLogoSettings } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { templates } from "./registry";

/** The owner's logo options (frame, size, position, show name) on every template: see templates/_kit/logo.ts. */

const ids = Object.keys(templates);

function render(site: PublicSite): Document {
  const Template = templates[site.templateId];
  const html = renderToStaticMarkup(<Template site={site} preview={false} path={[]} base="/x" />);
  return new DOMParser().parseFromString(html, "text/html");
}

/** The sample site with logo options from the fixture shorthand ("logo-bare-s180-center-noname"). */
function siteWith(id: string, options: string): PublicSite {
  const site = fixtureFor(id);
  site.settings = { ...site.settings, ...fixtureLogoSettings(options, site.business.slug) };
  return site;
}

const root = (doc: Document, id: string) => doc.querySelector(`[data-template="${id}"]`)!;
const header = (doc: Document) => doc.querySelector('[data-section="header"]')!;

describe.each(ids)("logo options in template %s", (id) => {
  it("adds nothing with the default options, with or without a logo", () => {
    for (const options of ["", "logo"]) {
      const el = root(render(siteWith(id, options)), id);
      for (const attr of ["data-logo-frame", "data-logo-size", "data-logo-pos", "data-logo-name"]) expect(el.hasAttribute(attr), `${options} ${attr}`).toBe(false);
      expect(el.querySelector(".kit-logo-bare")).toBeNull();
    }
  });

  it("shows the logo without its frame, at its own proportions", () => {
    const doc = render(siteWith(id, "logo-bare"));
    expect(root(doc, id).getAttribute("data-logo-frame")).toBe("off");
    const logo = header(doc).querySelector(".kit-logo.kit-logo-bare");
    expect(logo).not.toBeNull();
    const img = logo!.querySelector("img")!;
    expect(img.getAttribute("src")).toContain("fixture-logo.invalid");
    expect(img.getAttribute("style")).toContain("width:auto");
  });

  it.each([70, 180])("renders the logo at size %i", (size) => {
    const doc = render(siteWith(id, `logo-s${size}`));
    expect(root(doc, id).getAttribute("data-logo-size")).toBe(String(size));
    expect(header(doc).querySelector(".kit-logo")).not.toBeNull();
  });

  it("centers the logo and keeps the header's links and buttons", () => {
    const plain = header(render(siteWith(id, "logo")));
    const doc = render(siteWith(id, "logo-center"));
    expect(root(doc, id).getAttribute("data-logo-pos")).toBe("center");
    expect(header(doc).querySelectorAll("a, button").length).toBe(plain.querySelectorAll("a, button").length);
  });

  it("hides the name on screen but keeps it for screen readers and in the page", () => {
    const site = siteWith(id, "logo-center-noname");
    const doc = render(site);
    expect(root(doc, id).getAttribute("data-logo-name")).toBe("hidden");
    const names = [...header(doc).querySelectorAll(".kit-name")];
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.textContent).toBe(site.business.name);
      expect(name.closest("[aria-hidden='true']")).toBeNull();
    }
    expect(header(doc).querySelector(".kit-logo img")).not.toBeNull();
  });

  it("keeps the name (or initial) when the owner hides the name but has no logo", () => {
    const site = siteWith(id, "bare-noname");
    const doc = render(site);
    expect(root(doc, id).hasAttribute("data-logo-name")).toBe(false);
    expect(root(doc, id).hasAttribute("data-logo-frame")).toBe(false);
    expect(header(doc).textContent).toContain(site.business.name);
  });
});

describe("shared logo stylesheet", () => {
  const css = readFileSync(path.join(__dirname, "_kit", "logo.css"), "utf8");

  it("is imported by every template stylesheet", () => {
    for (const id of ids) expect(readFileSync(path.join(__dirname, id, "styles.css"), "utf8"), id).toContain('@import "../_kit/logo.css";');
  });

  it("hides the name visually, not from screen readers", () => {
    const rule = css.slice(css.indexOf('[data-logo-name="hidden"] .kit-name'));
    expect(rule).toContain("clip-path: inset(50%)");
    expect(rule.slice(0, rule.indexOf("}"))).not.toMatch(/display:\s*none|visibility:\s*hidden/);
  });

  it("has a scale for every logo size", () => {
    for (let size = 70; size <= 180; size += 10) if (size !== 100) expect(css, String(size)).toContain(`[data-logo-size="${size}"]`);
  });
});
