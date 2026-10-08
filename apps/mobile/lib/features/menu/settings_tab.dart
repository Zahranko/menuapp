import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_error.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../design/design_controller.dart';
import '../plan/plan_cards.dart';

/// The signed-in owner's email and phone (`GET /me`).
final accountProvider = FutureProvider<({String email, String? phone})>((ref) async {
  final me = (await ref.watch(dioProvider).get<Map<String, dynamic>>('/api/v1/me')).data!;
  return (email: me['email'] as String, phone: me['phone'] as String?);
});

/// Website, business info, plan, custom domain and account.
class SettingsTab extends ConsumerWidget {
  const SettingsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(padding: const EdgeInsets.fromLTRB(Ui.gutter, 4, Ui.gutter, 32), children: const [
      _WebsiteCard(),
      _BusinessCard(),
      PlanCard(),
      DomainCard(),
      _AccountCard(),
    ]);
  }
}

class _WebsiteCard extends ConsumerWidget {
  const _WebsiteCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    if (auth is! SignedIn) return const SizedBox.shrink();
    final site = ref.watch(siteProvider).value;
    final templates = ref.watch(templatesProvider).value ?? const [];
    final template = templates.where((x) => x.id == site?.templateId).firstOrNull;
    final live = site?.isPublished ?? false;
    return SectionCard(
      title: t.yourWebsite,
      icon: Icons.language_rounded,
      badge: Pill(live ? t.live : t.notPublished,
          color: live ? BrandColors.live.withValues(alpha: 0.15) : BrandColors.paper, textColor: live ? BrandColors.live : BrandColors.muted),
      subtitle: template == null ? auth.business.displayUrl : t.websiteTemplate(auth.business.displayUrl, template.numberLabel, template.name),
      children: [
        Wrap(spacing: 8, runSpacing: 8, children: [
          FilledButton.icon(
            style: FilledButton.styleFrom(minimumSize: const Size(0, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
            onPressed: () => context.push('/design'),
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: Text(t.editDesign),
          ),
          LightButton(label: t.chooseTemplateShort, onPressed: () => context.push('/templates')),
          LightButton(
            label: t.copyLink,
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: auth.business.siteUrl));
              if (context.mounted) showMessage(context, t.linkCopied);
            },
          ),
        ]),
      ],
    );
  }
}

class _BusinessCard extends ConsumerStatefulWidget {
  const _BusinessCard();

  @override
  ConsumerState<_BusinessCard> createState() => _BusinessCardState();
}

class _BusinessCardState extends ConsumerState<_BusinessCard> {
  final _name = TextEditingController();
  final _whatsApp = TextEditingController();
  final _address = TextEditingController();
  final _instagram = TextEditingController();
  Map<String, String> _errors = {};
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authControllerProvider);
    if (auth is SignedIn) {
      final b = auth.business;
      _name.text = b.name;
      _whatsApp.text = b.whatsApp ?? '';
      _address.text = b.address ?? '';
      _instagram.text = b.instagram ?? '';
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _whatsApp, _address, _instagram]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    if (_name.text.trim().isEmpty) return setState(() => _errors = {'name': t.errBusinessNameEmpty});
    final auth = ref.read(authControllerProvider);
    setState(() {
      _busy = true;
      _errors = {};
    });
    try {
      String? clean(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();
      final business = await ref.read(menuRepositoryProvider).updateBusiness(
            name: _name.text.trim(),
            whatsApp: clean(_whatsApp),
            address: clean(_address),
            instagram: clean(_instagram)?.replaceFirst('@', ''),
            email: auth is SignedIn ? auth.business.email : null,
          );
      ref.read(authControllerProvider.notifier).businessChanged(business);
      if (mounted) showMessage(context, t.savedLive);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _errors = {
            for (final k in ['name', 'whatsApp', 'address', 'instagram'])
              if (e.field(k) != null) k: e.field(k)!,
          });
      if (_errors.isEmpty) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return SectionCard(title: t.businessInfo, icon: Icons.storefront_outlined, subtitle: t.businessInfoSub, children: [
      LabeledField(label: t.businessName, controller: _name, error: _errors['name'], icon: Icons.badge_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.whatsApp, hint: '+962 79 123 4567', controller: _whatsApp, error: _errors['whatsApp'], keyboardType: TextInputType.phone, icon: Icons.chat_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.address, controller: _address, error: _errors['address'], icon: Icons.place_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.instagram, hint: '@vanillamenu', controller: _instagram, error: _errors['instagram'], textInputAction: TextInputAction.done, icon: Icons.alternate_email_rounded),
      const SizedBox(height: 18),
      BusyButton(label: t.saveChanges, busyLabel: t.saving, busy: _busy, onPressed: _save),
    ]);
  }
}

class _AccountCard extends ConsumerWidget {
  const _AccountCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final account = ref.watch(accountProvider).value;
    return SectionCard(
      title: t.account,
      icon: Icons.person_outline_rounded,
      children: [
        if (account != null) ...[
          Text(account.email, style: TextStyle(color: BrandColors.ink, fontWeight: FontWeight.w600)),
          if (account.phone != null) ...[
            const SizedBox(height: 2),
            Text(account.phone!, textDirection: TextDirection.ltr, textAlign: TextAlign.start, style: TextStyle(color: BrandColors.muted)),
          ],
          const SizedBox(height: 14),
        ],
        Row(children: [
          Expanded(
            child: LightButton(
              label: t.changePassword,
              onPressed: account == null
                  ? null
                  : () async {
                      try {
                        await ref.read(authRepositoryProvider).forgotPassword(account.email);
                        if (context.mounted) showMessage(context, t.passwordLinkSent);
                      } catch (e) {
                        if (context.mounted) showMessage(context, errorText(t, e));
                      }
                    },
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: LightButton(label: t.logOut, danger: true, onPressed: () => ref.read(authControllerProvider.notifier).logOut())),
        ]),
      ],
    );
  }
}
