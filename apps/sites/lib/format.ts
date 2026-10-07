const currencyLabels: Record<string, { en: string; ar: string; decimals: number }> = {
  JOD: { en: "JD", ar: "د.أ", decimals: 3 },
  KWD: { en: "KD", ar: "د.ك", decimals: 3 },
  BHD: { en: "BD", ar: "د.ب", decimals: 3 },
  OMR: { en: "OMR", ar: "ر.ع", decimals: 3 },
  SAR: { en: "SAR", ar: "ر.س", decimals: 2 },
  AED: { en: "AED", ar: "د.إ", decimals: 2 },
  QAR: { en: "QAR", ar: "ر.ق", decimals: 2 },
  EGP: { en: "EGP", ar: "ج.م", decimals: 2 },
  USD: { en: "$", ar: "$", decimals: 2 },
  EUR: { en: "€", ar: "€", decimals: 2 },
};

/** "3.50 JD": at least 2 decimals, more only when the price has them (JOD allows 3). */
export function formatPrice(price: number, currency: string, locale: string): string {
  const info = currencyLabels[currency.toUpperCase()];
  const max = info?.decimals ?? 2;
  const amount = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
    minimumFractionDigits: Math.min(2, max),
    maximumFractionDigits: max,
  }).format(price);
  const unit = info ? info[locale === "ar" ? "ar" : "en"] : currency.toUpperCase();
  return unit === "$" || unit === "€" ? `${unit}${amount}` : `${amount} ${unit}`;
}

export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function instagramLink(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

/** First letter for logo badges, falling back to a dot for names without letters. */
export function initial(name: string): string {
  return (name.trim()[0] ?? "•").toUpperCase();
}
