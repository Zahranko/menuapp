import registry from "../templates/registry.json";
import type { PublicProduct, PublicSite, Settings } from "./types";

/**
 * Sample businesses, used when APP_FIXTURES=1, by tests and for template thumbnails.
 * A template's manifest picks one with "sample" (default "cafe").
 */
type Row = [category: string, name: string, description: string, price: number, label: string | null, featured: boolean, photo: string | null];
type Sample = { name: string; address: string; instagram: string; menu: Row[]; settings?: Settings };

export const SAMPLES = {
  cafe: {
    name: "Vanilla Menu",
    address: "Rainbow Street 21, Jabal Amman",
    instagram: "vanillamenu",
    menu: [
      ["Coffee", "Vanilla latte", "Double shot, Madagascar vanilla, oat or full milk", 3.5, "Signature", true, "latte"],
      ["Coffee", "Spanish latte", "Condensed milk, velvety and sweet", 3.75, null, false, "spanish"],
      ["Coffee", "Cardamom cortado", "Equal parts espresso and warm milk, a pinch of cardamom", 2.75, "New", false, "cortado"],
      ["Coffee", "Iced mocha", "Dark chocolate, cold milk, lots of ice", 3.95, null, false, "iced"],
      ["Tea", "Sage and mint tea", "Fresh maramiya and mint, served in a glass pot", 2.0, null, false, "tea"],
      ["Tea", "Karak chai", "Black tea slow cooked with milk and spices", 2.5, null, false, "karak"],
      ["Bakery", "Pistachio croissant", "Butter croissant filled with pistachio cream", 2.25, "Best seller", true, "croissant"],
      ["Bakery", "Za'atar croissant", "Olive oil, za'atar and sesame", 1.95, "Vegan", false, "zaatar"],
      ["Bakery", "Date and tahini cookie", "Chewy, salted, baked every morning", 1.5, null, false, "cookie"],
      ["Desserts", "Saffron cake", "Saffron sponge with cardamom cream", 4.0, null, false, "cake"],
      ["Desserts", "Kunafa cheesecake", "Baked cheesecake on a crisp kunafa base", 4.5, "Signature", true, "kunafa"],
    ],
  },
  restaurant: {
    name: "Bait Sitti",
    address: "Al-Rainbow Street 8, Jabal Amman",
    instagram: "baitsitti",
    menu: [
      ["Cold mezze", "Hummus beiruti", "Chickpeas, tahini, lemon, parsley and a little chili", 2.25, "Vegan", true, "hummus"],
      ["Cold mezze", "Fattoush", "Crisp bread, sumac, purslane and pomegranate molasses", 2.5, null, false, "salad"],
      ["Cold mezze", "Mutabbal", "Smoked eggplant with tahini and garlic", 2.25, null, false, null],
      ["Hot mezze", "Falafel plate", "Six falafel, tahini sauce and pickled turnips", 2.75, "Best seller", true, "falafel"],
      ["Hot mezze", "Lentil soup", "Red lentils, cumin and a squeeze of lemon", 2.0, null, false, "soup"],
      ["Grill", "Mixed grill", "Shish tawouk, kofta and lamb tikka with grilled tomato", 9.5, "Signature", true, "grill"],
      ["Grill", "Chicken shawarma wrap", "Garlic toum, pickles and fries inside", 3.75, null, false, "wrap"],
      ["Grill", "Kofta with tahini", "Baked in the oven with potatoes and tahini", 7.25, null, false, null],
      ["Sweets", "Kunafa nabulsiyeh", "Warm cheese, crisp semolina and syrup", 3.5, null, false, "kunafa"],
      ["Drinks", "Lemon and mint", "Fresh, blended with ice", 2.0, null, false, "juice"],
    ],
  },
  sweets: {
    name: "Sugar Lane",
    address: "Mecca Street 112, Amman",
    instagram: "sugarlane",
    menu: [
      ["Ice cream", "Pistachio scoop", "Sicilian pistachio, a little salt", 1.75, "Best seller", true, "icecream"],
      ["Ice cream", "Mastic and rose", "Booza with mastic, rosewater and crushed pistachio", 1.95, "Signature", true, "icecream"],
      ["Ice cream", "Dark chocolate sorbet", "Dairy free, 70% cacao", 1.75, "Vegan", false, null],
      ["Doughnuts", "Strawberry glaze", "Brioche doughnut with fresh strawberry glaze", 1.5, null, false, "donut"],
      ["Doughnuts", "Lotus cream", "Filled with lotus cream and crumbs", 1.75, "New", false, "donut"],
      ["Cakes", "Red velvet cupcake", "Cream cheese frosting", 1.6, null, false, "cupcake"],
      ["Cakes", "Saffron cake slice", "Saffron sponge with cardamom cream", 3.25, null, true, "cake"],
      ["Waffles", "Classic waffle", "Belgian waffle, berries and maple", 3.5, null, false, "waffle"],
      ["Drinks", "Strawberry smoothie", "Strawberry, banana and yogurt", 2.75, null, false, "smoothie"],
    ],
  },
  drinks: {
    name: "Juice Lab",
    address: "Wasfi Al-Tal Street 40, Amman",
    instagram: "juicelab",
    menu: [
      ["Fresh juice", "Orange and carrot", "Pressed to order", 2.25, "Best seller", true, "juice"],
      ["Fresh juice", "Green detox", "Apple, cucumber, celery, lemon and ginger", 2.75, "Vegan", false, "salad"],
      ["Fresh juice", "Watermelon cooler", "Watermelon, mint and lime", 2.25, null, false, "juice"],
      ["Smoothies", "Berry blast", "Strawberry, blueberry, banana and yogurt", 3.25, "Signature", true, "smoothie"],
      ["Smoothies", "Mango lassi", "Alphonso mango, yogurt, cardamom", 3.0, null, false, "smoothie"],
      ["Mocktails", "Virgin mojito", "Lime, mint, soda", 3.5, null, true, "mocktail"],
      ["Mocktails", "Pink lemonade", "Raspberry, lemon and rose", 3.25, "New", false, "mocktail"],
      ["Bites", "Granola cup", "Yogurt, granola and honey", 2.5, null, false, null],
    ],
  },
  fastfood: {
    name: "Smash Corner",
    address: "Gardens Street 77, Amman",
    instagram: "smashcorner",
    menu: [
      ["Burgers", "Double smash", "Two smashed patties, cheese, pickles, house sauce", 5.5, "Best seller", true, "burger"],
      ["Burgers", "Spicy chicken burger", "Crispy chicken, chili mayo, slaw", 4.75, "Spicy", true, "burger"],
      ["Burgers", "Mushroom swiss", "Beef patty, sautéed mushrooms, swiss cheese", 5.25, null, false, null],
      ["Pizza", "Margherita", "Tomato, mozzarella, basil", 6.0, "Vegan", false, "pizza"],
      ["Pizza", "Pepperoni", "Beef pepperoni, mozzarella, oregano", 7.5, "Signature", true, "pizza"],
      ["Sides", "Fries", "Skin on, sea salt", 1.5, null, false, "fries"],
      ["Sides", "Loaded fries", "Cheese sauce, jalapeños, crispy onions", 2.75, null, false, "fries"],
      ["Drinks", "Lemon and mint", "Fresh, blended with ice", 1.75, null, false, "juice"],
    ],
  },
  asian: {
    name: "Koi Kitchen",
    address: "Abdoun Circle 5, Amman",
    instagram: "koikitchen",
    menu: [
      ["Sushi", "Salmon nigiri", "Two pieces, hand pressed", 3.5, "Signature", true, "sushi"],
      ["Sushi", "California roll", "Crab, avocado, cucumber, eight pieces", 5.25, "Best seller", true, "sushi"],
      ["Sushi", "Veggie maki", "Cucumber, avocado and pickled radish", 3.75, "Vegan", false, null],
      ["Noodles", "Chicken ramen", "Slow broth, soft egg, spring onion", 6.5, null, true, "noodles"],
      ["Noodles", "Spicy dan dan", "Sesame, chili oil, minced beef", 6.25, "Spicy", false, "noodles"],
      ["Small plates", "Edamame", "Sea salt or chili garlic", 2.25, null, false, "salad"],
      ["Small plates", "Miso soup", "Tofu, wakame, spring onion", 1.75, null, false, "soup"],
    ],
  },
  brunch: {
    name: "Green Fork",
    address: "Abdali Boulevard 9, Amman",
    instagram: "greenfork",
    menu: [
      ["Brunch", "Shakshuka", "Eggs baked in spiced tomato and peppers, warm bread", 4.5, "Best seller", true, "soup"],
      ["Brunch", "Halloumi waffle", "Savory waffle, grilled halloumi, za'atar honey", 5.25, "New", true, "waffle"],
      ["Brunch", "Avocado toast", "Sourdough, smashed avocado, dukkah and lemon", 4.75, "Vegan", false, null],
      ["Bowls", "Green goddess bowl", "Quinoa, greens, edamame, herb dressing", 5.75, "Vegan", true, "salad"],
      ["Bowls", "Falafel bowl", "Baked falafel, hummus, pickles and tabbouleh", 5.5, null, false, "falafel"],
      ["Bowls", "Lentil soup", "Red lentils, cumin and lemon", 3.0, "Vegan", false, "soup"],
      ["Drinks", "Green juice", "Apple, cucumber, spinach and ginger", 2.75, null, false, "juice"],
      ["Drinks", "Berry smoothie", "Berries, banana and oat milk", 3.25, "Vegan", false, "smoothie"],
      ["Drinks", "Flat white", "Double shot, silky milk", 2.75, null, false, "latte"],
    ],
  },
  pizza: {
    name: "Forno Rosso",
    address: "Al-Baouniyah Street 14, Jabal Al-Luweibdeh",
    instagram: "fornorosso",
    menu: [
      ["Pizza", "Margherita", "San Marzano tomato, fior di latte, basil", 6.0, "Best seller", true, "pizza"],
      ["Pizza", "Diavola", "Spicy beef salami, tomato, mozzarella, chili honey", 7.75, "Spicy", true, "pizza"],
      ["Pizza", "Za'atar and labneh", "White base, za'atar, labneh, olives and mint", 6.5, "Signature", true, "pizza"],
      ["Pizza", "Quattro formaggi", "Mozzarella, gorgonzola, parmesan and halloumi", 8.25, null, false, "pizza"],
      ["Pasta", "Penne arrabbiata", "Tomato, garlic and chili", 5.5, "Vegan", false, "noodles"],
      ["Pasta", "Tagliatelle al ragù", "Slow cooked beef ragù, parmesan", 7.0, null, false, "noodles"],
      ["Salads", "Rocket and parmesan", "Lemon, olive oil, shaved parmesan", 4.25, null, false, "salad"],
      ["Desserts", "Tiramisu", "Mascarpone, espresso, cocoa", 3.75, null, false, "cake"],
      ["Drinks", "Fresh lemonade", "Lemon, mint and a little sugar", 2.0, null, false, "juice"],
    ],
  },
  salon: {
    name: "Maison Lina",
    address: "Abdoun, Prince Hashem Street 12",
    instagram: "maisonlina",
    menu: [
      ["Hair", "Cut and blow dry", "Consultation, wash, cut and finish, 60 minutes", 25, "Best seller", true, "services/scissors"],
      ["Hair", "Blow dry", "Wash and styled blow dry, 40 minutes", 12, null, false, "services/dryer"],
      ["Hair", "Full color", "Root to tip color with gloss, from 120 minutes", 55, "Signature", true, "services/dryer"],
      ["Hair", "Keratin treatment", "Smoothing treatment for frizz-free hair", 90, null, false, null],
      ["Nails", "Gel manicure", "Shape, cuticle care and gel color", 15, null, true, "services/nails"],
      ["Nails", "Spa pedicure", "Soak, scrub, massage and polish", 18, "New", false, "services/nails"],
      ["Skin", "Hydrating facial", "Deep cleanse, mask and massage, 50 minutes", 35, null, false, "services/facial"],
      ["Skin", "Hot stone massage", "Full body, 60 minutes", 45, null, false, "services/massage"],
    ],
  },
  clinic: {
    name: "Smile Dental Clinic",
    address: "Shmeisani, Abdul Hamid Sharaf Street 30",
    instagram: "smiledental",
    menu: [
      ["General", "Check-up and cleaning", "Exam, scaling, polishing and advice", 30, "Best seller", true, "services/tooth"],
      ["General", "Fillings", "Tooth-colored composite fillings, per tooth", 35, null, false, "services/tooth"],
      ["General", "Children's dentistry", "Gentle visits for kids from age 3", 25, null, true, "services/clipboard"],
      ["General", "Emergency visit", "Same-day appointment for pain or injury", 40, null, false, "services/stethoscope"],
      ["Cosmetic", "Teeth whitening", "In-clinic whitening, one session", 150, "Signature", true, "services/tooth"],
      ["Cosmetic", "Veneers", "Porcelain veneers, per tooth, from", 220, null, false, null],
      ["Orthodontics", "Clear aligners", "Consultation and treatment plan", 50, "New", false, "services/clipboard"],
    ],
  },
  studio: {
    name: "Northline Studio",
    address: "Jabal Amman, First Circle, Studio 4",
    instagram: "northline",
    menu: [
      ["Brand", "Brand identity", "Logo, colors, type and a short brand guide", 900, "Best seller", true, "services/pen"],
      ["Brand", "Packaging design", "Labels and boxes ready for print", 600, null, false, "services/pen"],
      ["Web", "Website design and build", "Up to six pages, mobile first, easy to edit", 1500, "Signature", true, "services/browser"],
      ["Web", "Online store setup", "Products, payments and delivery set up for you", 1200, null, false, "services/browser"],
      ["Content", "Product photography", "Half-day shoot, 20 edited photos", 350, null, true, "services/camera"],
      ["Content", "Social media videos", "Four short videos a month", 400, "New", false, "services/play"],
    ],
  },
  gym: {
    name: "Pulse Fitness",
    address: "Sweifieh, Wakalat Street 5",
    instagram: "pulsefitness",
    menu: [
      ["Memberships", "Monthly membership", "Gym floor and all group classes", 45, "Best seller", true, "services/dumbbell"],
      ["Memberships", "Three months", "Save 15 percent, includes a body scan", 115, null, true, "services/kettlebell"],
      ["Memberships", "Student plan", "Weekdays before 4 pm with a student card", 30, null, false, "services/dumbbell"],
      ["Classes", "Spin class", "45 minutes, all levels", 6, null, false, "services/kettlebell"],
      ["Classes", "Yoga flow", "60 minutes, mats provided", 7, "New", false, "services/yoga"],
      ["Classes", "HIIT", "30 minutes of intervals", 6, null, false, "services/kettlebell"],
      ["Personal training", "One session", "60 minutes with a certified coach", 25, null, false, "services/dumbbell"],
      ["Personal training", "Pack of ten", "Ten sessions, use them in three months", 220, "Signature", true, "services/yoga"],
    ],
  },
  home: {
    name: "Handy Pro",
    address: "Serving all of Amman",
    instagram: "handypro",
    menu: [
      ["Cleaning", "Home deep clean", "Two cleaners, up to 150 square meters", 45, "Best seller", true, "services/spray"],
      ["Cleaning", "Sofa and carpet cleaning", "Steam cleaning, per seat or square meter", 15, null, false, "services/spray"],
      ["Repairs", "AC service", "Clean, gas check and filter, per unit", 20, "Signature", true, "services/snowflake"],
      ["Repairs", "Plumbing visit", "Leaks, taps and heaters, first hour", 18, null, false, "services/drop"],
      ["Repairs", "Handyman hour", "Shelves, curtains, furniture assembly", 12, null, false, "services/wrench"],
      ["Painting", "Room painting", "Walls and ceiling, paint included", 90, "New", false, "services/roller"],
    ],
  },
  shop: {
    name: "Olive and Thread",
    address: "Jabal Al-Weibdeh, Paris Circle 3",
    instagram: "oliveandthread",
    menu: [
      ["Home", "Olive wood candle", "Soy wax, olive wood wick, 40 hours", 12.0, "Best seller", true, "candle"],
      ["Home", "Stoneware mug", "Hand thrown, glazed green, 300 ml", 9.5, null, true, "mug"],
      ["Home", "Pothos in clay pot", "Easy care plant, 15 cm pot", 8.0, null, false, "plant"],
      ["Bath", "Olive oil soap", "Nabulsi soap, three bars", 6.5, "Vegan", true, "soap"],
      ["Bath", "Rose hand cream", "Damask rose and shea, 75 ml", 7.75, "New", false, null],
      ["Bags", "Canvas tote", "Heavy cotton, embroidered logo", 11.0, null, false, "bag"],
      ["Bags", "Market basket", "Woven palm leaf, leather handles", 18.5, null, false, null],
    ],
  },
} satisfies Record<string, Sample>;

export type SampleName = keyof typeof SAMPLES;

/** Content a real owner would type in, so every section of a sample site has something to show. */
const sampleSettings: Settings = {
  "hero.eyebrow": "Since 2019 · Jabal Amman",
  "story.since": "2019",
  gallery: ["/samples/latte-art.svg", "/presets/counter.svg", "/samples/food/croissant.svg", "/templates/souq/art/store.svg", "/presets/beans.svg", "/samples/food/kunafa.svg"],
  "reviews.1.quote": "Best vanilla latte in town, and the pistachio croissant is dangerous. I come here to work every Sunday.",
  "reviews.1.name": "Lina H.",
  "reviews.2.quote": "Quiet, beautiful, and the staff remember your order. The kunafa cheesecake is a must.",
  "reviews.2.name": "Omar K.",
  "reviews.3.quote": "Great coffee and the menu is easy to browse on the phone before you even arrive.",
  "reviews.3.name": "Sara M.",
};

/** Sample pictures: "latte" is a food illustration, "services/tooth" a service one. */
const photoUrl = (name: string) => (name.includes("/") ? `/samples/${name}.svg` : `/samples/food/${name}.svg`);

/** Gallery photos per sample, built from its product pictures. */
function galleryFor(sample: SampleName): string[] {
  if (sample === "cafe") return sampleSettings.gallery as string[];
  const photos = [...new Set(SAMPLES[sample].menu.map((r) => r[6]).filter(Boolean))] as string[];
  return photos.slice(0, 6).map(photoUrl);
}

const id = (n: number) => `00000000-0000-7000-8000-${n.toString().padStart(12, "0")}`;

type RegistryTemplate = (typeof registry.templates)[number] & { sample?: string };

function templateInfo(templateId: string): RegistryTemplate {
  return (registry.templates.find((t) => t.id === templateId) ?? registry.templates[0]) as RegistryTemplate;
}

export function defaultsFor(templateId: string): Settings {
  return { ...(templateInfo(templateId).defaults as Settings) };
}

export function sampleFor(templateId: string): SampleName {
  const name = templateInfo(templateId).sample;
  return name && name in SAMPLES ? (name as SampleName) : "cafe";
}

/** Sample content for the keys this template has. */
const otherReviews: Settings = {
  "hero.eyebrow": "Since 2019 · Amman",
  "reviews.1.quote": "Everything tastes fresh and the portions are generous. We order from here every week.",
  "reviews.2.quote": "Friendly people, quick service and the menu is easy to browse on the phone.",
  "reviews.3.quote": "Our favorite place in the neighborhood. Try the signature, you will not regret it.",
};

/** Reviews that fit a service business instead of a kitchen. */
const serviceReviews: Settings = {
  "reviews.1.quote": "Booked on WhatsApp in a minute and they were on time. Friendly, careful and the price was exactly what they said.",
  "reviews.1.name": "Rania A.",
  "reviews.2.quote": "Professional from the first message to the last. I have already recommended them to my whole family.",
  "reviews.2.name": "Khaled S.",
  "reviews.3.quote": "Clear prices, no surprises and great results. I will definitely be back.",
  "reviews.3.name": "Dana M.",
};
const SERVICE_SAMPLES = new Set<SampleName>(["salon", "clinic", "studio", "gym", "home"]);

function sampleSettingsFor(templateId: string, sample: SampleName): Settings {
  const defaults = defaultsFor(templateId);
  if (SERVICE_SAMPLES.has(sample)) {
    // Service templates bring their own hero copy; only reviews and photos come from the sample.
    const settings: Settings = { ...serviceReviews, gallery: galleryFor(sample) };
    return Object.fromEntries(Object.entries(settings).filter(([key]) => key in defaults));
  }
  const reviews = sample === "cafe" ? {} : otherReviews;
  const settings: Settings = { ...sampleSettings, ...reviews, gallery: galleryFor(sample) };
  return Object.fromEntries(Object.entries(settings).filter(([key]) => key in defaults));
}

export function fixtureFor(templateId: string, overrides: Partial<PublicSite> = {}, sampleName: SampleName = sampleFor(templateId)): PublicSite {
  const sample: Sample = SAMPLES[sampleName];
  const names = [...new Set(sample.menu.map((s) => s[0]))];
  const slug = sample.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  return {
    business: {
      name: sample.name,
      slug: sampleName === "cafe" ? "vanillamenu" : slug,
      whatsApp: "+962790000000",
      email: "hello@example.com",
      address: sample.address,
      instagram: sample.instagram,
      locale: "en",
      currencyCode: "JOD",
      timeZone: "Asia/Amman",
      customDomains: sampleName === "cafe" ? ["vanillamenu.example.com"] : [],
    },
    templateId,
    settings: { ...defaultsFor(templateId), ...sampleSettingsFor(templateId, sampleName) },
    categories: names.map((name, ci) => ({
      id: id(100 + ci),
      name,
      products: sample.menu
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s[0] === name)
        .map<PublicProduct>(({ s, i }) => ({
          id: id(i + 1),
          name: s[1],
          description: s[2],
          price: s[3],
          imageUrl: s[6] ? photoUrl(s[6]) : null,
          label: s[4],
          // The fourth product is sold out in every sample, to show how that looks.
          isAvailable: i !== 3,
          isFeatured: s[5],
        })),
    })),
    publishedAt: "2026-01-01T00:00:00Z",
    isPreview: false,
    ...overrides,
  };
}

/** A menu of `count` products in `categories` categories, with long names and no photos (for stress tests). */
export function bigMenu(site: PublicSite, count: number, categories = 8): PublicSite {
  const long = "with a deliberately long name that has to wrap onto several lines without breaking the layout";
  return {
    ...site,
    categories: Array.from({ length: categories }, (_, c) => ({
      id: id(5000 + c),
      name: c === 0 ? `Category ${c + 1} ${long}` : `Category ${c + 1}`,
      products: Array.from({ length: Math.ceil(count / categories) }, (_, p) => c * Math.ceil(count / categories) + p)
        .filter((n) => n < count)
        .map((n) => ({
          id: id(10000 + n),
          name: n % 7 === 0 ? `Product ${n + 1} ${long}` : `Product ${n + 1}`,
          description: n % 3 === 0 ? null : `Description of product ${n + 1}. ${n % 5 === 0 ? long : ""}`,
          price: 1 + (n % 40) * 0.25,
          imageUrl: null,
          label: n % 9 === 0 ? "New" : null,
          isAvailable: n % 11 !== 5,
          isFeatured: n % 13 === 0,
        })),
    })),
  };
}

export const fixtureSite: PublicSite = fixtureFor(process.env.APP_FIXTURE_TEMPLATE ?? "souq", {}, "cafe");

/**
 * Fixture mode: /vanillamenu shows the sample café with APP_FIXTURE_TEMPLATE,
 * and /<template id> shows the template's own sample business (used for thumbnails and template work).
 */
export function fixtureBySlug(slug: string): PublicSite | null {
  if (slug === fixtureSite.business.slug) return fixtureSite;
  return registry.templates.some((t) => t.id === slug) ? fixtureFor(slug) : null;
}

/**
 * Fixture previews: "fixture" is the sample café; "fixture.<template>.<theme>.<locale>" renders any template in one of
 * its themes and languages (used by the accessibility checks). Theme "default" keeps the template's default.
 */
export function fixturePreview(token: string): PublicSite | null {
  if (token === "fixture") return { ...fixtureSite, isPreview: true };
  const [prefix, templateId, theme, locale] = token.split(".");
  if (prefix !== "fixture" || !registry.templates.some((t) => t.id === templateId)) return null;
  const site = fixtureFor(templateId, { isPreview: true });
  if (theme && theme !== "default") site.settings = { ...site.settings, theme };
  if (locale === "ar") site.business = { ...site.business, locale: "ar" };
  return site;
}
