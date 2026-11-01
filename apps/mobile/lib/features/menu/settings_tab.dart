import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_error.dart';
import '../../core/currency.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/l10n/app_language.dart';
import '../../core/widgets/currency_picker.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/language_picker.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../design/design_controller.dart';
import 'catalog_controller.dart';
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
      subtitle: template == null ? auth.business.displayUrl : t.websiteTemplate(auth.business.displayUrl, template.numberLabel, template.nameFor(context)),
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
          LightButton(key: const Key('settingsQr'), label: t.qrCode, icon: Icons.qr_code_2_rounded, onPressed: () => context.push('/qr')),
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
  final _phone = TextEditingController();
  final _facebook = TextEditingController();
  final _tikTok = TextEditingController();
  final _snapchat = TextEditingController();
  Map<String, String> _errors = {};
  bool _busy = false;
  bool _changingCurrency = false;

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
      _phone.text = b.phone ?? '';
      _facebook.text = b.facebook ?? '';
      _tikTok.text = b.tikTok ?? '';
      _snapchat.text = b.snapchat ?? '';
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _whatsApp, _address, _instagram, _phone, _facebook, _tikTok, _snapchat]) {
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
            phone: clean(_phone),
            facebook: clean(_facebook),
            tikTok: clean(_tikTok),
            snapchat: clean(_snapchat),
            email: auth is SignedIn ? auth.business.email : null,
          );
      ref.read(authControllerProvider.notifier).businessChanged(business);
      if (mounted) showMessage(context, t.savedLive);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _errors = {
            for (final k in ['name', 'whatsApp', 'address', 'instagram', 'phone', 'facebook', 'tikTok', 'snapchat'])
              if (e.field(k) != null) k: e.field(k)!,
          });
      if (_errors.isEmpty) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Picks a new currency and saves it at once. With products on the menu, first confirms that
  /// prices keep their numbers and only the currency changes.
  Future<void> _changeCurrency() async {
    final t = AppLocalizations.of(context);
    final auth = ref.read(authControllerProvider);
    if (auth is! SignedIn) return;
    final b = auth.business;
    final picked = await showCurrencyPicker(context, selected: b.currencyCode);
    if (picked == null || picked == b.currencyCode || !mounted) return;

    final products = ref.read(catalogProvider).value?.products ?? const [];
    if (products.isNotEmpty) {
      final sample = products.first.price;
      final ok = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(t.currencyChangeTitle(currencyFor(picked).nameFor(context))),
          content: Text(t.currencyChangeBody(formatPrice(context, sample, b.currencyCode), formatPrice(context, sample, picked))),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
            FilledButton(
              key: const Key('confirmCurrency'),
              style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
              onPressed: () => Navigator.pop(context, true),
              child: Text(t.currencyChangeConfirm),
            ),
          ],
        ),
      );
      if (ok != true || !mounted) return;
    }

    setState(() => _changingCurrency = true);
    try {
      // The saved info goes back unchanged, so only the currency changes (unsaved edits above stay in their fields).
      final business = await ref.read(menuRepositoryProvider).updateBusiness(
            name: b.name,
            whatsApp: b.whatsApp,
            address: b.address,
            instagram: b.instagram,
            phone: b.phone,
            facebook: b.facebook,
            tikTok: b.tikTok,
            snapchat: b.snapchat,
            email: b.email,
            currencyCode: picked,
          );
      ref.read(authControllerProvider.notifier).businessChanged(business);
      // Prices are rounded to the new currency's decimals on the server: show them as saved.
      if (products.isNotEmpty) unawaited(ref.read(catalogProvider.notifier).refresh().catchError((_) {}));
      if (mounted) showMessage(context, t.currencyChanged);
    } on ApiError catch (e) {
      if (mounted) showMessage(context, e.field('currencyCode') ?? errorText(t, e));
    } finally {
      if (mounted) setState(() => _changingCurrency = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final currency = auth is SignedIn ? auth.business.currencyCode : defaultCurrencyCode;
    return SectionCard(title: t.businessInfo, icon: Icons.storefront_outlined, subtitle: t.businessInfoSub, children: [
      LabeledField(label: t.businessName, controller: _name, error: _errors['name'], icon: Icons.badge_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.whatsApp, hint: t.whatsAppHint, controller: _whatsApp, error: _errors['whatsApp'], keyboardType: TextInputType.phone, icon: Icons.chat_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.address, controller: _address, error: _errors['address'], icon: Icons.place_outlined),
      const SizedBox(height: 14),
      CurrencyRow(code: currency, enabled: !_changingCurrency, onTap: _changeCurrency),
      const SizedBox(height: 22),
      Text(t.socialAccounts, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: BrandColors.ink)),
      const SizedBox(height: 4),
      Text(t.socialAccountsSub, style: TextStyle(color: BrandColors.muted, fontSize: 13, height: 1.4)),
      const SizedBox(height: 14),
      LabeledField(label: t.instagram, hint: '@yourshop', controller: _instagram, error: _errors['instagram'], keyboardType: TextInputType.url, icon: Icons.camera_alt_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.facebook, hint: t.facebookHint, controller: _facebook, error: _errors['facebook'], keyboardType: TextInputType.url, icon: Icons.facebook_rounded),
      const SizedBox(height: 14),
      LabeledField(label: t.tikTok, hint: t.tikTokHint, controller: _tikTok, error: _errors['tikTok'], keyboardType: TextInputType.url, icon: Icons.music_note_outlined),
      const SizedBox(height: 14),
      LabeledField(label: t.snapchat, hint: t.snapchatHint, controller: _snapchat, error: _errors['snapchat'], keyboardType: TextInputType.url, icon: Icons.chat_bubble_outline_rounded),
      const SizedBox(height: 14),
      LabeledField(
        label: t.phoneForCalls,
        hint: t.phoneForCallsHint,
        controller: _phone,
        error: _errors['phone'],
        keyboardType: TextInputType.phone,
        textInputAction: TextInputAction.done,
        icon: Icons.call_outlined,
      ),
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
            // Left to right so the number reads in order, but on the layout's start side like the email above.
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(account.phone!, textDirection: TextDirection.ltr, style: TextStyle(color: BrandColors.muted)),
            ),
          ],
          const SizedBox(height: 14),
        ],
        const _LanguageRow(),
        const SizedBox(height: 14),
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

/// "App language" with the current choice; opens the choice sheet.
class _LanguageRow extends ConsumerWidget {
  const _LanguageRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final language = ref.watch(appLanguageProvider);
    return Material(
      color: BrandColors.paper,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        key: const Key('appLanguage'),
        leading: Icon(Icons.translate_rounded, color: BrandColors.primary),
        title: Text(t.appLanguage, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
        subtitle: Text(languageLabel(t, language), locale: language.locale, style: TextStyle(color: BrandColors.muted)),
        trailing: Icon(Icons.chevron_right_rounded, color: BrandColors.muted),
        onTap: () => showLanguageSheet(context),
      ),
    );
  }
}
