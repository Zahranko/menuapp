import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand.dart';
import '../../../core/theme.dart';
import '../../../l10n/generated/app_localizations.dart';

/// First screen for signed-out owners. The animated splash and onboarding slides (S10) replace it later.
class StartScreen extends StatelessWidget {
  const StartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    return Scaffold(
      backgroundColor: BrandColors.primary,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Spacer(),
            Text(arabic && Brand.brandNameAr.isNotEmpty ? Brand.brandNameAr : Brand.brandName,
                style: TextStyle(color: BrandColors.accent, fontSize: 48, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(Brand.tagline, style: const TextStyle(color: Colors.white, fontSize: 18)),
            const Spacer(),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary),
              onPressed: () => context.go('/signup'),
              child: Text(t.createAccount),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white54),
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () => context.go('/login'),
              child: Text(t.logIn),
            ),
          ]),
        ),
      ),
    );
  }
}
