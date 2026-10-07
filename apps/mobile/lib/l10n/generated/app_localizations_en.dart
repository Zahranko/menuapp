// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get createAccount => 'Create account';

  @override
  String get creatingAccount => 'Creating account';

  @override
  String get logIn => 'Log in';

  @override
  String get loggingIn => 'Logging in';

  @override
  String get back => 'Back';

  @override
  String get signupTitle => 'Set up your business';

  @override
  String get signupSubtitle =>
      'One account, one menu site. Takes about a minute.';

  @override
  String get businessName => 'Business name';

  @override
  String get businessNameHint => 'Vanilla Menu';

  @override
  String get linkAvailable => 'Available';

  @override
  String get linkTaken => 'Taken';

  @override
  String get email => 'Email';

  @override
  String get emailHint => 'you@business.com';

  @override
  String get phone => 'Phone number';

  @override
  String get phoneHint => '7X XXX XXXX';

  @override
  String get countryCode => 'Country code';

  @override
  String get password => 'Password';

  @override
  String get passwordHint => 'At least 8 characters';

  @override
  String get passwordHelp =>
      'Use 8+ characters with a number and a capital letter.';

  @override
  String get strengthTooShort => 'Too short';

  @override
  String get strengthWeak => 'Weak. Add a number and a capital letter.';

  @override
  String get strengthOkay => 'Okay. Add a capital letter or symbol.';

  @override
  String get strengthGood => 'Good password';

  @override
  String get strengthStrong => 'Strong password';

  @override
  String get showPassword => 'Show password';

  @override
  String get hidePassword => 'Hide password';

  @override
  String get termsAgree => 'I agree to the Terms and Privacy Policy.';

  @override
  String get haveAccount => 'Already have an account?';

  @override
  String get errBusinessName => 'Enter your business name.';

  @override
  String get errEmail => 'Enter your email.';

  @override
  String get errEmailFormat =>
      'Check the email format, like name@business.com.';

  @override
  String get errPhone => 'Enter your phone number.';

  @override
  String get errPhoneFull =>
      'Enter a full phone number without the country code.';

  @override
  String get errPasswordShort => 'Password needs at least 8 characters.';

  @override
  String get errTerms => 'Accept the terms to continue.';

  @override
  String get errPassword => 'Enter your password.';

  @override
  String get errNetwork =>
      'Can\'t reach the server. Check your connection and try again.';

  @override
  String get errGeneric => 'Something went wrong. Try again.';

  @override
  String get loginTitle => 'Welcome back';

  @override
  String get loginSubtitle => 'Log in to edit your menu and prices.';

  @override
  String get loginWith => 'Log in with';

  @override
  String get tabEmail => 'Email';

  @override
  String get tabPhone => 'Phone';

  @override
  String get passwordHintLogin => 'Your password';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String newTo(String brandName) {
    return 'New to $brandName?';
  }

  @override
  String get createAnAccount => 'Create an account';

  @override
  String get forgotTitle => 'Reset your password';

  @override
  String get forgotBody =>
      'Enter your account email and we\'ll send you a reset link.';

  @override
  String get sendLink => 'Send reset link';

  @override
  String get resetSent => 'We sent a reset link to your email';

  @override
  String welcomeTitle(String name) {
    return 'Your table is set, $name.';
  }

  @override
  String get welcomeNew =>
      'Your account is ready. Next, pick a template and add your first items.';

  @override
  String get welcomeBack =>
      'You are logged in. Your menu site is live at the link below.';

  @override
  String get yourLink => 'Your menu link';

  @override
  String get copy => 'Copy';

  @override
  String get copied => 'Copied';

  @override
  String get stepAccount => 'Account created';

  @override
  String get stepTemplate => 'Choose one of 100 templates';

  @override
  String get stepItems => 'Add items and prices';

  @override
  String get stepPublish => 'Choose Basic (\$5) or Pro (\$10) and publish';

  @override
  String get logOut => 'Log out';
}
