import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @creatingAccount.
  ///
  /// In en, this message translates to:
  /// **'Creating account'**
  String get creatingAccount;

  /// No description provided for @logIn.
  ///
  /// In en, this message translates to:
  /// **'Log in'**
  String get logIn;

  /// No description provided for @loggingIn.
  ///
  /// In en, this message translates to:
  /// **'Logging in'**
  String get loggingIn;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @signupTitle.
  ///
  /// In en, this message translates to:
  /// **'Set up your business'**
  String get signupTitle;

  /// No description provided for @signupSubtitle.
  ///
  /// In en, this message translates to:
  /// **'One account, one menu site. Takes about a minute.'**
  String get signupSubtitle;

  /// No description provided for @businessName.
  ///
  /// In en, this message translates to:
  /// **'Business name'**
  String get businessName;

  /// No description provided for @businessNameHint.
  ///
  /// In en, this message translates to:
  /// **'Vanilla Menu'**
  String get businessNameHint;

  /// No description provided for @linkAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get linkAvailable;

  /// No description provided for @linkTaken.
  ///
  /// In en, this message translates to:
  /// **'Taken'**
  String get linkTaken;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'you@business.com'**
  String get emailHint;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get phone;

  /// No description provided for @phoneHint.
  ///
  /// In en, this message translates to:
  /// **'7X XXX XXXX'**
  String get phoneHint;

  /// No description provided for @countryCode.
  ///
  /// In en, this message translates to:
  /// **'Country code'**
  String get countryCode;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters'**
  String get passwordHint;

  /// No description provided for @passwordHelp.
  ///
  /// In en, this message translates to:
  /// **'Use 8+ characters with a number and a capital letter.'**
  String get passwordHelp;

  /// No description provided for @strengthTooShort.
  ///
  /// In en, this message translates to:
  /// **'Too short'**
  String get strengthTooShort;

  /// No description provided for @strengthWeak.
  ///
  /// In en, this message translates to:
  /// **'Weak. Add a number and a capital letter.'**
  String get strengthWeak;

  /// No description provided for @strengthOkay.
  ///
  /// In en, this message translates to:
  /// **'Okay. Add a capital letter or symbol.'**
  String get strengthOkay;

  /// No description provided for @strengthGood.
  ///
  /// In en, this message translates to:
  /// **'Good password'**
  String get strengthGood;

  /// No description provided for @strengthStrong.
  ///
  /// In en, this message translates to:
  /// **'Strong password'**
  String get strengthStrong;

  /// No description provided for @showPassword.
  ///
  /// In en, this message translates to:
  /// **'Show password'**
  String get showPassword;

  /// No description provided for @hidePassword.
  ///
  /// In en, this message translates to:
  /// **'Hide password'**
  String get hidePassword;

  /// No description provided for @termsAgree.
  ///
  /// In en, this message translates to:
  /// **'I agree to the Terms and Privacy Policy.'**
  String get termsAgree;

  /// No description provided for @haveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get haveAccount;

  /// No description provided for @errBusinessName.
  ///
  /// In en, this message translates to:
  /// **'Enter your business name.'**
  String get errBusinessName;

  /// No description provided for @errEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter your email.'**
  String get errEmail;

  /// No description provided for @errEmailFormat.
  ///
  /// In en, this message translates to:
  /// **'Check the email format, like name@business.com.'**
  String get errEmailFormat;

  /// No description provided for @errPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number.'**
  String get errPhone;

  /// No description provided for @errPhoneFull.
  ///
  /// In en, this message translates to:
  /// **'Enter a full phone number without the country code.'**
  String get errPhoneFull;

  /// No description provided for @errPasswordShort.
  ///
  /// In en, this message translates to:
  /// **'Password needs at least 8 characters.'**
  String get errPasswordShort;

  /// No description provided for @errTerms.
  ///
  /// In en, this message translates to:
  /// **'Accept the terms to continue.'**
  String get errTerms;

  /// No description provided for @errPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your password.'**
  String get errPassword;

  /// No description provided for @errNetwork.
  ///
  /// In en, this message translates to:
  /// **'Can\'t reach the server. Check your connection and try again.'**
  String get errNetwork;

  /// No description provided for @errGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Try again.'**
  String get errGeneric;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Log in to edit your menu and prices.'**
  String get loginSubtitle;

  /// No description provided for @loginWith.
  ///
  /// In en, this message translates to:
  /// **'Log in with'**
  String get loginWith;

  /// No description provided for @tabEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get tabEmail;

  /// No description provided for @tabPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get tabPhone;

  /// No description provided for @passwordHintLogin.
  ///
  /// In en, this message translates to:
  /// **'Your password'**
  String get passwordHintLogin;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @newTo.
  ///
  /// In en, this message translates to:
  /// **'New to {brandName}?'**
  String newTo(String brandName);

  /// No description provided for @createAnAccount.
  ///
  /// In en, this message translates to:
  /// **'Create an account'**
  String get createAnAccount;

  /// No description provided for @forgotTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset your password'**
  String get forgotTitle;

  /// No description provided for @forgotBody.
  ///
  /// In en, this message translates to:
  /// **'Enter your account email and we\'ll send you a reset link.'**
  String get forgotBody;

  /// No description provided for @sendLink.
  ///
  /// In en, this message translates to:
  /// **'Send reset link'**
  String get sendLink;

  /// No description provided for @resetSent.
  ///
  /// In en, this message translates to:
  /// **'We sent a reset link to your email'**
  String get resetSent;

  /// No description provided for @welcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Your table is set, {name}.'**
  String welcomeTitle(String name);

  /// No description provided for @welcomeNew.
  ///
  /// In en, this message translates to:
  /// **'Your account is ready. Next, pick a template and add your first items.'**
  String get welcomeNew;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'You are logged in. Your menu site is live at the link below.'**
  String get welcomeBack;

  /// No description provided for @yourLink.
  ///
  /// In en, this message translates to:
  /// **'Your menu link'**
  String get yourLink;

  /// No description provided for @copy.
  ///
  /// In en, this message translates to:
  /// **'Copy'**
  String get copy;

  /// No description provided for @copied.
  ///
  /// In en, this message translates to:
  /// **'Copied'**
  String get copied;

  /// No description provided for @stepAccount.
  ///
  /// In en, this message translates to:
  /// **'Account created'**
  String get stepAccount;

  /// No description provided for @stepTemplate.
  ///
  /// In en, this message translates to:
  /// **'Choose one of 100 templates'**
  String get stepTemplate;

  /// No description provided for @stepItems.
  ///
  /// In en, this message translates to:
  /// **'Add items and prices'**
  String get stepItems;

  /// No description provided for @stepPublish.
  ///
  /// In en, this message translates to:
  /// **'Choose Basic (\$5) or Pro (\$10) and publish'**
  String get stepPublish;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get logOut;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
