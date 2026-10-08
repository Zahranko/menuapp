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

  @override
  String get tabProducts => 'Products';

  @override
  String get tabCategories => 'Categories';

  @override
  String get tabSettings => 'Settings';

  @override
  String get viewSite => 'View site';

  @override
  String get savesGoLive => 'Saves go live instantly';

  @override
  String get addProduct => 'Add product';

  @override
  String get addCategory => 'Add category';

  @override
  String get tryAgain => 'Try again';

  @override
  String get statProducts => 'Products';

  @override
  String get statSoldOut => 'Sold out';

  @override
  String get statCategories => 'Categories';

  @override
  String get searchProducts => 'Search products';

  @override
  String get filterAll => 'All';

  @override
  String get noProductsTitle => 'No products yet';

  @override
  String get noProductsBody =>
      'Tap Add product to put your first item on your website.';

  @override
  String get noMatchesTitle => 'No matches';

  @override
  String get noMatchesBody => 'Try another name, or clear the search.';

  @override
  String get noProductsInCategory => 'No products in this category yet.';

  @override
  String get soldOut => 'Sold out';

  @override
  String availableAgain(String name) {
    return '$name is available again';
  }

  @override
  String markedSoldOut(String name) {
    return '$name marked sold out';
  }

  @override
  String get labelSignature => 'Signature';

  @override
  String get labelNew => 'New';

  @override
  String get labelBestSeller => 'Best seller';

  @override
  String get labelVegan => 'Vegan';

  @override
  String get labelSpicy => 'Spicy';

  @override
  String priceIn(String price, String currency) {
    return '$price $currency';
  }

  @override
  String get currencyJod => 'JD';

  @override
  String get addCategoryFirst => 'Add a category first';

  @override
  String get errProductName => 'Enter a product name.';

  @override
  String get errPrice => 'Enter a price.';

  @override
  String get errPriceFormat => 'Use numbers only, like 3.50.';

  @override
  String get savedLive => 'Saved · live on your website';

  @override
  String get addedLive => 'Added · live on your website';

  @override
  String get productDeleted => 'Product deleted';

  @override
  String get editProduct => 'Edit product';

  @override
  String get newProduct => 'New product';

  @override
  String get editProductSub =>
      'Changes show on your website as soon as you save.';

  @override
  String get newProductSub =>
      'It appears on your website right after you save.';

  @override
  String get uploading => 'Uploading';

  @override
  String get uploadPhoto => 'Upload photo';

  @override
  String get changePhoto => 'Change photo';

  @override
  String get remove => 'Remove';

  @override
  String get productName => 'Name';

  @override
  String get productNameHint => 'Pistachio croissant';

  @override
  String get descriptionOptional => 'Description (optional)';

  @override
  String get descriptionHint => 'What\'s in it, size, how it\'s served';

  @override
  String get price => 'Price';

  @override
  String get category => 'Category';

  @override
  String get label => 'Label';

  @override
  String get noLabel => 'No label';

  @override
  String get available => 'Available';

  @override
  String get availableHelp => 'Turn off to show it as sold out';

  @override
  String get featureSignature => 'Feature in Signature picks';

  @override
  String get featureSignatureHelp => 'Shown large near the top of your website';

  @override
  String deleteProductTitle(String name) {
    return 'Delete $name?';
  }

  @override
  String get deleteProductBody =>
      'It will be removed from your website. This can\'t be undone.';

  @override
  String get saveChanges => 'Save changes';

  @override
  String get saving => 'Saving';

  @override
  String get deleteProduct => 'Delete product';

  @override
  String get cancel => 'Cancel';

  @override
  String get keepIt => 'Keep it';

  @override
  String get delete => 'Delete';

  @override
  String get noCategoriesTitle => 'No categories yet';

  @override
  String get noCategoriesBody =>
      'Categories group your products, like Coffee or Desserts.';

  @override
  String get categoriesHint =>
      'Use the arrows to set the order your customers see. Categories with no products stay hidden on your website.';

  @override
  String productCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count products',
      one: '1 product',
      zero: 'No products',
    );
    return '$_temp0';
  }

  @override
  String get hiddenOnSite => 'Hidden on site';

  @override
  String moveUp(String name) {
    return 'Move $name up';
  }

  @override
  String moveDown(String name) {
    return 'Move $name down';
  }

  @override
  String get orderUpdated => 'Order updated on your website';

  @override
  String get errCategoryName => 'Enter a category name.';

  @override
  String get errCategoryTaken => 'You already have a category with that name.';

  @override
  String get categoryAdded => 'Category added. Add products to show it.';

  @override
  String get categoryRenamed => 'Renamed · live on your website';

  @override
  String get categoryDeleted => 'Category deleted';

  @override
  String categoryDeletedMoved(String name) {
    return 'Deleted · products moved to $name';
  }

  @override
  String get newCategory => 'New category';

  @override
  String get editCategory => 'Edit category';

  @override
  String get newCategorySub =>
      'Group your products, like Coffee, Sandwiches or Gift boxes.';

  @override
  String productsInCategory(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count products in this category.',
      one: '1 product in this category.',
      zero: 'No products in this category.',
    );
    return '$_temp0';
  }

  @override
  String get categoryName => 'Category name';

  @override
  String get categoryNameHint => 'Sandwiches';

  @override
  String deleteCategoryTitle(String name) {
    return 'Delete $name?';
  }

  @override
  String get deleteCategoryChoose => 'Choose where its products go first.';

  @override
  String get deleteCategoryEmpty =>
      'It has no products, so nothing else changes.';

  @override
  String whatHappensToProducts(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'What happens to its $count products?',
      one: 'What happens to its product?',
    );
    return '$_temp0';
  }

  @override
  String moveTo(String name) {
    return 'Move to $name';
  }

  @override
  String get deleteThemToo => 'Delete them too';

  @override
  String get deleteCategory => 'Delete category';

  @override
  String get yourWebsite => 'Your website';

  @override
  String get live => 'Live';

  @override
  String get notPublished => 'Not published';

  @override
  String websiteTemplate(String link, String number, String name) {
    return '$link · Template $number $name';
  }

  @override
  String get editDesign => 'Edit design';

  @override
  String get chooseTemplateShort => 'Change template';

  @override
  String get copyLink => 'Copy link';

  @override
  String get linkCopied => 'Link copied';

  @override
  String get businessInfo => 'Business info';

  @override
  String get businessInfoSub =>
      'Shown in your website header, contact section and footer.';

  @override
  String get errBusinessNameEmpty => 'Business name can\'t be empty';

  @override
  String get whatsApp => 'WhatsApp';

  @override
  String get address => 'Address';

  @override
  String get instagram => 'Instagram';

  @override
  String get account => 'Account';

  @override
  String get changePassword => 'Change password';

  @override
  String get passwordLinkSent =>
      'We emailed you a link to change your password';

  @override
  String get plan => 'Plan';

  @override
  String get planBasic => 'Basic';

  @override
  String get planPro => 'Pro';

  @override
  String planCurrent(String name) {
    return '$name · current';
  }

  @override
  String get perMonth => '/mo';

  @override
  String get proDetail => 'Everything in Basic plus your own domain';

  @override
  String get testModeNote =>
      'Test account: every feature is unlocked and nothing is charged.';

  @override
  String trialUntil(String date) {
    return 'Free trial until $date';
  }

  @override
  String get upgradeToPro => 'Upgrade to Pro';

  @override
  String get switchToBasic => 'Switch to Basic';

  @override
  String upgradeBody(String price) {
    return '$price per month. You can request your own domain right after upgrading.';
  }

  @override
  String downgradeBody(String price) {
    return '$price per month from your next billing date.';
  }

  @override
  String downgradeDomain(String domain) {
    return 'Your domain request for $domain will be cancelled.';
  }

  @override
  String upgradeFor(String price) {
    return 'Upgrade for $price/month';
  }

  @override
  String get notNow => 'Not now';

  @override
  String get nowOnPro => 'You\'re on Pro';

  @override
  String get nowOnBasic => 'You\'re on Basic';

  @override
  String get finishPayment =>
      'Finish the payment in your browser to change plan';

  @override
  String get customDomain => 'Custom domain';

  @override
  String domainLocked(String example) {
    return 'Connect your own domain, like $example. Available on Pro.';
  }

  @override
  String get domainEnterBody =>
      'Enter the domain you own. Our support team sets it up and emails you the DNS steps.';

  @override
  String get yourDomain => 'Your domain';

  @override
  String get errDomainEmpty => 'Enter your domain.';

  @override
  String get errDomainFormat =>
      'Enter a domain like vanillamenu.com, without spaces.';

  @override
  String get sendToSupport => 'Send request to support';

  @override
  String get sending => 'Sending';

  @override
  String get domainRequestSent => 'Request sent to support';

  @override
  String get domainRequestCancelled => 'Domain request cancelled';

  @override
  String domainRequested(String domain, String date) {
    return '$domain · request sent $date';
  }

  @override
  String get domainStep1 => 'Request sent';

  @override
  String get domainStep2 => 'Support emails you DNS steps (within 24 hours)';

  @override
  String get domainStep3 => 'You add the DNS record at your domain provider';

  @override
  String domainStep4(String domain) {
    return 'Live with SSL at $domain';
  }

  @override
  String dnsHint(String target) {
    return 'Point the www record (CNAME) of your domain to $target.';
  }

  @override
  String get cancelRequest => 'Cancel request';

  @override
  String get openInBrowser => 'Open in browser';

  @override
  String get manageMenu => 'Manage your menu';

  @override
  String get siteOfflineTitle => 'This page isn\'t online yet';

  @override
  String get siteOfflineBody =>
      'Your changes are saved. The page shows here once the websites are hosted.';

  @override
  String get chooseTemplate => 'Choose a template';

  @override
  String templatesSub(int count) {
    return '$count designs. Each one shows your products its own way.';
  }

  @override
  String filterAllCount(int count) {
    return 'All $count';
  }

  @override
  String get filterFood => 'Food and drinks';

  @override
  String get filterShops => 'Shops';

  @override
  String get filterServices => 'Services';

  @override
  String replaceDesignTitle(String name) {
    return 'Use $name?';
  }

  @override
  String get replaceDesignBody =>
      'Your design settings start fresh with this template. Products and prices stay the same. Your live site changes when you publish.';

  @override
  String get useTemplate => 'Use template';

  @override
  String get inUse => 'In use';

  @override
  String get ready => 'Ready';

  @override
  String get customize => 'Customize';

  @override
  String customizeTemplate(String number, String name) {
    return '$number $name';
  }

  @override
  String get resetTooltip => 'Reset to template defaults';

  @override
  String get resetTitle => 'Start over?';

  @override
  String resetBody(String name) {
    return 'Every design setting goes back to $name\'s defaults. Products and prices stay the same.';
  }

  @override
  String get reset => 'Reset';

  @override
  String get livePreview => 'Live preview';

  @override
  String get groupMore => 'More';

  @override
  String get menuItemsAndPrices => 'Menu items and prices';

  @override
  String get menuItemsElsewhere =>
      'Products and prices are edited in My menu, and show in every template.';

  @override
  String get publish => 'Publish';

  @override
  String get publishChanges => 'Publish changes';

  @override
  String get publishing => 'Publishing your site';

  @override
  String get publishedTitle => 'Your site is live';

  @override
  String get publishedBody =>
      'Customers see the new design now. Products and prices update by themselves when you change them.';

  @override
  String get photo => 'Photo';

  @override
  String get addPhotos => 'Add photos';

  @override
  String get closed => 'Closed';

  @override
  String get goToMenu => 'Go to my menu';

  @override
  String get onbItemsTitle => 'List your items and prices in minutes';

  @override
  String get onbItemsBody =>
      'Add photos, prices and categories. Edit anything later and your site updates right away.';

  @override
  String get onbTemplatesTitle =>
      'Pick one of 100 templates, then make it yours';

  @override
  String get onbTemplatesBody =>
      'Each template shows your products its own way. Choose the hero image, colors and add your logo.';

  @override
  String get onbShareTitle => 'Share one link. Go custom on Pro.';

  @override
  String get onbShareBody =>
      'Put the link on your Instagram, WhatsApp or a table QR code. Customers see your menu instantly.';

  @override
  String get sampleCafe => 'Vanilla Café';

  @override
  String get sampleDrinks => 'Drinks';

  @override
  String get sampleItem1 => 'Vanilla latte';

  @override
  String get sampleItem1Note => 'Double shot, oat milk';

  @override
  String get sampleItem2 => 'Pistachio croissant';

  @override
  String get sampleItem2Note => 'Baked this morning';

  @override
  String get sampleItem3 => 'Saffron cake';

  @override
  String get sampleItem3Note => 'Slice, cardamom cream';

  @override
  String get addItem => 'Add item';

  @override
  String templateOf(String number) {
    return 'Template $number / 100';
  }

  @override
  String hello(String name) {
    return 'Hello, $name';
  }

  @override
  String get siteLive => 'Your site is live';

  @override
  String get quickActions => 'Quick actions';

  @override
  String get designSite => 'Design';

  @override
  String get shareSite => 'Share';

  @override
  String get allItems => 'All';
}
