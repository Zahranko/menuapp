import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart' show DateFormat;

import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import 'design_models.dart';

/// Field types the editor knows. Others are skipped (with a log line) so a newer template never breaks the app.
const supportedFieldTypes = {'text', 'textarea', 'choice', 'palette', 'color', 'image', 'images', 'range', 'toggle', 'bool', 'toggles', 'hours'};

/// One control for one template setting, chosen by the field's type.
class SettingField extends StatelessWidget {
  const SettingField({super.key, required this.field, required this.value, required this.onChanged, this.error});

  final TemplateField field;
  final Object? value;
  final ValueChanged<Object?> onChanged;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final control = switch (field.type) {
      'text' || 'textarea' => _TextSetting(field: field, value: value as String? ?? '', onChanged: onChanged),
      'choice' => _ChoiceSetting(field: field, value: value?.toString(), onChanged: onChanged),
      'palette' || 'color' => _SwatchSetting(field: field, value: value?.toString(), onChanged: onChanged),
      'image' => _ImageSetting(field: field, value: value as String? ?? '', onChanged: onChanged),
      'images' => _ImagesSetting(field: field, value: [for (final v in (value as List?) ?? const []) v.toString()], onChanged: onChanged),
      'range' => _RangeSetting(field: field, value: (value as num?)?.toDouble() ?? field.min ?? 0, onChanged: onChanged),
      'toggle' || 'bool' => null,
      'toggles' => _TogglesSetting(field: field, value: [for (final v in (value as List?) ?? const []) v.toString()], onChanged: onChanged),
      'hours' => _HoursSetting(value: Map<String, dynamic>.from((value as Map?) ?? const {}), onChanged: onChanged),
      _ => null,
    };
    if (field.type == 'toggle' || field.type == 'bool') {
      return SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(field.label, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
        value: value == true,
        activeTrackColor: BrandColors.primary,
        onChanged: onChanged,
      );
    }
    if (control == null) {
      debugPrint('Editor: skipped setting "${field.key}" of unknown type "${field.type}"');
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (field.type != 'range') ...[
          Text(field.label, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
          const SizedBox(height: 8),
        ],
        control,
        if (error != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(error!, style: TextStyle(color: BrandColors.highlight, fontSize: 12.5))),
      ]),
    );
  }
}

class _TextSetting extends StatefulWidget {
  const _TextSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final String value;
  final ValueChanged<Object?> onChanged;

  @override
  State<_TextSetting> createState() => _TextSettingState();
}

class _TextSettingState extends State<_TextSetting> {
  late final _controller = TextEditingController(text: widget.value);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        key: Key('setting-${widget.field.key}'),
        controller: _controller,
        maxLines: widget.field.type == 'textarea' ? 4 : 1,
        minLines: widget.field.type == 'textarea' ? 2 : 1,
        maxLength: widget.field.max?.toInt(),
        onChanged: widget.onChanged,
      );
}

class _ChoiceSetting extends StatelessWidget {
  const _ChoiceSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final String? value;
  final ValueChanged<Object?> onChanged;

  @override
  Widget build(BuildContext context) => Wrap(spacing: 8, runSpacing: 8, children: [
        for (final o in field.options)
          ChoiceChip(
            label: Text(field.optionLabel(o)),
            selected: value == o,
            showCheckmark: false,
            selectedColor: BrandColors.primary,
            labelStyle: TextStyle(color: value == o ? Colors.white : BrandColors.ink, fontWeight: FontWeight.w600),
            onSelected: (_) => onChanged(o),
          ),
      ]);
}

Color? _hex(String? hex) {
  if (hex == null || !RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(hex)) return null;
  return Color(int.parse('FF${hex.substring(1)}', radix: 16));
}

/// Round swatches: the option's own color for "color", the theme's swatch for "palette".
class _SwatchSetting extends StatelessWidget {
  const _SwatchSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final String? value;
  final ValueChanged<Object?> onChanged;

  @override
  Widget build(BuildContext context) => Wrap(spacing: 10, runSpacing: 10, children: [
        for (final o in field.options)
          Tooltip(
            message: field.optionLabel(o),
            child: Semantics(
              button: true,
              selected: value == o,
              label: field.optionLabel(o),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => onChanged(o),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _hex(field.type == 'color' ? o : field.swatches[o]) ?? BrandColors.line,
                    border: Border.all(color: value == o ? BrandColors.primary : BrandColors.line, width: value == o ? 3 : 1),
                  ),
                  child: value == o ? Icon(Icons.check, size: 18, color: BrandColors.ink.withValues(alpha: 0.6)) : null,
                ),
              ),
            ),
          ),
      ]);
}

class _RangeSetting extends StatelessWidget {
  const _RangeSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final double value;
  final ValueChanged<Object?> onChanged;

  @override
  Widget build(BuildContext context) {
    final min = field.min ?? 0, max = field.max ?? 100, step = field.step ?? 1;
    final divisions = ((max - min) / step).round();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [
        Expanded(child: Text(field.label, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink))),
        Text(value.toStringAsFixed(value == value.roundToDouble() ? 0 : 1), style: TextStyle(color: BrandColors.muted)),
      ]),
      Slider(
        value: value.clamp(min, max),
        min: min,
        max: max,
        divisions: divisions > 0 ? divisions : null,
        activeColor: BrandColors.primary,
        onChanged: (v) => onChanged(v == v.roundToDouble() ? v.toInt() : v),
      ),
    ]);
  }
}

class _TogglesSetting extends StatelessWidget {
  const _TogglesSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final List<String> value;
  final ValueChanged<Object?> onChanged;

  @override
  Widget build(BuildContext context) => Column(children: [
        for (final o in field.options)
          SwitchListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            title: Text(field.optionLabel(o)),
            value: value.contains(o),
            activeTrackColor: BrandColors.primary,
            // Keep the template's order so the sections list stays stable.
            onChanged: (on) => onChanged([for (final x in field.options) if (x == o ? on : value.contains(x)) x]),
          ),
      ]);
}

/// Uploads a photo for an image setting and returns its address, or null when cancelled or failed.
Future<String?> _upload(BuildContext context, WidgetRef ref) async {
  final t = AppLocalizations.of(context);
  final photo = await pickPhoto();
  if (photo == null) return null;
  try {
    return await ref.read(menuRepositoryProvider).uploadImage(photo.bytes, photo.name);
  } catch (e) {
    if (context.mounted) showMessage(context, errorText(t, e));
    return null;
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.selected, required this.onTap, required this.child, this.label});

  final bool selected;
  final VoidCallback onTap;
  final Widget child;
  final String? label;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        label: label,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: 72,
            height: 72,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: selected ? BrandColors.primary : BrandColors.line, width: selected ? 3 : 1),
            ),
            child: child,
          ),
        ),
      );
}

class _ImageSetting extends ConsumerStatefulWidget {
  const _ImageSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final String value;
  final ValueChanged<Object?> onChanged;

  @override
  ConsumerState<_ImageSetting> createState() => _ImageSettingState();
}

class _ImageSettingState extends ConsumerState<_ImageSetting> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final v = widget.value;
    final uploaded = v.isNotEmpty && !v.startsWith(presetPrefix);
    return Wrap(spacing: 8, runSpacing: 8, children: [
      for (final p in widget.field.presets)
        _Tile(
          label: p,
          selected: v == '$presetPrefix$p',
          onTap: () => widget.onChanged('$presetPrefix$p'),
          child: SvgPicture.network(presetAsset(p), fit: BoxFit.cover, placeholderBuilder: (_) => Center(child: Text(p, style: const TextStyle(fontSize: 11)))),
        ),
      _Tile(
        label: t.uploadPhoto,
        selected: uploaded,
        onTap: () async {
          setState(() => _busy = true);
          final url = await _upload(context, ref);
          if (mounted) setState(() => _busy = false);
          if (url != null) widget.onChanged(url);
        },
        child: _busy
            ? const Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)))
            : uploaded
                ? Image.network(v, fit: BoxFit.cover)
                : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.add_photo_alternate_outlined, color: BrandColors.muted),
                    Text(t.photo, style: TextStyle(fontSize: 11, color: BrandColors.muted)),
                  ]),
      ),
      if (widget.field.presets.isEmpty && v.isNotEmpty)
        TextButton(onPressed: () => widget.onChanged(''), child: Text(t.remove)),
    ]);
  }
}

class _ImagesSetting extends ConsumerStatefulWidget {
  const _ImagesSetting({required this.field, required this.value, required this.onChanged});

  final TemplateField field;
  final List<String> value;
  final ValueChanged<Object?> onChanged;

  @override
  ConsumerState<_ImagesSetting> createState() => _ImagesSettingState();
}

class _ImagesSettingState extends ConsumerState<_ImagesSetting> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final max = widget.field.max?.toInt() ?? 6;
    return Wrap(spacing: 8, runSpacing: 8, children: [
      for (final (i, url) in widget.value.indexed)
        Stack(children: [
          _Tile(selected: false, onTap: () {}, child: Image.network(url, fit: BoxFit.cover)),
          PositionedDirectional(
            top: 2,
            end: 2,
            child: InkWell(
              onTap: () => widget.onChanged([...widget.value]..removeAt(i)),
              child: CircleAvatar(radius: 11, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 14, color: Colors.white, semanticLabel: t.remove)),
            ),
          ),
        ]),
      if (widget.value.length < max)
        _Tile(
          label: t.addPhotos,
          selected: false,
          onTap: () async {
            setState(() => _busy = true);
            final url = await _upload(context, ref);
            if (mounted) setState(() => _busy = false);
            if (url != null) widget.onChanged([...widget.value, url]);
          },
          child: _busy
              ? const Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)))
              : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.add, color: BrandColors.muted),
                  Text('${widget.value.length}/$max', style: TextStyle(fontSize: 11, color: BrandColors.muted)),
                ]),
        ),
    ]);
  }
}

/// Opening hours from Saturday to Friday: a time range like 08:00-23:00 per day, or closed.
class _HoursSetting extends StatelessWidget {
  const _HoursSetting({required this.value, required this.onChanged});

  final Map<String, dynamic> value;
  final ValueChanged<Object?> onChanged;

  static const days = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toLanguageTag();
    // 6 January 2024 was a Saturday.
    String dayName(int i) => DateFormat.EEEE(locale).format(DateTime(2024, 1, 6 + i));
    return Column(children: [
      for (final (i, day) in days.indexed)
        _HoursRow(
          key: ValueKey(day),
          day: dayName(i),
          value: value[day]?.toString() ?? '',
          closedLabel: t.closed,
          onChanged: (v) => onChanged({...value, day: v}),
        ),
    ]);
  }
}

class _HoursRow extends StatefulWidget {
  const _HoursRow({super.key, required this.day, required this.value, required this.closedLabel, required this.onChanged});

  final String day;
  final String value;
  final String closedLabel;
  final ValueChanged<String> onChanged;

  @override
  State<_HoursRow> createState() => _HoursRowState();
}

class _HoursRowState extends State<_HoursRow> {
  late final _controller = TextEditingController(text: widget.value == 'closed' ? '' : widget.value);
  late String _open = widget.value == 'closed' || widget.value.isEmpty ? '08:00-23:00' : widget.value;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final closed = widget.value == 'closed';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        SizedBox(width: 92, child: Text(widget.day, style: TextStyle(color: BrandColors.ink))),
        Expanded(
          child: TextField(
            controller: _controller,
            enabled: !closed,
            textDirection: TextDirection.ltr,
            keyboardType: TextInputType.datetime,
            decoration: const InputDecoration(isDense: true, hintText: '08:00-23:00'),
            onChanged: (v) {
              _open = v;
              widget.onChanged(v.trim());
            },
          ),
        ),
        const SizedBox(width: 8),
        Text(widget.closedLabel, style: TextStyle(color: BrandColors.muted, fontSize: 12)),
        Switch(
          value: closed,
          activeTrackColor: BrandColors.highlight,
          onChanged: (on) {
            if (!on) _controller.text = _open;
            widget.onChanged(on ? 'closed' : _open);
          },
        ),
      ]),
    );
  }
}
