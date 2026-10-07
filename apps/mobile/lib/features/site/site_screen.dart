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
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(children: [
          Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF52D17C), shape: BoxShape.circle)),
          const SizedBox(width: 8),
          Flexible(child: Text(business.displayUrl, textDirection: TextDirection.ltr, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15))),
        ]),
        actions: [
          IconButton(
            tooltip: t.openInBrowser,
            icon: const Icon(Icons.open_in_browser),
            onPressed: () => launchUrl(Uri.parse(business.siteUrl), mode: LaunchMode.externalApplication),
          ),
        ],
      ),
      body: ref.watch(webViewBuilderProvider)(business.siteUrl, 0),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Row(children: [
            Expanded(
              child: FilledButton(
                onPressed: () => context.canPop() ? context.pop() : context.go('/menu'),
                child: Text(t.manageMenu),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52), foregroundColor: BrandColors.ink),
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: business.siteUrl));
                  if (context.mounted) showMessage(context, t.linkCopied);
                },
                child: Text(t.copyLink),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
