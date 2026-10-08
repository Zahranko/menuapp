import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../l10n/generated/app_localizations.dart';
import '../api/api_error.dart';
import '../brand.dart';
import '../theme.dart';

/// A white card with soft depth: the base surface of every screen.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(18), this.onTap, this.color, this.radius = Ui.radius});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius));
    // A Material (not a colored box) so switches and list tiles inside show their ink.
    return DecoratedBox(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(radius), boxShadow: Ui.shadow),
      child: Material(
        color: color ?? Colors.white,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
      ),
    );
  }
}

/// A rounded square with an icon, used to lead cards and rows.
class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.color, this.background, this.size = 42});

  final IconData icon;
  final Color? color;
  final Color? background;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: background ?? BrandColors.accent.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(size * 0.32)),
        child: Icon(icon, size: size * 0.5, color: color ?? BrandColors.primary),
      );
}

/// A white card with a title, as in the prototype's Settings tab.
class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.title, this.badge, this.subtitle, this.icon, required this.children});

  final String title;
  final Widget? badge;
  final String? subtitle;
  final IconData? icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AppCard(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                if (icon != null) ...[IconTile(icon!, size: 38), const SizedBox(width: 12)],
                Expanded(child: Text(title, style: Ui.display(18, weight: FontWeight.w700))),
                ?badge,
              ],
            ),
            if (subtitle != null) ...[const SizedBox(height: 6), Text(subtitle!, style: TextStyle(color: BrandColors.muted, height: 1.4, fontSize: 14))],
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }
}

/// A small rounded tag, like "Live", "Pro" or "Sold out".
class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.color, this.textColor});

  final String text;
  final Color? color;
  final Color? textColor;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
    decoration: BoxDecoration(color: color ?? BrandColors.accent.withValues(alpha: 0.24), borderRadius: BorderRadius.circular(99)),
    child: Text(
      text,
      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, letterSpacing: 0.2, color: textColor ?? BrandColors.ink),
    ),
  );
}

/// "3.50 JD": two decimals, or three when the price needs them.
String formatPrice(AppLocalizations t, double price, String currencyCode) {
  var text = price.toStringAsFixed(3);
  if (text.endsWith('0')) text = text.substring(0, text.length - 1);
  return t.priceIn(text, currencyCode == 'JOD' ? t.currencyJod : currencyCode);
}

/// A product photo, or a tinted tile with the first letter when there is none.
class ProductThumb extends StatelessWidget {
  const ProductThumb({super.key, required this.name, this.imageUrl, this.size = 52, this.radius = 12});

  final String name;
  final String? imageUrl;
  final double size;
  final double radius;

  static const _tints = [Color(0xFFE9D8B4), Color(0xFFDCE6C8), Color(0xFFF3D9C4), Color(0xFFE3DCEC), Color(0xFFD6E3E8), Color(0xFFF6DDB0)];

  @override
  Widget build(BuildContext context) {
    final tint = _tints[name.codeUnits.fold(0, (a, b) => a + b) % _tints.length];
    final letter = Container(
      color: name.trim().isEmpty ? BrandColors.paper : tint,
      alignment: Alignment.center,
      child: name.trim().isEmpty
          ? Icon(Icons.add_a_photo_outlined, size: size * 0.36, color: BrandColors.muted)
          : Text(name.characters.first.toUpperCase(), style: Ui.display(size * 0.4, color: BrandColors.ink.withValues(alpha: 0.62))),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox.square(
        dimension: size,
        child: imageUrl == null || imageUrl!.isEmpty ? letter : Image.network(imageUrl!, fit: BoxFit.cover, errorBuilder: (_, _, _) => letter),
      ),
    );
  }
}

/// Picks a photo from the library, shrinks it and returns its bytes and file name, or null when cancelled.
Future<({Uint8List bytes, String name})?> pickPhoto() async {
  final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1600, maxHeight: 1600, imageQuality: 82);
  if (file == null) return null;
  return (bytes: await file.readAsBytes(), name: file.name);
}

/// The message to show for a failed call.
String errorText(AppLocalizations t, Object error) {
  final e = ApiError.from(error);
  if (e.isNetwork) return t.errNetwork;
  return e.summary ?? t.errGeneric;
}

/// Opens a bottom sheet that scrolls with the keyboard, like the prototype's sheets.
Future<T?> showFormSheet<T>(BuildContext context, Widget Function(BuildContext) builder) => showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  builder: (context) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
    child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), child: builder(context)),
  ),
);

/// A secondary button with a light border.
class LightButton extends StatelessWidget {
  const LightButton({super.key, required this.label, required this.onPressed, this.danger = false, this.icon});

  final String label;
  final VoidCallback? onPressed;
  final bool danger;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final color = danger ? BrandColors.highlight : BrandColors.ink;
    final style = OutlinedButton.styleFrom(
      foregroundColor: color,
      backgroundColor: danger ? BrandColors.highlight.withValues(alpha: 0.06) : Colors.white,
      side: BorderSide(color: danger ? BrandColors.highlight.withValues(alpha: 0.4) : BrandColors.line),
      minimumSize: const Size(0, 48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    );
    return icon == null
        ? OutlinedButton(style: style, onPressed: onPressed, child: Text(label))
        : OutlinedButton.icon(style: style, onPressed: onPressed, icon: Icon(icon, size: 18), label: Text(label));
  }
}

/// The brand name in the display font with an accent dot, as on the prototype's splash.
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.onDark = false, this.size = 24});

  final bool onDark;
  final double size;

  @override
  Widget build(BuildContext context) {
    final arabic = Localizations.localeOf(context).languageCode == 'ar' && Brand.brandNameAr.isNotEmpty;
    return Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
      Text(arabic ? Brand.brandNameAr : Brand.brandName, style: Ui.display(size, color: onDark ? Colors.white : BrandColors.ink)),
      Container(
        width: size * 0.26,
        height: size * 0.26,
        margin: EdgeInsets.only(bottom: size * 0.16, left: 2, right: 2),
        decoration: BoxDecoration(color: onDark ? BrandColors.accent : BrandColors.highlight, shape: BoxShape.circle),
      ),
    ]);
  }
}
