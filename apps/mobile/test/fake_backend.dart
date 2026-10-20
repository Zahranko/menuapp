import 'package:dio/dio.dart';

import 'fake_api.dart';

/// An in-memory stand-in for the owner API: enough of /me, catalog, site, templates, plans and domains
/// for widget tests to click through the app.
class FakeBackend {
  FakeBackend({this.plan = 'pro', this.testMode = true, bool withMenu = true, String currencyCode = 'USD'})
      : businessData = business(currencyCode: currencyCode) {
    if (withMenu) {
      categories.addAll([
        {'id': 'c1', 'name': 'Coffee', 'sortOrder': 0},
        {'id': 'c2', 'name': 'Bakery', 'sortOrder': 1},
        {'id': 'c3', 'name': 'Desserts', 'sortOrder': 2},
      ]);
      products.addAll([
        _product('p1', 'c1', 'Vanilla latte', 3.5, label: 'Signature'),
        _product('p2', 'c1', 'Spanish latte', 3.75),
        _product('p3', 'c2', 'Pistachio croissant', 2.25, available: false),
      ]);
    }
  }

  String plan;
  bool testMode;

  /// The owner's business as `GET /me` and `PUT /business` return it.
  final Map<String, Object?> businessData;

  /// The server's currency list with each one's decimals.
  static const currencyDecimals = {
    'USD': 2, 'EUR': 2, 'GBP': 2, 'JOD': 3, 'SAR': 2, 'AED': 2, 'QAR': 2, 'KWD': 3, 'BHD': 3, 'OMR': 3, 'EGP': 2, 'LBP': 2, 'IQD': 3,
    'SYP': 2, 'MAD': 2, 'TND': 3, 'DZD': 2, 'LYD': 3, 'YER': 2, 'SDG': 2, 'ILS': 2, 'TRY': 2, 'CAD': 2, 'AUD': 2, 'CHF': 2, 'SEK': 2,
    'NOK': 2, 'DKK': 2, 'JPY': 0, 'CNY': 2, 'INR': 2, 'PKR': 2, 'MYR': 2, 'IDR': 2, 'NGN': 2, 'ZAR': 2, 'KES': 2, 'BRL': 2, 'MXN': 2,
  };
  final categories = <Map<String, Object?>>[];
  final products = <Map<String, Object?>>[];
  Map<String, Object?>? domainRequest;
  String templateId = 'souq';
  Map<String, Object?> draft = Map.of(souqDefaults);
  DateTime? publishedAt;
  final requests = <String>[];
  final drafts = <Map<String, Object?>>[];

  /// The AI helper's `GET /ai/status`; null answers 404, like a server without the helper.
  Map<String, Object?>? aiStatus;

  /// Answers of `POST /ai/design`, `/ai/text` and `/ai/menu`.
  Map<String, Object?>? aiDesign;
  Map<String, Object?>? aiText;
  Map<String, Object?>? aiMenu;

  /// Bodies sent to `POST /catalog/import`.
  final imports = <Map<String, Object?>>[];

  /// Paths (like "PATCH /api/v1/products/p1/availability") that answer with a server error.
  final failing = <String>{};
  int _ids = 100;

  static Map<String, Object?> _product(String id, String categoryId, String name, double price, {String? label, bool available = true}) => {
        'id': id,
        'categoryId': categoryId,
        'name': name,
        'description': null,
        'price': price,
        'imageUrl': null,
        'label': label,
        'isAvailable': available,
        'isFeatured': false,
        'sortOrder': 0,
        'updatedAt': '2026-01-01T00:00:00Z',
      };

  static const souqDefaults = <String, Object?>{'font': 'modern', 'accent': '#D9542C', 'hero.title': 'Coffee worth crossing the city for.', 'texture': false};

  /// Settings added to every template later (the logo options). The starting draft does not have them, like a site
  /// made before they existed.
  static const logoDefaults = <String, Object?>{'logo.frame': true, 'logo.size': 100, 'logo.position': 'start', 'logo.name': true};

  /// The site options shared by every template (fonts, footer, social accounts, order button), added later like the
  /// logo options: the starting draft does not have them.
  static const siteOptionDefaults = <String, Object?>{
    'font.family': 'default',
    'footer.nameSize': 'large',
    'social.show': <String>[],
    'order.action': 'auto',
    'order.shape': 'auto',
    'order.label': '',
  };

  /// The shared fields as the API's template registry lists them (from the sites' _kit/site-options.json).
  static const siteOptionFields = <Map<String, Object?>>[
    {
      'key': 'font.family',
      'type': 'choice',
      'label': 'Font',
      'labelAr': 'الخط',
      'group': 'Fonts & colors',
      'groupAr': 'الخطوط والألوان',
      'options': ['default', 'cairo', 'amiri'],
      'optionLabels': {'default': 'Template default', 'cairo': 'Cairo', 'amiri': 'Amiri (classic)'},
      'optionLabelsAr': {'default': 'كما في القالب', 'cairo': 'القاهرة (Cairo)', 'amiri': 'أميري، خط كلاسيكي (Amiri)'},
    },
    {
      'key': 'footer.nameSize',
      'type': 'choice',
      'label': 'Business name size in the footer',
      'labelAr': 'حجم اسم النشاط في أسفل الصفحة',
      'group': 'Footer',
      'groupAr': 'التذييل',
      'options': ['large', 'medium', 'small'],
      'optionLabels': {'large': 'Large (as designed)', 'medium': 'Medium', 'small': 'Small'},
      'optionLabelsAr': {'large': 'كبير (كما في التصميم)', 'medium': 'متوسط', 'small': 'صغير'},
    },
    {
      'key': 'social.show',
      'type': 'toggles',
      'label': 'Accounts to show on your website',
      'labelAr': 'الحسابات التي تظهر في موقعك',
      'group': 'Social media',
      'groupAr': 'حسابات التواصل الاجتماعي',
      'options': ['instagram', 'whatsapp', 'facebook', 'tiktok', 'snapchat', 'phone'],
      'optionLabels': {'instagram': 'Instagram', 'whatsapp': 'WhatsApp', 'facebook': 'Facebook', 'tiktok': 'TikTok', 'snapchat': 'Snapchat', 'phone': 'Phone (call us)'},
      'optionLabelsAr': {'instagram': 'إنستغرام', 'whatsapp': 'واتساب', 'facebook': 'فيسبوك', 'tiktok': 'تيك توك', 'snapchat': 'سناب شات', 'phone': 'الهاتف (اتصل بنا)'},
    },
    {
      'key': 'order.action',
      'type': 'choice',
      'label': 'What the button does',
      'labelAr': 'ماذا يفعل الزر',
      'group': 'Order button',
      'groupAr': 'زر الطلب',
      'options': ['auto', 'whatsapp', 'call', 'instagram', 'facebook', 'hide'],
      'optionLabels': {'auto': 'Template default', 'whatsapp': 'Order on WhatsApp', 'call': 'Call us', 'instagram': 'Open Instagram', 'facebook': 'Open Facebook', 'hide': 'Hide the button'},
      'optionLabelsAr': {'auto': 'كما في القالب', 'whatsapp': 'اطلب عبر واتساب', 'call': 'اتصل بنا', 'instagram': 'افتح إنستغرام', 'facebook': 'افتح فيسبوك', 'hide': 'إخفاء الزر'},
    },
    {
      'key': 'order.shape',
      'type': 'choice',
      'label': 'Button shape',
      'labelAr': 'شكل الزر',
      'group': 'Order button',
      'groupAr': 'زر الطلب',
      'options': ['auto', 'pill', 'rounded', 'circle'],
      'optionLabels': {'auto': 'Template default', 'pill': 'Pill', 'rounded': 'Rounded square', 'circle': 'Round icon only'},
      'optionLabelsAr': {'auto': 'كما في القالب', 'pill': 'بيضاوي', 'rounded': 'مربع بزوايا دائرية', 'circle': 'دائرة بأيقونة فقط'},
    },
    {'key': 'order.label', 'type': 'text', 'label': 'Button text (leave empty for the usual text)', 'labelAr': 'نص الزر (اتركه فارغًا للنص المعتاد)', 'group': 'Order button', 'groupAr': 'زر الطلب', 'max': 28},
  ];

  /// Some of the card and hero slider fields as the API lists them (from the sites' _kit/card-settings.json and
  /// _kit/hero-settings.json). The Atelier template has them.
  static const cardAndHeroFields = <Map<String, Object?>>[
    {
      'key': 'cards.style',
      'type': 'choice',
      'label': 'Card style',
      'labelAr': 'شكل البطاقات',
      'group': 'Cards',
      'groupAr': 'البطاقات',
      'options': ['auto', 'flat', 'glass'],
      'optionLabels': {'auto': 'Template default', 'flat': 'Flat', 'glass': 'Glass'},
      'optionLabelsAr': {'auto': 'كما في القالب', 'flat': 'مسطّحة', 'glass': 'زجاجية'},
    },
    {
      'key': 'cards.borderColor',
      'type': 'color',
      'label': 'Border color',
      'labelAr': 'لون الإطار',
      'group': 'Cards',
      'groupAr': 'البطاقات',
      'options': ['auto', 'accent', 'ink'],
      'optionLabels': {'auto': 'Template default', 'accent': 'Accent color', 'ink': 'Text color'},
      'optionLabelsAr': {'auto': 'كما في القالب', 'accent': 'اللون المميز', 'ink': 'لون النص'},
      'custom': true,
    },
    {
      'key': 'hero.slides',
      'type': 'images',
      'label': 'More photos for the top (they take turns)',
      'labelAr': 'صور إضافية لأعلى الصفحة (تتناوب في الظهور)',
      'group': 'Hero slider',
      'groupAr': 'صور الواجهة المتحركة',
      'max': 5,
    },
    {
      'key': 'hero.transition',
      'type': 'choice',
      'label': 'How the photos change',
      'labelAr': 'طريقة تبديل الصور',
      'group': 'Hero slider',
      'groupAr': 'صور الواجهة المتحركة',
      'options': ['slide', 'fade', 'zoom'],
      'optionLabels': {'slide': 'Slide', 'fade': 'Fade', 'zoom': 'Fade with a slow zoom'},
      'optionLabelsAr': {'slide': 'انزلاق', 'fade': 'تلاشٍ', 'zoom': 'تلاشٍ مع تكبير بطيء'},
    },
    {'key': 'hero.autoplay', 'type': 'toggle', 'label': 'Change photos automatically', 'labelAr': 'تبديل الصور تلقائيًا', 'group': 'Hero slider', 'groupAr': 'صور الواجهة المتحركة'},
    {
      'key': 'hero.controls',
      'type': 'toggles',
      'label': 'Buttons on the photos',
      'labelAr': 'أزرار على الصور',
      'group': 'Hero slider',
      'groupAr': 'صور الواجهة المتحركة',
      'options': ['dots', 'arrows'],
      'optionLabels': {'dots': 'Dots', 'arrows': 'Arrows'},
      'optionLabelsAr': {'dots': 'نقاط', 'arrows': 'أسهم'},
    },
  ];
  static const cardAndHeroDefaults = <String, Object?>{
    'cards.style': 'auto',
    'cards.borderColor': 'auto',
    'hero.slides': <String>[],
    'hero.transition': 'slide',
    'hero.autoplay': true,
    'hero.controls': ['dots', 'arrows'],
  };

  static final templates = [
    {
      'id': 'souq',
      'number': 1,
      'name': 'Souq',
      'category': 'Café',
      'description': 'Warm café site',
      'ar': {'name': 'سوق', 'category': 'مقهى', 'description': 'موقع مقهى دافئ'},
      'thumbnailUrl': '/templates/souq/thumbnail.png',
      'version': 1,
      'schema': [
        {
          'key': 'font',
          'type': 'choice',
          'label': 'Font style',
          'labelAr': 'نمط الخط',
          'group': 'Brand',
          'groupAr': 'الهوية',
          'options': ['modern', 'elegant'],
          'optionLabels': {'modern': 'Modern', 'elegant': 'Elegant'},
          'optionLabelsAr': {'modern': 'عصري', 'elegant': 'أنيق'},
        },
        {'key': 'logo.frame', 'type': 'toggle', 'label': 'Logo frame', 'labelAr': 'إطار الشعار', 'group': 'Brand', 'groupAr': 'الهوية'},
        {'key': 'logo.size', 'type': 'range', 'label': 'Logo size', 'labelAr': 'حجم الشعار', 'group': 'Brand', 'groupAr': 'الهوية', 'min': 70, 'max': 180, 'step': 10, 'unit': '%'},
        {
          'key': 'logo.position',
          'type': 'choice',
          'label': 'Logo position',
          'labelAr': 'مكان الشعار',
          'group': 'Brand',
          'groupAr': 'الهوية',
          'options': ['start', 'center'],
          'optionLabels': {'start': 'Template default', 'center': 'Centered'},
          'optionLabelsAr': {'start': 'كما في القالب', 'center': 'في المنتصف'},
        },
        {'key': 'logo.name', 'type': 'toggle', 'label': 'Show business name', 'labelAr': 'إظهار اسم النشاط', 'group': 'Brand', 'groupAr': 'الهوية'},
        {'key': 'accent', 'type': 'color', 'label': 'Accent color', 'labelAr': 'اللون المميز', 'group': 'Brand', 'groupAr': 'الهوية', 'options': ['#D9542C', '#2B6B4F'], 'custom': true},
        {'key': 'texture', 'type': 'toggle', 'label': 'Dotted texture', 'labelAr': 'خلفية منقطة', 'group': 'Brand', 'groupAr': 'الهوية'},
        // No Arabic texts: the English ones show in Arabic too.
        {'key': 'hero.title', 'type': 'text', 'label': 'Headline', 'group': 'Hero header', 'max': 60},
        {'key': 'sparkles', 'type': 'hologram', 'label': 'Future setting', 'group': 'Hero header'},
        ...siteOptionFields,
      ],
      'defaults': {...souqDefaults, ...logoDefaults, ...siteOptionDefaults},
      'defaultsAr': {'hero.title': 'قهوة تستحق المشوار.'},
    },
    {
      'id': 'atelier',
      'number': 17,
      'name': 'Atelier',
      'category': 'Salon, beauty',
      'description': 'Salon site',
      'thumbnailUrl': '/templates/atelier/thumbnail.png',
      'version': 1,
      'schema': [
        {'key': 'hero.title', 'type': 'text', 'label': 'Headline', 'group': 'Hero header', 'max': 60},
        ...cardAndHeroFields,
      ],
      'defaults': {'hero.title': 'Hair, done right.', ...cardAndHeroDefaults},
    },
    {
      'id': 'noir',
      'number': 42,
      'name': 'Noir',
      'category': 'Restaurant',
      'description': 'Dark fine-dining site',
      'thumbnailUrl': '/templates/noir/thumbnail.png',
      'tier': 'pro',
      'version': 1,
      'schema': [
        {'key': 'hero.title', 'type': 'text', 'label': 'Headline', 'group': 'Hero header', 'max': 60},
      ],
      'defaults': {'hero.title': 'An evening to remember.'},
    },
  ];

  /// The 403 the API sends for a Pro template on the Basic plan.
  static const FakeResponse proTemplateRefused = (
    status: 403,
    body: {'title': 'This template is part of the Pro plan.', 'status': 403, 'code': 'template.pro'},
  );

  bool _isProTemplate(String id) => templates.any((t) => t['id'] == id && t['tier'] == 'pro');

  Map<String, Object?> get _site => {
        'templateId': templateId,
        'draftSettings': draft,
        'publishedTemplateId': publishedAt == null ? null : templateId,
        'publishedSettings': publishedAt == null ? null : draft,
        'publishedAt': publishedAt?.toIso8601String(),
        'hasUnpublishedChanges': publishedAt == null,
        'siteUrl': 'https://example.test/vanillamenu',
      };

  FakeResponse handle(RequestOptions r) {
    final key = '${r.method} ${r.path}';
    requests.add(key);
    if (failing.contains(key)) return (status: 500, body: {'title': 'Server error'});
    final body = r.data is Map ? Map<String, Object?>.from(r.data as Map) : null;
    final path = r.path;

    switch (key) {
      case 'GET /api/v1/me':
        return (status: 200, body: {'userId': 'u1', 'email': 'hello@vanillamenu.test', 'phone': '+15555550123', 'business': businessData});
      case 'PUT /api/v1/business':
        final currency = body!['currencyCode'] as String?;
        if (currency != null && !currencyDecimals.containsKey(currency)) {
          return (status: 400, body: {'title': 'Check the highlighted fields.', 'status': 400, 'code': 'business.currency', 'errors': {'currencyCode': ['Choose a currency from the list.']}});
        }
        if ((body['facebook'] as String?)?.contains(' ') ?? false) {
          return (status: 400, body: {'title': 'Check the highlighted fields.', 'status': 400, 'code': 'business.facebook', 'errors': {'facebook': ['Enter your Facebook page name or link, like facebook.com/vanillamenu.']}});
        }
        for (final k in ['name', 'whatsApp', 'address', 'instagram', 'phone', 'facebook', 'tikTok', 'snapchat', 'email', 'timeZone']) {
          if (body.containsKey(k)) businessData[k] = body[k];
        }
        if (currency != null && currency != businessData['currencyCode']) {
          // Prices keep their numbers, rounded to the new currency's decimals.
          final decimals = currencyDecimals[currency]!;
          for (final p in products) {
            p['price'] = double.parse((p['price'] as num).toStringAsFixed(decimals));
          }
          businessData['currencyCode'] = currency;
        }
        return (status: 200, body: businessData);
      case 'POST /api/v1/auth/logout':
        return (status: 204, body: null);
      case 'GET /api/v1/categories':
        return (status: 200, body: [
          for (final c in categories) {...c, 'productCount': products.where((p) => p['categoryId'] == c['id']).length},
        ]);
      case 'POST /api/v1/categories':
        final c = {'id': 'c${_ids++}', 'name': body!['name'], 'parentId': body['parentId'], 'sortOrder': categories.length};
        categories.add(c);
        return (status: 201, body: {...c, 'productCount': 0});
      case 'PUT /api/v1/categories/order':
        final ids = [for (final id in r.data as List) id.toString()];
        categories.sort((a, b) => ids.indexOf(a['id'] as String).compareTo(ids.indexOf(b['id'] as String)));
        for (final (i, c) in categories.indexed) {
          c['sortOrder'] = i;
        }
        return (status: 200, body: categories);
      case 'GET /api/v1/products':
        return (status: 200, body: products);
      case 'POST /api/v1/products':
        final p = {..._product('p${_ids++}', body!['categoryId'] as String, body['name'] as String, (body['price'] as num).toDouble()), ...body};
        products.add(p);
        return (status: 201, body: p);
      case 'GET /api/v1/templates':
        return (status: 200, body: templates);
      case 'GET /api/v1/site':
        return (status: 200, body: _site);
      case 'PUT /api/v1/site/template':
        if (plan != 'pro' && _isProTemplate(body!['templateId'] as String)) return proTemplateRefused;
        templateId = body!['templateId'] as String;
        draft = Map.of(templates.firstWhere((t) => t['id'] == templateId)['defaults'] as Map<String, Object?>);
        return (status: 200, body: _site);
      case 'PUT /api/v1/site/draft':
        draft = Map<String, Object?>.from(body!['settings'] as Map);
        drafts.add(draft);
        return (status: 200, body: _site);
      case 'POST /api/v1/site/publish':
        if (plan != 'pro' && _isProTemplate(templateId)) return proTemplateRefused;
        publishedAt = DateTime.utc(2026, 1, 2);
        return (status: 200, body: _site);
      case 'POST /api/v1/site/preview-token':
        return (status: 200, body: {'token': 't', 'previewUrl': 'https://example.test/_preview/t', 'expiresAt': '2030-01-01T00:00:00Z'});
      case 'GET /api/v1/plans':
        return (status: 200, body: [
          {'code': 'basic', 'name': 'Basic', 'priceUsd': 5, 'allowsCustomDomain': false},
          {'code': 'pro', 'name': 'Pro', 'priceUsd': 10, 'allowsCustomDomain': true},
        ]);
      case 'GET /api/v1/subscription':
        return (status: 200, body: _subscription);
      case 'POST /api/v1/subscription/change':
        plan = body!['planCode'] as String;
        if (plan == 'basic') domainRequest = null;
        return (status: 200, body: {'checkoutUrl': null, 'subscription': _subscription});
      case 'GET /api/v1/domain-request':
        return domainRequest == null ? (status: 204, body: null) : (status: 200, body: domainRequest);
      case 'POST /api/v1/domain-request':
        domainRequest = {
          'id': 'd1',
          'domain': body!['domain'],
          'status': 'requested',
          'staffNote': null,
          'dnsTarget': 'edge.example.test',
          'createdAt': '2026-03-04T10:00:00Z',
          'updatedAt': '2026-03-04T10:00:00Z',
          'activatedAt': null,
        };
        return (status: 200, body: domainRequest);
      case 'DELETE /api/v1/domain-request':
        domainRequest = null;
        return (status: 204, body: null);
      case 'GET /api/v1/ai/status':
        return aiStatus == null ? (status: 404, body: {'title': 'Not found'}) : (status: 200, body: aiStatus);
      case 'POST /api/v1/ai/design':
        return (status: 200, body: aiDesign);
      case 'POST /api/v1/ai/text':
        return (status: 200, body: aiText);
      case 'POST /api/v1/ai/menu':
        return (status: 200, body: aiMenu);
      case 'POST /api/v1/catalog/import':
        imports.add(body!);
        var added = 0;
        for (final c in (body['categories'] as List).cast<Map>()) {
          final existing = categories.where((x) => (x['name'] as String).toLowerCase() == (c['name'] as String).toLowerCase()).firstOrNull;
          final category = existing ?? {'id': 'c${_ids++}', 'name': c['name'], 'parentId': null, 'sortOrder': categories.length};
          if (existing == null) categories.add(category);
          for (final p in (c['products'] as List).cast<Map>()) {
            products.add({..._product('p${_ids++}', category['id'] as String, p['name'] as String, (p['price'] as num).toDouble()), 'description': p['description']});
            added++;
          }
        }
        return (status: 200, body: {'categoriesCreated': 0, 'productsCreated': added});
    }

    final productMatch = RegExp(r'^/api/v1/products/([^/]+)(/availability)?$').firstMatch(path);
    if (productMatch != null) {
      final index = products.indexWhere((p) => p['id'] == productMatch.group(1));
      if (index < 0) return (status: 404, body: {'title': 'Product not found.'});
      if (productMatch.group(2) != null) {
        products[index]['isAvailable'] = body!['isAvailable'];
        return (status: 204, body: null);
      }
      if (r.method == 'DELETE') {
        products.removeAt(index);
        return (status: 204, body: null);
      }
      products[index] = {...products[index], ...?body};
      return (status: 200, body: products[index]);
    }

    final categoryMatch = RegExp(r'^/api/v1/categories/([^/]+)$').firstMatch(path);
    if (categoryMatch != null) {
      final id = categoryMatch.group(1);
      if (r.method == 'DELETE') {
        final moveTo = r.queryParameters['moveTo'] as String?;
        for (final p in [...products]) {
          if (p['categoryId'] != id) continue;
          moveTo == null ? products.remove(p) : p['categoryId'] = moveTo;
        }
        categories.removeWhere((c) => c['id'] == id);
        for (final c in categories) {
          if (c['parentId'] == id) c['parentId'] = null;
        }
        return (status: 204, body: null);
      }
      final c = categories.firstWhere((c) => c['id'] == id)
        ..['name'] = body!['name']
        ..['parentId'] = body['parentId'];
      return (status: 200, body: {...c, 'productCount': 0});
    }

    return (status: 404, body: {'title': 'Not found: $key'});
  }

  Map<String, Object?> get _subscription => {
        'planCode': plan,
        'status': plan == 'pro' ? 'active' : 'trialing',
        'currentPeriodEnd': plan == 'pro' ? null : '2026-03-20T00:00:00Z',
        'allowsCustomDomain': plan == 'pro',
        'testMode': testMode,
      };
}
