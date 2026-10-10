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

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: BrandColors.primary,
        body: DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const AlignmentDirectional(-0.9, -0.9).resolve(Directionality.of(context)),
              radius: 1.2,
              colors: [BrandColors.primary2, BrandColors.primary],
            ),
          ),
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
                    children: [
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(color: BrandColors.accent, borderRadius: BorderRadius.circular(18)),
                          child: Icon(Icons.check_rounded, color: BrandColors.primary, size: 32),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text.rich(_title(t.welcomeTitle(business.name), business.name), style: Ui.display(36, color: onDark)),
                      const SizedBox(height: 14),
                      Text(auth.justSignedUp ? t.welcomeNew : t.welcomeBack, style: TextStyle(color: soft, fontSize: 15.5, height: 1.5)),
                      const SizedBox(height: 28),
                      Container(
                        padding: const EdgeInsets.fromLTRB(18, 14, 10, 14),
                        decoration: BoxDecoration(
                          color: onDark.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(Ui.radius),
                          border: Border.all(color: onDark.withValues(alpha: 0.12)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(t.yourLink.toUpperCase(), style: Ui.eyebrow.copyWith(color: soft, fontSize: 11)),
                                  const SizedBox(height: 6),
                                  SelectableText(
                                    link,
                                    key: const Key('siteLink'),
                                    textDirection: TextDirection.ltr,
                                    style: const TextStyle(color: onDark, fontSize: 16.5, fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ),
                            FilledButton(
                              style: FilledButton.styleFrom(
                                backgroundColor: onDark.withValues(alpha: 0.12),
                                foregroundColor: onDark,
                                minimumSize: const Size(0, 40),
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                textStyle: const TextStyle(fontFamily: AppFonts.body, fontWeight: FontWeight.w700, fontSize: 13.5),
                              ),
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
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),
                      for (final (i, step) in [t.stepAccount, t.stepTemplate, t.stepItems, t.stepPublish].indexed)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: onDark.withValues(alpha: 0.08))),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: i == 0 ? BrandColors.accent : Colors.transparent,
                                  shape: BoxShape.circle,
                                  border: i == 0 ? null : Border.all(color: onDark.withValues(alpha: 0.25)),
                                ),
                                child: i == 0
                                    ? Icon(Icons.check_rounded, size: 17, color: BrandColors.primary)
                                    : Text(
                                        '${i + 1}',
                                        style: TextStyle(color: soft, fontSize: 12.5, fontWeight: FontWeight.w700),
                                      ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  step,
                                  style: TextStyle(color: i == 0 ? onDark : soft, fontWeight: i == 0 ? FontWeight.w600 : FontWeight.w500, fontSize: 15),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FilledButton(
                        key: const Key('chooseTemplate'),
                        style: FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary),
                        onPressed: () => context.push('/templates'),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [Flexible(child: Text(t.chooseTemplate, overflow: TextOverflow.ellipsis)), const SizedBox(width: 8), const Icon(Icons.arrow_forward_rounded, size: 20)],
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        style: TextButton.styleFrom(foregroundColor: onDark, minimumSize: const Size.fromHeight(48)),
                        onPressed: () => context.go('/menu'),
                        child: Text(t.goToMenu),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// The title with the business name in the accent color, as in the prototype.
  TextSpan _title(String text, String name) {
    final at = text.indexOf(name);
    if (name.isEmpty || at < 0) return TextSpan(text: text);
    return TextSpan(
      children: [
        TextSpan(text: text.substring(0, at)),
        TextSpan(
          text: name,
          style: TextStyle(color: BrandColors.accent),
        ),
        TextSpan(text: text.substring(at + name.length)),
      ],
    );
  }
}
