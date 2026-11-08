import 'package:flutter/material.dart';

import '../../core/brand.dart';
import '../../core/theme.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../ai/ai_design_chat.dart';
import 'design_models.dart';

/// The top of the design editor: the template's ready-made looks side by side. One tap puts a look's settings in the
/// draft (through the same apply and Undo as the AI chat); Undo puts back exactly what the look replaced.
class LooksStrip extends StatefulWidget {
  const LooksStrip({super.key, required this.looks, required this.fields, required this.values, required this.onApply});

  final List<TemplateLook> looks;

  /// The fields the editor shows; a look only changes these.
  final List<TemplateField> fields;

  /// The draft's current values.
  final Map<String, dynamic> Function() values;
  final ApplySettings onApply;

  @override
  State<LooksStrip> createState() => _LooksStripState();
}

class _LooksStripState extends State<LooksStrip> {
  /// The look last applied and what it replaced, for Undo. Null before the first tap and after Undo.
  ({TemplateLook look, Map<String, Object?> before})? _last;
  bool _undone = false;
  bool _busy = false;

  Set<String> get _keys => {for (final f in widget.fields) f.key};

  /// The look the draft matches now (every setting it sets has its value), if any.
  TemplateLook? _current(Map<String, dynamic> values) {
    for (final look in widget.looks) {
      final own = look.values.entries.where((e) => _keys.contains(e.key));
      if (own.isNotEmpty && own.every((e) => SettingsChange.same(values[e.key], e.value))) return look;
    }
    return null;
  }

  Future<void> _apply(TemplateLook look) async {
    if (_busy) return;
    final change = SettingsChange.of(look.values, keys: _keys, current: widget.values());
    if (change.patch.isEmpty) return;
    setState(() => _busy = true);
    try {
      await widget.onApply(change.patch);
      if (mounted) {
        setState(() {
          _last = (look: look, before: change.before);
          _undone = false;
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _undo() async {
    final last = _last;
    if (last == null || _busy) return;
    setState(() => _busy = true);
    try {
      await SettingsChange.undo(last.before, widget.onApply);
      if (mounted) {
        setState(() {
          _last = null;
          _undone = true;
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final values = widget.values();
    final current = _current(values);
    final palette = widget.fields.where((f) => f.type == 'palette').firstOrNull;
    return SectionCard(
      key: const Key('looksStrip'),
      title: t.looksTitle,
      icon: Icons.style_outlined,
      subtitle: t.looksSubtitle,
      children: [
        SizedBox(
          height: 132,
          child: ListView.separated(
            key: const Key('looksList'),
            scrollDirection: Axis.horizontal,
            itemCount: widget.looks.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final look = widget.looks[i];
              return _LookTile(
                key: Key('look-${look.id}'),
                look: look,
                palette: palette,
                values: values,
                selected: identical(look, current),
                onTap: _busy ? null : () => _apply(look),
              );
            },
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 180),
          child: _last == null && !_undone
              ? const SizedBox(width: double.infinity)
              : Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(children: [
                    Icon(_undone ? Icons.undo_rounded : Icons.check_circle_rounded, size: 17, color: _undone ? BrandColors.muted : BrandColors.live),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _undone ? t.lookUndone : t.lookApplied(_last!.look.labelFor(context)),
                        key: const Key('lookStatus'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: BrandColors.muted, fontSize: 13, height: 1.3),
                      ),
                    ),
                    if (_last != null)
                      TextButton(
                        key: const Key('lookUndo'),
                        onPressed: _busy ? null : _undo,
                        style: TextButton.styleFrom(minimumSize: const Size(0, 36), padding: const EdgeInsets.symmetric(horizontal: 10)),
                        child: Text(t.aiChatUndo),
                      ),
                  ]),
                ),
        ),
      ],
    );
  }
}

/// One look: a small swatch of its background and accent (from the template's color themes), and its name.
class _LookTile extends StatelessWidget {
  const _LookTile({super.key, required this.look, required this.palette, required this.values, required this.selected, required this.onTap});

  final TemplateLook look;
  final TemplateField? palette;
  final Map<String, dynamic> values;
  final bool selected;
  final VoidCallback? onTap;

  static Color? _color(Object? hex) {
    if (hex is! String || !RegExp(r'^#[0-9A-Fa-f]{6}$').hasMatch(hex)) return null;
    return Color(hexToArgb(hex));
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = palette == null ? null : (look.values[palette!.key] ?? values[palette!.key]);
    final background = _color(look.values['colors.background']) ?? _color(palette?.swatches[theme]) ?? BrandColors.tint;
    final accent = _color(look.values['accent']) ?? _color(values['accent']) ?? BrandColors.primary;
    final dark = background.computeLuminance() < 0.3;
    final ink = dark ? Colors.white : const Color(0xFF1C1C1C);
    final name = look.labelFor(context);
    return Semantics(
      button: true,
      selected: selected,
      label: t.lookApply(name),
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Ui.radiusSmall),
        child: SizedBox(
          width: 104,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              height: 86,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.circular(Ui.radiusSmall),
                border: Border.all(color: selected ? BrandColors.primary : BrandColors.line, width: selected ? 2.5 : 1),
              ),
              child: Stack(children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(width: 46, height: 7, decoration: BoxDecoration(color: ink.withValues(alpha: 0.85), borderRadius: BorderRadius.circular(4))),
                  const SizedBox(height: 5),
                  Container(width: 30, height: 7, decoration: BoxDecoration(color: ink.withValues(alpha: 0.85), borderRadius: BorderRadius.circular(4))),
                  const Spacer(),
                  Container(width: 38, height: 14, decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(7))),
                ]),
                if (selected)
                  PositionedDirectional(
                    top: 0,
                    end: 0,
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(color: BrandColors.primary, shape: BoxShape.circle),
                      child: const Icon(Icons.check_rounded, size: 15, color: Colors.white),
                    ),
                  ),
              ]),
            ),
            const SizedBox(height: 7),
            Text(
              name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13, height: 1.2, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, color: BrandColors.ink),
            ),
          ]),
        ),
      ),
    );
  }
}
