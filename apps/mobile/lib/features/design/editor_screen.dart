import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_error.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../menu/dashboard_screen.dart';
import '../site/site_web_view.dart';
import 'design_controller.dart';
import 'design_models.dart';
import 'field_widgets.dart';

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

  @override
  void dispose() {
    _debounce?.cancel();
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
        setState(() => _errors = {
              for (final f in _fields)
                if (e.field('settings.${f.key}') != null) f.key: e.field('settings.${f.key}')!,
            });
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

  Future<void> _reset(TemplateInfo template) async {
    final t = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t.resetTitle),
        content: Text(t.resetBody(template.name)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
          FilledButton(style: FilledButton.styleFrom(minimumSize: const Size(0, 44)), onPressed: () => Navigator.pop(context, true), child: Text(t.reset)),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() {
      _settings = Map<String, dynamic>.from(template.defaults);
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
      await showFormSheet<void>(context, (sheet) => _Published(onViewSite: () {
            Navigator.pop(sheet);
            context.push('/site');
          }, onManageMenu: () {
            Navigator.pop(sheet);
            context.go('/menu');
          }));
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
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
        body: LoadError(error: site.error ?? templates.error!, onRetry: () {
          ref.invalidate(siteProvider);
          ref.invalidate(templatesProvider);
        }),
      );
    }
    final info = site.value;
    final all = templates.value;
    if (info == null || all == null) return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));

    if (_templateId != info.templateId) {
      // First load, or the template changed in the gallery: start from the saved draft.
      _templateId = info.templateId;
      _settings = Map<String, dynamic>.from(info.draft);
      _generation++;
      _previewUrl = null;
      Future.microtask(_refreshPreview);
    }
    final template = all.where((x) => x.id == info.templateId).firstOrNull;
    final fields = [for (final f in template?.fields ?? const <TemplateField>[]) if (supportedFieldTypes.contains(f.type)) f];
    final groups = <String, List<TemplateField>>{};
    for (final f in fields) {
      groups.putIfAbsent(f.group ?? t.groupMore, () => []).add(f);
    }

    return PopScope(
      canPop: !_pending,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await _save();
        if (context.mounted) context.pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(template == null ? t.customize : t.customizeTemplate(template.numberLabel, template.name)),
          actions: [
            if (template != null) IconButton(tooltip: t.resetTooltip, onPressed: () => _reset(template), icon: const Icon(Icons.restart_alt)),
            IconButton(tooltip: t.chooseTemplateShort, onPressed: () => context.push('/templates'), icon: const Icon(Icons.grid_view_rounded)),
          ],
        ),
        body: Column(children: [
          Container(
            height: MediaQuery.sizeOf(context).height * 0.34,
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: BrandColors.line), color: Colors.white),
            child: Stack(children: [
              Positioned.fill(
                child: _previewUrl == null
                    ? const Center(child: CircularProgressIndicator())
                    : ref.watch(webViewBuilderProvider)(_previewUrl!, _reload),
              ),
              PositionedDirectional(
                top: 8,
                start: 8,
                child: Pill(_pending ? t.saving : t.livePreview, color: Colors.white),
              ),
            ]),
          ),
          Expanded(
            child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 24), children: [
              for (final entry in groups.entries)
                SectionCard(
                  title: entry.key,
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
              SectionCard(title: t.menuItemsAndPrices, subtitle: t.menuItemsElsewhere, children: [
                LightButton(label: t.manageMenu, onPressed: () => context.go('/menu')),
              ]),
            ]),
          ),
        ]),
        bottomNavigationBar: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: BusyButton(
              label: info.isPublished ? t.publishChanges : t.publish,
              busyLabel: t.publishing,
              busy: _publishing,
              onPressed: _publish,
            ),
          ),
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
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Align(
        alignment: AlignmentDirectional.centerStart,
        child: CircleAvatar(radius: 26, backgroundColor: BrandColors.accent, child: Icon(Icons.check, color: BrandColors.primary, size: 28)),
      ),
      const SizedBox(height: 14),
      Text(t.publishedTitle, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: BrandColors.ink)),
      const SizedBox(height: 6),
      Text(t.publishedBody, style: TextStyle(color: BrandColors.muted)),
      const SizedBox(height: 18),
      FilledButton(onPressed: onViewSite, child: Text(t.viewSite)),
      const SizedBox(height: 10),
      LightButton(label: t.manageMenu, onPressed: onManageMenu),
    ]);
  }
}
