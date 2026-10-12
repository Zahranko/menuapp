/** Words only Ember uses, on top of the shared Pro words (../_premium/copy.ts) and lib/i18n.ts. */
const en = {
  orderNow: "Order now",
  hall: "Hall of Flame",
  specials: "Today's specials",
  rank: "No. {n}",
  menuIndex: "The menu",
  allPhotos: "All photos",
  pullUp: "Pull up",
};

type EmberCopy = { [K in keyof typeof en]: string };

const ar: EmberCopy = {
  orderNow: "اطلب الآن",
  hall: "قاعة اللهب",
  specials: "عروض اليوم",
  rank: "رقم {n}",
  menuIndex: "المنيو",
  allPhotos: "كل الصور",
  pullUp: "مرّ علينا",
};

export function emberCopy(locale: string): EmberCopy {
  return locale === "ar" ? ar : en;
}
