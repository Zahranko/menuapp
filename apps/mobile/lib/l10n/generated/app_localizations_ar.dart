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
    return 'سفرتك جاهزة يا $name.';
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
}
