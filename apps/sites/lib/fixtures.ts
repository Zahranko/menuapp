import registry from "../templates/registry.json";
import type { PublicProduct, PublicSite, Settings } from "./types";

/** The prototype's sample business, used when APP_FIXTURES=1 and by tests. */
const sample: Array<[string, string, string, number, string | null, boolean]> = [
  ["Coffee", "Vanilla latte", "Double shot, Madagascar vanilla, oat or full milk", 3.5, "Signature", true],
  ["Coffee", "Spanish latte", "Condensed milk, velvety and sweet", 3.75, null, false],
  ["Coffee", "Cardamom cortado", "Equal parts espresso and warm milk, a pinch of cardamom", 2.75, "New", false],
  ["Coffee", "Iced mocha", "Dark chocolate, cold milk, lots of ice", 3.95, null, false],
  ["Tea", "Sage and mint tea", "Fresh maramiya and mint, served in a glass pot", 2.0, null, false],
  ["Tea", "Karak chai", "Black tea slow cooked with milk and spices", 2.5, null, false],
  ["Bakery", "Pistachio croissant", "Butter croissant filled with pistachio cream", 2.25, "Best seller", true],
  ["Bakery", "Za'atar croissant", "Olive oil, za'atar and sesame", 1.95, "Vegan", false],
  ["Bakery", "Date and tahini cookie", "Chewy, salted, baked every morning", 1.5, null, false],
  ["Desserts", "Saffron cake", "Saffron sponge with cardamom cream", 4.0, null, false],
  ["Desserts", "Kunafa cheesecake", "Baked cheesecake on a crisp kunafa base", 4.5, "Signature", true],
];

const id = (n: number) => `00000000-0000-7000-8000-${n.toString().padStart(12, "0")}`;

export function defaultsFor(templateId: string): Settings {
  const template = registry.templates.find((t) => t.id === templateId) ?? registry.templates[0];
  return { ...(template.defaults as Settings) };
}

export function fixtureFor(templateId: string, overrides: Partial<PublicSite> = {}): PublicSite {
  const names = [...new Set(sample.map((s) => s[0]))];
  return {
    business: {
      name: "Vanilla Menu",
      slug: "vanillamenu",
      whatsApp: "+962790000000",
      email: "hello@example.com",
      address: "Rainbow Street 21, Jabal Amman",
      instagram: "vanillamenu",
      locale: "en",
      currencyCode: "JOD",
      timeZone: "Asia/Amman",
      customDomains: ["vanillamenu.example.com"],
    },
    templateId,
    settings: defaultsFor(templateId),
    categories: names.map((name, ci) => ({
      id: id(100 + ci),
      name,
      products: sample
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s[0] === name)
        .map<PublicProduct>(({ s, i }) => ({
          id: id(i + 1),
          name: s[1],
          description: s[2],
          price: s[3],
          imageUrl: null,
          label: s[4],
          isAvailable: i !== 3,
          isFeatured: s[5],
        })),
    })),
    publishedAt: "2026-01-01T00:00:00Z",
    isPreview: false,
    ...overrides,
  };
}

export const fixtureSite: PublicSite = fixtureFor(process.env.APP_FIXTURE_TEMPLATE ?? "souq");
