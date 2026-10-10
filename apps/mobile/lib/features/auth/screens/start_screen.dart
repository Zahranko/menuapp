import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand.dart';
import '../../../core/theme.dart';
import '../../../core/widgets/ui.dart';
import '../../../l10n/generated/app_localizations.dart';

/// Onboarding, the first screen for signed-out owners: three animated slides on what the app does,
/// then "Get started" opens sign-up. Skip and log in are always in reach.
class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  final _pages = PageController();
  int _page = 0;

  static const _count = 3;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  void _next() {
    if (_page == _count - 1) return context.go('/signup');
    _pages.animateToPage(_page + 1, duration: const Duration(milliseconds: 550), curve: const Cubic(0.2, 0.8, 0.2, 1));
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final last = _page == _count - 1;
    final slides = [
      (art: _MenuArt(active: _page == 0), title: t.onbItemsTitle, body: t.onbItemsBody),
      (art: _TemplatesArt(active: _page == 1), title: t.onbTemplatesTitle, body: t.onbTemplatesBody),
      (art: _LinkArt(active: _page == 2), title: t.onbShareTitle, body: t.onbShareBody),
    ];
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: BrandColors.paper,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 10, 12, 0),
                child: Row(
                  children: [
                    const Wordmark(size: 22),
                    const Spacer(),
                    AnimatedOpacity(
                      opacity: last ? 0 : 1,
                      duration: const Duration(milliseconds: 250),
                      child: TextButton(
                        style: TextButton.styleFrom(foregroundColor: BrandColors.muted),
                        onPressed: last ? null : () => context.go('/signup'),
                        child: Text(t.skip),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pages,
                  itemCount: _count,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (context, i) => _Slide(art: slides[i].art, title: slides[i].title, body: slides[i].body),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 6),
                child: Row(
                  children: [
                    for (var i = 0; i < _count; i++)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeOutCubic,
                        margin: const EdgeInsetsDirectional.only(end: 6),
                        width: i == _page ? 26 : 8,
                        height: 8,
                        decoration: BoxDecoration(color: i == _page ? BrandColors.primary : BrandColors.line, borderRadius: BorderRadius.circular(8)),
                      ),
                    const Spacer(),
                    _NextButton(label: last ? t.getStarted : null, tooltip: t.next, onPressed: _next),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(t.haveAccount, style: TextStyle(color: BrandColors.muted, fontSize: 14)),
                    TextButton(onPressed: () => context.go('/login'), child: Text(t.logIn)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The round arrow button that grows into "Get started" on the last slide.
class _NextButton extends StatelessWidget {
  const _NextButton({required this.label, required this.tooltip, required this.onPressed});

  final String? label;
  final String tooltip;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label ?? tooltip,
      child: Material(
        color: BrandColors.primary,
        shape: const StadiumBorder(),
        clipBehavior: Clip.antiAlias,
        elevation: 0,
        child: InkWell(
          key: const Key('onboardingNext'),
          onTap: onPressed,
          child: AnimatedSize(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            child: Container(
              height: 56,
              constraints: const BoxConstraints(minWidth: 56),
              padding: EdgeInsets.symmetric(horizontal: label == null ? 0 : 22),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (label != null) ...[
                    Text(
                      label!,
                      style: const TextStyle(fontFamily: AppFonts.body, color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15.5),
                    ),
                    const SizedBox(width: 10),
                  ],
                  // Points the reading direction: the icon mirrors itself in Arabic.
                  const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 22),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Slide extends StatelessWidget {
  const _Slide({required this.art, required this.title, required this.body});

  final Widget art;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Center(
              child: FittedBox(fit: BoxFit.scaleDown, child: art),
            ),
          ),
          const SizedBox(height: 16),
          Text(title, style: Ui.display(31)),
          const SizedBox(height: 12),
          Text(body, style: TextStyle(color: BrandColors.muted, fontSize: 15.5, height: 1.5)),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

/// Runs a one-shot animation each time its slide becomes the current one.
mixin _PlayOnActive<T extends StatefulWidget> on State<T>, SingleTickerProviderStateMixin<T> {
  late final play = AnimationController(vsync: this, duration: playDuration);

  Duration get playDuration;
  bool get active;

  /// Called when the slide becomes current, after the animation restarts.
  void onShown() {}

  /// Called when the slide stops being current.
  void onHidden() {}

  @override
  void initState() {
    super.initState();
    if (active) {
      play.forward();
      onShown();
    }
  }

  void checkActive(bool was) {
    if (active && !was) {
      play.forward(from: 0);
      onShown();
    } else if (!active && was) {
      onHidden();
    }
  }

  @override
  void dispose() {
    onHidden();
    play.dispose();
    super.dispose();
  }

  /// A step of the slide's animation, from [startMs] for [ms] milliseconds.
  double at(int startMs, int ms, [Curve curve = Curves.easeOutCubic]) {
    final total = playDuration.inMilliseconds;
    final v = ((play.value * total - startMs) / ms).clamp(0.0, 1.0);
    return curve.transform(v);
  }
}

const _spring = Cubic(0.2, 1.5, 0.4, 1);

/// Slide 1: a café menu whose rows slide in, then an "Add item" button pops up.
class _MenuArt extends StatefulWidget {
  const _MenuArt({required this.active});

  final bool active;

  @override
  State<_MenuArt> createState() => _MenuArtState();
}

class _MenuArtState extends State<_MenuArt> with SingleTickerProviderStateMixin, _PlayOnActive {
  @override
  Duration get playDuration => const Duration(milliseconds: 1100);

  @override
  bool get active => widget.active;

  @override
  void didUpdateWidget(_MenuArt old) {
    super.didUpdateWidget(old);
    checkActive(old.active);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final items = [
      (t.sampleItem1, t.sampleItem1Note, '3.50', Icons.coffee_rounded, const Color(0xFFB98A5C), Colors.white),
      (t.sampleItem2, t.sampleItem2Note, '2.25', Icons.bakery_dining_rounded, const Color(0xFFDCE6C8), const Color(0xFF9A6A2E)),
      (t.sampleItem3, t.sampleItem3Note, '4.00', Icons.cake_rounded, const Color(0xFFF6DDB0), BrandColors.highlight),
    ];
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return AnimatedBuilder(
      animation: play,
      builder: (context, _) => Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 290,
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [BoxShadow(color: BrandColors.primary.withValues(alpha: 0.33), blurRadius: 60, offset: const Offset(0, 30), spreadRadius: -30)],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(t.sampleCafe, style: Ui.display(18, weight: FontWeight.w700)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                      decoration: BoxDecoration(color: BrandColors.accent.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                      child: Text(
                        t.sampleDrinks.toUpperCase(),
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.6, color: Color(0xFF8A5D00)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                for (final (i, (name, note, price, icon, bg, fg)) in items.indexed)
                  Opacity(
                    opacity: at(i * 150, 500),
                    child: Transform.translate(
                      offset: Offset((rtl ? 10 : -10) * (1 - at(i * 150, 500)), 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          border: Border(top: BorderSide(color: BrandColors.hairline)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
                              child: Icon(icon, color: fg, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: BrandColors.ink),
                                  ),
                                  Text(
                                    note,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(color: BrandColors.muted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              price,
                              textDirection: TextDirection.ltr,
                              style: Ui.display(15, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          PositionedDirectional(
            end: -12,
            bottom: -18,
            child: Transform.scale(
              scale: at(600, 500, _spring),
              alignment: rtl ? Alignment.bottomLeft : Alignment.bottomRight,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
                decoration: BoxDecoration(
                  color: BrandColors.accent,
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: const [BoxShadow(color: Color(0x888A5D00), blurRadius: 24, offset: Offset(0, 12), spreadRadius: -10)],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add_rounded, size: 16, color: BrandColors.primary),
                    const SizedBox(width: 6),
                    Text(
                      t.addItem,
                      style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.primary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Slide 2: three website templates fan out; the middle one changes color and the counter runs through 100.
class _TemplatesArt extends StatefulWidget {
  const _TemplatesArt({required this.active});

  final bool active;

  @override
  State<_TemplatesArt> createState() => _TemplatesArtState();
}

class _TemplatesArtState extends State<_TemplatesArt> with SingleTickerProviderStateMixin, _PlayOnActive {
  static const _swatches = [Color(0xFFD9542C), Color(0xFFF2B22E), Color(0xFF2B4D3D), Color(0xFF6C7FD1)];
  final _random = math.Random();
  Timer? _counter;
  Timer? _cycle;
  int _number = 1;
  int _swatch = 0;
  bool _touched = false;

  @override
  Duration get playDuration => const Duration(milliseconds: 700);

  @override
  bool get active => widget.active;

  @override
  void didUpdateWidget(_TemplatesArt old) {
    super.didUpdateWidget(old);
    checkActive(old.active);
  }

  @override
  void onShown() {
    _counter?.cancel();
    _cycle?.cancel();
    _counter = Timer.periodic(const Duration(milliseconds: 900), (_) {
      if (mounted) setState(() => _number = _number >= 100 ? 1 : math.min(100, _number + 1 + _random.nextInt(9)));
    });
    _cycle = Timer.periodic(const Duration(milliseconds: 1800), (_) {
      if (mounted && !_touched) setState(() => _swatch = (_swatch + 1) % _swatches.length);
    });
  }

  @override
  void onHidden() {
    _counter?.cancel();
    _cycle?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final soft = const Color(0xFFEFEDE2);
    final line = const Color(0xFFE3E1D4);
    Widget bar({double? width, double height = 6}) => Container(
      width: width,
      height: height,
      decoration: BoxDecoration(color: line, borderRadius: BorderRadius.circular(3)),
    );

    Widget card({required Color hero, required Widget body}) => Container(
      width: 150,
      height: 270,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5E3D6)),
        boxShadow: [BoxShadow(color: BrandColors.primary.withValues(alpha: 0.4), blurRadius: 50, offset: const Offset(0, 24), spreadRadius: -24)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            height: 84,
            color: hero,
            padding: const EdgeInsets.all(10),
            alignment: AlignmentDirectional.bottomStart,
            child: Container(
              width: 26,
              height: 26,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Color(0x22000000), blurRadius: 6, offset: Offset(0, 2))],
              ),
            ),
          ),
          Padding(padding: const EdgeInsets.all(10), child: body),
        ],
      ),
    );

    final rows = Column(
      children: [
        for (var i = 0; i < 4; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 7),
            child: Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(8)),
                ),
                const SizedBox(width: 7),
                Expanded(child: bar()),
              ],
            ),
          ),
      ],
    );
    final feature = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 90,
          decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(10)),
        ),
        const SizedBox(height: 7),
        bar(),
        const SizedBox(height: 7),
        bar(width: 70),
      ],
    );
    final grid = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var r = 0; r < 2; r++)
          Padding(
            padding: const EdgeInsets.only(bottom: 7),
            child: Row(
              children: [
                for (var c = 0; c < 2; c++) ...[
                  if (c == 1) const SizedBox(width: 7),
                  Expanded(
                    child: Container(
                      height: 58,
                      decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(9)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        bar(width: 70),
      ],
    );

    return AnimatedBuilder(
      animation: play,
      builder: (context, _) {
        final fan = at(0, 650, const Cubic(0.2, 0.8, 0.2, 1));
        final side = rtl ? -1.0 : 1.0;
        Widget fanned(Widget child, double dir) => Transform.translate(
          offset: Offset(96 * dir * side * fan, 0),
          child: Transform.rotate(
            angle: 8 * dir * side * math.pi / 180 * fan,
            child: Transform.scale(
              scale: 1 - 0.14 * fan,
              child: Opacity(opacity: 0.9, child: child),
            ),
          ),
        );
        return SizedBox(
          width: 320,
          height: 340,
          child: Stack(
            alignment: Alignment.topCenter,
            clipBehavior: Clip.none,
            children: [
              Positioned(
                top: 20,
                child: fanned(card(hero: const Color(0xFFC9D6B3), body: rows), -1),
              ),
              Positioned(
                top: 20,
                child: fanned(card(hero: const Color(0xFFE9D8B4), body: feature), 1),
              ),
              Positioned(
                top: 20,
                child: card(hero: _swatches[_swatch], body: grid),
              ),
              PositionedDirectional(
                top: 0,
                end: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: BrandColors.line),
                  ),
                  child: Text(
                    t.templateOf(_number.toString().padLeft(3, '0')),
                    style: Ui.display(13, color: BrandColors.muted, weight: FontWeight.w700).copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                child: Semantics(
                  label: t.onbHeroColor,
                  child: Row(
                    children: [
                      for (final (i, color) in _swatches.indexed)
                        GestureDetector(
                          onTap: () => setState(() {
                            _touched = true;
                            _swatch = i;
                          }),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 28,
                            height: 28,
                            margin: const EdgeInsets.symmetric(horizontal: 5),
                            transform: Matrix4.identity()..scaleByDouble(i == _swatch ? 1.1 : 1, i == _swatch ? 1.1 : 1, 1, 1),
                            transformAlignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: Border.all(color: BrandColors.paper, width: 3),
                              boxShadow: [BoxShadow(color: i == _swatch ? BrandColors.primary : BrandColors.line, spreadRadius: i == _swatch ? 2 : 1)],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Slide 3: the site link types itself out, switches to a custom domain on Pro, and the two plans sit below.
class _LinkArt extends StatefulWidget {
  const _LinkArt({required this.active});

  final bool active;

  @override
  State<_LinkArt> createState() => _LinkArtState();
}

class _LinkArtState extends State<_LinkArt> with SingleTickerProviderStateMixin, _PlayOnActive {
  static const _name = 'vanillamenu';
  Timer? _typing;
  int _typed = 0;
  bool _custom = false;

  @override
  Duration get playDuration => const Duration(milliseconds: 900);

  @override
  bool get active => widget.active;

  @override
  void didUpdateWidget(_LinkArt old) {
    super.didUpdateWidget(old);
    checkActive(old.active);
  }

  String get _base => '${Brand.domain}/';

  @override
  void onShown() => _type();

  void _type() {
    _typing?.cancel();
    // Called from initState and didUpdateWidget too, where a build follows anyway.
    _typed = 0;
    _custom = false;
    final total = _base.length + _name.length;
    _typing = Timer.periodic(const Duration(milliseconds: 55), (timer) {
      if (!mounted) return timer.cancel();
      if (_typed < total) return setState(() => _typed++);
      timer.cancel();
      _typing = Timer(const Duration(milliseconds: 1800), () {
        if (!mounted) return;
        setState(() => _custom = true);
        _typing = Timer(const Duration(milliseconds: 2600), () {
          if (mounted) setState(_type);
        });
      });
    });
  }

  @override
  void onHidden() => _typing?.cancel();

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final shown = (_base + _name).substring(0, math.min(_typed, _base.length + _name.length));
    final accent = TextStyle(color: BrandColors.accent);
    final url = _custom
        ? TextSpan(
            children: [
              TextSpan(text: '$_name.com', style: accent),
              TextSpan(
                text: '  · ${t.planPro}',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontWeight: FontWeight.w500),
              ),
            ],
          )
        : TextSpan(
            children: [
              TextSpan(text: shown.length > _base.length ? _base : shown),
              if (shown.length > _base.length) TextSpan(text: shown.substring(_base.length), style: accent),
            ],
          );

    Widget plan({required String name, required String price, required String note, required bool pro}) => Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: pro ? BrandColors.primary2 : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: pro ? BrandColors.primary2 : BrandColors.line),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              name.toUpperCase(),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: pro ? BrandColors.accent : BrandColors.muted),
            ),
            const SizedBox(height: 4),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: price),
                  TextSpan(
                    text: ' ${t.perMonth}',
                    style: TextStyle(
                      fontFamily: AppFonts.body,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0,
                      color: pro ? Colors.white70 : BrandColors.muted,
                    ),
                  ),
                ],
              ),
              style: Ui.display(28, color: pro ? Colors.white : BrandColors.ink).copyWith(letterSpacing: -0.8),
            ),
            const SizedBox(height: 4),
            Text(note, style: TextStyle(fontSize: 12.5, height: 1.35, color: pro ? Colors.white70 : BrandColors.muted)),
          ],
        ),
      ),
    );

    return AnimatedBuilder(
      animation: play,
      builder: (context, _) => SizedBox(
        width: 300,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Opacity(
              opacity: at(0, 400),
              child: Transform.translate(
                offset: Offset(0, 12 * (1 - at(0, 400))),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 52),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(color: BrandColors.primary, borderRadius: BorderRadius.circular(16)),
                  child: Directionality(
                    textDirection: TextDirection.ltr,
                    child: Row(
                      children: [
                        Icon(Icons.lock_outline_rounded, size: 16, color: Colors.white.withValues(alpha: 0.7)),
                        const SizedBox(width: 10),
                        Flexible(
                          child: Text.rich(
                            url,
                            maxLines: 1,
                            overflow: TextOverflow.clip,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                          ),
                        ),
                        _Caret(color: BrandColors.accent),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Opacity(
              opacity: at(250, 450),
              child: Transform.translate(
                offset: Offset(0, 16 * (1 - at(250, 450))),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      plan(name: t.planBasic, price: t.onbBasicPrice, note: t.onbBasicNote('${Brand.domain}/yourname'), pro: false),
                      const SizedBox(width: 10),
                      plan(name: t.planPro, price: t.onbProPrice, note: t.onbProNote, pro: true),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A blinking text caret.
class _Caret extends StatefulWidget {
  const _Caret({required this.color});

  final Color color;

  @override
  State<_Caret> createState() => _CaretState();
}

class _CaretState extends State<_Caret> {
  Timer? _blink;
  bool _on = true;

  @override
  void initState() {
    super.initState();
    // A timer, not a repeating animation, so screens with the caret still settle in tests.
    _blink = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (mounted) setState(() => _on = !_on);
    });
  }

  @override
  void dispose() {
    _blink?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Opacity(
    opacity: _on ? 1 : 0,
    child: Container(width: 2, height: 18, margin: const EdgeInsets.only(left: 1), color: widget.color),
  );
}
