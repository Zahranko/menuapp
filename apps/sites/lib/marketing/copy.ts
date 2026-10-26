import { brand } from "../brand";

/** The marketing site's languages. English lives at "/", Arabic under "/ar". */
export type Lang = "en" | "ar";
export const LANGS: readonly Lang[] = ["en", "ar"];

/** Marketing pages, by the path they have in English. */
export type MarketingPage = "home" | "privacy" | "contact";

const PAGE_PATHS: Record<MarketingPage, string> = { home: "", privacy: "/privacy", contact: "/contact" };

/** "/", "/privacy", "/ar", "/ar/privacy", ... */
export function pagePath(lang: Lang, page: MarketingPage): string {
  const path = PAGE_PATHS[page];
  if (lang === "ar") return `/ar${path}`;
  return path || "/";
}

/** Fills the {brandName}, {domain} and {email} placeholders from brand.json; the Arabic copy uses the Arabic brand name. */
export function fill(text: string, lang: Lang): string {
  return text
    .replaceAll("{brandName}", lang === "ar" ? brand.brandNameAr : brand.brandName)
    .replaceAll("{domain}", brand.domain)
    .replaceAll("{email}", brand.supportEmail);
}

type Step = { title: string; body: string };
type Feature = { title: string; body: string };
type Plan = { name: string; price: string; per: string; note: string; points: string[] };
type Section = { title: string; body: string[]; list?: string[] };

const en = {
  dir: "ltr" as "ltr" | "rtl",
  skip: "Skip to content",
  nav: { how: "How it works", features: "Features", plans: "Plans", getApp: "Get the app", home: "Home", main: "Main" },
  switchTo: "عربي",
  switchLabel: "اقرأ هذه الصفحة بالعربية",
  meta: {
    home: { title: "{brandName} · Create your website from your phone", description: "Pick one of 100 templates, add your products and prices, and share one link. A website for your café, restaurant or shop, made on your phone." },
    privacy: { title: "Privacy policy · {brandName}", description: "What {brandName} collects, why, who processes it and how to delete your data." },
    contact: { title: "Contact us · {brandName}", description: "Questions about your website, plans or your own domain? Email the {brandName} team." },
  },
  hero: {
    eyebrow: "For cafés, restaurants and shops",
    titleStart: "Create your website",
    titleMark: "from your phone",
    titleEnd: ".",
    lead: "Pick one of 100 templates, add your products and prices, and share one link. No laptop, no designer, no code.",
    proof: ["Arabic and English", "QR code included", "From $5 a month"],
    appCaption: "The {brandName} app",
    siteCaption: "Your website",
    live: "Your site is live",
    link: "{domain}/yourcafe",
    appAlt: "The {brandName} app on a phone, listing a café's coffees with prices and sold-out switches",
    siteAlt: "A café website made with a {brandName} template, open on a phone",
    templatesAlt: "Template gallery in the {brandName} app",
  },
  stores: {
    appStoreSmall: "Download on the",
    appStore: "App Store",
    playSmall: "Get it on",
    play: "Google Play",
    soon: "Coming soon to the {appStore} and {googlePlay}.",
    soonBadge: "Soon",
  },
  ticker: ["Cafés", "Restaurants", "Bakeries", "Boutiques", "Sweet shops", "Juice bars", "Florists", "Salons", "Bookshops", "Food trucks"],
  how: {
    kicker: "How it works",
    title: "From sign-up to a live site in three steps",
    steps: [
      { title: "Sign up", body: "Create your account with your business name, email and phone. It takes a minute." },
      { title: "Pick a template", body: "Choose one of 100 designs, then make it yours: colors, logo, hero photo, products and prices." },
      { title: "Share your link", body: "Post {domain}/yourname on Instagram and WhatsApp, or print the QR code for your tables." },
    ] as Step[],
  },
  features: {
    kicker: "Features",
    title: "Everything a small business needs. Nothing it doesn't.",
    templatesWord: "templates",
    templates: { title: "100 templates", body: "Cafés, restaurants, fashion, shops and services. Each one shows your products its own way." } as Feature,
    languages: { title: "Arabic and English", body: "Your site speaks your customers' language, right to left included." } as Feature,
    qr: { title: "QR code", body: "Save it, print it, put it on the table. Customers scan and see your menu." } as Feature,
    ai: { title: "AI helper", body: "Snap your menu and it fills in your products, or let it suggest colors and words. You check everything before it goes live." } as Feature,
    domain: { title: "Your own domain on Pro", body: "Use an address like yourcafe.com. Our support team sets it up with you." } as Feature,
    edit: { title: "Edit any time", body: "Change a price or mark an item sold out and your site updates right away." } as Feature,
    langSample: { a: "Hello", b: "أهلاً" },
    domainSample: "www.yourcafe.com",
    soldOut: "Sold out",
    available: "Available",
    aiSample: "Reading your menu photo…",
  },
  plans: {
    kicker: "Plans",
    title: "Simple plans, in dollars",
    lead: "Choose a plan when you publish. Switch any time from the app.",
    popular: "Your own domain",
    list: [
      {
        name: "Basic",
        price: "$5",
        per: "/month",
        note: "Your site at {domain}/yourname",
        points: ["Products, categories and prices you edit from your phone", "Arabic or English website", "QR code for your tables and windows", "AI helper for photos and text"],
      },
      {
        name: "Pro",
        price: "$10",
        per: "/month",
        note: "Everything in Basic plus your own domain",
        points: ["Your own domain, set up by our support team", "Templates marked Pro", "More AI helper uses each month", "Everything in Basic"],
      },
    ] as Plan[],
  },
  cta: { title: "Your website is one phone away.", body: "Download {brandName}, pick a template and publish today." },
  footer: { tagline: "Websites for small businesses, made on the phone.", privacy: "Privacy", contact: "Contact", rights: "All rights reserved.", language: "Language" },
  contact: {
    kicker: "Contact",
    title: "We're here to help",
    lead: "Questions about your website, your plan or your own domain? Email us and a real person from our team will answer.",
    emailLabel: "Email us",
    reply: "We usually reply within one business day.",
    tipsTitle: "To help us answer faster",
    tips: ["Write from the email you signed up with.", "Include your site link, like {domain}/yourname.", "Add a screenshot if something looks wrong."],
    topicsTitle: "We can help with",
    topics: ["Signing in and your account", "Your website and template", "Plans and payments", "Connecting your own domain", "Deleting your data"],
  },
  privacy: {
    kicker: "Legal",
    title: "Privacy policy",
    updated: "Last updated: {date}",
    intro:
      "{brandName} lets businesses create a website from their phone. This policy explains what information we collect, why we collect it, who helps us process it and the choices you have. It covers the {brandName} app, {domain} and the websites businesses publish with {brandName}.",
    contents: "On this page",
    sections: [
      {
        title: "Information business owners give us",
        body: ["When you create an account and build your site, we collect:"],
        list: [
          "Account details: your name, business name, email address, phone number and password (we store only a secure hash of the password).",
          "Business content: products, prices, descriptions, categories, opening hours, address, social and WhatsApp links, your logo and the photos you upload.",
          "Plan details: your plan, its status and any custom domain you ask us to connect.",
          "Messages you send to our support team.",
        ],
      },
      {
        title: "Information about website visitors",
        body: [
          "The websites businesses build with {brandName} do not use advertising or tracking cookies. We only use what the site needs to work.",
          "Like most websites, our servers keep short technical logs (IP address, browser type, the page requested and the time) to keep the service secure and running. We do not use them to build profiles of visitors.",
          "If you contact a business through its website, for example on WhatsApp or by email, that conversation is between you and the business and the service you use.",
        ],
      },
      {
        title: "The AI helper",
        body: [
          "The AI helper is optional. When a business owner uses it, the photos and text they choose are sent to DeepSeek, an AI service that processes them on servers in China, to suggest products, colors and wording. Before a photo is sent we shrink it and remove its camera details, such as location.",
          "Nothing is sent to DeepSeek unless the owner starts the AI helper. The owner reviews every suggestion before it appears on their site.",
        ],
      },
      {
        title: "How we use information",
        body: ["We use the information above to:"],
        list: [
          "Create and run your account and publish your website.",
          "Send you emails you need, such as password resets, domain setup steps and plan changes.",
          "Answer your support requests.",
          "Keep the service secure and prevent abuse.",
        ],
      },
      {
        title: "Who we share it with",
        body: [
          "We do not sell personal information. We share it only with providers that help us run {brandName}: hosting and file storage, email delivery, DeepSeek for the AI helper and, once paid plans open, a payment provider or the app stores. They may use it only to provide their service to us.",
          "Content you publish on your website, such as products, photos and contact details, is public by design. We may also disclose information when the law requires it.",
        ],
      },
      {
        title: "Payments",
        body: [
          "Paid plans will be handled by a payment provider or by Apple and Google in-app purchases. We will not store your full card number. We will update this policy with the provider's name before payments start.",
        ],
      },
      {
        title: "How long we keep it and how to delete it",
        body: [
          "We keep your account and site content while your account is open. Server logs are kept for a short time, usually no longer than 90 days.",
          "You can ask us to delete your account and data at any time by emailing {email}. We delete it within 30 days, except records we must keep by law, such as billing records.",
        ],
      },
      {
        title: "Your rights",
        body: [
          "You can ask to see, correct, export or delete the personal information we hold about you. Most details can be changed directly in the app; for anything else, email {email}.",
        ],
      },
      {
        title: "Security",
        body: [
          "We use encrypted connections (HTTPS), store passwords only as secure hashes and limit who on our team can access your data. No service is perfectly secure, so please use a strong password.",
        ],
      },
      {
        title: "Children",
        body: ["{brandName} is a service for businesses and is not meant for children under 16. We do not knowingly collect their information."],
      },
      {
        title: "Changes to this policy",
        body: ["When we change this policy we update the date at the top. If a change is important, we will tell business owners by email or in the app."],
      },
      {
        title: "Contact",
        body: ["Questions about your privacy? Email us at {email}."],
      },
    ] as Section[],
  },
};

export type Copy = typeof en;

const ar: Copy = {
  dir: "rtl",
  skip: "انتقل إلى المحتوى",
  nav: { how: "كيف يعمل", features: "المزايا", plans: "الباقات", getApp: "حمّل التطبيق", home: "الرئيسية", main: "الرئيسية" },
  switchTo: "EN",
  switchLabel: "Read this page in English",
  meta: {
    home: { title: "{brandName} · أنشئ موقعك من هاتفك", description: "اختر قالبًا من 100 قالب، أضف منتجاتك وأسعارك، وشارك رابطًا واحدًا. موقع لمقهاك أو مطعمك أو متجرك، تصنعه من هاتفك." },
    privacy: { title: "سياسة الخصوصية · {brandName}", description: "ما الذي يجمعه {brandName} ولماذا، ومن يعالجه، وكيف تحذف بياناتك." },
    contact: { title: "تواصل معنا · {brandName}", description: "عندك سؤال عن موقعك أو باقتك أو نطاقك الخاص؟ راسل فريق {brandName}." },
  },
  hero: {
    eyebrow: "للمقاهي والمطاعم والمتاجر",
    titleStart: "أنشئ موقعك",
    titleMark: "من هاتفك",
    titleEnd: ".",
    lead: "اختر قالبًا من 100 قالب، أضف منتجاتك وأسعارك، وشارك رابطًا واحدًا. بلا حاسوب، بلا مصمم، بلا برمجة.",
    proof: ["عربي وإنجليزي", "رمز QR جاهز", "من 5$ شهريًا"],
    appCaption: "تطبيق {brandName}",
    siteCaption: "موقعك",
    live: "موقعك أصبح متاحًا",
    link: "{domain}/yourcafe",
    appAlt: "تطبيق {brandName} على الهاتف، يعرض مشروبات مقهى بأسعارها ومفاتيح النفاد",
    siteAlt: "موقع مقهى مصمّم بقالب من {brandName}، مفتوح على الهاتف",
    templatesAlt: "معرض القوالب في تطبيق {brandName}",
  },
  stores: {
    appStoreSmall: "حمّله من",
    appStore: "App Store",
    playSmall: "احصل عليه من",
    play: "Google Play",
    soon: "قريبًا على {appStore} و {googlePlay}.",
    soonBadge: "قريبًا",
  },
  ticker: ["المقاهي", "المطاعم", "المخابز", "البوتيكات", "محلات الحلويات", "محلات العصير", "محلات الورد", "الصالونات", "المكتبات", "عربات الطعام"],
  how: {
    kicker: "كيف يعمل",
    title: "من التسجيل إلى موقع منشور في ثلاث خطوات",
    steps: [
      { title: "سجّل", body: "أنشئ حسابك باسم نشاطك وبريدك ورقم هاتفك. يستغرق ذلك دقيقة." },
      { title: "اختر قالبًا", body: "اختر تصميمًا من 100 تصميم واجعله لك: الألوان والشعار وصورة الواجهة والمنتجات والأسعار." },
      { title: "شارك رابطك", body: "ضع {domain}/yourname على إنستغرام وواتساب، أو اطبع رمز QR لطاولاتك." },
    ],
  },
  features: {
    kicker: "المزايا",
    title: "كل ما يحتاجه نشاطك الصغير، ولا شيء زائد.",
    templatesWord: "قالب",
    templates: { title: "100 قالب", body: "للمقاهي والمطاعم والأزياء والمتاجر والخدمات. كل قالب يعرض منتجاتك بطريقته." },
    languages: { title: "عربي وإنجليزي", body: "موقعك يتحدث لغة زبائنك، مع دعم كامل للكتابة من اليمين إلى اليسار." },
    qr: { title: "رمز QR", body: "احفظه واطبعه وضعه على الطاولة. يمسحه زبائنك فيرون المنيو." },
    ai: { title: "المساعد الذكي", body: "صوّر قائمتك فيضيف منتجاتك، أو دعه يقترح الألوان والنصوص. تراجع كل شيء قبل أن يظهر في موقعك." },
    domain: { title: "نطاقك الخاص مع Pro", body: "استخدم عنوانًا مثل yourcafe.com. يجهّزه معك فريق الدعم." },
    edit: { title: "عدّل في أي وقت", body: "غيّر سعرًا أو اجعل صنفًا نافدًا، ويتحدّث موقعك فورًا." },
    langSample: { a: "أهلاً", b: "Hello" },
    domainSample: "www.yourcafe.com",
    soldOut: "نفد",
    available: "متاح",
    aiSample: "نقرأ صورة قائمتك…",
  },
  plans: {
    kicker: "الباقات",
    title: "باقات بسيطة، بالدولار",
    lead: "اختر باقتك عند النشر، وبدّلها متى شئت من التطبيق.",
    popular: "نطاقك الخاص",
    list: [
      {
        name: "الأساسية",
        price: "5$",
        per: "/شهريًا",
        note: "موقعك على {domain}/yourname",
        points: ["منتجات وفئات وأسعار تعدّلها من هاتفك", "موقع بالعربية أو الإنجليزية", "رمز QR لطاولاتك وواجهتك", "المساعد الذكي للصور والنصوص"],
      },
      {
        name: "الاحترافية",
        price: "10$",
        per: "/شهريًا",
        note: "كل ما في الأساسية مع نطاقك الخاص",
        points: ["نطاقك الخاص، يجهّزه فريق الدعم", "القوالب المميزة بعلامة Pro", "استخدامات أكثر للمساعد الذكي كل شهر", "كل ما في الباقة الأساسية"],
      },
    ],
  },
  cta: { title: "موقعك على بُعد هاتف.", body: "حمّل {brandName}، اختر قالبًا وانشر موقعك اليوم." },
  footer: { tagline: "مواقع للأنشطة الصغيرة، تُصنع من الهاتف.", privacy: "الخصوصية", contact: "تواصل معنا", rights: "جميع الحقوق محفوظة.", language: "اللغة" },
  contact: {
    kicker: "تواصل معنا",
    title: "نحن هنا لمساعدتك",
    lead: "عندك سؤال عن موقعك أو باقتك أو نطاقك الخاص؟ راسلنا وسيجيبك شخص حقيقي من فريقنا.",
    emailLabel: "راسلنا",
    reply: "نرد عادةً خلال يوم عمل واحد.",
    tipsTitle: "لنجيبك أسرع",
    tips: ["راسلنا من البريد الذي سجّلت به.", "أرفق رابط موقعك، مثل {domain}/yourname.", "أضف لقطة شاشة إن بدا شيء غير صحيح."],
    topicsTitle: "نساعدك في",
    topics: ["تسجيل الدخول وحسابك", "موقعك وقالبك", "الباقات والدفع", "ربط نطاقك الخاص", "حذف بياناتك"],
  },
  privacy: {
    kicker: "قانوني",
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: {date}",
    intro:
      "يتيح {brandName} للأنشطة التجارية إنشاء موقع من الهاتف. توضح هذه السياسة المعلومات التي نجمعها ولماذا نجمعها ومن يساعدنا في معالجتها والخيارات المتاحة لك. وهي تشمل تطبيق {brandName} وموقع {domain} والمواقع التي تنشرها الأنشطة التجارية باستخدام {brandName}.",
    contents: "في هذه الصفحة",
    sections: [
      {
        title: "المعلومات التي يقدّمها أصحاب الأنشطة",
        body: ["عند إنشاء حسابك وبناء موقعك نجمع:"],
        list: [
          "بيانات الحساب: اسمك واسم نشاطك وبريدك الإلكتروني ورقم هاتفك وكلمة المرور (نحفظ منها بصمة آمنة فقط).",
          "محتوى النشاط: المنتجات والأسعار والأوصاف والفئات وساعات العمل والعنوان وروابط التواصل وواتساب وشعارك والصور التي ترفعها.",
          "بيانات الباقة: باقتك وحالتها وأي نطاق خاص تطلب ربطه.",
          "الرسائل التي ترسلها إلى فريق الدعم.",
        ],
      },
      {
        title: "المعلومات عن زوّار المواقع",
        body: [
          "لا تستخدم المواقع المبنية بـ{brandName} ملفات تعريف ارتباط إعلانية أو للتتبّع. نستخدم فقط ما يحتاجه الموقع ليعمل.",
          "كمعظم المواقع، تحتفظ خوادمنا بسجلات تقنية قصيرة (عنوان IP ونوع المتصفح والصفحة المطلوبة والوقت) لإبقاء الخدمة آمنة وتعمل. لا نستخدمها لبناء ملفات عن الزوار.",
          "إذا تواصلت مع نشاط تجاري عبر موقعه، مثلًا على واتساب أو بالبريد، فالمحادثة بينك وبين النشاط والخدمة التي تستخدمها.",
        ],
      },
      {
        title: "المساعد الذكي",
        body: [
          "المساعد الذكي اختياري. عندما يستخدمه صاحب النشاط تُرسل الصور والنصوص التي يختارها إلى DeepSeek، وهي خدمة ذكاء اصطناعي تعالجها على خوادم في الصين، لاقتراح المنتجات والألوان والصياغة. قبل إرسال أي صورة نصغّرها ونزيل بيانات الكاميرا منها مثل الموقع الجغرافي.",
          "لا يُرسل شيء إلى DeepSeek ما لم يبدأ صاحب النشاط المساعد الذكي. ويراجع صاحب النشاط كل اقتراح قبل أن يظهر في موقعه.",
        ],
      },
      {
        title: "كيف نستخدم المعلومات",
        body: ["نستخدم المعلومات أعلاه من أجل:"],
        list: [
          "إنشاء حسابك وتشغيله ونشر موقعك.",
          "إرسال الرسائل التي تحتاجها، مثل استعادة كلمة المرور وخطوات إعداد النطاق وتغييرات الباقة.",
          "الرد على طلبات الدعم.",
          "حماية الخدمة ومنع إساءة استخدامها.",
        ],
      },
      {
        title: "مع من نشاركها",
        body: [
          "لا نبيع المعلومات الشخصية. نشاركها فقط مع مزوّدين يساعدوننا في تشغيل {brandName}: الاستضافة وتخزين الملفات وإرسال البريد وDeepSeek للمساعد الذكي، وعند بدء الباقات المدفوعة مزوّد دفع أو متاجر التطبيقات. ولا يجوز لهم استخدامها إلا لتقديم خدمتهم لنا.",
          "المحتوى الذي تنشره في موقعك، مثل المنتجات والصور وبيانات التواصل، عام بطبيعته. وقد نفصح عن معلومات إذا طلب القانون ذلك.",
        ],
      },
      {
        title: "الدفع",
        body: [
          "سيتولّى الدفع للباقات المدفوعة مزوّد دفع أو الشراء داخل التطبيق من Apple وGoogle. لن نحفظ رقم بطاقتك كاملًا، وسنحدّث هذه السياسة باسم المزوّد قبل بدء الدفع.",
        ],
      },
      {
        title: "مدة الاحتفاظ وكيفية الحذف",
        body: [
          "نحتفظ بحسابك ومحتوى موقعك ما دام حسابك مفتوحًا. أما سجلات الخوادم فنحتفظ بها مدة قصيرة، عادةً لا تزيد على 90 يومًا.",
          "يمكنك طلب حذف حسابك وبياناتك في أي وقت بمراسلة {email}. نحذفها خلال 30 يومًا، باستثناء السجلات التي يلزمنا القانون بحفظها مثل سجلات الفواتير.",
        ],
      },
      {
        title: "حقوقك",
        body: ["يمكنك طلب الاطلاع على معلوماتك الشخصية لدينا أو تصحيحها أو تصديرها أو حذفها. معظم البيانات تستطيع تعديلها مباشرة من التطبيق، ولأي شيء آخر راسل {email}."],
      },
      {
        title: "الأمان",
        body: ["نستخدم اتصالات مشفّرة (HTTPS)، ونحفظ كلمات المرور كبصمات آمنة فقط، ونحصر الوصول إلى بياناتك في عدد محدود من فريقنا. لا توجد خدمة آمنة تمامًا، لذا استخدم كلمة مرور قوية."],
      },
      {
        title: "الأطفال",
        body: ["{brandName} خدمة للأنشطة التجارية وليست موجّهة للأطفال دون 16 عامًا، ولا نجمع معلوماتهم عن قصد."],
      },
      {
        title: "التغييرات على هذه السياسة",
        body: ["عند تغيير هذه السياسة نحدّث التاريخ في أعلاها. وإذا كان التغيير مهمًا نُبلغ أصحاب الأنشطة بالبريد أو داخل التطبيق."],
      },
      {
        title: "تواصل معنا",
        body: ["عندك سؤال عن خصوصيتك؟ راسلنا على {email}."],
      },
    ],
  },
};

export function copy(lang: Lang): Copy {
  return lang === "ar" ? ar : en;
}

/** The date the privacy policy last changed (ISO), shown at its top. Update it with every change to the policy text. */
export const PRIVACY_UPDATED = "2026-10-26";

export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}
