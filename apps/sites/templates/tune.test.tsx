import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applySiteOptions, fixtureFor } from "@/lib/fixtures";
import { ownerCss } from "@/lib/owner-css";
import type { PublicSite } from "@/lib/types";
import { contrast } from "./_kit/color";
import { extraSection, ownInk, safeLink, titleColor, TUNE_KEYS, tuneAttributes } from "./_kit/tune";
import tuneSettings from "./_kit/tune-settings.json";
import registry from "./registry.json";
import { templates } from "./registry";

/** The shared "Motion", "Your own section" and "Fine tuning" groups (_kit/tune.ts, tune.css, SiteExtra) on every template. */

const ids = Object.keys(templates);
type Field = { key: string; type: string; group?: string; groupAr?: string; labelAr?: string; options?: string[]; optionLabelsAr?: Record<string, string> };
const schemaOf = (id: string) => registry.templates.find((t) => t.id === id)!.schema as Field[];

function html(site: PublicSite, page: string[] = []): string {
  const Template = templates[site.templateId];
  return renderToStaticMarkup(<Template site={site} preview={false} path={page} base="/x" />);
}
const parse = (markup: string) => new DOMParser().parseFromString(markup, "text/html");
const site = (id: string, options = "", arabic = false) => {
  const s = fixtureFor(id, {}, undefined, arabic);
  if (arabic) s.business = { ...s.business, locale: "ar" };
  if (options) applySiteOptions(s, options);
  return s;
};
const topSections = (doc: Document) =>
  [...doc.querySelectorAll("[data-section]")].filter((e) => !e.parentElement?.closest("[data-section]")).map((e) => e.getAttribute("data-section")!).filter((n) => n !== "order");

describe("tune options", () => {
  it("adds nothing for the defaults or for unknown values", () => {
    expect(tuneAttributes({})).toEqual({});
    expect(tuneAttributes(tuneSettings.defaults)).toEqual({});
    expect(tuneAttributes({ "motion.intro": "explode", "motion.hover": 3, "tune.headings": "#5B3FD0" })).toEqual({});
    expect(extraSection(tuneSettings.defaults)).toBeNull();
    expect(extraSection({ "extra.place": "top" })).toBeNull();
  });

  it("turns the owner's choices into data attributes", () => {
    expect(tuneAttributes({ "motion.intro": "rise", "motion.hover": "lift", "motion.speed": "slow" })).toEqual({
      "data-mo-intro": "rise",
      "data-mo-hover": "lift",
      "data-mo-speed": "slow",
    });
  });

  it("keeps the owner's text and title colors readable, titles on the accent fill too", () => {
    for (const bg of ["#FFFFFF", "#FBF7EE", "#121714", "#0E0E0E"]) {
      for (const chosen of ["#FFFFFF", "#F2C14E", "#777777", "#14213D", "#5B3FD0", "#000000"]) {
        const ink = ownInk({ "tune.text": chosen }, "#111111", [bg]);
        // 7:1, so text a template softens to 80% still reads at 4.5:1.
        expect(contrast(ink, bg), `${chosen} on ${bg}`).toBeGreaterThanOrEqual(7);
        for (const fill of ["#FF5A1F", "#1F6FEB", "#F2C14E"]) {
          const title = titleColor({ "tune.headings": chosen }, [bg], { fill, text: "#1F6FEB" });
          if (title === null) continue;
          expect(contrast(title, bg), `title ${chosen} on ${bg}`).toBeGreaterThanOrEqual(4.5);
          expect(contrast(title, fill), `title ${chosen} on the accent ${fill}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
    // A violet title on a light page with an orange accent panel turns dark enough to read on both.
    expect(titleColor({ "tune.headings": "#5B3FD0" }, ["#FBF7EE"], { fill: "#FF5A1F", text: "#C2410C" })).not.toBeNull();
    expect(ownInk({}, "#111111", ["#FFFFFF"])).toBe("#111111");
    // No color reads on both a white page and a dark gray accent panel: the template's own title color stays.
    expect(titleColor({ "tune.headings": "accent" }, ["#FFFFFF"], { fill: "#3A3A3A", text: "#3A3A3A" })).toBeNull();
    expect(titleColor({ "tune.headings": "accent" }, ["#FFFFFF"], { fill: "#F2C14E", text: "#8A5A00" })).toMatch(/^#/);
    expect(titleColor({ "tune.headings": "default" }, ["#FFFFFF"], { fill: "#F2C14E", text: "#8A5A00" })).toBeNull();
  });

  it("makes the button's link safe", () => {
    expect(safeLink("example.com/order")).toBe("https://example.com/order");
    expect(safeLink("https://wa.me/962790000000")).toBe("https://wa.me/962790000000");
    expect(safeLink("#menu")).toBe("#menu");
    expect(safeLink("tel:+962790000000")).toBe("tel:+962790000000");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "JaVaScRiPt:alert(1)", "localhost", "", "two words", "vbscript:x", "//evil"]) {
      expect(safeLink(bad), bad).toBeNull();
    }
  });

  it("has Arabic labels for every field and option", () => {
    for (const group of [tuneSettings.motion, tuneSettings.extra, tuneSettings.tune]) {
      expect(group.groupAr).toBeTruthy();
      for (const field of group.fields as Field[]) {
        expect(field.labelAr, field.key).toBeTruthy();
        for (const option of field.options ?? []) expect(field.optionLabelsAr?.[option], `${field.key} ${option}`).toBeTruthy();
      }
    }
  });
});

describe("the owner's own CSS", () => {
  it("is nested under the template's root", () => {
    expect(ownerCss(".kit-card { color: red; }")).toBe("[data-template]{\n.kit-card { color: red; }\n}");
    expect(ownerCss("")).toBeNull();
    expect(ownerCss("   ")).toBeNull();
    expect(ownerCss(42)).toBeNull();
  });

  it("can't close the style element, load anything or leave the root", () => {
    const css = ownerCss(
      "</style><script>alert(1)</script>\n@import 'https://evil.test/a.css';\n@font-face { font-family: x; src: url(https://evil.test/f.woff) }\n" +
        "h2 { background: url(https://evil.test/x.png); background-image: image-set('x.png' 1x) }\n.a { content: '\\3c /style\\3e' }\n" +
        "}} body { display: none }\n@media (min-width: 700px) { h1 { color: red } }\n@keyframes k { from { opacity: 0 } }",
    )!;
    expect(css).not.toMatch(/</);
    expect(css).not.toMatch(/\\/);
    expect(css).not.toMatch(/@import|@font-face/i);
    expect(css).not.toMatch(/\burl\(|image-set\(/i);
    expect(css).toContain("@media (min-width: 700px)");
    expect(css).toContain("@keyframes k");
    expect(css.startsWith("[data-template]{")).toBe(true);
    // The root block ends at the very last character, so nothing escapes it.
    let d = 0;
    let end = -1;
    for (let i = 0; i < css.length; i++) {
      if (css[i] === "{") d++;
      if (css[i] === "}" && --d === 0) {
        end = i;
        break;
      }
    }
    expect(end).toBe(css.length - 1);
  });

  it("closes blocks left open and keeps braces inside strings", () => {
    expect(ownerCss('.a { content: "}"; color: red')).toBe('[data-template]{\n.a { content: "}"; color: red}\n}');
  });
});

describe.each(ids)("tune options in template %s", (id) => {
  it("comes after Sections (or the moving strip): Motion, then Your own section, then Fine tuning, in both languages", () => {
    const schema = schemaOf(id);
    const groups = [...new Set(schema.map((f) => f.group))];
    const motion = groups.indexOf("Motion");
    expect(groups[motion - 1]).toMatch(/^(Sections|Moving strip)$/);
    expect(groups.slice(motion, motion + 3)).toEqual(["Motion", "Your own section", "Fine tuning"]);
    const keys = schema.filter((f) => ["Motion", "Your own section", "Fine tuning"].includes(f.group!)).map((f) => f.key);
    expect(keys).toEqual(TUNE_KEYS);
    const defaults = registry.templates.find((t) => t.id === id)!.defaults as Record<string, unknown>;
    for (const key of TUNE_KEYS) expect(defaults[key], key).toEqual((tuneSettings.defaults as Record<string, unknown>)[key]);
  });

  it("looks exactly as before with the defaults, saved or not", () => {
    const saved = site(id);
    const old = site(id);
    for (const key of TUNE_KEYS) delete old.settings[key];
    expect(html(saved)).toBe(html(old));
  });

  it("puts the motion attributes and the title color on the root", () => {
    const doc = parse(html(site(id, "moi_rise-moh_glow-mos_fast-tnh_14213d")));
    const root = doc.querySelector("[data-template]")!;
    expect(root.getAttribute("data-mo-intro")).toBe("rise");
    expect(root.getAttribute("data-mo-hover")).toBe("glow");
    expect(root.getAttribute("data-mo-speed")).toBe("fast");
    const title = (root as HTMLElement).style.getPropertyValue("--tn-head");
    if (title) expect(title).toMatch(/^#[0-9a-f]{6}$/i);
    const text = parse(html(site(id, "tnt_777777"))).querySelector("[data-template]")!.getAttribute("style")!;
    expect(text).not.toBe(parse(html(site(id))).querySelector("[data-template]")!.getAttribute("style"));
  });

  for (const arabic of [false, true]) {
    it(`shows the owner's own section where they chose${arabic ? ", in Arabic" : ""}`, () => {
      for (const place of ["top", "middle", "bottom"]) {
        const doc = parse(html(site(id, `extra_${place}`, arabic)));
        const names = topSections(doc);
        expect(names.filter((n) => n === "extra"), place).toHaveLength(1);
        const at = names.indexOf("extra");
        expect(at, place).toBeGreaterThan(0);
        expect(at, place).toBeLessThan(names.length - 1);
        if (place === "bottom") expect(names.indexOf("footer") === -1 || names[at + 1] === "footer", `${place}: ${names.join(",")}`).toBe(true);
        expect(doc.querySelectorAll("h1").length).toBe(1);
        const all = [...doc.querySelectorAll("[id]")].map((e) => e.id);
        expect(new Set(all).size, "ids are unique").toBe(all.length);
        const section = doc.getElementById("extra")!;
        expect(doc.getElementById(section.getAttribute("aria-labelledby")!)?.textContent).toBe(arabic ? "ضيافة لمناسباتكم" : "Catering for your events");
        expect(section.querySelector("a[data-k~=btn]")!.getAttribute("href")).toBe("#menu");
        expect(section.querySelectorAll("p").length).toBeGreaterThanOrEqual(2);
      }
    });
  }

  it("draws every layout of the owner's own section, with and without a photo", () => {
    for (const layout of tuneSettings.extra.fields.find((f) => f.key === "extra.layout")!.options!) {
      for (const photo of ["", "-exnp"]) {
        const doc = parse(html(site(id, `extra_bottom-exl_${layout}${photo}`)));
        const section = doc.getElementById("extra")!;
        expect(section.getAttribute("data-sc")).toBe(layout);
        expect(section.querySelector("[data-k~=photo]") !== null, `${layout}${photo}`).toBe(photo === "");
      }
    }
  });

  it("leaves the button out when its link isn't safe, and the section out when it has nothing to say", () => {
    const s = site(id, "extra_top");
    s.settings = { ...s.settings, "extra.link": "javascript:alert(1)" };
    expect(parse(html(s)).querySelector("#extra a")).toBeNull();
    s.settings = { ...s.settings, "extra.title": "", "extra.text": "" };
    expect(parse(html(s)).getElementById("extra")).toBeNull();
  });
});
