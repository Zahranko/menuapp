import registry from "../templates/registry.json";
import { brand, demoSlug } from "./brand";
import type { PublicProduct, PublicSite, Settings } from "./types";

/**
 * Sample businesses, used when APP_FIXTURES=1, by tests and for template thumbnails.
 * A template's manifest picks one with "sample" (default "cafe").
 */
type Row = [category: string, name: string, description: string, price: number, label: string | null, featured: boolean, photo: string | null, custom?: [en: string, ar: string]];
/** The Arabic of a row: category ("Parent/Child" like the row), name and description. */
type RowAr = [category: string, name: string, description: string];
/**
 * A sample business. Samples with `menuAr` (one row per `menu` row, in the same order) show their products, categories,
 * name and address in Arabic in Arabic previews (fixture.<id>.<theme>.ar); the others keep their English menu there.
 */
type Sample = { name: string; address: string; instagram: string; menu: Row[]; settings?: Settings; nameAr?: string; addressAr?: string; menuAr?: RowAr[] };

export const SAMPLES = {
  // The demo business every template preview, thumbnail and test uses: named after the brand (brand.json).
  cafe: {
    name: brand.brandName,
    nameAr: brand.brandNameAr || brand.brandName,
    address: "12 Market Street, Old Town",
    instagram: demoSlug,
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
    address: "8 Olive Lane, Old Town",
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
    address: "112 Main Street, Riverside",
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
    address: "40 Park Avenue, Riverside",
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
    address: "77 Garden Road, Riverside",
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
    address: "5 Hill Street, Old Town",
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
    address: "9 Central Boulevard, Downtown",
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
    address: "14 Church Street, Old Town",
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
    address: "12 Hill Street, Old Town",
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
    address: "Studio 4, 1 Square Road, Old Town",
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
    address: "5 High Street, Downtown",
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
    address: "Serving the whole city",
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
    address: "3 Paris Square, Old Town",
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
  /* Pro samples: "Parent/Child" puts a product in a sub-category. */
  maison: {
    name: "Maison Noor",
    address: "4 Hill Street, Old Town",
    instagram: "maisonnoor",
    menu: [
      ["Starters/Cold", "Beef carpaccio", "Shaved parmesan, rocket, truffle oil", 9.5, "Signature", true, "salad"],
      ["Starters/Cold", "Burrata and heirloom tomato", "Basil oil, aged balsamic, sea salt", 8.75, "Vegan", false, "salad"],
      ["Starters/Hot", "Lentil velouté", "Cumin crème, crispy shallots", 5.5, null, false, "soup"],
      ["Starters/Hot", "Seared scallops", "Cauliflower purée, brown butter, capers", 12.0, "New", false, null],
      ["Mains/From the sea", "Wild sea bass", "Saffron beurre blanc, fennel confit", 18.5, "Best seller", true, "sushi"],
      ["Mains/From the sea", "Prawn linguine", "Garlic, chili, cherry tomato, parsley", 15.0, null, false, "noodles"],
      ["Mains/From the grill", "Wagyu striploin", "Smoked salt, bone marrow jus, pommes purée", 32.0, "Signature", true, "grill"],
      ["Mains/From the grill", "Lamb rack", "Za'atar crust, freekeh, mint yogurt", 24.0, "Best seller", false, "grill"],
      ["Desserts", "Kunafa mille-feuille", "Orange blossom cream, pistachio praline", 7.5, "Best seller", true, "kunafa"],
      ["Desserts", "Dark chocolate fondant", "Salted caramel, vanilla bean ice cream", 7.0, null, false, "cake"],
      ["Drinks/Mocktails", "Rose and lychee spritz", "Rose water, lychee, sparkling water", 5.5, null, false, "mocktail"],
      ["Drinks/Mocktails", "Smoked citrus", "Grapefruit, rosemary smoke, tonic", 5.75, "New", false, "juice"],
      ["Drinks/Coffee", "Turkish coffee", "Cardamom, served with Turkish delight", 3.5, null, false, "cortado"],
    ],
  },
  lumen: {
    name: "Lumen Coffee",
    address: "9 Paris Square, Old Town",
    instagram: "lumencoffee",
    menu: [
      ["Coffee/Espresso bar", "Flat white", "Double ristretto, silky milk", 3.25, "Best seller", true, "latte"],
      ["Coffee/Espresso bar", "Cortado", "Equal parts espresso and warm milk", 2.75, null, false, "cortado"],
      ["Coffee/Espresso bar", "Spanish latte", "Condensed milk, double shot", 3.75, "Signature", true, "spanish"],
      ["Coffee/Filter", "V60 of the day", "Ask us which single origin is brewing", 3.95, null, false, "mug"],
      ["Coffee/Iced", "Iced oat latte", "Oat milk, double shot, lots of ice", 3.75, "Vegan", false, "iced"],
      ["Coffee/Iced", "Cold brew tonic", "18-hour cold brew over tonic and orange", 4.0, "New", false, "mocktail"],
      ["Tea", "Karak chai", "Black tea slow cooked with milk and spices", 2.5, null, false, "karak"],
      ["Tea", "Sage and mint", "Fresh maramiya and mint in a glass pot", 2.25, null, false, "tea"],
      ["Bakery/Viennoiserie", "Butter croissant", "Laminated for three days", 1.95, "Best seller", true, "croissant"],
      ["Bakery/Viennoiserie", "Za'atar croissant", "Olive oil, za'atar and sesame", 2.1, null, false, "zaatar"],
      ["Bakery/Cookies", "Brown butter cookie", "Dark chocolate, flaky salt", 1.75, null, false, "cookie"],
      ["Brunch", "Shakshuka", "Two eggs, spiced tomato, warm bread", 5.5, null, false, "soup"],
      ["Brunch", "Avocado toast", "Sourdough, chili flakes, poached egg", 5.95, "Best seller", false, "salad"],
    ],
  },
  atlas: {
    name: "Atlas Supply",
    address: "17 Church Street, Old Town",
    instagram: "atlassupply",
    menu: [
      ["Home/Ceramics", "Speckled mug", "Hand thrown stoneware, 300 ml", 14.0, "Best seller", true, "mug"],
      ["Home/Ceramics", "Serving bowl", "Matte glaze, 24 cm", 22.0, null, false, null],
      ["Home/Candles", "Cedar and fig candle", "Soy wax, 50 hours", 18.0, "Signature", true, "candle"],
      ["Home/Candles", "Oud and amber candle", "Soy wax, wooden wick", 21.0, "New", false, "candle"],
      ["Home/Textiles", "Linen tea towel", "Stonewashed, set of two", 12.5, null, false, "bag"],
      ["Bath and body/Soap", "Olive oil soap", "Cold pressed from local olive oil", 4.5, "Best seller", true, "soap"],
      ["Bath and body/Soap", "Dead Sea mud bar", "Mineral rich, unscented", 5.5, null, false, "soap"],
      ["Bath and body/Care", "Hand balm", "Shea, almond oil and sage", 9.0, "Vegan", false, null],
      ["Plants", "Snake plant", "In a ceramic pot, 40 cm", 16.0, null, false, "plant"],
      ["Plants", "Olive tree", "Two years old, terracotta pot", 28.0, "Best seller", false, "plant"],
      ["Gifts", "Market tote", "Heavy canvas, leather handles", 19.0, null, false, "bag"],
    ],
  },
  ember: {
    name: "Ember and Oak",
    address: "210 Main Street, Riverside",
    instagram: "emberandoak",
    menu: [
      ["Burgers/Beef", "The Ember", "Double smash patty, cheddar, onion jam, ember sauce", 7.5, "Best seller", true, "burger"],
      ["Burgers/Beef", "Truffle mushroom", "Swiss cheese, truffle mayo, sautéed mushrooms", 8.25, "Signature", true, "burger"],
      ["Burgers/Chicken", "Nashville hot", "Crispy chicken, hot honey, pickles, slaw", 6.95, "Spicy", false, "burger"],
      ["Burgers/Chicken", "Grilled chicken", "Lemon garlic marinade, lettuce, toum", 6.25, null, false, "wrap"],
      ["Grill/Steaks", "Ribeye 300 g", "Charcoal grilled, chimichurri, fries", 19.5, "Signature", true, "grill"],
      ["Grill/Skewers", "Shish tawouk", "Yogurt marinade, garlic, grilled peppers", 8.0, "Best seller", false, "grill"],
      ["Grill/Skewers", "Lamb kofta", "Parsley, onion, sumac, flatbread", 8.5, null, false, null],
      ["Sides", "Loaded fries", "Cheese sauce, jalapeño, crispy onions", 3.75, "Best seller", false, "fries"],
      ["Sides", "Charred corn", "Chili butter, lime, cotija", 3.25, null, false, null],
      ["Drinks/Shakes", "Salted caramel shake", "Vanilla ice cream, caramel, sea salt", 4.25, null, false, "smoothie"],
      ["Drinks/Soft drinks", "Fresh lemonade", "Mint, lemon, crushed ice", 2.5, null, false, "juice"],
    ],
  },
  bloom: {
    name: "Bloom Bakery",
    address: "33 High Street, Downtown",
    instagram: "bloombakery",
    menu: [
      ["Cakes/Whole cakes", "Rose and pistachio cake", "Rose sponge, pistachio buttercream, dried petals", 28.0, "Signature", true, "cake"],
      ["Cakes/Whole cakes", "Strawberry shortcake", "Vanilla chiffon, fresh cream, strawberries", 26.0, "Best seller", true, "cake"],
      ["Cakes/Slices", "Lemon drizzle slice", "Lemon curd and crunchy sugar", 3.5, null, false, "cake"],
      ["Cakes/Slices", "Carrot cake slice", "Walnuts, cream cheese frosting", 3.75, null, false, null],
      ["Pastries", "Raspberry danish", "Butter pastry, vanilla custard", 2.5, "New", false, "croissant"],
      ["Pastries", "Cinnamon roll", "Brown sugar, cream cheese glaze", 2.75, "Best seller", true, "croissant"],
      ["Cookies", "Pink velvet cookie", "White chocolate chunks", 1.75, null, false, "cookie"],
      ["Cupcakes", "Vanilla bean cupcake", "Whipped buttercream, sprinkles", 2.25, null, false, "cupcake"],
      ["Cupcakes", "Mango cupcake", "Mango curd centre", 2.25, "Vegan", false, "cupcake"],
      ["Drinks", "Strawberry milk", "Fresh strawberries, cold milk", 2.75, null, false, "smoothie"],
      ["Drinks", "Iced rose latte", "Rose syrup, espresso, milk", 3.5, null, false, "iced"],
    ],
  },
  /* Clothing stores: sizes and colors are part of the description ("Sizes: S–XL. Colors: Sand, Black"), sale prices a custom label. */
  folio: {
    name: "Linea Studio",
    address: "21 Gallery Row, Old Town",
    instagram: "lineastudio",
    nameAr: "لينيا ستوديو",
    addressAr: "21 شارع الغاليري، البلدة القديمة",
    menu: [
      ["New in", "Linen wrap dress", "Washed linen, midi length, tie waist. Sizes: XS–L. Colors: Terracotta, Sand", 89, "New", true, "fashion/dress"],
      ["New in", "Oversized poplin shirt", "Crisp cotton poplin, dropped shoulder. Sizes: S–XL. Colors: White, Sky", 54, null, false, "fashion/shirt"],
      ["Women", "Wide-leg trousers", "High rise, pressed crease, wool blend. Sizes: XS–XL", 72, "Best seller", true, "fashion/trousers"],
      ["Women", "Ribbed merino top", "Fine merino rib, slim fit. Sizes: XS–L", 46, null, false, "fashion/knit"],
      ["Women", "Pleated midi skirt", "Satin finish, elastic waist. Sizes: S–L. Colors: Sage, Black", 64, null, false, "fashion/skirt"],
      ["Men", "Relaxed cotton tee", "Heavyweight jersey, boxy fit. Sizes: S–XXL", 28, null, false, "fashion/tee"],
      ["Men", "Unstructured blazer", "Linen and cotton, half lined. Sizes: S–XL", 140, "Signature", true, "fashion/blazer"],
      ["Men", "Straight denim", "Rigid indigo denim, straight leg. Sizes: 28, 30, 32, 34, 36", 68, null, false, "fashion/jeans"],
      ["Accessories", "Leather tote", "Full-grain leather, inner zip pocket", 120, null, false, "fashion/bag"],
      ["Accessories", "Silk square scarf", "Hand-rolled edges, 70 × 70 cm", 38, null, false, "fashion/scarf"],
      ["Sale", "Wool overcoat", "Double-faced wool, knee length. Was 260. Sizes: S, M", 182, "Custom", false, "fashion/coat", ["Sale −30%", "تخفيض 30%"]],
      ["Sale", "Canvas sneakers", "Organic canvas, natural rubber sole. Sizes: 38–45", 39, "Custom", false, "fashion/sneakers", ["−40%", "−40%"]],
    ],
    menuAr: [
      ["وصل حديثًا", "فستان كتان ملفوف", "كتان مغسول، طول متوسط، ربطة عند الخصر. المقاسات: XS–L. الألوان: تيراكوتا، رملي"],
      ["وصل حديثًا", "قميص بوبلين واسع", "قطن بوبلين ناعم، كتف منسدل. المقاسات: S–XL. الألوان: أبيض، سماوي"],
      ["نساء", "بنطال واسع الساقين", "خصر عالٍ، كسرة مكوية، مزيج صوف. المقاسات: XS–XL"],
      ["نساء", "بلوزة ميرينو مضلعة", "صوف ميرينو ناعم، قصة ضيقة. المقاسات: XS–L"],
      ["نساء", "تنورة ميدي بكسرات", "لمسة ساتان، خصر مطاطي. المقاسات: S–L. الألوان: أخضر مريمي، أسود"],
      ["رجال", "تيشيرت قطني مريح", "قطن ثقيل، قصة مربعة. المقاسات: S–XXL"],
      ["رجال", "بليزر بلا بطانة كاملة", "كتان وقطن، نصف مبطن. المقاسات: S–XL"],
      ["رجال", "جينز مستقيم", "دنيم نيلي متين، قصة مستقيمة. المقاسات: 28، 30، 32، 34، 36"],
      ["إكسسوارات", "حقيبة جلد كبيرة", "جلد طبيعي كامل، جيب داخلي بسحاب"],
      ["إكسسوارات", "إيشارب حرير مربع", "حواف ملفوفة يدويًا، 70 × 70 سم"],
      ["تخفيضات", "معطف صوف", "صوف بوجهين، بطول الركبة. كان 260. المقاسات: S، M"],
      ["تخفيضات", "حذاء قماشي", "قماش عضوي، نعل مطاط طبيعي. المقاسات: 38–45"],
    ],
  },
  drop: {
    name: "Block Nine",
    address: "9 Warehouse Lane, Downtown",
    instagram: "blocknine",
    nameAr: "بلوك ناين",
    addressAr: "9 شارع المستودعات، وسط البلد",
    menu: [
      ["New drop", "Heavyweight hoodie", "450 g brushed fleece, oversized. Sizes: S–XXL. Colors: Charcoal, Bone", 65, "New", true, "fashion/hoodie"],
      ["New drop", "Varsity jacket", "Wool body, faux leather sleeves, snap front. Sizes: S–XL", 129, "Best seller", true, "fashion/jacket"],
      ["Tees", "Boxy graphic tee", "Screen printed, 240 g cotton. Sizes: XS–XXL", 32, null, true, "fashion/tee"],
      ["Tees", "Kids logo tee", "Soft cotton for ages 4 to 12. Sizes: 4Y, 6Y, 8Y, 10Y, 12Y", 22, null, false, "fashion/kids"],
      ["Bottoms", "Utility cargo pants", "Ripstop cotton, six pockets, drawcord hem. Sizes: S–XL", 74, null, false, "fashion/cargo"],
      ["Bottoms", "Loose fit jeans", "Washed denim, wide leg. Sizes: 28–36", 69, null, false, "fashion/jeans"],
      ["Sneakers", "Court low sneakers", "Leather upper, gum sole. Sizes: 39–46", 95, "Signature", true, "fashion/sneakers"],
      ["Accessories", "Crossbody bag", "Water-repellent nylon, adjustable strap", 35, null, false, "fashion/crossbody"],
      ["Accessories", "Bucket hat", "Washed cotton twill. One size", 24, null, false, "fashion/hat"],
      ["Sale", "Track shades", "UV400 lenses, matte frame", 18, "Custom", false, "fashion/sunglasses", ["Sale −50%", "تخفيض 50%"]],
    ],
    menuAr: [
      ["الإصدار الجديد", "هودي ثقيل", "فليس 450 غرام، قصة واسعة. المقاسات: S–XXL. الألوان: فحمي، عظمي"],
      ["الإصدار الجديد", "جاكيت فارسيتي", "جسم صوف، أكمام جلد صناعي، أزرار كبس. المقاسات: S–XL"],
      ["تيشيرتات", "تيشيرت مربع بطبعة", "طباعة شاشة، قطن 240 غرام. المقاسات: XS–XXL"],
      ["تيشيرتات", "تيشيرت أطفال", "قطن ناعم من عمر 4 إلى 12 سنة. المقاسات: 4Y، 6Y، 8Y، 10Y، 12Y"],
      ["بناطيل", "بنطال كارغو", "قطن ريبستوب، ستة جيوب، حافة برباط. المقاسات: S–XL"],
      ["بناطيل", "جينز واسع", "دنيم مغسول، ساق واسعة. المقاسات: 28–36"],
      ["أحذية رياضية", "سنيكرز منخفض", "جلد علوي، نعل مطاطي. المقاسات: 39–46"],
      ["إكسسوارات", "حقيبة كتف", "نايلون مقاوم للماء، حزام قابل للتعديل"],
      ["إكسسوارات", "قبعة باكيت", "قطن تويل مغسول. مقاس واحد"],
      ["تخفيضات", "نظارة شمسية", "عدسات UV400، إطار مطفي"],
    ],
  },
  couture: {
    name: "Dar Layla",
    address: "4 Jasmine Avenue, Hill District",
    instagram: "darlayla",
    nameAr: "دار ليلى",
    addressAr: "4 جادة الياسمين، حي التلال",
    menu: [
      ["Women/Dresses", "Silk slip dress", "Bias-cut silk satin, adjustable straps. Sizes: XS–L. Colors: Garnet, Champagne", 240, "New", true, "fashion/dress"],
      ["Women/Dresses", "Pleated evening skirt", "Sunray pleats, satin waistband. Sizes: XS–L", 165, null, false, "fashion/skirt"],
      ["Women/Abayas", "Embroidered abaya", "Crepe with hand-stitched gold trim. Sizes: 52, 54, 56, 58", 320, "Signature", true, "fashion/abaya"],
      ["Women/Knitwear", "Cashmere crewneck", "Pure cashmere, relaxed fit. Sizes: XS–L", 210, null, false, "fashion/knit"],
      ["Men/Tailoring", "Midnight blazer", "Wool and mohair, soft shoulder. Sizes: 46–54", 380, "Best seller", true, "fashion/blazer"],
      ["Men/Tailoring", "Camel overcoat", "Double-faced wool and cashmere. Sizes: S–XL", 520, null, false, "fashion/coat"],
      ["Men/Shirts", "Poplin dress shirt", "Two-ply cotton, mother-of-pearl buttons. Sizes: 38–44", 120, null, false, "fashion/shirt"],
      ["Kids", "Linen party set", "Shirt and shorts in washed linen. Sizes: 2Y–8Y", 85, null, false, "fashion/kids"],
      ["Accessories/Bags", "Leather tote", "Vegetable-tanned leather, hand painted edges", 290, "Best seller", true, "fashion/bag"],
      ["Accessories/Scarves", "Printed silk carré", "Hand-rolled edges, 90 × 90 cm", 140, null, false, "fashion/scarf"],
      ["Sale", "Wide-leg trousers", "Wool crepe, pressed crease. Was 210. Sizes: XS, S", 147, "Custom", false, "fashion/trousers", ["Sale −30%", "تخفيض 30%"]],
      ["Sale", "Tortoise sunglasses", "Acetate frame, gradient lenses", 96, "Custom", false, "fashion/sunglasses", ["Last pieces", "آخر القطع"]],
    ],
    menuAr: [
      ["نساء/فساتين", "فستان حرير ناعم", "ساتان حريري بقصة مائلة، حمالات قابلة للتعديل. المقاسات: XS–L. الألوان: عنابي، شامبانيا"],
      ["نساء/فساتين", "تنورة سهرة بكسرات", "كسرات شعاعية، حزام ساتان. المقاسات: XS–L"],
      ["نساء/عبايات", "عباية مطرزة", "كريب بتطريز ذهبي يدوي. المقاسات: 52، 54، 56، 58"],
      ["نساء/تريكو", "كنزة كشمير", "كشمير خالص، قصة مريحة. المقاسات: XS–L"],
      ["رجال/بدلات", "بليزر كحلي داكن", "صوف وموهير، كتف ناعم. المقاسات: 46–54"],
      ["رجال/بدلات", "معطف جملي", "صوف وكشمير بوجهين. المقاسات: S–XL"],
      ["رجال/قمصان", "قميص بوبلين رسمي", "قطن مزدوج، أزرار صدف. المقاسات: 38–44"],
      ["أطفال", "طقم كتان للمناسبات", "قميص وشورت من الكتان المغسول. المقاسات: 2Y–8Y"],
      ["إكسسوارات/حقائب", "حقيبة جلد كبيرة", "جلد مدبوغ نباتيًا، حواف مطلية يدويًا"],
      ["إكسسوارات/أوشحة", "وشاح حرير مطبوع", "حواف ملفوفة يدويًا، 90 × 90 سم"],
      ["تخفيضات", "بنطال واسع الساقين", "كريب صوفي، كسرة مكوية. كان 210. المقاسات: XS، S"],
      ["تخفيضات", "نظارة شمسية بإطار صدفي", "إطار أسيتات، عدسات متدرجة"],
    ],
  },
  // The onboarding "your website" picture (showcaseSite): the brand-named café, filled like a real owner would.
  showcase: {
    name: brand.brandName,
    nameAr: brand.brandNameAr || brand.brandName,
    address: "21 Rainbow Street, Jabal Amman",
    addressAr: "21 شارع الرينبو، جبل عمّان",
    instagram: demoSlug,
    menu: [
      ["Coffee", "Flat white", "Double ristretto, silky milk", 3.25, "Best seller", true, "latte"],
      ["Coffee", "Spanish latte", "Condensed milk, double shot, a little cinnamon", 3.75, "Signature", true, "spanish"],
      ["Coffee", "Cardamom cortado", "Espresso and warm milk, a pinch of cardamom", 2.75, "New", false, "cortado"],
      ["Coffee", "Iced caramel latte", "House caramel, oat milk, lots of ice", 3.95, null, true, "iced"],
      ["Coffee", "V60 of the day", "Ask us which single origin is brewing", 3.95, null, false, "mug"],
      ["Coffee", "Cold brew tonic", "18-hour cold brew over tonic and orange", 4.0, "New", false, "mocktail"],
      ["Tea", "Karak chai", "Black tea slow cooked with milk and spices", 2.5, null, false, "karak"],
      ["Tea", "Sage and mint", "Fresh maramiya and mint in a glass pot", 2.25, null, false, "tea"],
      ["Bakery", "Pistachio croissant", "Butter croissant filled with pistachio cream", 2.25, "Best seller", true, "croissant"],
      ["Bakery", "Za'atar croissant", "Olive oil, za'atar and sesame", 1.95, "Vegan", false, "zaatar"],
      ["Bakery", "Date and tahini cookie", "Chewy, salted, baked every morning", 1.5, null, false, "cookie"],
      ["Desserts", "Kunafa cheesecake", "Baked cheesecake on a crisp kunafa base", 4.5, "Signature", true, "kunafa"],
      ["Desserts", "Saffron cake", "Saffron sponge with cardamom cream", 4.0, null, false, "cake"],
      ["Desserts", "Honey waffle", "Belgian waffle, berries and local honey", 3.75, null, false, "waffle"],
    ],
    menuAr: [
      ["قهوة", "فلات وايت", "ريستريتو مزدوج وحليب مخملي"],
      ["قهوة", "سبانش لاتيه", "حليب مكثف وشوت مزدوج ورشة قرفة"],
      ["قهوة", "كورتادو بالهيل", "إسبريسو وحليب دافئ مع رشة هيل"],
      ["قهوة", "آيس لاتيه بالكراميل", "كراميل من صنعنا، حليب الشوفان، وثلج كثير"],
      ["قهوة", "V60 اليوم", "اسألنا عن المحصول المختص الذي نحضّره اليوم"],
      ["قهوة", "كولد برو تونك", "كولد برو 18 ساعة مع التونك والبرتقال"],
      ["شاي", "شاي كرك", "شاي أسود مطبوخ على مهل مع الحليب والبهارات"],
      ["شاي", "ميرمية ونعناع", "ميرمية ونعناع طازج في إبريق زجاجي"],
      ["مخبوزات", "كرواسون بالفستق", "كرواسون بالزبدة محشو بكريمة الفستق"],
      ["مخبوزات", "كرواسون بالزعتر", "زيت زيتون وزعتر وسمسم"],
      ["مخبوزات", "كوكيز التمر والطحينة", "طرية ومملحة، تُخبز كل صباح"],
      ["حلويات", "تشيز كيك بالكنافة", "تشيز كيك مخبوز على قاعدة كنافة مقرمشة"],
      ["حلويات", "كيكة الزعفران", "إسفنج بالزعفران مع كريمة الهيل"],
      ["حلويات", "وافل بالعسل", "وافل بلجيكي مع التوت والعسل البلدي"],
    ],
  },
} satisfies Record<string, Sample>;

export type SampleName = keyof typeof SAMPLES;

/** Content a real owner would type in, so every section of a sample site has something to show. */
const sampleSettings: Settings = {
  "hero.eyebrow": "Since 2019 · Old Town",
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

/** The template's Arabic starter text (manifest "defaultsAr"), which overrides its English text defaults for Arabic businesses. */
export function arabicDefaultsFor(templateId: string): Settings {
  return { ...((templateInfo(templateId) as { defaultsAr?: Settings }).defaultsAr ?? {}) };
}

export function sampleFor(templateId: string): SampleName {
  const name = templateInfo(templateId).sample;
  return name && name in SAMPLES ? (name as SampleName) : "cafe";
}

/** Sample content for the keys this template has. */
const otherReviews: Settings = {
  "hero.eyebrow": "Since 2019 · Old Town",
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

/** Reviews that fit a clothing store. */
const fashionReviews: Settings = {
  "reviews.1.quote": "The fit is perfect and the fabric feels even better than in the photos. They held my size and sent it the same day.",
  "reviews.1.name": "Lina H.",
  "reviews.2.quote": "I asked about sizes on WhatsApp and got an answer in minutes, with photos. My new favorite shop.",
  "reviews.2.name": "Omar K.",
  "reviews.3.quote": "Beautiful pieces that last. The exchange was easy when I needed a smaller size.",
  "reviews.3.name": "Sara M.",
};
const fashionReviewsAr: Settings = {
  "reviews.1.quote": "المقاس مثالي والقماش أجمل من الصور. حجزوا لي المقاس وأرسلوه في اليوم نفسه.",
  "reviews.1.name": "لينا ح.",
  "reviews.2.quote": "سألت عن المقاسات على واتساب وجاءني الرد خلال دقائق مع صور. صار متجري المفضل.",
  "reviews.2.name": "عمر ك.",
  "reviews.3.quote": "قطع جميلة تدوم طويلًا، والاستبدال كان سهلًا عندما احتجت مقاسًا أصغر.",
  "reviews.3.name": "سارة م.",
};
const FASHION_SAMPLES = new Set<SampleName>(["folio", "drop", "couture"]);

function sampleSettingsFor(templateId: string, sample: SampleName, arabic = false): Settings {
  const defaults = defaultsFor(templateId);
  if (SERVICE_SAMPLES.has(sample)) {
    // Service templates bring their own hero copy; only reviews and photos come from the sample.
    const settings: Settings = { ...serviceReviews, gallery: galleryFor(sample) };
    return Object.fromEntries(Object.entries(settings).filter(([key]) => key in defaults));
  }
  const reviews = sample === "cafe" ? {} : FASHION_SAMPLES.has(sample) ? (arabic ? fashionReviewsAr : fashionReviews) : otherReviews;
  const settings: Settings = { ...sampleSettings, ...reviews, gallery: galleryFor(sample) };
  // Fashion templates keep their own line above the headline (a season, a drop number).
  if (FASHION_SAMPLES.has(sample)) delete settings["hero.eyebrow"];
  return Object.fromEntries(Object.entries(settings).filter(([key]) => key in defaults));
}

/** "Coffee/Iced" adds a "Coffee" main category (without products of its own) before its first sub-category. */
function categoriesOf(names: string[]): { name: string; parent: string | null }[] {
  const out: { name: string; parent: string | null }[] = [];
  for (const name of names) {
    const parent = name.includes("/") ? name.split("/")[0] : null;
    if (parent !== null && !out.some((c) => c.name === parent)) out.push({ name: parent, parent: null });
    out.push({ name, parent });
  }
  return out;
}

/** The sample's menu, with its Arabic category names, product names and descriptions when `arabic` and it has them. */
function menuOf(sample: Sample, arabic: boolean): Row[] {
  if (!arabic || !sample.menuAr) return sample.menu;
  return sample.menu.map((row, i) => {
    const [category, name, description] = sample.menuAr![i] ?? row;
    return [category, name, description, ...row.slice(3)] as Row;
  });
}

/** `arabic`: the sample's Arabic menu, name and address where it has them (Arabic previews). */
export function fixtureFor(templateId: string, overrides: Partial<PublicSite> = {}, sampleName: SampleName = sampleFor(templateId), arabic = false): PublicSite {
  const sample: Sample = SAMPLES[sampleName];
  const menu = menuOf(sample, arabic);
  const names = [...new Set(menu.map((s) => s[0]))];
  const slug = sample.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  return {
    business: {
      name: (arabic && sample.nameAr) || sample.name,
      slug: sampleName === "cafe" ? demoSlug : slug,
      whatsApp: "+15555550123",
      email: "hello@example.com",
      address: (arabic && sample.addressAr) || sample.address,
      instagram: sample.instagram,
      locale: "en",
      currencyCode: "USD",
      timeZone: "UTC",
      customDomains: sampleName === "cafe" ? [`${demoSlug}.example.com`] : [],
      phone: "+15555550100",
      facebook: sample.instagram,
      tikTok: sample.instagram,
      snapchat: sample.instagram,
    },
    templateId,
    settings: { ...defaultsFor(templateId), ...sampleSettingsFor(templateId, sampleName, arabic) },
    categories: categoriesOf(names).map(({ name, parent }, ci, all) => ({
      id: id(100 + ci),
      name: name.split("/").pop()!,
      ...(parent !== null && { parentId: id(100 + all.findIndex((c) => c.name === parent)) }),
      products: menu
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s[0] === name)
        .map<PublicProduct>(({ s, i }) => ({
          id: id(i + 1),
          name: s[1],
          description: s[2],
          price: s[3],
          imageUrl: s[6] ? photoUrl(s[6]) : null,
          label: s[4],
          ...(s[7] && { customLabel: s[7][0], customLabelAr: s[7][1] }),
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

/** Settings of the showcase site, in English and Arabic: every section filled, warm colors, real-feeling copy. */
const SHOWCASE_SETTINGS: Record<"en" | "ar", Settings> = {
  en: {
    "hero.sticker": "Roasted this week",
    "hero.title": "Good coffee, slow mornings.",
    "hero.subtitle": "Specialty coffee roasted in-house, croissants out of the oven at 7 and a sunny corner to stay a while.",
    ticker: "Fresh roast, Pistachio croissants, Oat milk, Kunafa cheesecake, Iced everything",
    "story.title": "A small bar with a big espresso machine.",
    "story.text": "We roast twice a week, bake before sunrise and know most of our guests by name. Come for a flat white, stay for the light.",
    "footer.text": "Roasted in small batches. Baked every morning.",
    "reviews.1.quote": "The pistachio croissant is dangerous and the flat white is the best in town. I work from here every Sunday.",
    "reviews.1.name": "Lina H.",
    "reviews.2.quote": "Bright, friendly and the staff remember your order. The kunafa cheesecake is a must.",
    "reviews.2.name": "Omar K.",
    "reviews.3.quote": "I check the menu on my phone on the way and it is ready when I arrive.",
    "reviews.3.name": "Sara M.",
  },
  ar: {
    "hero.sticker": "محمّصة هذا الأسبوع",
    "hero.title": "قهوة طيبة وصباحات هادئة.",
    "hero.subtitle": "قهوة مختصة نحمّصها بأنفسنا، وكرواسون يخرج من الفرن في السابعة، وركن مشمس تجلس فيه على راحتك.",
    ticker: "تحميص طازج، كرواسون بالفستق، حليب الشوفان، تشيز كيك بالكنافة، كل شيء مثلّج",
    "story.title": "بار صغير وآلة إسبريسو كبيرة.",
    "story.text": "نحمّص مرتين في الأسبوع، ونخبز قبل الشروق، ونعرف معظم ضيوفنا بأسمائهم. تعال من أجل فلات وايت، وابقَ من أجل الضوء.",
    "footer.text": "محمّصة على دفعات صغيرة. مخبوزة كل صباح.",
    "reviews.1.quote": "كرواسون الفستق خطير والفلات وايت الأفضل في المدينة. أعمل من هنا كل يوم أحد.",
    "reviews.1.name": "لينا ح.",
    "reviews.2.quote": "مكان مشرق ولطيف، والفريق يتذكر طلبك. التشيز كيك بالكنافة لا بد منه.",
    "reviews.2.name": "عمر ك.",
    "reviews.3.quote": "أتصفح المنيو على هاتفي في الطريق، فيكون طلبي جاهزًا حين أصل.",
    "reviews.3.name": "سارة م.",
  },
};

/** Template of the showcase site: Lumen, the bold specialty-café design. */
export const SHOWCASE_TEMPLATE = "lumen";

/**
 * The brand-named café at its best, for the app's onboarding pictures (e2e/onboarding-shots.spec.ts):
 * fixture mode serves it at /showcase (English) and /showcasear (Arabic).
 */
export function showcaseSite(arabic = false): PublicSite {
  const site = fixtureFor(SHOWCASE_TEMPLATE, {}, "showcase", arabic);
  site.business = { ...site.business, locale: arabic ? "ar" : "en", currencyCode: "USD", customDomains: [] };
  site.settings = {
    ...site.settings,
    ...(arabic ? arabicDefaultsFor(SHOWCASE_TEMPLATE) : {}),
    ...SHOWCASE_SETTINGS[arabic ? "ar" : "en"],
    theme: "cream",
    accent: "#FF5A1F",
    "hero.image": "preset:pour",
    "story.image": "preset:beans",
    gallery: ["/samples/latte-art.svg", "/presets/counter.svg", "/samples/food/croissant.svg", "/presets/beans.svg", "/samples/food/kunafa.svg", "/presets/pour.svg"],
    "gallery.products": false,
    // Arabic in the brand's Arabic face (brand.json fontArabic is Cairo).
    ...(arabic ? { "font.family": "cairo" } : {}),
  };
  // Everything is in stock on the showcase.
  site.categories = site.categories.map((c) => ({ ...c, products: c.products.map((p) => ({ ...p, isAvailable: true })) }));
  return site;
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
 * Fixture mode: /<demoSlug> shows the sample café with APP_FIXTURE_TEMPLATE,
 * /showcase and /showcasear show the onboarding showcase (showcaseSite),
 * and /<template id> shows the template's own sample business (used for thumbnails and template work).
 */
export function fixtureBySlug(slug: string): PublicSite | null {
  if (slug === fixtureSite.business.slug) return fixtureSite;
  if (slug === "showcase" || slug === "showcasear") return showcaseSite(slug === "showcasear");
  return registry.templates.some((t) => t.id === slug) ? fixtureFor(slug) : null;
}

/**
 * Fixture previews: "fixture" is the sample café; "fixture.<template>.<theme>.<locale>" renders any template in one of
 * its themes and languages (used by the accessibility checks). Theme "default" keeps the template's default.
 * Locale "ar" also swaps in the template's Arabic starter text.
 */
export function fixturePreview(token: string): PublicSite | null {
  if (token === "fixture") return { ...fixtureSite, isPreview: true };
  const [prefix, templateId, theme, locale, logo] = token.split(".");
  if (prefix !== "fixture" || !registry.templates.some((t) => t.id === templateId)) return null;
  const site = fixtureFor(templateId, { isPreview: true }, sampleFor(templateId), locale === "ar");
  if (theme && theme !== "default") site.settings = { ...site.settings, theme };
  if (locale === "ar") {
    site.business = { ...site.business, locale: "ar" };
    site.settings = { ...site.settings, ...arabicDefaultsFor(templateId) };
  }
  if (logo) {
    site.settings = { ...site.settings, ...fixtureLogoSettings(logo, site.business.slug) };
    applySiteOptions(site, logo);
  }
  return site;
}

/** Long business names for footer tests: one with spaces, one long word, in English and Arabic (all within 60 characters). */
export const LONG_NAMES = {
  en: { name: "The Golden Spoon Family Restaurant and Café of Old Town", word: "Supercalifragilisticexpialidociousbakeryandcafe" },
  ar: { name: "مطعم ومقهى الملعقة الذهبية العائلي في البلدة القديمة", word: "مخبزالملعقةالذهبيةالعائليةللحلوياتوالمعجناتالشرقية" },
};

/**
 * Site options for a fixture preview, from the same token part as the logo options ("-" between options):
 * "longname" / "longword" (a long business name), "foot_medium" / "foot_small" (footer name size), "social" (every
 * account shown), "order_<action>" (whatsapp, call, instagram, facebook, hide), "shape_<shape>" (pill, rounded, circle),
 * "font_<name>" (a shared font, see _kit/fonts.ts), "accent_<rrggbb>" (a custom accent color), "bg_<rrggbb>" (a background
 * color, see _kit/background.ts), "nowa" (no WhatsApp) and
 * "labels" (every product label, including long custom ones).
 * ":" works in place of "_" in tests; page addresses escape it, so links use "_".
 */
export function applySiteOptions(site: PublicSite, options: string): void {
  const locale = site.business.locale === "ar" ? "ar" : "en";
  for (const option of options.split("-")) {
    const [key, value = ""] = option.split(/[:_]/);
    if (key === "longname") site.business = { ...site.business, name: LONG_NAMES[locale].name };
    else if (key === "longword") site.business = { ...site.business, name: LONG_NAMES[locale].word };
    else if (key === "nowa") site.business = { ...site.business, whatsApp: null };
    else if (key === "social") site.settings = { ...site.settings, "social.show": ["instagram", "whatsapp", "facebook", "tiktok", "snapchat", "phone"] };
    else if (key === "foot") site.settings = { ...site.settings, "footer.nameSize": value };
    else if (key === "order") site.settings = { ...site.settings, "order.action": value };
    else if (key === "shape") site.settings = { ...site.settings, "order.shape": value };
    else if (key === "font") site.settings = { ...site.settings, "font.family": value };
    else if (key === "accent") site.settings = { ...site.settings, accent: `#${value.toUpperCase()}` };
    else if (key === "bg") site.settings = { ...site.settings, "colors.background": `#${value.toUpperCase()}` };
    else if (key === "labels") applyAllLabels(site);
    else if (key === "gal" || key === "galp") applyGalleryOption(site, Number(value), key === "galp");
    else applyCardAndHeroOption(site, key, value);
  }
}

/** Host of the sample gallery photos in fixture previews; it does not exist, so tests and screenshots answer it themselves. */
export const FIXTURE_PHOTO_HOST = "fixture-photo.invalid";
/** Gallery photo sizes the fixture cycles through: very tall, very wide, tiny, landscape, portrait, square. */
export const FIXTURE_PHOTO_SIZES = ["300x1500", "1800x240", "16x12", "1200x800", "800x1200", "900x900"];

/**
 * Gallery options for fixture previews (same token part as applySiteOptions): "gal_<n>" gives the owner n gallery photos
 * (1 to 12) of odd sizes at https://fixture-photo.invalid/<n>-<w>x<h>.svg and leaves product photos out of Pro
 * galleries; "galp_<n>" keeps the product photos (which carry the product names) after them.
 */
function applyGalleryOption(site: PublicSite, count: number, products: boolean): void {
  const n = Math.min(12, Math.max(1, Math.round(count) || 1));
  const gallery = Array.from({ length: n }, (_, i) => `https://${FIXTURE_PHOTO_HOST}/${i + 1}-${FIXTURE_PHOTO_SIZES[i % FIXTURE_PHOTO_SIZES.length]}.svg`);
  site.settings = { ...site.settings, gallery, "gallery.products": products };
}

/** Sample hero photos for slider previews ("slides"), at most six. */
export const FIXTURE_SLIDES = ["/presets/loft.svg", "/presets/counter.svg", "/presets/marble.svg", "/presets/pour.svg", "/presets/arches.svg", "/presets/shelf.svg"];

const CARD_KEYS: Record<string, string> = { card: "cards.style", border: "cards.border", corners: "cards.corners", photo: "cards.photo", spacing: "cards.spacing" };
const HERO_KEYS: Record<string, string> = { trans: "hero.transition", speed: "hero.speed", height: "hero.height", overlay: "hero.overlay", text: "hero.textPosition" };

/**
 * Card and hero slider options for fixture previews (same token part as applySiteOptions): "card_<style>",
 * "border_<width>", "bc_<accent|ink|rrggbb>" (border color), "corners_<size>", "photo_<shape>", "spacing_<tight|airy>";
 * "slides" or "slides_<n>" (n hero photos in all, 2 to 6), "trans_<slide|fade|zoom>", "speed_<slow|normal|fast>",
 * "auto_off" (no autoplay), "ctrl_<both|dots|arrows|none>", "height_<size>", "overlay_<amount>", "text_<position>".
 */
function applyCardAndHeroOption(site: PublicSite, key: string, value: string): void {
  const set = (settings: Settings) => (site.settings = { ...site.settings, ...settings });
  if (key in CARD_KEYS) set({ [CARD_KEYS[key]]: value });
  else if (key === "bc") set({ "cards.borderColor": /^[0-9a-f]{6}$/i.test(value) ? `#${value.toUpperCase()}` : value });
  else if (key in HERO_KEYS) set({ [HERO_KEYS[key]]: value });
  else if (key === "auto") set({ "hero.autoplay": value !== "off" });
  else if (key === "ctrl") set({ "hero.controls": value === "both" ? ["dots", "arrows"] : value === "none" ? [] : [value] });
  else if (key === "slides") {
    const count = Math.min(6, Math.max(2, Number(value) || 3));
    const photos = FIXTURE_SLIDES.slice(0, count);
    if ("hero.images" in site.settings) {
      // Templates with several hero photos of their own: the slideshow layout where they have one.
      const layout = site.settings["hero.layout"];
      const slider = layout === "cover" || layout === "split" || layout === "poster" || layout === "full" ? "slides" : layout === "blob" ? "slider" : layout;
      set({ "hero.images": photos, ...(typeof layout === "string" ? { "hero.layout": slider } : {}) });
    } else if (typeof site.settings["hero.image"] === "string") set({ "hero.image": photos[0], "hero.slides": photos.slice(1) });
    else set({ "hero.slides": photos });
  }
}

/** Custom label texts at the 24-character limit: one with spaces, one long word (badge layout tests). */
export const LONG_LABELS = {
  en: { text: "Limited weekend special!", word: "Chefsrecommendationtoday" },
  ar: { text: "عرض خاص لنهاية الأسبوع", word: "توصيةالشيفلهذااليومفقط" },
};

/** Gives the products, in menu order, every label in turn: the five fixed ones, then two long custom ones. */
function applyAllLabels(site: PublicSite): void {
  const fixed = ["Signature", "New", "Best seller", "Vegan", "Spicy"];
  let n = 0;
  site.categories = site.categories.map((c) => ({
    ...c,
    products: c.products.map((p) => {
      const i = n++ % (fixed.length + 2);
      if (i < fixed.length) return { ...p, label: fixed[i], customLabel: null, customLabelAr: null };
      const key = i === fixed.length ? "text" : "word";
      return { ...p, label: "Custom", customLabel: LONG_LABELS.en[key], customLabelAr: LONG_LABELS.ar[key] };
    }),
  }));
}

/** Host of the sample logo in fixture previews; it does not exist, so tests and screenshots answer it themselves. */
export const FIXTURE_LOGO_HOST = "fixture-logo.invalid";

/**
 * Logo options for a fixture preview, from the token's fifth part ("fixture.<id>.<theme>.<locale>.<options>"):
 * options joined by "-": "logo" (a sample logo at https://fixture-logo.invalid/<slug>.png), "bare" (frame off),
 * "s70" to "s180" (size), "center" (centered) and "noname" (business name hidden).
 */
export function fixtureLogoSettings(options: string, slug: string): Settings {
  const settings: Settings = {};
  for (const option of options.split("-")) {
    if (option === "logo") settings.logo = `https://${FIXTURE_LOGO_HOST}/${slug}.png`;
    else if (option === "bare") settings["logo.frame"] = false;
    else if (option === "center") settings["logo.position"] = "center";
    else if (option === "noname") settings["logo.name"] = false;
    else if (/^s\d{2,3}$/.test(option)) settings["logo.size"] = Number(option.slice(1));
  }
  return settings;
}
