/** Words the fashion templates (Folio, Drop, Couture) share. Shared site words come from lib/i18n.ts. */
const en = {
  shop: "Shop",
  shopAll: "Shop all",
  collections: "Collections",
  newIn: "New in",
  lookbook: "Lookbook",
  sizes: "Sizes",
  size: "Size",
  chooseSize: "Choose your size",
  colors: "Colors",
  inStock: "In stock",
  order: "Order on WhatsApp",
  askSize: "Ask about sizes",
  orderMessage: "Hello, I would like to order: {name} ({price})",
  sizeMessage: ", size {size}",
  askMessage: "Hello, do you have {name} in my size?",
  photo: "Photo {n}",
  openPhoto: "Open photo {n}",
  prev: "Previous photo",
  next: "Next photo",
  pieces: "pieces",
  viewAll: "View all",
  details: "View details",
  exchange: "Free exchanges within 14 days",
  find: "Search the shop",
  empty: "Nothing matches. Try another word or collection.",
};

type Copy = { [K in keyof typeof en]: string };

const ar: Copy = {
  shop: "المتجر",
  shopAll: "تسوّق الكل",
  collections: "المجموعات",
  newIn: "وصل حديثًا",
  lookbook: "معرض الإطلالات",
  sizes: "المقاسات",
  size: "المقاس",
  chooseSize: "اختر مقاسك",
  colors: "الألوان",
  inStock: "متوفر",
  order: "اطلب عبر واتساب",
  askSize: "اسأل عن المقاسات",
  orderMessage: "مرحبًا، أود طلب: {name} ({price})",
  sizeMessage: "، المقاس {size}",
  askMessage: "مرحبًا، هل يتوفر {name} بمقاسي؟",
  photo: "الصورة {n}",
  openPhoto: "افتح الصورة {n}",
  prev: "الصورة السابقة",
  next: "الصورة التالية",
  pieces: "قطعة",
  viewAll: "عرض الكل",
  details: "عرض التفاصيل",
  exchange: "استبدال مجاني خلال 14 يومًا",
  find: "ابحث في المتجر",
  empty: "لا توجد نتائج. جرّب كلمة أو مجموعة أخرى.",
};

export function fashionCopy(locale: string): Copy {
  return locale === "ar" ? ar : en;
}

export const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
