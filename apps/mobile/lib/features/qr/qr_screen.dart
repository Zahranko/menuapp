import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../design/design_controller.dart';
import '../plan/plan_controller.dart';
import 'image_export.dart';
import 'qr_code.dart';

/// The website's QR code with the business logo and name: pick a dark color, keep the logo in the middle or not,
/// save it to the phone or share it, and the same as a poster to print.
class QrScreen extends ConsumerStatefulWidget {
  const QrScreen({super.key});

  /// Exported picture sizes: the code card 1200 pixels wide; the poster A5 at 300 dpi (1754 × 2480), which has
  /// the A4 shape too, so it prints sharp on either.
  static const cardWidth = 1200.0;
  static const posterWidth = 1754.0;
  static const posterSize = Size(420, 594);

  @override
  ConsumerState<QrScreen> createState() => _QrScreenState();
}

class _QrScreenState extends ConsumerState<QrScreen> {
  final _card = GlobalKey();
  final _poster = GlobalKey();
  int _color = 0;
  bool _withLogo = true;
  bool _busy = false;

  Future<void> _export(GlobalKey key, double width, String name, {required bool share, required String url, BuildContext? from}) async {
    final t = AppLocalizations.of(context);
    final exporter = ref.read(imageExporterProvider);
    final origin = from == null ? null : originOf(from);
    setState(() => _busy = true);
    try {
      final png = await capturePng(key, width: width);
      if (share) {
        await exporter.share(png, name, text: t.qrShareText(url), origin: origin);
      } else {
        await exporter.save(png, name);
        if (mounted) showMessage(context, t.qrSaved);
      }
    } catch (_) {
      if (mounted && !share) showMessage(context, t.qrSaveFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    if (auth is! SignedIn) return const SizedBox.shrink();
    final business = auth.business;
    final url = qrUrlFor(business, ref.watch(planProvider).value?.domainRequest);
    final logoUrl = ref.watch(siteProvider).value?.draft['logo'];
    final colors = qrColors();
    final color = colors[_color];
    final logo = BusinessLogo(name: business.name, imageUrl: logoUrl is String && logoUrl.startsWith('http') ? logoUrl : null);

    Widget actions(GlobalKey key, double width, String name) => Row(children: [
          Expanded(
            child: FilledButton.icon(
              key: Key('$name-save'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
              onPressed: _busy ? null : () => _export(key, width, name, share: false, url: url),
              icon: const Icon(Icons.download_rounded, size: 19),
              label: Text(t.qrSave, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Builder(
              builder: (button) => LightButton(
                key: Key('$name-share'),
                icon: Icons.ios_share_rounded,
                label: t.qrShare,
                onPressed: _busy ? null : () => _export(key, width, name, share: true, url: url, from: button),
              ),
            ),
          ),
        ]);

    return Scaffold(
      backgroundColor: BrandColors.canvas,
      appBar: AppBar(
        backgroundColor: BrandColors.canvas,
        leadingWidth: 68,
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 12),
          child: Center(
            child: RoundIconButton(
              icon: Icons.arrow_back_rounded,
              tooltip: MaterialLocalizations.of(context).backButtonTooltip,
              onPressed: () => context.canPop() ? context.pop() : context.go('/menu'),
            ),
          ),
        ),
        title: Text(t.qrCode, style: Ui.display(context, 20, weight: FontWeight.w700)),
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(Ui.gutter, 4, Ui.gutter, 32), children: [
        Text(t.qrTitle, style: Ui.display(context, 26)),
        const SizedBox(height: 6),
        Text(t.qrSub, style: TextStyle(color: BrandColors.muted, fontSize: 14.5, height: 1.4)),
        const SizedBox(height: 18),
        Center(
          child: RepaintBoundary(
            key: _card,
            child: QrCard(name: business.name, url: url, color: color, withLogo: _withLogo, logo: logo),
          ),
        ),
        const SizedBox(height: 18),
        Text(t.qrColor, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5, color: BrandColors.ink)),
        const SizedBox(height: 10),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final (i, c) in colors.indexed)
            Semantics(
              button: true,
              selected: i == _color,
              label: '${t.qrColor} ${i + 1}',
              child: GestureDetector(
                key: Key('qrColor$i'),
                onTap: () => setState(() => _color = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: c,
                    shape: BoxShape.circle,
                    border: Border.all(color: i == _color ? BrandColors.accent : Colors.white, width: 3),
                    boxShadow: Ui.shadow,
                  ),
                  child: i == _color ? const Icon(Icons.check_rounded, color: Colors.white, size: 20) : null,
                ),
              ),
            ),
        ]),
        const SizedBox(height: 8),
        SwitchListTile(
          key: const Key('qrLogo'),
          contentPadding: EdgeInsets.zero,
          title: Text(t.qrLogo),
          subtitle: Text(t.qrLogoHelp),
          value: _withLogo,
          onChanged: (v) => setState(() => _withLogo = v),
        ),
        const SizedBox(height: 8),
        actions(_card, QrScreen.cardWidth, 'qr'),
        const SizedBox(height: 24),
        SectionCard(
          title: t.qrPoster,
          icon: Icons.print_outlined,
          subtitle: t.qrPosterSub,
          children: [
            Center(
              child: Container(
                decoration: BoxDecoration(boxShadow: Ui.lift),
                child: FittedBox(
                  child: RepaintBoundary(
                    key: _poster,
                    child: QrPoster(business: business, url: url, color: color, withLogo: _withLogo, logo: logo),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            actions(_poster, QrScreen.posterWidth, 'poster'),
          ],
        ),
      ]),
    );
  }
}

/// The business logo (an uploaded picture) or, without one, its first letter on the brand gradient.
class BusinessLogo extends StatelessWidget {
  const BusinessLogo({super.key, required this.name, this.imageUrl});

  final String name;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final letter = Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [BrandColors.highlight, Color.lerp(BrandColors.highlight, BrandColors.accent, 0.45)!],
        ),
      ),
      child: FittedBox(
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Text(name.isEmpty ? '?' : name.characters.first.toUpperCase(), style: Ui.display(context, 22, color: Colors.white)),
        ),
      ),
    );
    if (imageUrl == null) return letter;
    return ColoredBox(
      color: Colors.white,
      child: Image.network(imageUrl!, fit: BoxFit.contain, errorBuilder: (_, _, _) => letter),
    );
  }
}

/// The code on a white card with the logo and name above and the address below: what "Save to phone" saves.
class QrCard extends StatelessWidget {
  const QrCard({super.key, required this.name, required this.url, required this.color, required this.withLogo, required this.logo});

  final String name;
  final String url;
  final Color color;
  final bool withLogo;
  final Widget logo;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: Ui.shadow),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          ClipRRect(borderRadius: BorderRadius.circular(10), child: SizedBox.square(dimension: 36, child: logo)),
          const SizedBox(width: 10),
          Flexible(
            child: Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, style: Ui.display(context, 19, color: color, weight: FontWeight.w700)),
          ),
        ]),
        const SizedBox(height: 12),
        QrView(key: const Key('qrView'), data: url, color: color, size: 240, withLogo: withLogo, logo: logo),
        const SizedBox(height: 8),
        Text(_display(url),
            textDirection: TextDirection.ltr,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: BrandColors.ink, fontWeight: FontWeight.w700, fontSize: 14)),
      ]),
    );
  }
}

String _display(String url) => url.replaceFirst(RegExp(r'^https?://'), '');

/// A printable poster: logo and name, "Scan for our menu" in the website's language with the other language below,
/// the code large in the middle and the address at the bottom. Always A-paper shaped (1 : √2).
class QrPoster extends StatelessWidget {
  const QrPoster({super.key, required this.business, required this.url, required this.color, required this.withLogo, required this.logo});

  final Business business;
  final String url;
  final Color color;
  final bool withLogo;
  final Widget logo;

  @override
  Widget build(BuildContext context) {
    final arabicSite = business.locale == 'ar';
    final main = lookupAppLocalizations(Locale(arabicSite ? 'ar' : 'en'));
    final other = lookupAppLocalizations(Locale(arabicSite ? 'en' : 'ar'));
    final mainDir = arabicSite ? TextDirection.rtl : TextDirection.ltr;
    final otherDir = arabicSite ? TextDirection.ltr : TextDirection.rtl;
    TextStyle display(double size, {Color? c, bool arabic = false}) => TextStyle(
          fontFamily: AppFonts.display,
          fontSize: size,
          fontWeight: FontWeight.w800,
          color: c ?? color,
          height: arabic ? 1.35 : 1.1,
          letterSpacing: arabic ? 0 : -0.4,
        );
    return Directionality(
      textDirection: mainDir,
      child: Container(
        key: const Key('qrPoster'),
        width: QrScreen.posterSize.width,
        height: QrScreen.posterSize.height,
        color: Colors.white,
        child: Column(children: [
          Container(height: 10, color: color),
          const SizedBox(height: 30),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              ClipRRect(borderRadius: BorderRadius.circular(12), child: SizedBox.square(dimension: 46, child: logo)),
              const SizedBox(width: 12),
              Flexible(child: Text(business.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(24, arabic: arabicSite))),
            ]),
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            // One line each, shrunk to fit if a font runs wide, so the code always keeps its size.
            child: Column(children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(main.posterScan, maxLines: 1, textDirection: mainDir, style: display(34, arabic: arabicSite)),
              ),
              const SizedBox(height: 4),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(other.posterScan,
                    maxLines: 1,
                    textDirection: otherDir,
                    style: display(19, c: BrandColors.muted, arabic: !arabicSite).copyWith(fontWeight: FontWeight.w700)),
              ),
            ]),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(22), border: Border.all(color: color, width: 3)),
            child: QrView(data: url, color: color, size: 252, withLogo: withLogo, logo: logo),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(main.posterScanHint,
                  maxLines: 1,
                  textDirection: mainDir,
                  style: TextStyle(fontFamily: AppFonts.body, fontSize: 14, color: BrandColors.muted, fontWeight: FontWeight.w500)),
            ),
          ),
          const Spacer(),
          Text(_display(url),
              textDirection: TextDirection.ltr,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontFamily: AppFonts.body, fontSize: 17, color: BrandColors.ink, fontWeight: FontWeight.w700)),
          const SizedBox(height: 26),
          Container(height: 10, color: color),
        ]),
      ),
    );
  }
}
