import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme.dart';
import '../../l10n/generated/app_localizations.dart';

final _hexPattern = RegExp(r'^#[0-9a-fA-F]{6}$');

/// The color of a "#RRGGBB" code, or null when it is not one.
Color? colorFromHex(String? hex) {
  if (hex == null || !_hexPattern.hasMatch(hex)) return null;
  return Color(int.parse('FF${hex.substring(1)}', radix: 16));
}

/// "#RRGGBB" in capitals, as the website stores colors.
String colorToHex(Color c) {
  String part(double v) => (v * 255).round().clamp(0, 255).toRadixString(16).padLeft(2, '0');
  return '#${part(c.r)}${part(c.g)}${part(c.b)}'.toUpperCase();
}

/// Asks the owner for their own color: three sliders (color, strength, brightness) and a color code field.
/// Returns "#RRGGBB", or null when cancelled. The website picks readable text for any color, so every color is allowed.
Future<String?> pickColor(BuildContext context, {required String initial}) => showDialog<String>(
  context: context,
  builder: (_) => _ColorDialog(initial: colorFromHex(initial) ?? const Color(0xFFD9542C)),
);

class _ColorDialog extends StatefulWidget {
  const _ColorDialog({required this.initial});

  final Color initial;

  @override
  State<_ColorDialog> createState() => _ColorDialogState();
}

class _ColorDialogState extends State<_ColorDialog> {
  late HSVColor _hsv = HSVColor.fromColor(widget.initial);
  late final _code = TextEditingController(text: colorToHex(widget.initial));
  bool _invalid = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  void _set(HSVColor hsv) => setState(() {
    _hsv = hsv;
    _invalid = false;
    _code.text = colorToHex(hsv.toColor());
  });

  Widget _slider(String label, double value, double max, List<Color> track, ValueChanged<double> onChanged, String key) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        label,
        style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink, fontSize: 13),
      ),
      const SizedBox(height: 6),
      Container(
        height: 10,
        margin: const EdgeInsets.symmetric(horizontal: 24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(5),
          gradient: LinearGradient(colors: track),
        ),
      ),
      Slider(key: Key(key), value: value, max: max, onChanged: onChanged, activeColor: BrandColors.primary),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final color = _hsv.toColor();
    return AlertDialog(
      title: Text(t.customColorTitle),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              key: const Key('color-preview'),
              height: 56,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.line),
              ),
            ),
            const SizedBox(height: 14),
            _slider(
              t.colorHue,
              _hsv.hue,
              360,
              [for (var h = 0; h <= 360; h += 60) HSVColor.fromAHSV(1, h.toDouble(), 1, 1).toColor()],
              (v) => _set(_hsv.withHue(v)),
              'color-hue',
            ),
            _slider(
              t.colorSaturation,
              _hsv.saturation,
              1,
              [_hsv.withSaturation(0).toColor(), _hsv.withSaturation(1).toColor()],
              (v) => _set(_hsv.withSaturation(v)),
              'color-saturation',
            ),
            _slider(t.colorBrightness, _hsv.value, 1, [Colors.black, _hsv.withValue(1).toColor()], (v) => _set(_hsv.withValue(v)), 'color-brightness'),
            TextField(
              key: const Key('color-code'),
              controller: _code,
              textDirection: TextDirection.ltr,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[#0-9a-fA-F]')), LengthLimitingTextInputFormatter(7)],
              decoration: InputDecoration(labelText: t.colorHexLabel, errorText: _invalid ? t.colorHexInvalid : null, isDense: true),
              onChanged: (v) {
                final code = v.startsWith('#') ? v : '#$v';
                final c = colorFromHex(code);
                setState(() {
                  _invalid = c == null && v.length >= 6;
                  if (c != null) _hsv = HSVColor.fromColor(c);
                });
              },
            ),
            const SizedBox(height: 10),
            Text(t.colorReadableNote, style: TextStyle(color: BrandColors.muted, fontSize: 12.5, height: 1.4)),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(MaterialLocalizations.of(context).cancelButtonLabel)),
        FilledButton(
          key: const Key('color-use'),
          onPressed: () {
            final typed = _code.text.startsWith('#') ? _code.text : '#${_code.text}';
            if (colorFromHex(typed) == null) return setState(() => _invalid = true);
            Navigator.of(context).pop(typed.toUpperCase());
          },
          child: Text(t.useColor),
        ),
      ],
    );
  }
}
