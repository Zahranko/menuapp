import 'dart:async';

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
import '../ai/ai_design_chat.dart';
import '../auth/auth_controller.dart';
import '../menu/dashboard_screen.dart';
import '../plan/plan_cards.dart';
import '../plan/plan_controller.dart';
import '../site/site_web_view.dart';
import 'design_controller.dart';
import 'design_models.dart';
import 'field_widgets.dart';
import 'looks_strip.dart';

/// Customize: a live preview on top, controls generated from the template's schema below, Publish at the bottom.
/// Changes save as a draft 600 ms after the last edit; the live site changes only on Publish.
class EditorScreen extends ConsumerStatefulWidget {
  const EditorScreen({super.key});

  static const saveDelay = Duration(milliseconds: 600);

  @override
  ConsumerState<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends ConsumerState<EditorScreen> {
  Map<String, dynamic>? _settings;
  String? _templateId;
  Timer? _debounce;
  Future<void>? _saving;
  Map<String, String> _errors = {};
  String? _previewUrl;
  DateTime? _previewAt;
  int _reload = 0;
  int _generation = 0;
  bool _publishing = false;

  /// Groups of settings the owner closed, and a key per group to scroll to it ("Jump to").
  final Set<String> _closed = {};
  final Map<String, GlobalKey> _groupKeys = {};

  GlobalKey _groupKey(String group) => _groupKeys.putIfAbsent(group, () => GlobalKey(debugLabel: 'group-$group'));

  /// Opens a group and scrolls it to the top of the settings.
  void _jumpTo(String group) {
    setState(() => _closed.remove(group));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final target = _groupKeys[group]?.currentContext;
      if (target != null && target.mounted) {
        Scrollable.ensureVisible(target, duration: const Duration(milliseconds: 350), curve: Curves.easeOutCubic);
      }
    });
  }

  /// The AI assistant's conversation, kept while the editor is open.
  AiChatController? _chatState;
  AiChatController get _chat => _chatState ??= AiChatController(_siteLocale);

  @override
  void dispose() {
    _debounce?.cancel();
    _chatState?.dispose();
    super.dispose();
  }

  bool get _pending => (_debounce?.isActive ?? false) || _saving != null;

  void _change(String key, Object? value) {
    setState(() {
      _settings![key] = value;
      _errors.remove(key);
    });
    _debounce?.cancel();
    _debounce = Timer(EditorScreen.saveDelay, _save);
  }

  /// Merges the AI assistant's changes (or its Undo) into the draft and saves it, so the preview shows them. A null value
  /// goes back to the template's default. Publishing stays the owner's step.
  Future<void> _applySuggestions(Map<String, dynamic> settings) async {
    setState(() {
      for (final e in settings.entries) {
        if (e.value == null) {
          _settings!.remove(e.key);
        } else {
          _settings![e.key] = e.value;
        }
      }
      _errors.removeWhere((key, _) => settings.containsKey(key));
      _generation++;
    });
    await _save();
  }

  /// Saves now (waiting for a save already running), then refreshes the preview.
  Future<bool> _save() async {
    _debounce?.cancel();
    if (_saving != null) await _saving;
    final settings = Map<String, dynamic>.from(_settings!);
    final done = Completer<void>();
    _saving = done.future;
    var ok = false;
    try {
      await ref.read(siteProvider.notifier).saveDraft(settings);
      ok = true;
      if (mounted) setState(() => _errors = {});
      await _refreshPreview();
    } on ApiError catch (e) {
      if (mounted) {
        setState(
          () => _errors = {
            for (final f in _fields)
              if (e.field('settings.${f.key}') != null) f.key: e.field('settings.${f.key}')!,
          },
        );
        if (_errors.isEmpty) showMessage(context, errorText(AppLocalizations.of(context), e));
      }
    } catch (e) {
      if (mounted) showMessage(context, errorText(AppLocalizations.of(context), e));
    } finally {
      done.complete();
      _saving = null;
    }
    return ok;
  }

  Future<void> _refreshPreview() async {
    try {
      // Preview links last 30 minutes; ask for a new one well before that.
      if (_previewUrl == null || DateTime.now().difference(_previewAt!) > const Duration(minutes: 25)) {
        _previewUrl = await ref.read(designRepositoryProvider).previewUrl();
        _previewAt = DateTime.now();
      }
      if (mounted) setState(() => _reload++);
    } catch (_) {
      // The editor still works without a preview.
    }
  }

  List<TemplateField> get _fields {
    final templates = ref.read(templatesProvider).value ?? const [];
    final template = templates.where((x) => x.id == _templateId).firstOrNull;
    return template?.fields ?? const [];
  }

  /// The website's language (chosen at sign-up), which picks the template's starting texts.
  String get _siteLocale => switch (ref.read(authControllerProvider)) {
    SignedIn(:final business) => business.locale,
    _ => 'en',
  };

  Future<void> _reset(TemplateInfo template) async {
    final t = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t.resetTitle),
        content: Text(t.resetBody(template.nameFor(context))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
            onPressed: () => Navigator.pop(context, true),
            child: Text(t.reset),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() {
      _settings = template.defaultsFor(_siteLocale);
      _errors = {};
      _generation++;
    });
    await _save();
  }

  Future<void> _publish() async {
    final t = AppLocalizations.of(context);
    setState(() => _publishing = true);
    try {
      if (_pending || _errors.isNotEmpty) {
        if (!await _save()) return;
      }
      await ref.read(siteProvider.notifier).publish();
      if (!mounted) return;
      setState(() => _publishing = false);
      await showFormSheet<void>(
        context,
        (sheet) => _Published(
          onViewSite: () {
            Navigator.pop(sheet);
            context.push('/site');
          },
          onManageMenu: () {
            Navigator.pop(sheet);
            context.go('/menu');
          },
        ),
      );
    } catch (e) {
      if (!mounted) return;
      if (e is ApiError && e.code == 'template.pro') {
        // A Pro template on the Basic plan: explain and offer the upgrade instead of a bare error.
        setState(() => _publishing = false);
        ref.invalidate(planProvider);
        final name = ref.read(templatesProvider).value?.where((x) => x.id == ref.read(siteProvider).value?.templateId).firstOrNull?.nameFor(context);
        await openProTemplateSheet(context, name ?? t.customize);
      } else {
        showMessage(context, errorText(t, e));
      }
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final site = ref.watch(siteProvider);
    final templates = ref.watch(templatesProvider);
    if (site.hasError || templates.hasError) {
      return Scaffold(
        appBar: AppBar(),
        body: LoadError(
          error: site.error ?? templates.error!,
          onRetry: () {
            ref.invalidate(siteProvider);
            ref.invalidate(templatesProvider);
          },
        ),
      );
    }
    final info = site.value;
    final all = templates.value;
    if (info == null || all == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final template = all.where((x) => x.id == info.templateId).firstOrNull;
    if (_templateId != info.templateId) {
      // First load, or the template changed in the gallery: start from the saved draft. Settings the draft does not
      // have yet (added to the template after the site was made, like the logo options) show their defaults, which is
      // also what the site uses and what the API saves for them.
      _templateId = info.templateId;
      _settings = {...?template?.defaultsFor(_siteLocale), ...info.draft};
      _generation++;
      _previewUrl = null;
      // The conversation was about the other template's settings.
      if (_chatState?.messages.isNotEmpty ?? false) Future.microtask(_chat.clear);
      Future.microtask(_refreshPreview);
    }
    final fields = [
      for (final f in template?.fields ?? const <TemplateField>[])
        if (supportedFieldTypes.contains(f.type)) f,
    ];
    final groups = <String, List<TemplateField>>{};
    for (final f in fields) {
      groups.putIfAbsent(f.groupFor(context) ?? t.groupMore, () => []).add(f);
    }

    return PopScope(
      canPop: !_pending,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await _save();
        if (context.mounted) context.pop();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: Scaffold(
          body: Column(
            children: [
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [BrandColors.primary, BrandColors.primary2]),
                ),
                child: SafeArea(
                  bottom: false,
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                        child: Row(
                          children: [
                            RoundIconButton(
                              dark: true,
                              icon: Icons.arrow_back_rounded,
                              tooltip: MaterialLocalizations.of(context).backButtonTooltip,
                              onPressed: () => Navigator.maybePop(context),
                            ),
                            Expanded(
                              child: Column(
                                children: [
                                  Text(
                                    template?.nameFor(context) ?? t.customize,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Ui.display(context, 18, color: Colors.white, weight: FontWeight.w700),
                                  ),
                                  if (template != null)
                                    Text(
                                      t.templateOf(template.numberLabel),
                                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12.5, fontWeight: FontWeight.w500),
                                    ),
                                ],
                              ),
                            ),
                            if (template != null)
                              RoundIconButton(dark: true, tooltip: t.resetTooltip, onPressed: () => _reset(template), icon: Icons.restart_alt_rounded),
                            const SizedBox(width: 6),
                            RoundIconButton(
                              dark: true,
                              tooltip: t.chooseTemplateShort,
                              onPressed: () => context.push('/templates'),
                              icon: Icons.grid_view_rounded,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        height: MediaQuery.sizeOf(context).height * 0.36,
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(36, 0, 36, 0),
                        padding: const EdgeInsets.fromLTRB(6, 6, 6, 0),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0B0F0D),
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 30, offset: const Offset(0, -4))],
                        ),
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
                          child: Stack(
                            children: [
                              Positioned.fill(
                                child: ColoredBox(
                                  color: Colors.white,
                                  child: _previewUrl == null
                                      ? const Center(child: CircularProgressIndicator())
                                      : ref.watch(webViewBuilderProvider)(_previewUrl!, _reload),
                                ),
                              ),
                              PositionedDirectional(
                                top: 10,
                                start: 10,
                                child: AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 200),
                                  child: Pill(
                                    key: ValueKey(_pending),
                                    _pending ? t.saving : t.livePreview,
                                    color: _pending ? BrandColors.accent : BrandColors.primary,
                                    textColor: _pending ? BrandColors.primary : Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (groups.length > 3)
                _JumpBar(
                  groups: groups.keys.toList(),
                  allClosed: groups.keys.every(_closed.contains),
                  onJump: _jumpTo,
                  onToggleAll: () => setState(() {
                    if (groups.keys.every(_closed.contains)) {
                      _closed.clear();
                    } else {
                      _closed.addAll(groups.keys);
                    }
                  }),
                ),
              Expanded(
                // Every group is built (not lazily), so "Jump to" can scroll to any of them.
                child: SingleChildScrollView(
                  key: const Key('editorSettings'),
                  padding: const EdgeInsets.fromLTRB(Ui.gutter, 20, Ui.gutter, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (template != null && template.looks.isNotEmpty)
                        LooksStrip(
                          key: ValueKey('looks-${template.id}'),
                          looks: template.looks,
                          fields: fields,
                          values: () => _settings ?? const {},
                          onApply: _applySuggestions,
                        ),
                      AiDesignAssistant(chat: _chat, fields: fields, values: () => _settings ?? const {}, onApply: _applySuggestions),
                      for (final entry in groups.entries)
                        _GroupCard(
                          key: _groupKey(entry.key),
                          title: entry.key,
                          count: entry.value.length,
                          // A group with a field that needs fixing stays open.
                          open: !_closed.contains(entry.key) || entry.value.any((f) => _errors.containsKey(f.key)),
                          onToggle: () => setState(() => _closed.contains(entry.key) ? _closed.remove(entry.key) : _closed.add(entry.key)),
                          children: [
                            for (final f in entry.value)
                              SettingField(
                                key: ValueKey('${f.key}-$_generation'),
                                field: f,
                                value: _settings![f.key],
                                error: _errors[f.key],
                                onChanged: (v) => _change(f.key, v),
                              ),
                          ],
                        ),
                      SectionCard(
                        title: t.menuItemsAndPrices,
                        icon: Icons.restaurant_menu_rounded,
                        subtitle: t.menuItemsElsewhere,
                        children: [LightButton(label: t.manageMenu, onPressed: () => context.go('/menu'))],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: BrandColors.hairline)),
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                child: BusyButton(label: info.isPublished ? t.publishChanges : t.publish, busyLabel: t.publishing, busy: _publishing, onPressed: _publish),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A row of buttons under the preview, one per group of settings, that opens the group and scrolls to it, and a button
/// that closes (or opens) every group, so a long list of settings becomes a short list of group names.
class _JumpBar extends StatelessWidget {
  const _JumpBar({required this.groups, required this.allClosed, required this.onJump, required this.onToggleAll});

  final List<String> groups;
  final bool allClosed;
  final ValueChanged<String> onJump;
  final VoidCallback onToggleAll;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return DecoratedBox(
      key: const Key('editorJumpBar'),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: BrandColors.hairline)),
      ),
      child: SizedBox(
        height: 56,
        child: Row(
          children: [
            Expanded(
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsetsDirectional.fromSTEB(Ui.gutter - 4, 8, 4, 8),
                children: [
                  Center(
                    child: Padding(
                      padding: const EdgeInsetsDirectional.only(start: 4, end: 8),
                      child: Text(
                        t.editorJumpTo,
                        style: TextStyle(color: BrandColors.muted, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  for (final group in groups)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(end: 6),
                      child: Semantics(
                        label: t.editorJumpToGroup(group),
                        excludeSemantics: true,
                        button: true,
                        child: ActionChip(key: Key('jump-$group'), label: Text(group), onPressed: () => onJump(group)),
                      ),
                    ),
                ],
              ),
            ),
            // Always in reach, at the end of the row.
            Padding(
              padding: const EdgeInsetsDirectional.only(end: Ui.gutter - 8),
              child: TextButton.icon(
                key: const Key('editorToggleAll'),
                style: TextButton.styleFrom(minimumSize: const Size(0, 44), padding: const EdgeInsets.symmetric(horizontal: 10)),
                onPressed: onToggleAll,
                icon: Icon(allClosed ? Icons.unfold_more_rounded : Icons.unfold_less_rounded, size: 20),
                label: Text(allClosed ? t.editorExpandAll : t.editorCollapseAll),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A group of settings with its name as a button that closes and opens it; closed, it shows how many settings it has.
class _GroupCard extends StatelessWidget {
  const _GroupCard({super.key, required this.title, required this.count, required this.open, required this.onToggle, required this.children});

  final String title;
  final int count;
  final bool open;
  final VoidCallback onToggle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AppCard(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(
              button: true,
              expanded: open,
              child: InkWell(
                key: Key('group-$title'),
                onTap: onToggle,
                child: Padding(
                  padding: EdgeInsets.fromLTRB(18, 18, 12, open ? 16 : 18),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: Ui.display(context, 18, weight: FontWeight.w700)),
                            if (!open) ...[
                              const SizedBox(height: 2),
                              Text(t.editorGroupCount(count), style: TextStyle(color: BrandColors.muted, fontSize: 13.5)),
                            ],
                          ],
                        ),
                      ),
                      AnimatedRotation(
                        turns: open ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(Icons.expand_more_rounded, color: BrandColors.muted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (open)
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
              ),
          ],
        ),
      ),
    );
  }
}

class _Published extends StatelessWidget {
  const _Published({required this.onViewSite, required this.onManageMenu});

  final VoidCallback onViewSite;
  final VoidCallback onManageMenu;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
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
        const SizedBox(height: 16),
        Text(t.publishedTitle, style: Ui.display(context, 26)),
        const SizedBox(height: 8),
        Text(t.publishedBody, style: TextStyle(color: BrandColors.muted, height: 1.45, fontSize: 15)),
        const SizedBox(height: 18),
        FilledButton(onPressed: onViewSite, child: Text(t.viewSite)),
        const SizedBox(height: 10),
        LightButton(label: t.manageMenu, onPressed: onManageMenu),
      ],
    );
  }
}
