import { describe, expect, it } from "vitest";
import { fixtureFor } from "./fixtures";
import { jsonLdScript, siteJsonLd } from "./jsonld";

describe("JSON-LD", () => {
  const site = fixtureFor("souq");
  const data = JSON.parse(jsonLdScript(siteJsonLd(site)));

  it("describes the café, its hours and its menu with prices", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("CafeOrCoffeeShop");
    expect(data.name).toBe("Vanilla Menu");
    expect(data.url).toBe("https://vanillamenu.example.com");
    expect(data.openingHoursSpecification).toHaveLength(7);
    expect(data.openingHoursSpecification[5]).toMatchObject({ dayOfWeek: "https://schema.org/Thursday", opens: "08:00", closes: "23:59" });
    const latte = data.hasMenu.hasMenuSection[0].hasMenuItem[0];
    expect(latte).toMatchObject({ name: "Vanilla latte", offers: { price: "3.50", priceCurrency: "JOD", availability: "https://schema.org/InStock" } });
    const mocha = data.hasMenu.hasMenuSection[0].hasMenuItem[3];
    expect(mocha.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("cannot break out of the script tag", () => {
    const evil = fixtureFor("souq");
    evil.business.name = "</script><script>alert(1)</script>";
    expect(jsonLdScript(siteJsonLd(evil))).not.toContain("</script>");
  });
});
