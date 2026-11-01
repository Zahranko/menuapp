/** Bloom's own interface words (carousel controls). Page words come from ../_premium/copy.ts, shared ones from lib/i18n.ts. */
const en = {
  pause: "Pause the slideshow",
  play: "Play the slideshow",
  prev: "Previous bake",
  next: "Next bake",
};

type Words = { [K in keyof typeof en]: string };

const ar: Words = {
  pause: "إيقاف العرض",
  play: "تشغيل العرض",
  prev: "الصنف السابق",
  next: "الصنف التالي",
};

export const wordsFor = (locale: string): Words => (locale === "ar" ? ar : en);
