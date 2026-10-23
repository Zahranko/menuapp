import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fixturePreview, LONG_LABELS } from "@/lib/fixtures";
import type { PublicSite } from "@/lib/types";
import { allPaths } from "./_premium/pages";
import { multiPage, templates } from "./registry";

/** Product labels in every template: fixed labels in the site's language, custom labels as the owner typed them. */

const render = (site: PublicSite) => {
  const Template = templates[site.templateId];
  const paths = multiPage.has(site.templateId) ? allPaths(site) : [[]];
  return paths.map((path) => renderToStaticMarkup(<Template site={site} preview={false} path={path} base="/x" />)).join("\n");
};
const escape = (s: string) => s.replace("'", "&#x27;");

describe.each(Object.keys(templates))("template %s", (id) => {
  it("shows custom labels in English on English sites and in Arabic on Arabic sites", () => {
    const en = render(fixturePreview(`fixture.${id}.default.en.labels`)!);
    const ar = render(fixturePreview(`fixture.${id}.default.ar.labels`)!);
    expect(en).toContain(escape(LONG_LABELS.en.text));
    expect(en).not.toContain(LONG_LABELS.ar.text);
    expect(ar).toContain(LONG_LABELS.ar.text);
    expect(ar).not.toContain(LONG_LABELS.en.text);
    expect(ar).not.toContain(LONG_LABELS.en.word);
  });

  it("translates the fixed labels on Arabic sites", () => {
    const ar = render(fixturePreview(`fixture.${id}.default.ar.labels`)!);
    for (const label of ["جديد", "نباتي", "حار"]) expect(ar, label).toContain(label);
    expect(ar).not.toMatch(/>\s*\[?(New|Vegan|Spicy|Best seller)\]?\s*</);
  });
});
