import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import 'site_web_view.dart';

/// The live website inside the app, with Manage menu and Copy link underneath.
class SiteScreen extends ConsumerWidget {
  const SiteScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    if (auth is! SignedIn) return const SizedBox.shrink();
    final business = auth.business;
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(children: [
        Container(
          color: BrandColors.canvas,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
              child: Row(children: [
                RoundIconButton(
                  icon: Icons.arrow_back_rounded,
                  tooltip: MaterialLocalizations.of(context).backButtonTooltip,
                  onPressed: () => context.canPop() ? context.pop() : context.go('/menu'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: BrandColors.line)),
                    child: Row(children: [
                      Icon(Icons.lock_rounded, size: 14, color: BrandColors.live),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(business.displayUrl,
                            textDirection: TextDirection.ltr,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: BrandColors.ink)),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(width: 8),
                RoundIconButton(
                  tooltip: t.openInBrowser,
                  icon: Icons.open_in_new_rounded,
                  onPressed: () => launchUrl(Uri.parse(business.siteUrl), mode: LaunchMode.externalApplication),
                ),
              ]),
            ),
          ),
        ),
        Expanded(child: ref.watch(webViewBuilderProvider)(business.siteUrl, 0)),
      ]),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: BrandColors.hairline))),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: Row(children: [
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
                  onPressed: () => context.canPop() ? context.pop() : context.go('/menu'),
                  icon: const Icon(Icons.grid_view_rounded, size: 19),
                  label: Text(t.manageMenu, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(54),
                    backgroundColor: BrandColors.accent,
                    foregroundColor: BrandColors.primary,
                  ),
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: business.siteUrl));
                    if (context.mounted) showMessage(context, t.linkCopied);
                  },
                  icon: const Icon(Icons.copy_rounded, size: 19),
                  label: Text(t.copyLink, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
