/** Words used by the Pro templates' pages and navigation. Shared words (hours, sold out, ...) come from lib/i18n.ts. */
const en = {
  home: "Home",
  menu: "Menu",
  shop: "Shop",
  categories: "Categories",
  browse: "Browse the menu",
  best: "Best sellers",
  bestLead: "The ones our guests order again and again.",
  gallery: "Gallery",
  galleryLead: "A look inside.",
  visit: "Visit",
  about: "About us",
  viewAll: "View all",
  seeAll: "See everything in {name}",
  inThis: "In {name}",
  subcategories: "Explore {name}",
  everything: "Everything",
  breadcrumb: "You are here",
  pages: "Pages",
  photo: "Photo {n}",
  prev: "Previous photo",
  next: "Next photo",
  order: "Order on WhatsApp",
  follow: "Follow us",
  findUs: "Find us",
  call: "Message us",
  backHome: "Back to home",
  slide: "Slide {n}",
};

type Copy = { [K in keyof typeof en]: string };

const ar: Copy = {
  home: "الرئيسية",
  menu: "القائمة",
  shop: "المتجر",
  categories: "الأقسام",
  browse: "تصفّح القائمة",
  best: "الأكثر طلبًا",
  bestLead: "الأصناف التي يطلبها ضيوفنا مرة بعد مرة.",
  gallery: "الصور",
  galleryLead: "نظرة من الداخل.",
  visit: "زورونا",
  about: "من نحن",
  viewAll: "عرض الكل",
  seeAll: "كل ما في {name}",
  inThis: "في {name}",
  subcategories: "اكتشف {name}",
  everything: "الكل",
  breadcrumb: "أنت هنا",
  pages: "الصفحات",
  photo: "صورة {n}",
  prev: "الصورة السابقة",
  next: "الصورة التالية",
  order: "اطلب عبر واتساب",
  follow: "تابعنا",
  findUs: "موقعنا",
  call: "راسلنا",
  backHome: "العودة للرئيسية",
  slide: "الشريحة {n}",
};

export function copyFor(locale: string): Copy {
  return locale === "ar" ? ar : en;
}

export const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
