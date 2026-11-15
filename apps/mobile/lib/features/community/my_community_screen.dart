import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_error.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/logo_mark.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../design/design_controller.dart';
import '../menu/dashboard_screen.dart';
import '../plan/plan_cards.dart';
import '../plan/plan_controller.dart';
import 'community_controller.dart';
import 'community_models.dart';
import 'community_screen.dart';

/// Sharing designs: Pro owners make a publisher profile (a unique username), then share their current Studio design
/// and manage what they shared: share its link, update it, hide it from the gallery or delete it.
class MyCommunityScreen extends ConsumerWidget {
  const MyCommunityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final plan = ref.watch(planProvider);
    final publisher = ref.watch(myPublisherProvider);
    final isPro = plan.value?.subscription.isPro;
    return Scaffold(
      appBar: AuthHeader(onBack: () => context.canPop() ? context.pop() : context.go('/community'), wordmark: const BrandLockup(size: 20)),
      body: publisher.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(myPublisherProvider)),
        data: (profile) => ListView(
          padding: const EdgeInsets.fromLTRB(Ui.gutter, 18, Ui.gutter, 32),
          children: [
            Text(profile == null ? t.communityShareYours : t.communityMine, style: Ui.display(context, 30)),
            const SizedBox(height: 10),
            Text(t.communityOnlyDesign, style: TextStyle(color: BrandColors.muted, fontSize: 15, height: 1.45)),
            const SizedBox(height: 18),
            if (profile == null && isPro == false)
              _ProNeeded()
            else if (profile == null)
              const PublisherForm()
            else ...[
              _PublisherCard(profile: profile),
              const SizedBox(height: 16),
              const _ShareCurrent(),
              const SizedBox(height: 20),
              const _MyTemplates(),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProNeeded extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return SectionCard(
      title: t.communityShareYours,
      badge: const ProBadge(),
      subtitle: t.communityShareYoursPro,
      children: [
        FilledButton(
          key: const Key('communityUpgrade'),
          style: FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary),
          onPressed: () => openTemplatePlanSheet(context, t.communityTitle, 'pro'),
          child: Text(t.upgradeToPro),
        ),
      ],
    );
  }
}

/// Creates or edits the publisher profile. The username is checked while the owner types.
class PublisherForm extends ConsumerStatefulWidget {
  const PublisherForm({super.key, this.profile, this.onSaved});

  final Publisher? profile;
  final VoidCallback? onSaved;

  @override
  ConsumerState<PublisherForm> createState() => _PublisherFormState();
}

class _PublisherFormState extends ConsumerState<PublisherForm> {
  late final _username = TextEditingController(text: widget.profile?.username ?? '');
  late final _name = TextEditingController(text: widget.profile?.displayName ?? '');
  late final _bio = TextEditingController(text: widget.profile?.bio ?? '');
  Timer? _check;
  String? _usernameNote;
  bool _usernameOk = false;
  Map<String, String> _errors = {};
  bool _saving = false;

  @override
  void dispose() {
    _check?.cancel();
    _username.dispose();
    _name.dispose();
    _bio.dispose();
    super.dispose();
  }

  void _onUsername(String value) {
    _check?.cancel();
    setState(() {
      _usernameNote = null;
      _usernameOk = false;
      _errors.remove('username');
    });
    if (value.trim().isEmpty) return;
    _check = Timer(const Duration(milliseconds: 400), () async {
      try {
        final result = await ref.read(communityRepositoryProvider).usernameAvailability(value);
        if (!mounted || _username.text != value) return;
        setState(() {
          _usernameOk = result.available;
          _usernameNote = result.message;
        });
      } catch (_) {
        // The check is a convenience; saving checks again.
      }
    });
  }

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    setState(() => _saving = true);
    try {
      await ref.read(communityRepositoryProvider).savePublisher(
            username: _username.text.trim(),
            displayName: _name.text.trim(),
            bio: _bio.text.trim().isEmpty ? null : _bio.text.trim(),
          );
      ref.invalidate(myPublisherProvider);
      widget.onSaved?.call();
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _errors = {
            for (final k in ['username', 'displayName', 'bio']) k: ?e.field(k),
          });
      if (_errors.isEmpty) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final editing = widget.profile != null;
    final username = _username.text.trim().toLowerCase().replaceFirst('@', '');
    return SectionCard(
      title: t.publisherProfileTitle,
      icon: Icons.badge_outlined,
      subtitle: t.publisherProfileSub,
      children: [
        LabeledField(
          fieldKey: const Key('publisherUsername'),
          label: t.publisherUsername,
          controller: _username,
          keyboardType: TextInputType.url,
          prefix: Padding(padding: const EdgeInsetsDirectional.only(start: 14, end: 2), child: Text('@', style: TextStyle(color: BrandColors.muted, fontWeight: FontWeight.w700))),
          error: _errors['username'] ?? _usernameNote,
          onChanged: _onUsername,
        ),
        if (_usernameOk && username.isNotEmpty && username != widget.profile?.username) ...[
          const SizedBox(height: 6),
          Row(children: [
            Icon(Icons.check_circle_rounded, size: 16, color: BrandColors.live),
            const SizedBox(width: 6),
            Text(t.publisherUsernameFree(username), style: TextStyle(color: BrandColors.live, fontSize: 13, fontWeight: FontWeight.w600)),
          ]),
        ],
        const SizedBox(height: 14),
        LabeledField(fieldKey: const Key('publisherName'), label: t.publisherDisplayName, controller: _name, error: _errors['displayName']),
        const SizedBox(height: 14),
        LabeledField(fieldKey: const Key('publisherBio'), label: t.publisherBio, controller: _bio, error: _errors['bio'], textInputAction: TextInputAction.done),
        const SizedBox(height: 18),
        BusyButton(
          key: const Key('publisherSave'),
          label: editing ? t.publisherSave : t.publisherCreate,
          busyLabel: editing ? t.publisherSave : t.publisherCreate,
          busy: _saving,
          onPressed: _save,
        ),
      ],
    );
  }
}

class _PublisherCard extends StatelessWidget {
  const _PublisherCard({required this.profile});

  final Publisher profile;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Row(children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: BrandColors.accent.withValues(alpha: 0.3),
          child: Text(profile.displayName.characters.first.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w800, color: BrandColors.primary, fontSize: 18)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(profile.displayName, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: BrandColors.ink)),
            Text('@${profile.username}', textDirection: TextDirection.ltr, style: TextStyle(color: BrandColors.muted, fontSize: 13.5)),
          ]),
        ),
        TextButton(
          key: const Key('publisherEdit'),
          onPressed: () => showFormSheet<void>(context, (sheet) => PublisherForm(profile: profile, onSaved: () => Navigator.pop(sheet))),
          child: Text(t.publisherEdit),
        ),
      ]),
    );
  }
}

/// "Share my current design": on a Studio site, a sheet with a name, a short description and whether the gallery lists it.
class _ShareCurrent extends ConsumerWidget {
  const _ShareCurrent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final site = ref.watch(siteProvider).value;
    final templates = ref.watch(templatesProvider).value;
    final template = templates?.where((x) => x.id == site?.templateId).firstOrNull;
    final canShare = template?.fields.any((f) => f.type == 'css') ?? false;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      FilledButton.icon(
        key: const Key('communityShareCurrent'),
        icon: const Icon(Icons.ios_share_rounded, size: 18),
        label: Text(t.communityShareCurrent),
        onPressed: canShare ? () => showFormSheet<void>(context, (_) => const ShareDesignSheet()) : null,
      ),
      if (!canShare && site != null) ...[
        const SizedBox(height: 8),
        Text(t.communityNeedsStudio, style: TextStyle(color: BrandColors.muted, fontSize: 13.5, height: 1.4)),
      ],
    ]);
  }
}

/// Names and shares the current design, or edits one already shared ([item]).
class ShareDesignSheet extends ConsumerStatefulWidget {
  const ShareDesignSheet({super.key, this.item});

  final MyCommunityTemplate? item;

  @override
  ConsumerState<ShareDesignSheet> createState() => _ShareDesignSheetState();
}

class _ShareDesignSheetState extends ConsumerState<ShareDesignSheet> {
  late final _name = TextEditingController(text: widget.item?.template.name ?? '');
  late final _description = TextEditingController(text: widget.item?.template.description ?? '');
  late bool _listed = widget.item?.isListed ?? true;
  Map<String, String> _errors = {};
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    setState(() => _saving = true);
    final repo = ref.read(communityRepositoryProvider);
    final description = _description.text.trim().isEmpty ? null : _description.text.trim();
    try {
      if (widget.item == null) {
        await repo.share(name: _name.text.trim(), description: description, listed: _listed);
      } else {
        await repo.update(widget.item!, name: _name.text.trim(), description: description ?? '', listed: _listed);
      }
      ref.invalidate(myCommunityTemplatesProvider);
      if (!mounted) return;
      Navigator.pop(context);
      showMessage(context, widget.item == null ? t.communityShared : t.communityUpdated);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _errors = {
            for (final k in ['name', 'description']) k: ?e.field(k),
          });
      if (_errors.isEmpty) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(widget.item == null ? t.communityShareCurrent : widget.item!.template.name, style: Ui.display(context, 24)),
      const SizedBox(height: 6),
      Text(t.communityOnlyDesign, style: TextStyle(color: BrandColors.muted, height: 1.4)),
      const SizedBox(height: 16),
      LabeledField(fieldKey: const Key('communityShareName'), label: t.communityShareName, controller: _name, error: _errors['name']),
      const SizedBox(height: 14),
      LabeledField(fieldKey: const Key('communityShareDescription'), label: t.communityShareDescription, controller: _description, error: _errors['description'], textInputAction: TextInputAction.done),
      const SizedBox(height: 8),
      SwitchListTile(
        key: const Key('communityListed'),
        contentPadding: EdgeInsets.zero,
        title: Text(t.communityListed),
        subtitle: Text(t.communityListedSub),
        value: _listed,
        onChanged: (v) => setState(() => _listed = v),
      ),
      const SizedBox(height: 12),
      BusyButton(
        key: const Key('communityShareSave'),
        label: widget.item == null ? t.communityPublish : t.publisherSave,
        busyLabel: widget.item == null ? t.communityPublish : t.publisherSave,
        busy: _saving,
        onPressed: _save,
      ),
    ]);
  }
}

class _MyTemplates extends ConsumerWidget {
  const _MyTemplates();

  Future<void> _run(BuildContext context, WidgetRef ref, Future<void> Function() action, String done) async {
    final t = AppLocalizations.of(context);
    try {
      await action();
      ref.invalidate(myCommunityTemplatesProvider);
      if (context.mounted) showMessage(context, done);
    } catch (e) {
      if (context.mounted) showMessage(context, errorText(t, e));
    }
  }

  Future<void> _menu(BuildContext context, WidgetRef ref, MyCommunityTemplate item, String choice) async {
    final t = AppLocalizations.of(context);
    final repo = ref.read(communityRepositoryProvider);
    switch (choice) {
      case 'share':
        await ref.read(shareTextProvider)(t.communityShareText(item.template.name, item.template.shareUrl));
      case 'edit':
        await showFormSheet<void>(context, (_) => ShareDesignSheet(item: item));
      case 'update':
        await _run(context, ref, () => repo.update(item, updateDesign: true), t.communityUpdated);
      case 'listed':
        await _run(context, ref, () => repo.update(item, listed: !item.isListed), t.communityUpdated);
      case 'delete':
        final ok = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(t.communityDeleteTitle(item.template.name)),
            content: Text(t.communityDeleteBody),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
              FilledButton(
                key: const Key('communityDeleteConfirm'),
                style: FilledButton.styleFrom(backgroundColor: BrandColors.highlight, minimumSize: const Size(0, 44)),
                onPressed: () => Navigator.pop(context, true),
                child: Text(t.communityDelete),
              ),
            ],
          ),
        );
        if (ok == true && context.mounted) await _run(context, ref, () => repo.delete(item), t.communityDeleted);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final mine = ref.watch(myCommunityTemplatesProvider);
    return mine.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(myCommunityTemplatesProvider)),
      data: (items) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (items.isEmpty) Text(t.communityNoneShared, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted)),
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: CommunityCard(
              item: item.template,
              onTap: () => context.push('/community/template?code=${item.template.code}'),
              trailing: PopupMenuButton<String>(
                key: Key('communityMenu-${item.template.code}'),
                onSelected: (choice) => _menu(context, ref, item, choice),
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'share', child: Text(t.communityShareLink)),
                  PopupMenuItem(value: 'edit', child: Text(t.publisherEdit)),
                  PopupMenuItem(value: 'update', child: Text(t.communityUpdateDesign)),
                  PopupMenuItem(value: 'listed', child: Text(item.isListed ? t.communityHide : t.communityShow)),
                  PopupMenuItem(value: 'delete', child: Text(t.communityDelete, style: TextStyle(color: BrandColors.highlight))),
                ],
              ),
              footer: item.isListed
                  ? null
                  : Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Row(children: [
                        Icon(Icons.link_rounded, size: 16, color: BrandColors.muted),
                        const SizedBox(width: 6),
                        Text(t.communityLinkOnly, style: TextStyle(color: BrandColors.muted, fontSize: 13)),
                      ]),
                    ),
            ),
          ),
      ]),
    );
  }
}
