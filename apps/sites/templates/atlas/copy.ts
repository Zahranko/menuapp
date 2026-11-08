/**
 * Words only Atlas uses (its storefront search, quick view and departments).
 * The shared Pro words come from ../_premium/copy.ts and the common ones from lib/i18n.ts.
 */
const en = {
  departments: "Departments",
  shopAll: "Shop all",
  shopName: "Shop {name}",
  find: "Find a department or product",
  findLabel: "Search the shop",
  findEmpty: "Nothing matches. Try another word.",
  products: "Products",
  quickView: "Quick view",
  newIn: "New in",
  lookbook: "Lookbook",
  inStock: "In stock",
  orderMessage: "Hello, I would like to order: {name} ({price})",
  ranked: "Ranked by what our customers order most.",
  showing: "{count} in {name}",
  featuredPiece: "Featured piece",
  moreIn: "More in {name}",
};

type Copy = { [K in keyof typeof en]: string };

const ar: Copy = {
  departments: "الأقسام",
  shopAll: "تسوّق الكل",
  shopName: "تسوّق {name}",
  find: "ابحث عن قسم أو منتج",
  findLabel: "ابحث في المتجر",
  findEmpty: "لا نتائج. جرّب كلمة أخرى.",
  products: "المنتجات",
  quickView: "نظرة سريعة",
  newIn: "وصل حديثًا",
  lookbook: "معرض الصور",
  inStock: "متوفر",
  orderMessage: "مرحبًا، أود طلب: {name} ({price})",
  ranked: "مرتبة حسب ما يطلبه زبائننا أكثر.",
  showing: "{count} في {name}",
  featuredPiece: "قطعة مميزة",
  moreIn: "المزيد في {name}",
};

export function atlasCopy(locale: string): Copy {
  return locale === "ar" ? ar : en;
}
