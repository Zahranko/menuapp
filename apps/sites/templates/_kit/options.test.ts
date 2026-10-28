import { describe, expect, it } from "vitest";
import { facebookLink, phoneLink, snapchatLink, tiktokLink } from "@/lib/format";
import { fixtureFor } from "@/lib/fixtures";
import { accountsOf, arabicOnLatinSite, callNumber, footerNameSize, optionAttributes, orderButton, socialAccounts, typeface } from "./options";

describe("social links", () => {
  it("builds each network's address from the stored username", () => {
    expect(facebookLink("vanillamenu")).toBe("https://www.facebook.com/vanillamenu");
    expect(facebookLink("profile.php?id=100089")).toBe("https://www.facebook.com/profile.php?id=100089");
    expect(tiktokLink("@vanilla.menu")).toBe("https://www.tiktok.com/@vanilla.menu");
    expect(snapchatLink("vanilla-menu")).toBe("https://www.snapchat.com/add/vanilla-menu");
    expect(phoneLink("+962 6 555-0100")).toBe("tel:+96265550100");
  });

  it("lists only the accounts the business filled in, and calls the WhatsApp number without a phone", () => {
    const site = fixtureFor("chalkboard");
    site.business = { ...site.business, phone: null, tikTok: null, snapchat: "" };
    expect(callNumber(site)).toBe(site.business.whatsApp);
    expect(accountsOf(site).map((a) => a.network)).toEqual(["instagram", "whatsapp", "facebook", "phone"]);
  });

  it("uses the template's default until the owner chooses", () => {
    const site = fixtureFor("chalkboard");
    delete site.settings["social.show"];
    expect(socialAccounts(site, ["instagram"]).map((a) => a.network)).toEqual(["instagram"]);
    site.settings["social.show"] = ["tiktok", "phone"];
    expect(socialAccounts(site, ["instagram"]).map((a) => a.network)).toEqual(["tiktok", "phone"]);
  });
});

describe("order button", () => {
  it("orders on WhatsApp by default, with the template's text and link", () => {
    const site = fixtureFor("chalkboard");
    const order = orderButton(site, { label: "Book a table", whatsapp: "https://wa.me/1?text=hi" })!;
    expect(order).toMatchObject({ action: "whatsapp", href: "https://wa.me/1?text=hi", label: "Book a table", shape: "auto", chosen: false, external: true });
  });

  it("ignores unknown values", () => {
    const site = fixtureFor("chalkboard");
    site.settings = { ...site.settings, "order.action": "fax", "order.shape": "star", "order.position": "top", "footer.nameSize": "huge", "font.family": "comic" };
    expect(orderButton(site)).toMatchObject({ action: "whatsapp", shape: "auto", position: "auto", chosen: false });
    expect(footerNameSize(site.settings)).toBe("large");
    expect(typeface(site.settings, "en")).toBeNull();
    expect(optionAttributes(site, orderButton(site))).toEqual({});
  });
});

describe("order button position", () => {
  it("moves a floating button the template shows, and nothing while it is on the template's place", () => {
    const site = fixtureFor("chalkboard");
    site.settings = { ...site.settings, "order.position": "start" };
    const order = orderButton(site)!;
    expect(order.position).toBe("start");
    expect(optionAttributes(site, order, true)["data-order-pos"]).toBe("start");
    // The shared button shows only once the owner picks an action: no position without a button.
    expect(optionAttributes(site, order)["data-order-pos"]).toBeUndefined();
    site.settings = { ...site.settings, "order.position": "auto" };
    expect(optionAttributes(site, orderButton(site), true)["data-order-pos"]).toBeUndefined();
  });
});

describe("Arabic text on a site in English", () => {
  it("says where the owner wrote Arabic: the name, the opening, other titles", () => {
    const site = fixtureFor("ember");
    expect(arabicOnLatinSite(site)).toEqual([]);
    expect(optionAttributes(site)["data-ar-text"]).toBeUndefined();
    site.settings = { ...site.settings, "hero.title": "مشاوي على الفحم" };
    expect(arabicOnLatinSite(site)).toEqual(["hero"]);
    expect(optionAttributes(site)["data-ar-text"]).toBe("hero");
    site.settings = { ...site.settings, "story.title": "حكايتنا" };
    site.business = { ...site.business, name: "جمر" };
    expect(optionAttributes(site)["data-ar-text"]).toBe("name hero titles");
  });

  it("is nothing on a site in Arabic, where every heading already gets the Arabic line height", () => {
    const site = fixtureFor("ember");
    site.business = { ...site.business, locale: "ar", name: "جمر" };
    site.settings = { ...site.settings, "hero.title": "مشاوي على الفحم" };
    expect(arabicOnLatinSite(site)).toEqual([]);
  });
});

describe("font choice", () => {
  it("drops letter spacing for Arabic", () => {
    const settings = { "font.family": "readex" };
    expect(typeface(settings, "en")!.tracking).toBe("-.02em");
    expect(typeface(settings, "ar")!.tracking).toBe("0");
  });
});
