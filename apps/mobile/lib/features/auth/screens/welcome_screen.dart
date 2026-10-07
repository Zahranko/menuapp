import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../auth_controller.dart';

/// Shown after sign-up or log-in: the business name, its live link and what comes next.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    if (auth is! SignedIn) return const SizedBox.shrink();
    final business = auth.business;
    final link = business.siteUrl.replaceFirst(RegExp(r'^https?://'), '');
    const onDark = Colors.white;
    final soft = onDark.withValues(alpha: 0.72);

    return Scaffold(
      backgroundColor: BrandColors.primary,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
          children: [
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: CircleAvatar(radius: 28, backgroundColor: BrandColors.accent, child: Icon(Icons.check, color: BrandColors.primary, size: 30)),
            ),
            const SizedBox(height: 26),
            Text(t.welcomeTitle(business.name), style: const TextStyle(color: onDark, fontSize: 34, fontWeight: FontWeight.w800, height: 1.05)),
            const SizedBox(height: 12),
            Text(auth.justSignedUp ? t.welcomeNew : t.welcomeBack, style: TextStyle(color: soft, fontSize: 15, height: 1.5)),
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: BrandColors.primary2, borderRadius: BorderRadius.circular(16)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t.yourLink, style: TextStyle(color: soft, fontSize: 12)),
                const SizedBox(height: 6),
                Row(children: [
                  Expanded(
                    child: SelectableText(link, key: const Key('siteLink'), textDirection: TextDirection.ltr,
                        style: const TextStyle(color: onDark, fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                  TextButton(
                    style: TextButton.styleFrom(foregroundColor: BrandColors.accent),
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: business.siteUrl));
                      if (!mounted) return;
                      setState(() => _copied = true);
                      Future.delayed(const Duration(milliseconds: 1600), () {
                        if (mounted) setState(() => _copied = false);
                      });
                    },
                    child: Text(_copied ? t.copied : t.copy),
                  ),
                ]),
              ]),
            ),
            const SizedBox(height: 24),
            for (final (i, step) in [t.stepAccount, t.stepTemplate, t.stepItems, t.stepPublish].indexed)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: Row(children: [
                  CircleAvatar(
                    radius: 13,
                    backgroundColor: i == 0 ? BrandColors.accent : onDark.withValues(alpha: 0.14),
                    child: i == 0
                        ? Icon(Icons.check, size: 15, color: BrandColors.primary)
                        : Text('${i + 1}', style: const TextStyle(color: onDark, fontSize: 12)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text(step, style: TextStyle(color: i == 0 ? onDark : soft))),
                ]),
              ),
            const SizedBox(height: 28),
            FilledButton.icon(
              key: const Key('chooseTemplate'),
              style: FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary),
              onPressed: () => context.push('/templates'),
              icon: const Icon(Icons.arrow_forward),
              label: Text(t.chooseTemplate),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: onDark,
                side: BorderSide(color: onDark.withValues(alpha: 0.4)),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () => context.go('/menu'),
              child: Text(t.goToMenu),
            ),
          ],
        ),
      ),
    );
  }
}
