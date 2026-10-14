import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/brand.dart';
import 'core/l10n/app_language.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'features/splash/splash_gate.dart';
import 'l10n/generated/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Read the language choice before the first frame, so the splash already speaks it.
  final store = SecureLanguageStore();
  AppLanguage? saved;
  try {
    saved = await store.read().timeout(const Duration(seconds: 2));
  } catch (_) {
    // The controller tries again.
  }
  runApp(ProviderScope(
    overrides: [
      languageStoreProvider.overrideWithValue(store),
      savedLanguageProvider.overrideWithValue(saved),
    ],
    child: const StorefrontApp(),
  ));
}

final _theme = buildTheme();
final _arabicTheme = buildTheme(arabic: true);

class StorefrontApp extends ConsumerWidget {
  const StorefrontApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: Brand.brandName,
      debugShowCheckedModeBanner: false,
      theme: _theme,
      routerConfig: ref.watch(routerProvider),
      // The launch splash plays over the first screen while the saved session is checked.
      // Arabic gets its own type settings: no letter spacing, roomier headings.
      builder: (context, child) => Theme(
        data: Ui.isArabic(context) ? _arabicTheme : _theme,
        child: SplashGate(child: child ?? const SizedBox.shrink()),
      ),
      // The owner's choice, or the device language when it's null; Arabic lays out right to left.
      locale: ref.watch(appLanguageProvider).locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
