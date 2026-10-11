/**
 * Local labels where the international symbol is not what customers expect to read.
 * Every other currency falls back to what `Intl` knows (symbol and decimals), then to the code itself.
 */
const currencyLabels: Record<string, { en: string; ar: string; decimals?: number }> = {
  JOD: { en: "JD", ar: "د.أ", decimals: 3 },
  KWD: { en: "KD", ar: "د.ك", decimals: 3 },
  BHD: { en: "BD", ar: "د.ب", decimals: 3 },
  OMR: { en: "OMR", ar: "ر.ع", decimals: 3 },
  LYD: { en: "LYD", ar: "د.ل", decimals: 3 },
  TND: { en: "TND", ar: "د.ت", decimals: 3 },
  IQD: { en: "IQD", ar: "د.ع" },
  SAR: { en: "SAR", ar: "ر.س" },
  AED: { en: "AED", ar: "د.إ" },
  QAR: { en: "QAR", ar: "ر.ق" },
  EGP: { en: "EGP", ar: "ج.م" },
  LBP: { en: "LBP", ar: "ل.ل" },
  SYP: { en: "SYP", ar: "ل.س" },
  YER: { en: "YER", ar: "ر.ي" },
  SDG: { en: "SDG", ar: "ج.س" },
  MAD: { en: "MAD", ar: "د.م." },
  DZD: { en: "DZD", ar: "د.ج" },
};

type CurrencyInfo = { en: string; ar: string; decimals: number };
const infoCache = new Map<string, CurrencyInfo>();

function currencyInfo(currency: string): CurrencyInfo {
  const code = currency.trim().toUpperCase();
  const cached = infoCache.get(code);
  if (cached) return cached;
  let symbol = code;
  let decimals = 2;
  try {
    const intl = new Intl.NumberFormat("en", { style: "currency", currency: code });
    decimals = intl.resolvedOptions().maximumFractionDigits ?? 2;
    symbol = intl.formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
  } catch {
    // Not a well-formed ISO 4217 code: show it as given, with 2 decimals.
  }
  const label = currencyLabels[code];
  const info: CurrencyInfo = {
    en: label?.en ?? symbol,
    ar: label?.ar ?? symbol,
    decimals: label?.decimals ?? decimals,
  };
  infoCache.set(code, info);
  return info;
}

/**
 * "3.50 JD", "$4.00", "¥1,200"-style prices for any ISO currency: at least 2 decimals (none for
 * currencies without minor units, like JPY), more only when the price has them (JOD and KWD allow 3).
 * Symbols such as $, €, £ go first; letter labels (JD, SAR, د.أ) go after the amount.
 */
export function formatPrice(price: number, currency: string, locale: string): string {
  const info = currencyInfo(currency);
  const max = info.decimals;
  const amount = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
    minimumFractionDigits: Math.min(2, max),
    maximumFractionDigits: max,
  }).format(price);
  const unit = info[locale === "ar" ? "ar" : "en"];
  if (!unit) return amount;
  return /\p{Sc}/u.test(unit) ? `${unit}${amount}` : `${amount} ${unit}`;
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
