import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/currency.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../design/color_picker.dart';
import '../design/design_models.dart';
import '../menu/catalog_controller.dart';
import '../menu/menu_models.dart';
import 'ai_repository.dart';
import 'ai_widgets.dart';

/// Merges suggested settings into the editor's draft (the editor saves it and refreshes the preview).
typedef ApplySettings = Future<void> Function(Map<String, dynamic> settings);

/// The editor's AI helper card: colors and texts from a photo, or texts written for the business.
/// Hidden when the status can't be read; shown dimmed with a note when the helper is off or used up this month.
class AiDesignHelper extends ConsumerWidget {
  const AiDesignHelper({super.key, required this.fields, required this.onApply});

  /// The current template's fields, to show suggestions with their labels, swatches and option names.
  final List<TemplateField> fields;
  final ApplySettings onApply;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final status = ref.watch(aiStatusProvider).value;
    if (status == null) return const SizedBox.shrink();
    final usable = status.usable;
    return SectionCard(
      key: const Key('aiDesignHelper'),
      title: t.aiHelper,
      icon: aiIcon,
      subtitle: t.aiHelperSub,
      children: [
        AiActionRow(
          key: const Key('aiFromPhoto'),
          icon: Icons.photo_camera_outlined,
          title: t.aiFromPhoto,
          subtitle: t.aiFromPhotoSub,
          onTap: usable ? () => _open(context, _Mode.photo) : null,
        ),
        const SizedBox(height: 10),
        AiActionRow(
          key: const Key('aiWriteText'),
          icon: Icons.edit_note_rounded,
          title: t.aiWriteText,
          subtitle: t.aiWriteTextSub,
          onTap: usable ? () => _open(context, _Mode.text) : null,
        ),
        const SizedBox(height: 12),
        AiStatusLine(status: status),
      ],
    );
  }

  Future<void> _open(BuildContext context, _Mode mode) async {
    final message = await showFormSheet<String>(context, (_) => _DesignHelperSheet(mode: mode, fields: fields, onApply: onApply));
    if (message != null && context.mounted) showMessage(context, message);
  }
}

enum _Mode { photo, text }

/// Note and photo, then the suggestions with a tick each, then Apply.
class _DesignHelperSheet extends ConsumerStatefulWidget {
  const _DesignHelperSheet({required this.mode, required this.fields, required this.onApply});

  final _Mode mode;
  final List<TemplateField> fields;
  final ApplySettings onApply;

  @override
  ConsumerState<_DesignHelperSheet> createState() => _DesignHelperSheetState();
}

class _DesignHelperSheetState extends ConsumerState<_DesignHelperSheet> {
  final _note = TextEditingController();
  bool _busy = false;
  bool _applying = false;
  String? _error;
  String? _summary;

  /// Suggested settings and product descriptions, each with whether the owner keeps it.
  Map<String, dynamic>? _settings;
  Map<String, String> _descriptions = {};
  final _off = <String>{};

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  TemplateField? _field(String key) => widget.fields.where((f) => f.key == key).firstOrNull;

  Future<void> _run({bool? camera}) async {
    final repo = ref.read(aiRepositoryProvider);
    AiPhoto? photo;
    if (camera != null) {
      photo = await ref.read(aiPhotoPickerProvider).one(camera: camera);
      if (photo == null) return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (photo != null) {
        final result = await repo.design(photo, note: _note.text);
        _show(result.settings, const {}, result.summary);
      } else {
        final result = await repo.text(note: _note.text);
        _show(result.settings, result.descriptions, null);
      }
    } catch (e) {
      if (mounted) setState(() => _error = errorText(AppLocalizations.of(context), e));
    } finally {
      ref.invalidate(aiStatusProvider);
      if (mounted) setState(() => _busy = false);
    }
  }

  void _show(Map<String, dynamic> settings, Map<String, String> descriptions, String? summary) {
    if (!mounted) return;
    setState(() {
      // Only settings this template shows in the editor; anything else would be invisible to the owner.
      _settings = {
        for (final e in settings.entries)
          if (_field(e.key) != null) e.key: e.value,
      };
      _descriptions = descriptions;
      _summary = summary;
      _off.clear();
    });
  }

  int get _chosen =>
      (_settings?.keys.where((k) => !_off.contains(k)).length ?? 0) + _descriptions.keys.where((id) => !_off.contains('product:$id')).length;

  Future<void> _apply() async {
    final t = AppLocalizations.of(context);
    setState(() => _applying = true);
    try {
      final settings = {
        for (final e in _settings!.entries)
          if (!_off.contains(e.key)) e.key: e.value,
      };
      final descriptions = {
        for (final e in _descriptions.entries)
          if (!_off.contains('product:${e.key}')) e.key: e.value,
      };
      if (descriptions.isNotEmpty) await _saveDescriptions(descriptions);
      if (settings.isNotEmpty) await widget.onApply(settings);
      if (!mounted) return;
      Navigator.pop(context, settings.isNotEmpty ? t.aiAppliedToDraft : t.aiDescriptionsSaved(descriptions.length));
    } catch (e) {
      if (mounted) setState(() => _error = errorText(t, e));
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  /// Saves each chosen description on its product (a full update with the product's other values unchanged).
  Future<void> _saveDescriptions(Map<String, String> descriptions) async {
    final catalog = await ref.read(catalogProvider.future);
    final currency = currencyFor(switch (ref.read(authControllerProvider)) { SignedIn(:final business) => business.currencyCode, _ => defaultCurrencyCode });
    final repo = ref.read(menuRepositoryProvider);
    for (final p in catalog.products) {
      final description = descriptions[p.id];
      if (description == null) continue;
      await repo.updateProduct(
        p.id,
        ProductInput(
          categoryId: p.categoryId,
          name: p.name,
          description: description,
          price: currency.inputText(p.price),
          label: p.label,
          customLabel: p.customLabel,
          customLabelAr: p.customLabelAr,
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
          imageUrl: p.imageUrl,
        ),
      );
    }
    await ref.read(catalogProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final photo = widget.mode == _Mode.photo;
    final title = photo ? t.aiFromPhoto : t.aiWriteText;
    if (_busy) return AiWorking(label: photo ? t.aiLookingAtPhoto : t.aiWriting);

    final settings = _settings;
    if (settings == null) {
      return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [const IconTile(aiIcon), const SizedBox(width: 12), Expanded(child: Text(title, style: Ui.display(context, 24)))]),
        const SizedBox(height: 18),
        LabeledField(
          fieldKey: const Key('aiNote'),
          label: t.aiNoteLabel,
          hint: t.aiNoteHint,
          controller: _note,
          textInputAction: TextInputAction.done,
        ),
        if (_error != null) ...[const SizedBox(height: 12), AiNote(_error!, icon: Icons.error_outline_rounded)],
        const SizedBox(height: 18),
        if (photo) ...[
          FilledButton.icon(
            key: const Key('aiTakePhoto'),
            onPressed: () => _run(camera: true),
            icon: const Icon(Icons.photo_camera_outlined),
            label: Text(t.aiTakePhoto),
          ),
          const SizedBox(height: 10),
          LightButton(icon: Icons.photo_library_outlined, label: t.aiChoosePhoto, onPressed: () => _run(camera: false)),
        ] else
          FilledButton.icon(key: const Key('aiSuggest'), onPressed: _run, icon: const Icon(aiIcon), label: Text(t.aiSuggest)),
      ]);
    }

    final design = [for (final k in settings.keys) if (!_isText(k)) k];
    final texts = [for (final k in settings.keys) if (_isText(k)) k];
    final products = ref.read(catalogProvider).value?.products ?? const <Product>[];
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(t.aiSuggestions, style: Ui.display(context, 24)),
      if (_summary != null) ...[const SizedBox(height: 6), Text(_summary!, style: TextStyle(color: BrandColors.muted, height: 1.4))],
      const SizedBox(height: 12),
      if (settings.isEmpty && _descriptions.isEmpty) AiNote(t.aiNothingSuggested),
      if (design.isNotEmpty) ...[_Heading(t.aiColors), for (final k in design) _row(k, _field(k)!, settings[k])],
      if (texts.isNotEmpty) ...[_Heading(t.aiTexts), for (final k in texts) _row(k, _field(k)!, settings[k])],
      if (_descriptions.isNotEmpty) ...[
        _Heading(t.aiProductDescriptions),
        for (final e in _descriptions.entries)
          _Choice(
            id: 'product:${e.key}',
            on: !_off.contains('product:${e.key}'),
            onChanged: (v) => setState(() => v ? _off.remove('product:${e.key}') : _off.add('product:${e.key}')),
            title: products.where((p) => p.id == e.key).firstOrNull?.name ?? '',
            child: Text(e.value, style: TextStyle(color: BrandColors.ink, height: 1.35)),
          ),
      ],
      const SizedBox(height: 14),
      if (settings.isNotEmpty) AiNote(t.aiDraftNote),
      if (_descriptions.isNotEmpty) ...[const SizedBox(height: 8), AiNote(t.aiDescriptionsNote)],
      const SizedBox(height: 8),
      AiNote(t.aiCheckBeforeUsing, icon: aiIcon),
      if (_error != null) ...[const SizedBox(height: 8), AiNote(_error!, icon: Icons.error_outline_rounded)],
      const SizedBox(height: 16),
      BusyButton(
        key: const Key('aiApply'),
        label: _chosen == 0 ? t.aiApply : t.aiApplyCount(_chosen),
        busyLabel: t.saving,
        busy: _applying,
        onPressed: _chosen == 0 ? () {} : _apply,
      ),
    ]);
  }

  bool _isText(String key) => const {'text', 'textarea'}.contains(_field(key)?.type);

  Widget _row(String key, TemplateField field, Object? value) => _Choice(
        id: key,
        on: !_off.contains(key),
        onChanged: (v) => setState(() => v ? _off.remove(key) : _off.add(key)),
        title: field.labelFor(context),
        child: _isText(key)
            ? Text(value?.toString() ?? '', style: TextStyle(color: BrandColors.ink, height: 1.35))
            : _SettingValue(field: field, value: value?.toString() ?? ''),
      );
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 14, 4, 6),
        child: Text(text, style: Ui.eyebrow(context).copyWith(fontSize: 13).tracked(context)),
      );
}

/// One suggestion with a checkbox to keep or skip it.
class _Choice extends StatelessWidget {
  const _Choice({required this.id, required this.on, required this.onChanged, required this.title, required this.child});

  final String id;
  final bool on;
  final ValueChanged<bool> onChanged;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => InkWell(
        key: Key('aiChoice-$id'),
        borderRadius: BorderRadius.circular(12),
        onTap: () => onChanged(!on),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(value: on, onChanged: (v) => onChanged(v ?? false)),
            const SizedBox(width: 4),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: BrandColors.muted)),
                  const SizedBox(height: 3),
                  child,
                ]),
              ),
            ),
          ]),
        ),
      );
}

/// A color as a swatch with its code, a theme as its swatch and name, any other choice as its name.
class _SettingValue extends StatelessWidget {
  const _SettingValue({required this.field, required this.value});

  final TemplateField field;
  final String value;

  @override
  Widget build(BuildContext context) {
    final color = colorFromHex(field.type == 'palette' ? field.swatches[value] : value);
    final hex = colorFromHex(value) != null;
    final label = hex ? value.toUpperCase() : field.optionLabelFor(context, value);
    return Row(children: [
      if (color != null) ...[
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: BrandColors.line)),
        ),
        const SizedBox(width: 10),
      ],
      Flexible(child: Text(label, textDirection: hex ? TextDirection.ltr : null, style: TextStyle(color: BrandColors.ink, fontWeight: FontWeight.w600))),
    ]);
  }
}
