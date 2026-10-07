// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get createAccount => 'إنشاء حساب';

  @override
  String get creatingAccount => 'جارٍ إنشاء الحساب';

  @override
  String get logIn => 'تسجيل الدخول';

  @override
  String get loggingIn => 'جارٍ تسجيل الدخول';

  @override
  String get back => 'رجوع';

  @override
  String get signupTitle => 'جهّز نشاطك التجاري';

  @override
  String get signupSubtitle =>
      'حساب واحد وموقع منيو واحد. يستغرق دقيقة تقريبًا.';

  @override
  String get businessName => 'اسم النشاط';

  @override
  String get businessNameHint => 'فانيلا منيو';

  @override
  String get linkAvailable => 'متاح';

  @override
  String get linkTaken => 'محجوز';

  @override
  String get email => 'البريد الإلكتروني';

  @override
  String get emailHint => 'you@business.com';

  @override
  String get phone => 'رقم الهاتف';

  @override
  String get phoneHint => '7X XXX XXXX';

  @override
  String get countryCode => 'رمز الدولة';

  @override
  String get password => 'كلمة المرور';

  @override
  String get passwordHint => '8 أحرف على الأقل';

  @override
  String get passwordHelp => 'استخدم 8 أحرف أو أكثر مع رقم وحرف إنجليزي كبير.';

  @override
  String get strengthTooShort => 'قصيرة جدًا';

  @override
  String get strengthWeak => 'ضعيفة. أضف رقمًا وحرفًا كبيرًا.';

  @override
  String get strengthOkay => 'مقبولة. أضف حرفًا كبيرًا أو رمزًا.';

  @override
  String get strengthGood => 'كلمة مرور جيدة';

  @override
  String get strengthStrong => 'كلمة مرور قوية';

  @override
  String get showPassword => 'إظهار كلمة المرور';

  @override
  String get hidePassword => 'إخفاء كلمة المرور';

  @override
  String get termsAgree => 'أوافق على الشروط وسياسة الخصوصية.';

  @override
  String get haveAccount => 'لديك حساب؟';

  @override
  String get errBusinessName => 'أدخل اسم نشاطك.';

  @override
  String get errEmail => 'أدخل بريدك الإلكتروني.';

  @override
  String get errEmailFormat => 'تحقق من صيغة البريد، مثل name@business.com.';

  @override
  String get errPhone => 'أدخل رقم هاتفك.';

  @override
  String get errPhoneFull => 'أدخل رقم الهاتف كاملًا بدون رمز الدولة.';

  @override
  String get errPasswordShort =>
      'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.';

  @override
  String get errTerms => 'وافق على الشروط للمتابعة.';

  @override
  String get errPassword => 'أدخل كلمة المرور.';

  @override
  String get errNetwork =>
      'تعذر الوصول إلى الخادم. تحقق من اتصالك وحاول مرة أخرى.';

  @override
  String get errGeneric => 'حدث خطأ ما. حاول مرة أخرى.';

  @override
  String get loginTitle => 'أهلًا بعودتك';

  @override
  String get loginSubtitle => 'سجّل الدخول لتعديل المنيو والأسعار.';

  @override
  String get loginWith => 'تسجيل الدخول باستخدام';

  @override
  String get tabEmail => 'البريد';

  @override
  String get tabPhone => 'الهاتف';

  @override
  String get passwordHintLogin => 'كلمة المرور';

  @override
  String get forgotPassword => 'نسيت كلمة المرور؟';

  @override
  String newTo(String brandName) {
    return 'جديد على $brandName؟';
  }

  @override
  String get createAnAccount => 'أنشئ حسابًا';

  @override
  String get forgotTitle => 'إعادة تعيين كلمة المرور';

  @override
  String get forgotBody => 'أدخل بريد حسابك وسنرسل لك رابطًا لإعادة التعيين.';

  @override
  String get sendLink => 'إرسال الرابط';

  @override
  String get resetSent => 'أرسلنا رابط إعادة التعيين إلى بريدك';

  @override
  String welcomeTitle(String name) {
    return 'طاولتك جاهزة يا $name.';
  }

  @override
  String get welcomeNew =>
      'حسابك جاهز. الخطوة التالية: اختر قالبًا وأضف أول أصنافك.';

  @override
  String get welcomeBack =>
      'تم تسجيل دخولك. موقع المنيو الخاص بك متاح على الرابط أدناه.';

  @override
  String get yourLink => 'رابط المنيو';

  @override
  String get copy => 'نسخ';

  @override
  String get copied => 'تم النسخ';

  @override
  String get stepAccount => 'تم إنشاء الحساب';

  @override
  String get stepTemplate => 'اختر واحدًا من 100 قالب';

  @override
  String get stepItems => 'أضف الأصناف والأسعار';

  @override
  String get stepPublish => 'اختر Basic (\$5) أو Pro (\$10) وانشر';

  @override
  String get logOut => 'تسجيل الخروج';

  @override
  String get tabProducts => 'المنتجات';

  @override
  String get tabCategories => 'الأصناف';

  @override
  String get tabSettings => 'الإعدادات';

  @override
  String get viewSite => 'عرض الموقع';

  @override
  String get savesGoLive => 'التعديلات تظهر فورًا';

  @override
  String get addProduct => 'إضافة منتج';

  @override
  String get addCategory => 'إضافة صنف';

  @override
  String get tryAgain => 'حاول مرة أخرى';

  @override
  String get statProducts => 'منتجات';

  @override
  String get statSoldOut => 'نفدت';

  @override
  String get statCategories => 'أصناف';

  @override
  String get searchProducts => 'ابحث في المنتجات';

  @override
  String get filterAll => 'الكل';

  @override
  String get noProductsTitle => 'لا توجد منتجات بعد';

  @override
  String get noProductsBody => 'اضغط إضافة منتج لتضع أول منتج على موقعك.';

  @override
  String get noMatchesTitle => 'لا نتائج';

  @override
  String get noMatchesBody => 'جرّب اسمًا آخر، أو امسح البحث.';

  @override
  String get noProductsInCategory => 'لا توجد منتجات في هذا الصنف بعد.';

  @override
  String get soldOut => 'نفد';

  @override
  String availableAgain(String name) {
    return '$name متوفر من جديد';
  }

  @override
  String markedSoldOut(String name) {
    return 'تم تعليم $name كنافد';
  }

  @override
  String get labelSignature => 'مميز';

  @override
  String get labelNew => 'جديد';

  @override
  String get labelBestSeller => 'الأكثر مبيعًا';

  @override
  String get labelVegan => 'نباتي';

  @override
  String get labelSpicy => 'حار';

  @override
  String priceIn(String price, String currency) {
    return '$price $currency';
  }

  @override
  String get currencyJod => 'د.أ';

  @override
  String get addCategoryFirst => 'أضف صنفًا أولًا';

  @override
  String get errProductName => 'أدخل اسم المنتج.';

  @override
  String get errPrice => 'أدخل السعر.';

  @override
  String get errPriceFormat => 'استخدم أرقامًا فقط، مثل 3.50.';

  @override
  String get savedLive => 'تم الحفظ · ظاهر على موقعك';

  @override
  String get addedLive => 'تمت الإضافة · ظاهر على موقعك';

  @override
  String get productDeleted => 'تم حذف المنتج';

  @override
  String get editProduct => 'تعديل المنتج';

  @override
  String get newProduct => 'منتج جديد';

  @override
  String get editProductSub => 'تظهر التعديلات على موقعك بمجرد الحفظ.';

  @override
  String get newProductSub => 'يظهر على موقعك مباشرة بعد الحفظ.';

  @override
  String get uploading => 'جارٍ الرفع';

  @override
  String get uploadPhoto => 'رفع صورة';

  @override
  String get changePhoto => 'تغيير الصورة';

  @override
  String get remove => 'إزالة';

  @override
  String get productName => 'الاسم';

  @override
  String get productNameHint => 'كرواسون بالفستق';

  @override
  String get descriptionOptional => 'الوصف (اختياري)';

  @override
  String get descriptionHint => 'المكونات، الحجم، طريقة التقديم';

  @override
  String get price => 'السعر';

  @override
  String get category => 'الصنف';

  @override
  String get label => 'الشارة';

  @override
  String get noLabel => 'بدون شارة';

  @override
  String get available => 'متوفر';

  @override
  String get availableHelp => 'أوقفه ليظهر كنافد';

  @override
  String get featureSignature => 'اعرضه ضمن الأطباق المميزة';

  @override
  String get featureSignatureHelp => 'يظهر بحجم كبير أعلى موقعك';

  @override
  String deleteProductTitle(String name) {
    return 'حذف $name؟';
  }

  @override
  String get deleteProductBody => 'سيُزال من موقعك. لا يمكن التراجع عن ذلك.';

  @override
  String get saveChanges => 'حفظ التعديلات';

  @override
  String get saving => 'جارٍ الحفظ';

  @override
  String get deleteProduct => 'حذف المنتج';

  @override
  String get cancel => 'إلغاء';

  @override
  String get keepIt => 'أبقِه';

  @override
  String get delete => 'حذف';

  @override
  String get noCategoriesTitle => 'لا توجد أصناف بعد';

  @override
  String get noCategoriesBody =>
      'الأصناف تجمع منتجاتك، مثل القهوة أو الحلويات.';

  @override
  String get categoriesHint =>
      'استخدم الأسهم لترتيب ما يراه زبائنك. الأصناف التي بلا منتجات تبقى مخفية على موقعك.';

  @override
  String productCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count منتج',
      few: '$count منتجات',
      two: 'منتجان',
      one: 'منتج واحد',
      zero: 'لا منتجات',
    );
    return '$_temp0';
  }

  @override
  String get hiddenOnSite => 'مخفي على الموقع';

  @override
  String moveUp(String name) {
    return 'نقل $name للأعلى';
  }

  @override
  String moveDown(String name) {
    return 'نقل $name للأسفل';
  }

  @override
  String get orderUpdated => 'تم تحديث الترتيب على موقعك';

  @override
  String get errCategoryName => 'أدخل اسم الصنف.';

  @override
  String get errCategoryTaken => 'لديك صنف بهذا الاسم.';

  @override
  String get categoryAdded => 'تمت إضافة الصنف. أضف منتجات ليظهر.';

  @override
  String get categoryRenamed => 'تمت إعادة التسمية · ظاهر على موقعك';

  @override
  String get categoryDeleted => 'تم حذف الصنف';

  @override
  String categoryDeletedMoved(String name) {
    return 'تم الحذف · نُقلت المنتجات إلى $name';
  }

  @override
  String get newCategory => 'صنف جديد';

  @override
  String get editCategory => 'تعديل الصنف';

  @override
  String get newCategorySub =>
      'اجمع منتجاتك، مثل القهوة أو السندويشات أو علب الهدايا.';

  @override
  String productsInCategory(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count منتج في هذا الصنف.',
      few: '$count منتجات في هذا الصنف.',
      two: 'منتجان في هذا الصنف.',
      one: 'منتج واحد في هذا الصنف.',
      zero: 'لا منتجات في هذا الصنف.',
    );
    return '$_temp0';
  }

  @override
  String get categoryName => 'اسم الصنف';

  @override
  String get categoryNameHint => 'سندويشات';

  @override
  String deleteCategoryTitle(String name) {
    return 'حذف $name؟';
  }

  @override
  String get deleteCategoryChoose => 'اختر أولًا أين تذهب منتجاته.';

  @override
  String get deleteCategoryEmpty => 'لا يحتوي على منتجات، فلن يتغير شيء آخر.';

  @override
  String whatHappensToProducts(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'ماذا يحدث لمنتجاته الـ$count؟',
      one: 'ماذا يحدث لمنتجه؟',
    );
    return '$_temp0';
  }

  @override
  String moveTo(String name) {
    return 'نقل إلى $name';
  }

  @override
  String get deleteThemToo => 'احذفها أيضًا';

  @override
  String get deleteCategory => 'حذف الصنف';

  @override
  String get yourWebsite => 'موقعك';

  @override
  String get live => 'منشور';

  @override
  String get notPublished => 'غير منشور';

  @override
  String websiteTemplate(String link, String number, String name) {
    return '$link · القالب $number $name';
  }

  @override
  String get editDesign => 'تعديل التصميم';

  @override
  String get chooseTemplateShort => 'تغيير القالب';

  @override
  String get copyLink => 'نسخ الرابط';

  @override
  String get linkCopied => 'تم نسخ الرابط';

  @override
  String get businessInfo => 'معلومات النشاط';

  @override
  String get businessInfoSub => 'تظهر في رأس موقعك وقسم التواصل والتذييل.';

  @override
  String get errBusinessNameEmpty => 'لا يمكن ترك اسم النشاط فارغًا';

  @override
  String get whatsApp => 'واتساب';

  @override
  String get address => 'العنوان';

  @override
  String get instagram => 'إنستغرام';

  @override
  String get account => 'الحساب';

  @override
  String get changePassword => 'تغيير كلمة المرور';

  @override
  String get passwordLinkSent => 'أرسلنا إلى بريدك رابطًا لتغيير كلمة المرور';

  @override
  String get plan => 'الباقة';

  @override
  String get planBasic => 'الأساسية';

  @override
  String get planPro => 'الاحترافية';

  @override
  String planCurrent(String name) {
    return '$name · الحالية';
  }

  @override
  String get perMonth => '/شهريًا';

  @override
  String get proDetail => 'كل ما في الأساسية مع نطاقك الخاص';

  @override
  String get testModeNote =>
      'حساب تجريبي: كل الميزات مفتوحة ولا يتم خصم أي مبلغ.';

  @override
  String trialUntil(String date) {
    return 'تجربة مجانية حتى $date';
  }

  @override
  String get upgradeToPro => 'الترقية إلى الاحترافية';

  @override
  String get switchToBasic => 'التحويل إلى الأساسية';

  @override
  String upgradeBody(String price) {
    return '$price شهريًا. يمكنك طلب نطاقك الخاص مباشرة بعد الترقية.';
  }

  @override
  String downgradeBody(String price) {
    return '$price شهريًا من موعد الفوترة القادم.';
  }

  @override
  String downgradeDomain(String domain) {
    return 'سيُلغى طلب النطاق $domain.';
  }

  @override
  String upgradeFor(String price) {
    return 'الترقية مقابل $price شهريًا';
  }

  @override
  String get notNow => 'ليس الآن';

  @override
  String get nowOnPro => 'أنت الآن على الباقة الاحترافية';

  @override
  String get nowOnBasic => 'أنت الآن على الباقة الأساسية';

  @override
  String get finishPayment => 'أكمل الدفع في المتصفح لتغيير الباقة';

  @override
  String get customDomain => 'نطاق خاص';

  @override
  String domainLocked(String example) {
    return 'اربط نطاقك الخاص، مثل $example. متاح في الباقة الاحترافية.';
  }

  @override
  String get domainEnterBody =>
      'أدخل النطاق الذي تملكه. فريق الدعم يجهزه ويرسل لك خطوات DNS بالبريد.';

  @override
  String get yourDomain => 'نطاقك';

  @override
  String get errDomainEmpty => 'أدخل نطاقك.';

  @override
  String get errDomainFormat => 'أدخل نطاقًا مثل vanillamenu.com بدون مسافات.';

  @override
  String get sendToSupport => 'إرسال الطلب للدعم';

  @override
  String get sending => 'جارٍ الإرسال';

  @override
  String get domainRequestSent => 'تم إرسال الطلب للدعم';

  @override
  String get domainRequestCancelled => 'تم إلغاء طلب النطاق';

  @override
  String domainRequested(String domain, String date) {
    return '$domain · أُرسل الطلب $date';
  }

  @override
  String get domainStep1 => 'تم إرسال الطلب';

  @override
  String get domainStep2 => 'يرسل لك الدعم خطوات DNS (خلال 24 ساعة)';

  @override
  String get domainStep3 => 'تضيف سجل DNS لدى مزود النطاق';

  @override
  String domainStep4(String domain) {
    return 'موقعك يعمل بأمان على $domain';
  }

  @override
  String dnsHint(String target) {
    return 'وجّه سجل www (CNAME) لنطاقك إلى $target.';
  }

  @override
  String get cancelRequest => 'إلغاء الطلب';

  @override
  String get openInBrowser => 'فتح في المتصفح';

  @override
  String get manageMenu => 'إدارة المنيو';

  @override
  String get siteOfflineTitle => 'هذه الصفحة غير متاحة بعد';

  @override
  String get siteOfflineBody =>
      'تعديلاتك محفوظة. ستظهر الصفحة هنا عندما تُستضاف المواقع.';

  @override
  String get chooseTemplate => 'اختر قالبًا';

  @override
  String templatesSub(int count) {
    return '$count تصميمًا. كل تصميم يعرض منتجاتك بطريقته.';
  }

  @override
  String filterAllCount(int count) {
    return 'الكل $count';
  }

  @override
  String get filterFood => 'طعام ومشروبات';

  @override
  String get filterShops => 'متاجر';

  @override
  String get filterServices => 'خدمات';

  @override
  String replaceDesignTitle(String name) {
    return 'استخدام $name؟';
  }

  @override
  String get replaceDesignBody =>
      'تبدأ إعدادات التصميم من جديد مع هذا القالب. المنتجات والأسعار تبقى كما هي. يتغير موقعك المنشور عند النشر.';

  @override
  String get useTemplate => 'استخدم القالب';

  @override
  String get inUse => 'المستخدم';

  @override
  String get ready => 'جاهز';

  @override
  String get customize => 'التخصيص';

  @override
  String customizeTemplate(String number, String name) {
    return '$number $name';
  }

  @override
  String get resetTooltip => 'استعادة إعدادات القالب';

  @override
  String get resetTitle => 'البدء من جديد؟';

  @override
  String resetBody(String name) {
    return 'تعود كل إعدادات التصميم إلى إعدادات $name الأصلية. المنتجات والأسعار تبقى كما هي.';
  }

  @override
  String get reset => 'استعادة';

  @override
  String get livePreview => 'معاينة مباشرة';

  @override
  String get groupMore => 'المزيد';

  @override
  String get menuItemsAndPrices => 'المنتجات والأسعار';

  @override
  String get menuItemsElsewhere =>
      'تُعدَّل المنتجات والأسعار من قائمتي، وتظهر في كل القوالب.';

  @override
  String get publish => 'نشر';

  @override
  String get publishChanges => 'نشر التعديلات';

  @override
  String get publishing => 'جارٍ نشر موقعك';

  @override
  String get publishedTitle => 'موقعك منشور';

  @override
  String get publishedBody =>
      'يرى زبائنك التصميم الجديد الآن. تتحدث المنتجات والأسعار تلقائيًا عند تعديلها.';

  @override
  String get photo => 'صورة';

  @override
  String get addPhotos => 'إضافة صور';

  @override
  String get closed => 'مغلق';

  @override
  String get goToMenu => 'الذهاب إلى قائمتي';
}
