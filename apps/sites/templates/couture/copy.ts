/**
 * Words only Couture uses. The shared Pro words (pages, breadcrumb, best sellers) come from ../_premium/copy.ts, the
 * fashion words from ../_fashion/copy.ts and the common ones from lib/i18n.ts.
 */
const en = {
  collections: "Collections",
  allCollections: "All collections",
  discover: "Discover",
  discoverAll: "Discover the collection",
  edit: "The edit",
  loved: "Most loved",
  lovedLead: "The pieces our clients come back for.",
  lookbook: "Lookbook",
  lookLead: "The season, as we see it.",
  house: "The house",
  boutique: "The boutique",
  appointment: "Book a private appointment",
  appointmentLead: "Try the collection in the boutique with one of our stylists, or ask us anything on WhatsApp.",
  appointmentMessage: "Hello, I would like to book a private appointment.",
  clients: "Words from our clients",
  pieces: "{n} pieces",
  shopName: "Discover {name}",
  more: "More collections",
};

type Copy = { [K in keyof typeof en]: string };

const ar: Copy = {
  collections: "المجموعات",
  allCollections: "كل المجموعات",
  discover: "اكتشف",
  discoverAll: "اكتشف المجموعة",
  edit: "مختاراتنا",
  loved: "الأكثر طلبًا",
  lovedLead: "القطع التي يعود إليها زبائننا.",
  lookbook: "معرض الإطلالات",
  lookLead: "الموسم كما نراه.",
  house: "الدار",
  boutique: "البوتيك",
  appointment: "احجز موعدًا خاصًا",
  appointmentLead: "جرّبوا المجموعة في البوتيك مع أحد منسّقينا، أو اسألونا عن أي شيء على واتساب.",
  appointmentMessage: "مرحبًا، أود حجز موعد خاص.",
  clients: "كلمات من زبائننا",
  pieces: "{n} قطعة",
  shopName: "اكتشف {name}",
  more: "مجموعات أخرى",
};

/** "1 piece", "12 pieces" in the site's language (Arabic: قطعة واحدة، قطعتان، 3 قطع، 11 قطعة). */
export function pieceCount(n: number, locale: string): string {
  if (locale === "ar") return n === 1 ? "قطعة واحدة" : n === 2 ? "قطعتان" : n <= 10 ? `${n} قطع` : `${n} قطعة`;
  return n === 1 ? "1 piece" : `${n} pieces`;
}

export function coutureCopy(locale: string): Copy {
  return locale === "ar" ? ar : en;
}
