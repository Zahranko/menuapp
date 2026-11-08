import { describe, expect, it } from "vitest";
import { cardAttributes, cardOptions, cardTint, cardVars } from "./cards";
import { contrast } from "./color";
import { heroAttributes, heroOptions, heroPhotos, MAX_SLIDES } from "./hero";

describe("card options", () => {
  it("adds nothing for the defaults or for unknown values", () => {
    expect(cardAttributes({})).toEqual({});
    expect(cardAttributes({ "cards.style": "auto", "cards.border": "auto", "cards.borderColor": "auto", "cards.corners": "auto", "cards.photo": "auto", "cards.spacing": "auto" })).toEqual({});
    expect(cardAttributes({ "cards.style": "neon", "cards.border": 3, "cards.borderColor": "red" })).toEqual({});
    expect(cardVars({}, { surface: "#FFFFFF", accent: "#C8102E", inks: ["#111111"] })).toEqual({});
  });

  it("turns the owner's choices into data attributes", () => {
    const settings = { "cards.style": "glass", "cards.border": "thick", "cards.borderColor": "accent", "cards.corners": "square", "cards.photo": "circle", "cards.spacing": "tight" };
    expect(cardAttributes(settings)).toEqual({
      "data-card-style": "glass",
      "data-card-border": "thick",
      "data-card-bc": "accent",
      "data-card-corners": "square",
      "data-card-photo": "circle",
      "data-card-spacing": "tight",
    });
  });

  it("takes the owner's own border color as #RRGGBB", () => {
    expect(cardOptions({ "cards.borderColor": "#0e7c86" }).borderColor).toBe("#0E7C86");
    expect(cardAttributes({ "cards.borderColor": "#0e7c86" })).toEqual({ "data-card-bc": "custom" });
    expect(cardVars({ "cards.borderColor": "#0e7c86" }, { surface: "#FFFFFF", accent: "#C8102E", inks: [] })).toEqual({ "--kit-bc-own": "#0E7C86" });
  });

  it("keeps every text color readable on the soft color style", () => {
    for (const [surface, accent, inks] of [
      ["#FFFFFF", "#C8102E", ["#1F1F1F", "#5B5B55"]],
      ["#1A1A1A", "#F2C14E", ["#F5F5F0", "#A8A8A0"]],
      ["#FBF7EE", "#2F8F4E", ["#1E1A14", "#6A6358", "#2F6B3F"]],
    ] as const) {
      const tint = cardTint(surface, accent, [...inks]);
      for (const ink of inks) expect(contrast(ink, tint), `${ink} on ${tint}`).toBeGreaterThanOrEqual(4.5);
    }
    // When even a little accent would hurt the text, the card stays on the plain surface.
    expect(cardTint("#FFFFFF", "#000000", ["#767676"])).toBe("#FFFFFF");
    expect(cardVars({ "cards.style": "tinted" }, { surface: "#FFFFFF", accent: "#C8102E", inks: ["#111111"] })["--kit-tint"]).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe("hero options", () => {
  it("defaults to a sliding, autoplaying slider with every button", () => {
    expect(heroOptions({})).toEqual({ transition: "slide", autoplay: true, interval: 5000, dots: true, arrows: true, height: "auto", overlay: "auto", textPosition: "auto" });
    expect(heroAttributes({})).toEqual({});
  });

  it("reads the owner's choices", () => {
    const o = heroOptions({ "hero.transition": "zoom", "hero.autoplay": false, "hero.speed": "slow", "hero.controls": ["dots"], "hero.height": "full", "hero.overlay": "strong", "hero.textPosition": "bottom" });
    expect(o).toEqual({ transition: "zoom", autoplay: false, interval: 8000, dots: true, arrows: false, height: "full", overlay: "strong", textPosition: "bottom" });
    expect(heroOptions({ "hero.controls": [] })).toMatchObject({ dots: false, arrows: false });
    expect(heroAttributes({ "hero.height": "short", "hero.overlay": "light", "hero.textPosition": "center" })).toEqual({ "data-hero-height": "short", "data-hero-overlay": "light", "data-hero-text": "center" });
  });

  it("puts the main photo first, then the extra ones, without duplicates", () => {
    expect(heroPhotos({ "hero.image": "preset:loft", "hero.slides": ["https://x.test/a.jpg", "https://x.test/a.jpg", "preset:pour"] }, "hero.image")).toEqual(["/presets/loft.svg", "https://x.test/a.jpg", "/presets/pour.svg"]);
    expect(heroPhotos({ "hero.image": "", "hero.slides": ["https://x.test/a.jpg"] }, "hero.image")).toEqual(["https://x.test/a.jpg"]);
    expect(heroPhotos({ "hero.image": "" }, "hero.image", "/samples/food/latte.svg")).toEqual(["/samples/food/latte.svg"]);
    expect(heroPhotos({ "hero.images": ["preset:noir", "preset:loft"] }, "hero.images")).toEqual(["/presets/noir.svg", "/presets/loft.svg"]);
    expect(heroPhotos({ "hero.slides": [] }, null)).toEqual([]);
    const many = Array.from({ length: 9 }, (_, i) => `https://x.test/${i}.jpg`);
    expect(heroPhotos({ "hero.slides": many }, null)).toHaveLength(MAX_SLIDES);
  });
});
