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

  /// No description provided for @tabProducts.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get tabProducts;

  /// No description provided for @tabCategories.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get tabCategories;

  /// No description provided for @tabSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get tabSettings;

  /// No description provided for @viewSite.
  ///
  /// In en, this message translates to:
  /// **'View site'**
  String get viewSite;

  /// No description provided for @savesGoLive.
  ///
  /// In en, this message translates to:
  /// **'Saves go live instantly'**
  String get savesGoLive;

  /// No description provided for @addProduct.
  ///
  /// In en, this message translates to:
  /// **'Add product'**
  String get addProduct;

  /// No description provided for @addCategory.
  ///
  /// In en, this message translates to:
  /// **'Add category'**
  String get addCategory;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get tryAgain;

  /// No description provided for @statProducts.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get statProducts;

  /// No description provided for @statSoldOut.
  ///
  /// In en, this message translates to:
  /// **'Sold out'**
  String get statSoldOut;

  /// No description provided for @statCategories.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get statCategories;

  /// No description provided for @searchProducts.
  ///
  /// In en, this message translates to:
  /// **'Search products'**
  String get searchProducts;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @noProductsTitle.
  ///
  /// In en, this message translates to:
  /// **'No products yet'**
  String get noProductsTitle;

  /// No description provided for @noProductsBody.
  ///
  /// In en, this message translates to:
  /// **'Tap Add product to put your first item on your website.'**
  String get noProductsBody;

  /// No description provided for @noMatchesTitle.
  ///
  /// In en, this message translates to:
  /// **'No matches'**
  String get noMatchesTitle;

  /// No description provided for @noMatchesBody.
  ///
  /// In en, this message translates to:
  /// **'Try another name, or clear the search.'**
  String get noMatchesBody;

  /// No description provided for @noProductsInCategory.
  ///
  /// In en, this message translates to:
  /// **'No products in this category yet.'**
  String get noProductsInCategory;

  /// No description provided for @soldOut.
  ///
  /// In en, this message translates to:
  /// **'Sold out'**
  String get soldOut;

  /// No description provided for @availableAgain.
  ///
  /// In en, this message translates to:
  /// **'{name} is available again'**
  String availableAgain(String name);

  /// No description provided for @markedSoldOut.
  ///
  /// In en, this message translates to:
  /// **'{name} marked sold out'**
  String markedSoldOut(String name);

  /// No description provided for @labelSignature.
  ///
  /// In en, this message translates to:
  /// **'Signature'**
  String get labelSignature;

  /// No description provided for @labelNew.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get labelNew;

  /// No description provided for @labelBestSeller.
  ///
  /// In en, this message translates to:
  /// **'Best seller'**
  String get labelBestSeller;

  /// No description provided for @labelVegan.
  ///
  /// In en, this message translates to:
  /// **'Vegan'**
  String get labelVegan;

  /// No description provided for @labelSpicy.
  ///
  /// In en, this message translates to:
  /// **'Spicy'**
  String get labelSpicy;

  /// No description provided for @priceIn.
  ///
  /// In en, this message translates to:
  /// **'{price} {currency}'**
  String priceIn(String price, String currency);

  /// No description provided for @currencyJod.
  ///
  /// In en, this message translates to:
  /// **'JD'**
  String get currencyJod;

  /// No description provided for @addCategoryFirst.
  ///
  /// In en, this message translates to:
  /// **'Add a category first'**
  String get addCategoryFirst;

  /// No description provided for @errProductName.
  ///
  /// In en, this message translates to:
  /// **'Enter a product name.'**
  String get errProductName;

  /// No description provided for @errPrice.
  ///
  /// In en, this message translates to:
  /// **'Enter a price.'**
  String get errPrice;

  /// No description provided for @errPriceFormat.
  ///
  /// In en, this message translates to:
  /// **'Use numbers only, like 3.50.'**
  String get errPriceFormat;

  /// No description provided for @savedLive.
  ///
  /// In en, this message translates to:
  /// **'Saved · live on your website'**
  String get savedLive;

  /// No description provided for @addedLive.
  ///
  /// In en, this message translates to:
  /// **'Added · live on your website'**
  String get addedLive;

  /// No description provided for @productDeleted.
  ///
  /// In en, this message translates to:
  /// **'Product deleted'**
  String get productDeleted;

  /// No description provided for @editProduct.
  ///
  /// In en, this message translates to:
  /// **'Edit product'**
  String get editProduct;

  /// No description provided for @newProduct.
  ///
  /// In en, this message translates to:
  /// **'New product'**
  String get newProduct;

  /// No description provided for @editProductSub.
  ///
  /// In en, this message translates to:
  /// **'Changes show on your website as soon as you save.'**
  String get editProductSub;

  /// No description provided for @newProductSub.
  ///
  /// In en, this message translates to:
  /// **'It appears on your website right after you save.'**
  String get newProductSub;

  /// No description provided for @uploading.
  ///
  /// In en, this message translates to:
  /// **'Uploading'**
  String get uploading;

  /// No description provided for @uploadPhoto.
  ///
  /// In en, this message translates to:
  /// **'Upload photo'**
  String get uploadPhoto;

  /// No description provided for @changePhoto.
  ///
  /// In en, this message translates to:
  /// **'Change photo'**
  String get changePhoto;

  /// No description provided for @remove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get remove;

  /// No description provided for @productName.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get productName;

  /// No description provided for @productNameHint.
  ///
  /// In en, this message translates to:
  /// **'Pistachio croissant'**
  String get productNameHint;

  /// No description provided for @descriptionOptional.
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get descriptionOptional;

  /// No description provided for @descriptionHint.
  ///
  /// In en, this message translates to:
  /// **'What\'s in it, size, how it\'s served'**
  String get descriptionHint;

  /// No description provided for @price.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get price;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @label.
  ///
  /// In en, this message translates to:
  /// **'Label'**
  String get label;

  /// No description provided for @noLabel.
  ///
  /// In en, this message translates to:
  /// **'No label'**
  String get noLabel;

  /// No description provided for @available.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get available;

  /// No description provided for @availableHelp.
  ///
  /// In en, this message translates to:
  /// **'Turn off to show it as sold out'**
  String get availableHelp;

  /// No description provided for @featureSignature.
  ///
  /// In en, this message translates to:
  /// **'Feature in Signature picks'**
  String get featureSignature;

  /// No description provided for @featureSignatureHelp.
  ///
  /// In en, this message translates to:
  /// **'Shown large near the top of your website'**
  String get featureSignatureHelp;

  /// No description provided for @deleteProductTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete {name}?'**
  String deleteProductTitle(String name);

  /// No description provided for @deleteProductBody.
  ///
  /// In en, this message translates to:
  /// **'It will be removed from your website. This can\'t be undone.'**
  String get deleteProductBody;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get saveChanges;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving'**
  String get saving;

  /// No description provided for @deleteProduct.
  ///
  /// In en, this message translates to:
  /// **'Delete product'**
  String get deleteProduct;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @keepIt.
  ///
  /// In en, this message translates to:
  /// **'Keep it'**
  String get keepIt;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @noCategoriesTitle.
  ///
  /// In en, this message translates to:
  /// **'No categories yet'**
  String get noCategoriesTitle;

  /// No description provided for @noCategoriesBody.
  ///
  /// In en, this message translates to:
  /// **'Categories group your products, like Coffee or Desserts.'**
  String get noCategoriesBody;

  /// No description provided for @categoriesHint.
  ///
  /// In en, this message translates to:
  /// **'Use the arrows to set the order your customers see. Categories with no products stay hidden on your website.'**
  String get categoriesHint;

  /// No description provided for @productCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No products} =1{1 product} other{{count} products}}'**
  String productCount(int count);

  /// No description provided for @hiddenOnSite.
  ///
  /// In en, this message translates to:
  /// **'Hidden on site'**
  String get hiddenOnSite;

  /// No description provided for @moveUp.
  ///
  /// In en, this message translates to:
  /// **'Move {name} up'**
  String moveUp(String name);

  /// No description provided for @moveDown.
  ///
  /// In en, this message translates to:
  /// **'Move {name} down'**
  String moveDown(String name);

  /// No description provided for @orderUpdated.
  ///
  /// In en, this message translates to:
  /// **'Order updated on your website'**
  String get orderUpdated;

  /// No description provided for @errCategoryName.
  ///
  /// In en, this message translates to:
  /// **'Enter a category name.'**
  String get errCategoryName;

  /// No description provided for @errCategoryTaken.
  ///
  /// In en, this message translates to:
  /// **'You already have a category with that name.'**
  String get errCategoryTaken;

  /// No description provided for @categoryAdded.
  ///
  /// In en, this message translates to:
  /// **'Category added. Add products to show it.'**
  String get categoryAdded;

  /// No description provided for @categoryRenamed.
  ///
  /// In en, this message translates to:
  /// **'Renamed · live on your website'**
  String get categoryRenamed;

  /// No description provided for @categoryDeleted.
  ///
  /// In en, this message translates to:
  /// **'Category deleted'**
  String get categoryDeleted;

  /// No description provided for @categoryDeletedMoved.
  ///
  /// In en, this message translates to:
  /// **'Deleted · products moved to {name}'**
  String categoryDeletedMoved(String name);

  /// No description provided for @newCategory.
  ///
  /// In en, this message translates to:
  /// **'New category'**
  String get newCategory;

  /// No description provided for @editCategory.
  ///
  /// In en, this message translates to:
  /// **'Edit category'**
  String get editCategory;

  /// No description provided for @newCategorySub.
  ///
  /// In en, this message translates to:
  /// **'Group your products, like Coffee, Sandwiches or Gift boxes.'**
  String get newCategorySub;

  /// No description provided for @productsInCategory.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No products in this category.} =1{1 product in this category.} other{{count} products in this category.}}'**
  String productsInCategory(int count);

  /// No description provided for @categoryName.
  ///
  /// In en, this message translates to:
  /// **'Category name'**
  String get categoryName;

  /// No description provided for @categoryNameHint.
  ///
  /// In en, this message translates to:
  /// **'Sandwiches'**
  String get categoryNameHint;

  /// No description provided for @deleteCategoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete {name}?'**
  String deleteCategoryTitle(String name);

  /// No description provided for @deleteCategoryChoose.
  ///
  /// In en, this message translates to:
  /// **'Choose where its products go first.'**
  String get deleteCategoryChoose;

  /// No description provided for @deleteCategoryEmpty.
  ///
  /// In en, this message translates to:
  /// **'It has no products, so nothing else changes.'**
  String get deleteCategoryEmpty;

  /// No description provided for @whatHappensToProducts.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{What happens to its product?} other{What happens to its {count} products?}}'**
  String whatHappensToProducts(int count);

  /// No description provided for @moveTo.
  ///
  /// In en, this message translates to:
  /// **'Move to {name}'**
  String moveTo(String name);

  /// No description provided for @deleteThemToo.
  ///
  /// In en, this message translates to:
  /// **'Delete them too'**
  String get deleteThemToo;

  /// No description provided for @deleteCategory.
  ///
  /// In en, this message translates to:
  /// **'Delete category'**
  String get deleteCategory;

  /// No description provided for @yourWebsite.
  ///
  /// In en, this message translates to:
  /// **'Your website'**
  String get yourWebsite;

  /// No description provided for @live.
  ///
  /// In en, this message translates to:
  /// **'Live'**
  String get live;

  /// No description provided for @notPublished.
  ///
  /// In en, this message translates to:
  /// **'Not published'**
  String get notPublished;

  /// No description provided for @websiteTemplate.
  ///
  /// In en, this message translates to:
  /// **'{link} · Template {number} {name}'**
  String websiteTemplate(String link, String number, String name);

  /// No description provided for @editDesign.
  ///
  /// In en, this message translates to:
  /// **'Edit design'**
  String get editDesign;

  /// No description provided for @chooseTemplateShort.
  ///
  /// In en, this message translates to:
  /// **'Change template'**
  String get chooseTemplateShort;

  /// No description provided for @copyLink.
  ///
  /// In en, this message translates to:
  /// **'Copy link'**
  String get copyLink;

  /// No description provided for @linkCopied.
  ///
  /// In en, this message translates to:
  /// **'Link copied'**
  String get linkCopied;

  /// No description provided for @businessInfo.
  ///
  /// In en, this message translates to:
  /// **'Business info'**
  String get businessInfo;

  /// No description provided for @businessInfoSub.
  ///
  /// In en, this message translates to:
  /// **'Shown in your website header, contact section and footer.'**
  String get businessInfoSub;

  /// No description provided for @errBusinessNameEmpty.
  ///
  /// In en, this message translates to:
  /// **'Business name can\'t be empty'**
  String get errBusinessNameEmpty;

  /// No description provided for @whatsApp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get whatsApp;

  /// No description provided for @address.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get address;

  /// No description provided for @instagram.
  ///
  /// In en, this message translates to:
  /// **'Instagram'**
  String get instagram;

  /// No description provided for @account.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get account;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @passwordLinkSent.
  ///
  /// In en, this message translates to:
  /// **'We emailed you a link to change your password'**
  String get passwordLinkSent;

  /// No description provided for @plan.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get plan;

  /// No description provided for @planBasic.
  ///
  /// In en, this message translates to:
  /// **'Basic'**
  String get planBasic;

  /// No description provided for @planPro.
  ///
  /// In en, this message translates to:
  /// **'Pro'**
  String get planPro;

  /// No description provided for @planCurrent.
  ///
  /// In en, this message translates to:
  /// **'{name} · current'**
  String planCurrent(String name);

  /// No description provided for @perMonth.
  ///
  /// In en, this message translates to:
  /// **'/mo'**
  String get perMonth;

  /// No description provided for @proDetail.
  ///
  /// In en, this message translates to:
  /// **'Everything in Basic plus your own domain'**
  String get proDetail;

  /// No description provided for @testModeNote.
  ///
  /// In en, this message translates to:
  /// **'Test account: every feature is unlocked and nothing is charged.'**
  String get testModeNote;

  /// No description provided for @trialUntil.
  ///
  /// In en, this message translates to:
  /// **'Free trial until {date}'**
  String trialUntil(String date);

  /// No description provided for @upgradeToPro.
  ///
  /// In en, this message translates to:
  /// **'Upgrade to Pro'**
  String get upgradeToPro;

  /// No description provided for @switchToBasic.
  ///
  /// In en, this message translates to:
  /// **'Switch to Basic'**
  String get switchToBasic;

  /// No description provided for @upgradeBody.
  ///
  /// In en, this message translates to:
  /// **'{price} per month. You can request your own domain right after upgrading.'**
  String upgradeBody(String price);

  /// No description provided for @downgradeBody.
  ///
  /// In en, this message translates to:
  /// **'{price} per month from your next billing date.'**
  String downgradeBody(String price);

  /// No description provided for @downgradeDomain.
  ///
  /// In en, this message translates to:
  /// **'Your domain request for {domain} will be cancelled.'**
  String downgradeDomain(String domain);

  /// No description provided for @upgradeFor.
  ///
  /// In en, this message translates to:
  /// **'Upgrade for {price}/month'**
  String upgradeFor(String price);

  /// No description provided for @notNow.
  ///
  /// In en, this message translates to:
  /// **'Not now'**
  String get notNow;

  /// No description provided for @nowOnPro.
  ///
  /// In en, this message translates to:
  /// **'You\'re on Pro'**
  String get nowOnPro;

  /// No description provided for @nowOnBasic.
  ///
  /// In en, this message translates to:
  /// **'You\'re on Basic'**
  String get nowOnBasic;

  /// No description provided for @finishPayment.
  ///
  /// In en, this message translates to:
  /// **'Finish the payment in your browser to change plan'**
  String get finishPayment;

  /// No description provided for @customDomain.
  ///
  /// In en, this message translates to:
  /// **'Custom domain'**
  String get customDomain;

  /// No description provided for @domainLocked.
  ///
  /// In en, this message translates to:
  /// **'Connect your own domain, like {example}. Available on Pro.'**
  String domainLocked(String example);

  /// No description provided for @domainEnterBody.
  ///
  /// In en, this message translates to:
  /// **'Enter the domain you own. Our support team sets it up and emails you the DNS steps.'**
  String get domainEnterBody;

  /// No description provided for @yourDomain.
  ///
  /// In en, this message translates to:
  /// **'Your domain'**
  String get yourDomain;

  /// No description provided for @errDomainEmpty.
  ///
  /// In en, this message translates to:
  /// **'Enter your domain.'**
  String get errDomainEmpty;

  /// No description provided for @errDomainFormat.
  ///
  /// In en, this message translates to:
  /// **'Enter a domain like vanillamenu.com, without spaces.'**
  String get errDomainFormat;

  /// No description provided for @sendToSupport.
  ///
  /// In en, this message translates to:
  /// **'Send request to support'**
  String get sendToSupport;

  /// No description provided for @sending.
  ///
  /// In en, this message translates to:
  /// **'Sending'**
  String get sending;

  /// No description provided for @domainRequestSent.
  ///
  /// In en, this message translates to:
  /// **'Request sent to support'**
  String get domainRequestSent;

  /// No description provided for @domainRequestCancelled.
  ///
  /// In en, this message translates to:
  /// **'Domain request cancelled'**
  String get domainRequestCancelled;

  /// No description provided for @domainRequested.
  ///
  /// In en, this message translates to:
  /// **'{domain} · request sent {date}'**
  String domainRequested(String domain, String date);

  /// No description provided for @domainStep1.
  ///
  /// In en, this message translates to:
  /// **'Request sent'**
  String get domainStep1;

  /// No description provided for @domainStep2.
  ///
  /// In en, this message translates to:
  /// **'Support emails you DNS steps (within 24 hours)'**
  String get domainStep2;

  /// No description provided for @domainStep3.
  ///
  /// In en, this message translates to:
  /// **'You add the DNS record at your domain provider'**
  String get domainStep3;

  /// No description provided for @domainStep4.
  ///
  /// In en, this message translates to:
  /// **'Live with SSL at {domain}'**
  String domainStep4(String domain);

  /// No description provided for @dnsHint.
  ///
  /// In en, this message translates to:
  /// **'Point the www record (CNAME) of your domain to {target}.'**
  String dnsHint(String target);

  /// No description provided for @cancelRequest.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get cancelRequest;

  /// No description provided for @openInBrowser.
  ///
  /// In en, this message translates to:
  /// **'Open in browser'**
  String get openInBrowser;

  /// No description provided for @manageMenu.
  ///
  /// In en, this message translates to:
  /// **'Manage your menu'**
  String get manageMenu;

  /// No description provided for @siteOfflineTitle.
  ///
  /// In en, this message translates to:
  /// **'This page isn\'t online yet'**
  String get siteOfflineTitle;

  /// No description provided for @siteOfflineBody.
  ///
  /// In en, this message translates to:
  /// **'Your changes are saved. The page shows here once the websites are hosted.'**
  String get siteOfflineBody;

  /// No description provided for @chooseTemplate.
  ///
  /// In en, this message translates to:
  /// **'Choose a template'**
  String get chooseTemplate;

  /// No description provided for @templatesSub.
  ///
  /// In en, this message translates to:
  /// **'{count} designs. Each one shows your products its own way.'**
  String templatesSub(int count);

  /// No description provided for @filterAllCount.
  ///
  /// In en, this message translates to:
  /// **'All {count}'**
  String filterAllCount(int count);

  /// No description provided for @filterFood.
  ///
  /// In en, this message translates to:
  /// **'Food and drinks'**
  String get filterFood;

  /// No description provided for @filterShops.
  ///
  /// In en, this message translates to:
  /// **'Shops'**
  String get filterShops;

  /// No description provided for @filterServices.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get filterServices;

  /// No description provided for @replaceDesignTitle.
  ///
  /// In en, this message translates to:
  /// **'Use {name}?'**
  String replaceDesignTitle(String name);

  /// No description provided for @replaceDesignBody.
  ///
  /// In en, this message translates to:
  /// **'Your design settings start fresh with this template. Products and prices stay the same. Your live site changes when you publish.'**
  String get replaceDesignBody;

  /// No description provided for @useTemplate.
  ///
  /// In en, this message translates to:
  /// **'Use template'**
  String get useTemplate;

  /// No description provided for @inUse.
  ///
  /// In en, this message translates to:
  /// **'In use'**
  String get inUse;

  /// No description provided for @ready.
  ///
  /// In en, this message translates to:
  /// **'Ready'**
  String get ready;

  /// No description provided for @customize.
  ///
  /// In en, this message translates to:
  /// **'Customize'**
  String get customize;

  /// No description provided for @customizeTemplate.
  ///
  /// In en, this message translates to:
  /// **'{number} {name}'**
  String customizeTemplate(String number, String name);

  /// No description provided for @resetTooltip.
  ///
  /// In en, this message translates to:
  /// **'Reset to template defaults'**
  String get resetTooltip;

  /// No description provided for @resetTitle.
  ///
  /// In en, this message translates to:
  /// **'Start over?'**
  String get resetTitle;

  /// No description provided for @resetBody.
  ///
  /// In en, this message translates to:
  /// **'Every design setting goes back to {name}\'s defaults. Products and prices stay the same.'**
  String resetBody(String name);

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @livePreview.
  ///
  /// In en, this message translates to:
  /// **'Live preview'**
  String get livePreview;

  /// No description provided for @groupMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get groupMore;

  /// No description provided for @menuItemsAndPrices.
  ///
  /// In en, this message translates to:
  /// **'Menu items and prices'**
  String get menuItemsAndPrices;

  /// No description provided for @menuItemsElsewhere.
  ///
  /// In en, this message translates to:
  /// **'Products and prices are edited in My menu, and show in every template.'**
  String get menuItemsElsewhere;

  /// No description provided for @publish.
  ///
  /// In en, this message translates to:
  /// **'Publish'**
  String get publish;

  /// No description provided for @publishChanges.
  ///
  /// In en, this message translates to:
  /// **'Publish changes'**
  String get publishChanges;

  /// No description provided for @publishing.
  ///
  /// In en, this message translates to:
  /// **'Publishing your site'**
  String get publishing;

  /// No description provided for @publishedTitle.
  ///
  /// In en, this message translates to:
  /// **'Your site is live'**
  String get publishedTitle;

  /// No description provided for @publishedBody.
  ///
  /// In en, this message translates to:
  /// **'Customers see the new design now. Products and prices update by themselves when you change them.'**
  String get publishedBody;

  /// No description provided for @photo.
  ///
  /// In en, this message translates to:
  /// **'Photo'**
  String get photo;

  /// No description provided for @addPhotos.
  ///
  /// In en, this message translates to:
  /// **'Add photos'**
  String get addPhotos;

  /// No description provided for @closed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get closed;

  /// No description provided for @goToMenu.
  ///
  /// In en, this message translates to:
  /// **'Go to my menu'**
  String get goToMenu;

  /// No description provided for @onbItemsTitle.
  ///
  /// In en, this message translates to:
  /// **'List your items and prices in minutes'**
  String get onbItemsTitle;

  /// No description provided for @onbItemsBody.
  ///
  /// In en, this message translates to:
  /// **'Add photos, prices and categories. Edit anything later and your site updates right away.'**
  String get onbItemsBody;

  /// No description provided for @onbTemplatesTitle.
  ///
  /// In en, this message translates to:
  /// **'Pick one of 100 templates, then make it yours'**
  String get onbTemplatesTitle;

  /// No description provided for @onbTemplatesBody.
  ///
  /// In en, this message translates to:
  /// **'Each template shows your products its own way. Choose the hero image, colors and add your logo.'**
  String get onbTemplatesBody;

  /// No description provided for @onbShareTitle.
  ///
  /// In en, this message translates to:
  /// **'Share one link. Go custom on Pro.'**
  String get onbShareTitle;

  /// No description provided for @onbShareBody.
  ///
  /// In en, this message translates to:
  /// **'Put the link on your Instagram, WhatsApp or a table QR code. Customers see your menu instantly.'**
  String get onbShareBody;

  /// No description provided for @sampleCafe.
  ///
  /// In en, this message translates to:
  /// **'Vanilla Café'**
  String get sampleCafe;

  /// No description provided for @sampleDrinks.
  ///
  /// In en, this message translates to:
  /// **'Drinks'**
  String get sampleDrinks;

  /// No description provided for @sampleItem1.
  ///
  /// In en, this message translates to:
  /// **'Vanilla latte'**
  String get sampleItem1;

  /// No description provided for @sampleItem1Note.
  ///
  /// In en, this message translates to:
  /// **'Double shot, oat milk'**
  String get sampleItem1Note;

  /// No description provided for @sampleItem2.
  ///
  /// In en, this message translates to:
  /// **'Pistachio croissant'**
  String get sampleItem2;

  /// No description provided for @sampleItem2Note.
  ///
  /// In en, this message translates to:
  /// **'Baked this morning'**
  String get sampleItem2Note;

  /// No description provided for @sampleItem3.
  ///
  /// In en, this message translates to:
  /// **'Saffron cake'**
  String get sampleItem3;

  /// No description provided for @sampleItem3Note.
  ///
  /// In en, this message translates to:
  /// **'Slice, cardamom cream'**
  String get sampleItem3Note;

  /// No description provided for @addItem.
  ///
  /// In en, this message translates to:
  /// **'Add item'**
  String get addItem;

  /// No description provided for @templateOf.
  ///
  /// In en, this message translates to:
  /// **'Template {number} / 100'**
  String templateOf(String number);

  /// No description provided for @hello.
  ///
  /// In en, this message translates to:
  /// **'Hello, {name}'**
  String hello(String name);

  /// No description provided for @siteLive.
  ///
  /// In en, this message translates to:
  /// **'Your site is live'**
  String get siteLive;

  /// No description provided for @quickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick actions'**
  String get quickActions;

  /// No description provided for @designSite.
  ///
  /// In en, this message translates to:
  /// **'Design'**
  String get designSite;

  /// No description provided for @shareSite.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get shareSite;

  /// No description provided for @allItems.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get allItems;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get getStarted;

  /// No description provided for @splashTagline.
  ///
  /// In en, this message translates to:
  /// **'Your menu, beautifully served.'**
  String get splashTagline;

  /// No description provided for @onbBasicPrice.
  ///
  /// In en, this message translates to:
  /// **'\$5'**
  String get onbBasicPrice;

  /// No description provided for @onbProPrice.
  ///
  /// In en, this message translates to:
  /// **'\$10'**
  String get onbProPrice;

  /// No description provided for @onbBasicNote.
  ///
  /// In en, this message translates to:
  /// **'Your site at {link}'**
  String onbBasicNote(String link);

  /// No description provided for @onbProNote.
  ///
  /// In en, this message translates to:
  /// **'Your own domain, set up by our support team'**
  String get onbProNote;

  /// No description provided for @onbHeroColor.
  ///
  /// In en, this message translates to:
  /// **'Hero color'**
  String get onbHeroColor;
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
