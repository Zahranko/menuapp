import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_error.dart';
import '../../core/currency.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../menu/catalog_controller.dart';
import 'ai_models.dart';
import 'ai_repository.dart';
import 'ai_widgets.dart';

/// "Add from a menu photo" on the Products tab. Hidden when the helper's status can't be read; dimmed with a note when it is off.
class AiMenuEntry extends ConsumerWidget {
  const AiMenuEntry({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final status = ref.watch(aiStatusProvider).value;
    if (status == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          AiActionRow(
            key: const Key('aiMenuFromPhoto'),
            icon: aiIcon,
            title: t.aiMenuFromPhoto,
            subtitle: t.aiMenuFromPhotoSub,
            onTap: status.usable ? () => openMenuFromPhotos(context) : null,
          ),
          const SizedBox(height: 10),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 4), child: AiStatusLine(status: status)),
        ]),
      ),
    );
  }
}

/// Picks up to 3 menu photos, reads them, then opens the review screen. Shows how many items were added.
Future<void> openMenuFromPhotos(BuildContext context) async {
  final draft = await showFormSheet<MenuDraft>(context, (_) => const _MenuPhotosSheet());
  if (draft == null || !context.mounted) return;
  final added = await Navigator.of(context).push<int>(MaterialPageRoute(builder: (_) => MenuReviewScreen(draft: draft)));
  if (added != null && added > 0 && context.mounted) showMessage(context, AppLocalizations.of(context).aiItemsAdded(added));
}

class _MenuPhotosSheet extends ConsumerStatefulWidget {
  const _MenuPhotosSheet();

  @override
  ConsumerState<_MenuPhotosSheet> createState() => _MenuPhotosSheetState();
}

class _MenuPhotosSheetState extends ConsumerState<_MenuPhotosSheet> {
  static const _max = 3;
  final _photos = <AiPhoto>[];
  late bool _arabic = switch (ref.read(authControllerProvider)) { SignedIn(:final business) => business.locale == 'ar', _ => false };
  bool _busy = false;
  String? _error;

  Future<void> _add({required bool camera}) async {
    final picker = ref.read(aiPhotoPickerProvider);
    final room = _max - _photos.length;
    final picked = camera ? [?await picker.one(camera: true)] : await picker.many(limit: room);
    if (mounted) setState(() => _photos.addAll(picked.take(room)));
  }

  Future<void> _read() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final draft = await ref.read(aiRepositoryProvider).menu(_photos, arabic: _arabic);
      if (mounted) Navigator.pop(context, draft);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(AppLocalizations.of(context), e));
    } finally {
      ref.invalidate(aiStatusProvider);
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    if (_busy) return MenuReading(photos: _photos);
    final room = _photos.length < _max;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [
        const AiBadge(),
        const SizedBox(width: 12),
        Expanded(child: Text(t.aiMenuFromPhoto, style: Ui.display(context, 24))),
      ]),
      const SizedBox(height: 6),
      Text(t.aiMenuFromPhotoSub, style: TextStyle(color: BrandColors.muted, height: 1.4)),
      const SizedBox(height: 18),
      Row(children: [
        Expanded(child: Text(t.aiMenuPhotos(_photos.length), style: Ui.eyebrow(context))),
        _PageDots(count: _photos.length, max: _max),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        for (var i = 0; i < _max; i++) ...[
          if (i > 0) const SizedBox(width: 10),
          Expanded(
            child: i < _photos.length
                ? _PhotoSlot(
                    photo: _photos[i],
                    page: i + 1,
                    removeLabel: t.aiRemovePhoto,
                    onRemove: () => setState(() => _photos.removeAt(i)),
                  )
                : _EmptySlot(page: i + 1, next: i == _photos.length),
          ),
        ],
      ]),
      if (room) ...[
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _SourceButton(icon: Icons.photo_camera_rounded, label: t.aiTakePhoto, onTap: () => _add(camera: true))),
          const SizedBox(width: 10),
          Expanded(child: _SourceButton(icon: Icons.photo_library_rounded, label: t.aiChoosePhoto, onTap: () => _add(camera: false))),
        ]),
      ],
      const SizedBox(height: 12),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(Icons.lightbulb_outline_rounded, size: 17, color: BrandColors.muted),
        const SizedBox(width: 6),
        Expanded(child: Text(t.aiPhotoTip, style: TextStyle(color: BrandColors.muted, fontSize: 12.5, height: 1.35))),
      ]),
      const SizedBox(height: 16),
      AiLanguageChoice(value: _arabic ? 'ar' : 'en', onChanged: (l) => setState(() => _arabic = l == 'ar')),
      if (_error != null) ...[const SizedBox(height: 12), AiNote(_error!, icon: Icons.error_outline_rounded)],
      const SizedBox(height: 18),
      FilledButton.icon(
        key: const Key('aiReadMenu'),
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
        onPressed: _photos.isEmpty ? null : _read,
        icon: const Icon(aiIcon),
        label: Text(t.aiReadMenu),
      ),
    ]);
  }
}

/// Three small bars that fill as photos are added.
class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.max});

  final int count;
  final int max;

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 0; i < max; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
            margin: const EdgeInsetsDirectional.only(start: 4),
            width: i < count ? 18 : 8,
            height: 6,
            decoration: BoxDecoration(color: i < count ? BrandColors.primary : BrandColors.line, borderRadius: BorderRadius.circular(99)),
          ),
      ]);
}

/// A chosen photo as a page: rounded, numbered, with a remove button.
class _PhotoSlot extends StatelessWidget {
  const _PhotoSlot({required this.photo, required this.page, required this.removeLabel, required this.onRemove});

  final AiPhoto photo;
  final int page;
  final String removeLabel;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) => AspectRatio(
        aspectRatio: 3 / 4,
        child: Container(
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), boxShadow: Ui.shadow),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(fit: StackFit.expand, children: [
              Image.memory(photo.bytes, fit: BoxFit.cover),
              const DecoratedBox(
                decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x00000000), Color(0x66000000)], stops: [0.55, 1])),
              ),
              PositionedDirectional(
                start: 8,
                bottom: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.92), borderRadius: BorderRadius.circular(99)),
                  child: Text('$page', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: BrandColors.ink)),
                ),
              ),
              PositionedDirectional(
                top: 4,
                end: 4,
                child: IconButton(
                  tooltip: removeLabel,
                  visualDensity: VisualDensity.compact,
                  iconSize: 16,
                  style: IconButton.styleFrom(backgroundColor: Colors.black.withValues(alpha: 0.45), foregroundColor: Colors.white),
                  onPressed: onRemove,
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
            ]),
          ),
        ),
      );
}

/// A free page: a dashed outline, stronger for the next one to fill.
class _EmptySlot extends StatelessWidget {
  const _EmptySlot({required this.page, required this.next});

  final int page;
  final bool next;

  @override
  Widget build(BuildContext context) => AspectRatio(
        aspectRatio: 3 / 4,
        child: CustomPaint(
          painter: _DashedBorder(color: next ? BrandColors.primary.withValues(alpha: 0.55) : BrandColors.line, radius: 16),
          child: Container(
            decoration: BoxDecoration(color: next ? BrandColors.tint : Colors.transparent, borderRadius: BorderRadius.circular(16)),
            alignment: Alignment.center,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(next ? Icons.add_photo_alternate_outlined : Icons.description_outlined, size: 24, color: next ? BrandColors.primary : BrandColors.line),
              const SizedBox(height: 4),
              Text('$page', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: next ? BrandColors.primary : BrandColors.muted.withValues(alpha: 0.6))),
            ]),
          ),
        ),
      );
}

class _DashedBorder extends CustomPainter {
  const _DashedBorder({required this.color, required this.radius});

  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    final path = Path()..addRRect(RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)).deflate(0.8));
    for (final metric in path.computeMetrics()) {
      for (var d = 0.0; d < metric.length; d += 10) {
        canvas.drawPath(metric.extractPath(d, d + 5), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorder old) => old.color != color || old.radius != radius;
}

/// "Take a photo" and "Choose from photos": two big, easy targets.
class _SourceButton extends StatelessWidget {
  const _SourceButton({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: BrandColors.tint,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: BrandColors.hairline)),
            child: Column(children: [
              IconTile(icon, size: 40),
              const SizedBox(height: 8),
              Text(label, textAlign: TextAlign.center, maxLines: 2, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: BrandColors.ink)),
            ]),
          ),
        ),
      );
}

/// While the helper reads: the photos fanned out with a scan line sweeping the top one, and the steps ticking off.
/// The steps follow a clock, not the server; the last one waits until the answer comes back.
class MenuReading extends StatefulWidget {
  const MenuReading({super.key, required this.photos});

  final List<AiPhoto> photos;

  @override
  State<MenuReading> createState() => _MenuReadingState();
}

class _MenuReadingState extends State<MenuReading> with SingleTickerProviderStateMixin {
  static const _stepEvery = Duration(milliseconds: 2600);
  late final _scan = AnimationController(vsync: this, duration: const Duration(milliseconds: 1700));
  Timer? _timer;
  int _step = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(_stepEvery, (timer) {
      if (_step >= 3) return timer.cancel();
      setState(() => _step++);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _scan.value = 0.5;
      _scan.stop();
    } else if (!_scan.isAnimating) {
      _scan.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scan.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final steps = [t.aiReadStepLook, t.aiReadStepSections, t.aiReadStepPrices, t.aiReadStepReady];
    final shown = widget.photos.take(3).toList();
    return Semantics(
      liveRegion: true,
      label: t.aiReadingMenu,
      child: Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          SizedBox(
            height: 210,
            child: Stack(alignment: Alignment.center, children: [
              Container(
                width: 230,
                height: 230,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [BrandColors.accent.withValues(alpha: 0.28), BrandColors.accent.withValues(alpha: 0)]),
                ),
              ),
              for (final (i, photo) in shown.indexed.toList().reversed)
                Transform.translate(
                  offset: Offset((i - (shown.length - 1) / 2) * 34, i == 0 ? 0 : 8),
                  child: Transform.rotate(
                    angle: (i - (shown.length - 1) / 2) * 0.12,
                    child: _ScanPage(photo: photo, scan: i == 0 ? _scan : null),
                  ),
                ),
            ]),
          ),
          const SizedBox(height: 18),
          Text(t.aiReadingMenu, textAlign: TextAlign.center, style: Ui.display(context, 22)),
          const SizedBox(height: 4),
          Text(t.aiTakesAMoment, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted, fontSize: 13.5)),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(color: BrandColors.tint, borderRadius: BorderRadius.circular(18), border: Border.all(color: BrandColors.hairline)),
            child: Column(children: [
              for (final (i, label) in steps.indexed) _StepRow(label: label, state: i < _step ? 2 : (i == _step ? 1 : 0)),
            ]),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(minHeight: 4, color: BrandColors.primary, backgroundColor: BrandColors.line.withValues(alpha: 0.5)),
          ),
        ]),
      ),
    );
  }
}

/// One photo as a paper page; with [scan], viewfinder corners and a glowing line that sweeps it.
class _ScanPage extends StatelessWidget {
  const _ScanPage({required this.photo, this.scan});

  final AiPhoto photo;
  final Animation<double>? scan;

  @override
  Widget build(BuildContext context) {
    const w = 128.0, h = 170.0;
    final glow = BrandColors.accent;
    return Container(
      width: w,
      height: h,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.16), blurRadius: 18, offset: const Offset(0, 8))],
      ),
      padding: const EdgeInsets.all(4),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Stack(fit: StackFit.expand, children: [
          Image.memory(photo.bytes, fit: BoxFit.cover),
          if (scan != null) ...[
            DecoratedBox(decoration: BoxDecoration(color: BrandColors.primary.withValues(alpha: 0.18))),
            AnimatedBuilder(
              animation: scan!,
              builder: (context, _) {
                final y = Curves.easeInOut.transform(scan!.value) * (h - 8);
                return Stack(children: [
                  // The part already read is clear; the rest stays tinted.
                  Positioned(
                    left: 0,
                    right: 0,
                    top: 0,
                    height: y,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [glow.withValues(alpha: 0), glow.withValues(alpha: 0.28)],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    top: y - 1.5,
                    height: 3,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: glow,
                        boxShadow: [BoxShadow(color: glow.withValues(alpha: 0.9), blurRadius: 12, spreadRadius: 1)],
                      ),
                    ),
                  ),
                ]);
              },
            ),
            const _Corners(),
          ],
        ]),
      ),
    );
  }
}

/// Four white viewfinder corners.
class _Corners extends StatelessWidget {
  const _Corners();

  @override
  Widget build(BuildContext context) {
    const side = BorderSide(color: Colors.white, width: 3);
    Widget corner(Alignment a) => Align(
          alignment: a,
          child: Container(
            width: 18,
            height: 18,
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border(
                top: a.y < 0 ? side : BorderSide.none,
                bottom: a.y > 0 ? side : BorderSide.none,
                left: a.x < 0 ? side : BorderSide.none,
                right: a.x > 0 ? side : BorderSide.none,
              ),
            ),
          ),
        );
    return Stack(children: [for (final a in const [Alignment.topLeft, Alignment.topRight, Alignment.bottomLeft, Alignment.bottomRight]) corner(a)]);
  }
}

/// A reading step: 0 waiting, 1 working, 2 done.
class _StepRow extends StatelessWidget {
  const _StepRow({required this.label, required this.state});

  final String label;
  final int state;

  @override
  Widget build(BuildContext context) {
    final mark = switch (state) {
      2 => Container(
          key: const ValueKey(2),
          width: 22,
          height: 22,
          decoration: BoxDecoration(color: BrandColors.primary, shape: BoxShape.circle),
          child: const Icon(Icons.check_rounded, size: 15, color: Colors.white),
        ),
      1 => SizedBox(key: const ValueKey(1), width: 22, height: 22, child: Padding(padding: const EdgeInsets.all(3), child: CircularProgressIndicator(strokeWidth: 2.4, color: BrandColors.primary))),
      _ => Container(
          key: const ValueKey(0),
          width: 22,
          height: 22,
          alignment: Alignment.center,
          child: Container(width: 8, height: 8, decoration: BoxDecoration(color: BrandColors.line, shape: BoxShape.circle)),
        ),
    };
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(children: [
        AnimatedSwitcher(duration: const Duration(milliseconds: 250), child: mark),
        const SizedBox(width: 12),
        Expanded(
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 250),
            style: DefaultTextStyle.of(context).style.copyWith(
              fontSize: 14.5,
              height: 1.3,
              fontWeight: state == 1 ? FontWeight.w700 : FontWeight.w500,
              color: state == 0 ? BrandColors.muted : BrandColors.ink,
            ),
            child: Text(label),
          ),
        ),
      ]),
    );
  }
}

/// The draft read from the photos: names and prices to correct, a tick per category and product, then "Add N items",
/// which adds them all at once. Pops with the number of products added.
class MenuReviewScreen extends ConsumerStatefulWidget {
  const MenuReviewScreen({super.key, required this.draft});

  final MenuDraft draft;

  @override
  ConsumerState<MenuReviewScreen> createState() => _MenuReviewScreenState();
}

class _MenuReviewScreenState extends ConsumerState<MenuReviewScreen> {
  final _nameErrors = <Object, String>{};
  final _priceErrors = <DraftProduct, String>{};
  bool _busy = false;

  List<DraftCategory> get _categories => widget.draft.categories;

  Currency get _currency => currencyFor(widget.draft.currencyCode.isNotEmpty
      ? widget.draft.currencyCode
      : switch (ref.read(authControllerProvider)) { SignedIn(:final business) => business.currencyCode, _ => defaultCurrencyCode });

  int get _count => _categories.where((c) => c.selected).fold(0, (n, c) => n + c.products.where((p) => p.selected).length);

  /// Each chosen category with its chosen products, in the API's shape.
  List<(DraftCategory, List<DraftProduct>)> get _chosen => [
        for (final c in _categories)
          if (c.selected && c.products.any((p) => p.selected)) (c, [for (final p in c.products) if (p.selected) p]),
      ];

  bool _validate(AppLocalizations t) {
    _nameErrors.clear();
    _priceErrors.clear();
    for (final (c, products) in _chosen) {
      if (c.name.trim().isEmpty) _nameErrors[c] = t.errCategoryName;
      for (final p in products) {
        if (p.name.trim().isEmpty) _nameErrors[p] = t.errProductName;
        if (p.price == null) _priceErrors[p] = t.errPrice;
      }
    }
    setState(() {});
    return _nameErrors.isEmpty && _priceErrors.isEmpty;
  }

  Future<void> _add() async {
    final t = AppLocalizations.of(context);
    if (_count == 0) return;
    if (!_validate(t)) return showMessage(context, t.aiFixHighlighted);
    final chosen = _chosen;
    setState(() => _busy = true);
    try {
      final added = await ref.read(aiRepositoryProvider).importCatalog([
        for (final (c, products) in chosen)
          {
            'name': c.name.trim(),
            'products': [
              for (final p in products) {'name': p.name.trim(), 'description': p.description?.trim(), 'price': p.price},
            ],
          },
      ]);
      await ref.read(catalogProvider.notifier).refresh();
      if (mounted) Navigator.pop(context, added);
    } on ApiError catch (e) {
      if (!mounted) return;
      _showFieldErrors(e, chosen);
      showMessage(context, e.fieldErrors.isEmpty ? errorText(t, e) : t.aiFixHighlighted);
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Puts the API's errors ("categories[0].products[2].price") on the matching fields.
  void _showFieldErrors(ApiError e, List<(DraftCategory, List<DraftProduct>)> sent) {
    final pattern = RegExp(r'^categories\[(\d+)\](?:\.products\[(\d+)\])?\.(\w+)$');
    setState(() {
      e.fieldErrors.forEach((key, message) {
        final m = pattern.firstMatch(key);
        if (m == null) return;
        final ci = int.parse(m.group(1)!);
        if (ci >= sent.length) return;
        final (category, products) = sent[ci];
        final pi = m.group(2) == null ? null : int.parse(m.group(2)!);
        final target = pi == null ? category : (pi < products.length ? products[pi] : null);
        if (target == null) return;
        if (m.group(3) == 'price' && target is DraftProduct) {
          _priceErrors[target] = message;
        } else {
          _nameErrors[target] = message;
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final existing = {for (final c in ref.watch(catalogProvider).value?.categories ?? const []) c.name.trim().toLowerCase()};
    final menuCurrency = widget.draft.menuCurrency;
    return Scaffold(
      appBar: AppBar(title: Text(t.aiReviewTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Ui.gutter, 4, Ui.gutter, 24),
        children: [
          Text(t.aiReviewSub, style: TextStyle(color: BrandColors.muted, height: 1.4)),
          const SizedBox(height: 10),
          AiNote(t.aiCheckBeforeUsing, icon: aiIcon),
          if (menuCurrency != null && menuCurrency != _currency.code) ...[
            const SizedBox(height: 8),
            AiNote(t.aiCurrencyDiffers(menuCurrency, _currency.code), icon: Icons.currency_exchange_rounded),
          ],
          for (final c in _categories)
            _CategoryCard(
              key: ObjectKey(c),
              category: c,
              exists: existing.contains(c.name.trim().toLowerCase()),
              currency: _currency,
              nameErrors: _nameErrors,
              priceErrors: _priceErrors,
              onChanged: () => setState(() {}),
            ),
        ],
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: BrandColors.hairline))),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: BusyButton(
              key: const Key('aiAddItems'),
              label: t.aiAddItems(_count),
              busyLabel: t.aiAdding,
              busy: _busy,
              onPressed: _add,
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    super.key,
    required this.category,
    required this.exists,
    required this.currency,
    required this.nameErrors,
    required this.priceErrors,
    required this.onChanged,
  });

  final DraftCategory category;

  /// The business already has a category with this name: the products join it.
  final bool exists;
  final Currency currency;
  final Map<Object, String> nameErrors;
  final Map<DraftProduct, String> priceErrors;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: AppCard(
        padding: const EdgeInsets.fromLTRB(8, 10, 14, 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(
              value: category.selected,
              semanticLabel: t.aiSelectCategory,
              onChanged: (v) {
                category.selected = v ?? false;
                for (final p in category.products) {
                  p.selected = category.selected;
                }
                onChanged();
              },
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _DraftText(
                  initial: category.name,
                  hint: t.categoryNameHint,
                  error: nameErrors[category],
                  bold: true,
                  onChanged: (v) {
                    category.name = v;
                    nameErrors.remove(category);
                    onChanged();
                  },
                ),
                const SizedBox(height: 4),
                Pill(exists ? t.aiExistingCategory : t.aiNewCategory),
              ]),
            ),
          ]),
          const Divider(height: 18),
          for (final p in category.products)
            _ProductRow(
              key: ObjectKey(p),
              product: p,
              enabled: category.selected,
              currency: currency,
              nameError: nameErrors[p],
              priceError: priceErrors[p],
              onChanged: () {
                nameErrors.remove(p);
                priceErrors.remove(p);
                if (p.selected) category.selected = true;
                onChanged();
              },
            ),
        ]),
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  const _ProductRow({
    super.key,
    required this.product,
    required this.enabled,
    required this.currency,
    required this.onChanged,
    this.nameError,
    this.priceError,
  });

  final DraftProduct product;
  final bool enabled;
  final Currency currency;
  final String? nameError;
  final String? priceError;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Checkbox(
          value: product.selected && enabled,
          semanticLabel: t.aiSelectItem,
          onChanged: (v) {
            product.selected = v ?? false;
            onChanged();
          },
        ),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _DraftText(
              initial: product.name,
              hint: t.productNameHint,
              error: nameError,
              onChanged: (v) {
                product.name = v;
                onChanged();
              },
            ),
            if (product.description != null && product.description!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(product.description!, style: TextStyle(color: BrandColors.muted, fontSize: 12.5, height: 1.3)),
              ),
          ]),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 96,
          child: _DraftText(
            initial: product.price == null ? '' : currency.inputText(product.price!),
            hint: currency.hint,
            error: priceError,
            number: true,
            onChanged: (v) {
              final text = v.trim().replaceAll(',', '.');
              product.price = currency.acceptsPrice(text) ? double.parse(text) : null;
              onChanged();
            },
          ),
        ),
      ]),
    );
  }
}

/// A compact text field that keeps its own controller and reports every change.
class _DraftText extends StatefulWidget {
  const _DraftText({required this.initial, required this.onChanged, this.hint, this.error, this.bold = false, this.number = false});

  final String initial;
  final ValueChanged<String> onChanged;
  final String? hint;
  final String? error;
  final bool bold;
  final bool number;

  @override
  State<_DraftText> createState() => _DraftTextState();
}

class _DraftTextState extends State<_DraftText> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        controller: _controller,
        onChanged: widget.onChanged,
        keyboardType: widget.number ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        textDirection: widget.number ? TextDirection.ltr : null,
        style: TextStyle(fontWeight: widget.bold ? FontWeight.w700 : FontWeight.w500, color: BrandColors.ink),
        decoration: InputDecoration(isDense: true, hintText: widget.hint, errorText: widget.error, errorMaxLines: 2),
      );
}
