import { withBrand } from "./brand";
import type { Locale } from "./types";

const en = {
  menu: "Menu",
  search: "Search the menu",
  noResults: "Nothing matches your search.",
  all: "All",
  soldOut: "Sold out",
  signature: "Signature picks",
  story: "Our story",
  gallery: "Gallery",
  reviews: "What guests say",
  visit: "Visit us",
  hours: "Opening hours",
  today: "Today",
  closed: "Closed",
  contact: "Contact",
  whatsapp: "Order on WhatsApp",
  directions: "Directions",
  email: "Email us",
  instagram: "Instagram",
  close: "Close",
  openMenu: "Open menu",
  details: "Details",
  newsletter: "Get our news",
  newsletterHint: "New items and offers, a few times a year.",
  subscribe: "Subscribe",
  yourEmail: "Your email",
  madeWith: "Made with {brandName}",
  preview: "Preview. Only you can see this.",
  items: "items",
  featured: "Featured",
  from: "from",
  viewMenu: "View the menu",
  findUs: "Find us",
  address: "Address",
  phone: "WhatsApp",
  rights: "All rights reserved.",
  categories: "Menu categories",
  photoOf: "Photo {n} of {name}",
  since: "Since",
  openUntil: "Open today until {time}",
  closedToday: "Closed today",
  days: { sat: "Saturday", sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" },
} as const;

type Strings = { [K in keyof typeof en]: (typeof en)[K] extends string ? string : { [D in keyof (typeof en)[K]]: string } };

const ar: Strings = {
  menu: "القائمة",
  search: "ابحث في القائمة",
  noResults: "لا توجد نتائج مطابقة.",
  all: "الكل",
  soldOut: "نفد",
  signature: "اختياراتنا المميزة",
  story: "قصتنا",
  gallery: "الصور",
  reviews: "آراء الضيوف",
  visit: "زورونا",
  hours: "ساعات العمل",
  today: "اليوم",
  closed: "مغلق",
  contact: "تواصل",
  whatsapp: "اطلب عبر واتساب",
  directions: "الاتجاهات",
  email: "راسلنا",
  instagram: "إنستغرام",
  close: "إغلاق",
  openMenu: "فتح القائمة",
  details: "التفاصيل",
  newsletter: "تابع أخبارنا",
  newsletterHint: "أصناف جديدة وعروض، بضع مرات في السنة.",
  subscribe: "اشترك",
  yourEmail: "بريدك الإلكتروني",
  madeWith: "صُنع باستخدام {brandName}",
  preview: "معاينة. أنت فقط من يراها.",
  items: "أصناف",
  featured: "مميز",
  from: "من",
  viewMenu: "تصفح القائمة",
  findUs: "موقعنا",
  address: "العنوان",
  phone: "واتساب",
  rights: "جميع الحقوق محفوظة.",
  categories: "أقسام القائمة",
  photoOf: "الصورة {n} من {name}",
  since: "منذ",
  openUntil: "مفتوح اليوم حتى {time}",
  closedToday: "مغلق اليوم",
  days: { sat: "السبت", sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة" },
};

/** Product labels are a fixed list; this shows them in the site's language. */
const labelsAr: Record<string, string> = { Signature: "مميز", New: "جديد", "Best seller": "الأكثر طلبًا", Vegan: "نباتي", Spicy: "حار" };

export function strings(locale: string): Strings {
  return locale === "ar" ? ar : en;
}

export function label(value: string, locale: string): string {
  return locale === "ar" ? (labelsAr[value] ?? value) : value;
}

export function madeWith(locale: string): string {
  return withBrand(strings(locale).madeWith);
}

export const asLocale = (value: string): Locale => (value === "ar" ? "ar" : "en");

/** "1 item", "5 items" in the site's language. */
export function itemCount(n: number, locale: string): string {
  if (locale === "ar") return n === 1 ? "صنف واحد" : n === 2 ? "صنفان" : n <= 10 ? `${n} أصناف` : `${n} صنفًا`;
  return n === 1 ? "1 item" : `${n} items`;
}
