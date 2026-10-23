import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/generated/app_localizations.dart';
import '../l10n/app_language.dart';
import '../theme.dart';
import 'ui.dart';

/// Each language is named in its own language, so anyone can find theirs whatever the app shows now.
const languageNames = {AppLanguage.en: 'English', AppLanguage.ar: 'العربية'};

/// The name of [language] for a settings row: the language's own name, or "Same as phone".
String languageLabel(AppLocalizations t, AppLanguage language) => languageNames[language] ?? t.languageSystem;

/// A compact button for the top bar of the start, sign-up and log-in screens: it names the other
/// language ("العربية" while in English, "English" while in Arabic) and switches to it in one tap.
class LanguageToggle extends ConsumerWidget {
  const LanguageToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final other = Localizations.localeOf(context).languageCode == 'ar' ? AppLanguage.en : AppLanguage.ar;
    final name = languageNames[other]!;
    return Tooltip(
      message: t.changeLanguage,
      child: TextButton.icon(
        key: const Key('languageToggle'),
        style: TextButton.styleFrom(
          foregroundColor: BrandColors.muted,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          minimumSize: const Size(0, 40),
          visualDensity: VisualDensity.compact,
          textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 13.5, fontWeight: FontWeight.w600),
        ),
        onPressed: () => ref.read(appLanguageProvider.notifier).choose(other),
        icon: const Icon(Icons.translate_rounded, size: 16),
        label: Text(name, locale: Locale(other.name)),
      ),
    );
  }
}

/// The "App language" choice: same as phone, English or العربية, the current one checked.
Future<void> showLanguageSheet(BuildContext context) => showFormSheet<void>(context, (sheet) => const _LanguageSheet());

class _LanguageSheet extends ConsumerWidget {
  const _LanguageSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final current = ref.watch(appLanguageProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(t.appLanguage, style: Ui.display(context, 24)),
        const SizedBox(height: 6),
        Text(t.appLanguageSub, style: TextStyle(color: BrandColors.muted, height: 1.4)),
        const SizedBox(height: 12),
        for (final language in AppLanguage.values)
          ListTile(
            key: Key('language-${language.name}'),
            contentPadding: EdgeInsets.zero,
            title: Text(
              languageLabel(t, language),
              locale: language.locale,
              style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink),
            ),
            selected: language == current,
            trailing: language == current ? Icon(Icons.check_rounded, color: BrandColors.primary) : null,
            onTap: () {
              ref.read(appLanguageProvider.notifier).choose(language);
              Navigator.pop(context);
            },
          ),
      ],
    );
  }
}
