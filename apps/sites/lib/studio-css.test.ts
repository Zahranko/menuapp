import { describe, expect, it } from "vitest";
import { cleanDeclaration, cleanStudioCss, scopeSelector, STUDIO_CSS_MAX, STUDIO_ROOT } from "./studio-css";

const R = STUDIO_ROOT;
const clean = (css: string) => cleanStudioCss(css).css.replace(/@media \(prefers-reduced-motion:reduce\).*$/, "");

describe("cleanStudioCss", () => {
  it("scopes every rule to the site", () => {
    expect(clean('[data-section="hero"] h1 { color: red; letter-spacing: 2px }')).toBe(`${R} [data-section="hero"] h1{color:red;letter-spacing:2px}`);
    expect(clean(".a, .b > .c { margin: 0 }")).toBe(`${R} .a,${R} .b > .c{margin:0}`);
    expect(clean(":scope { --acc: #f00 }")).toBe(`${R}{--acc:#f00}`);
  });

  it("keeps media queries, supports and keyframes", () => {
    const css = clean("@media (min-width: 700px) { .x { gap: 2rem } } @keyframes rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1 } } .x { animation: rise .6s ease both }");
    expect(css).toBe(`@media (min-width: 700px){${R} .x{gap:2rem}}@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1}}${R} .x{animation:rise .6s ease both}`);
    expect(clean("@supports (animation-timeline: view()) { .y { animation-timeline: view() } }")).toBe(`@supports (animation-timeline: view()){${R} .y{animation-timeline:view()}}`);
  });

  it("stops animations for visitors who ask for less motion", () => {
    expect(cleanStudioCss(".x{animation:spin 1s}").css).toContain("@media (prefers-reduced-motion:reduce)");
    expect(cleanStudioCss("").css).toBe("");
  });

  it("drops anything that loads from outside, runs code or escapes the site", () => {
    expect(clean('@import url("https://evil.example/x.css"); .a{color:red}')).toBe(`${R} .a{color:red}`);
    expect(clean("@font-face { font-family: x; src: url(https://evil.example/f.woff) }")).toBe("");
    expect(clean(".a { background: url(https://evil.example/track.png) }")).toBe("");
    expect(clean(".a { background-image: image-set('https://evil.example/a.png' 1x) }")).toBe("");
    expect(clean(".a { width: expression(alert(1)) }")).toBe("");
    expect(clean(".a { behavior: url(x.htc); -moz-binding: url(x) }")).toBe("");
    expect(clean(".a { position: fixed; inset: 0 }")).toBe(`${R} .a{inset:0}`);
    expect(clean("body { display: none } html .a { color: red } :root { --x: 1 }")).toBe("");
    expect(clean(".a:not(:scope) { color: red }")).toBe("");
    expect(cleanStudioCss(".a { color: red } </style><script>alert(1)</script>").css).toBe("");
    expect(cleanStudioCss(".a { content: '\\3c' }").css).toBe("");
  });

  it("keeps inline pictures and the site's own photos", () => {
    expect(clean(".a { background: url(\"data:image/svg+xml,%3Csvg%3E%3C/svg%3E\") }")).toContain("url(");
    expect(cleanStudioCss(".a { background: url(https://media.example/p.webp) }", ["media.example"]).css).toContain("media.example");
  });

  it("ignores comments, stray text and broken rules", () => {
    expect(clean("/* hi */ .a { color: red; ; nonsense; } stray; }")).toBe(`${R} .a{color:red}`);
    expect(clean(".a { color: red")).toBe(`${R} .a{color:red}`);
  });

  it("refuses sheets that are too long or not text", () => {
    expect(cleanStudioCss("a".repeat(STUDIO_CSS_MAX + 1)).css).toBe("");
    expect(cleanStudioCss(42).css).toBe("");
  });
});

describe("scopeSelector", () => {
  it("refuses selectors with characters CSS selectors don't need", () => {
    expect(scopeSelector(".a{")).toBeNull();
    expect(scopeSelector("")).toBeNull();
    expect(scopeSelector(".a,")).toBeNull();
  });
});

describe("cleanDeclaration", () => {
  it("allows custom properties and vendor prefixes", () => {
    expect(cleanDeclaration("--radius: 18px")).toBe("--radius:18px");
    expect(cleanDeclaration("-webkit-backdrop-filter: blur(8px)")).toBe("-webkit-backdrop-filter:blur(8px)");
    expect(cleanDeclaration("color red")).toBeNull();
  });
});
