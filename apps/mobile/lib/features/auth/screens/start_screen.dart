import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand.dart';
import '../../../core/theme.dart';
import '../../../core/widgets/language_picker.dart';
import '../../../core/widgets/ui.dart';
import '../../../l10n/generated/app_localizations.dart';

/// Onboarding, the first screen for signed-out owners: three slides showing real screenshots of the app and
/// of a website (assets/onboarding, English and Arabic), then "Get started" opens sign-up. Skip and log in are always in reach.
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
      (art: _ItemsArt(active: _page == 0), title: t.onbItemsTitle, body: t.onbItemsBody),
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
                padding: const EdgeInsetsDirectional.fromSTEB(24, 10, 12, 0),
                child: Row(
                  children: [
                    // Shrinks rather than overflows on narrow phones, next to the language button and Skip.
                    const Flexible(
                      child: FittedBox(fit: BoxFit.scaleDown, alignment: AlignmentDirectional.centerStart, child: Wordmark(size: 22)),
                    ),
                    const Spacer(),
                    // Choose the language before signing up; sign-up sends it as the site's language.
                    const LanguageToggle(),
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
          Expanded(child: art),
          const SizedBox(height: 8),
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
/// When the system asks for less motion, the slide shows its end state right away.
mixin _PlayOnActive<T extends StatefulWidget> on State<T>, SingleTickerProviderStateMixin<T> {
  late final play = AnimationController(vsync: this, duration: playDuration);
  bool _started = false;

  /// True when animations are turned off (MediaQuery.disableAnimations).
  bool still = false;

  Duration get playDuration;
  bool get active;

  /// Called when the slide becomes current, after the animation restarts.
  void onShown() {}

  /// Called when the slide stops being current.
  void onHidden() {}

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    still = MediaQuery.disableAnimationsOf(context);
    if (!_started) {
      _started = true;
      if (active) _show();
    }
  }

  void _show() {
    still ? play.value = 1 : play.forward(from: 0);
    onShown();
  }

  void checkActive(bool was) {
    if (active && !was) {
      _show();
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
    if (still) return 1;
    final total = playDuration.inMilliseconds;
    final v = ((play.value * total - startMs) / ms).clamp(0.0, 1.0);
    return curve.transform(v);
  }
}

const _spring = Cubic(0.2, 1.5, 0.4, 1);

/// The screenshots' size in logical pixels (a 390 × 844 phone); the top 50 are the status bar.
const _shotSize = Size(390, 844);
const _shotStatusBar = 50.0;

/// A real screenshot of the product inside a phone that rises into view, cut off by a soft fade at the bottom.
/// [overlays] are positioned in the slide's picture area, on top of the phone.
class _PhoneScene extends StatelessWidget {
  const _PhoneScene({required this.shot, required this.rise, this.lightStatusBar = false, this.overlays = const []});

  /// The picture's base name in assets/onboarding (an English and an Arabic version exist).
  final String shot;

  /// The entrance, from 0 (below and transparent) to 1 (in place).
  final double rise;

  /// White status bar text, for screenshots with a dark top.
  final bool lightStatusBar;
  final List<Widget> overlays;

  @override
  Widget build(BuildContext context) {
    final lang = Localizations.localeOf(context).languageCode == 'ar' ? 'ar' : 'en';
    return LayoutBuilder(
      builder: (context, area) {
        final phoneWidth = math.min(math.min(area.maxWidth * 0.74, 290.0), area.maxHeight * 0.62);
        final bezel = phoneWidth * 0.035;
        final screenWidth = phoneWidth - bezel * 2;
        final scale = screenWidth / _shotSize.width;
        final radius = phoneWidth * 0.15;
        final statusColor = lightStatusBar ? Colors.white : BrandColors.ink;
        final phone = Container(
          width: phoneWidth,
          height: _shotSize.height * scale + bezel * 2,
          padding: EdgeInsets.all(bezel),
          decoration: BoxDecoration(
            color: const Color(0xFF101814),
            borderRadius: BorderRadius.circular(radius),
            boxShadow: [BoxShadow(color: BrandColors.primary.withValues(alpha: 0.35), blurRadius: 50, offset: const Offset(0, 24), spreadRadius: -18)],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius - bezel),
            child: Stack(
              children: [
                Image.asset(
                  'assets/onboarding/${shot}_$lang.webp',
                  width: screenWidth,
                  height: _shotSize.height * scale,
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                  excludeFromSemantics: true,
                  gaplessPlayback: true,
                ),
                // The phone's status bar and camera cut-out, drawn over the screenshot's empty top.
                SizedBox(
                  height: _shotStatusBar * scale,
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24 * scale),
                    child: Directionality(
                      textDirection: TextDirection.ltr,
                      child: Row(
                        children: [
                          Text('9:41', style: TextStyle(fontFamily: AppFonts.body, fontWeight: FontWeight.w700, fontSize: 15 * scale, color: statusColor)),
                          const Spacer(),
                          Icon(Icons.signal_cellular_alt_rounded, size: 16 * scale, color: statusColor),
                          SizedBox(width: 4 * scale),
                          Icon(Icons.wifi_rounded, size: 16 * scale, color: statusColor),
                          SizedBox(width: 4 * scale),
                          Icon(Icons.battery_full_rounded, size: 17 * scale, color: statusColor),
                        ],
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.topCenter,
                  child: Container(
                    margin: EdgeInsets.only(top: 11 * scale),
                    width: 104 * scale,
                    height: 30 * scale,
                    decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(20 * scale)),
                  ),
                ),
              ],
            ),
          ),
        );
        return Stack(
          children: [
            Positioned.fill(
              child: ClipRect(
                child: ShaderMask(
                  blendMode: BlendMode.dstIn,
                  shaderCallback: (rect) => const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.white, Colors.white, Colors.transparent],
                    stops: [0, 0.82, 1],
                  ).createShader(rect),
                  child: Opacity(
                    opacity: rise,
                    child: Transform.translate(
                      offset: Offset(0, 36 * (1 - rise)),
                      child: OverflowBox(
                        alignment: Alignment.topCenter,
                        minWidth: 0,
                        minHeight: 0,
                        maxHeight: double.infinity,
                        child: Padding(padding: const EdgeInsets.only(top: 8), child: phone),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            ...overlays,
          ],
        );
      },
    );
  }
}

/// A small floating label over the phone that pops in.
class _Chip extends StatelessWidget {
  const _Chip({required this.child, required this.pop, this.color = Colors.white, this.alignment = AlignmentDirectional.center});

  final Widget child;
  final double pop;
  final Color color;
  final AlignmentDirectional alignment;

  @override
  Widget build(BuildContext context) => Transform.scale(
    scale: pop,
    alignment: alignment.resolve(Directionality.of(context)),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [BoxShadow(color: Color(0x33152A1F), blurRadius: 24, offset: Offset(0, 10), spreadRadius: -8)],
      ),
      child: child,
    ),
  );
}

/// Slide 1: the real product list rises in, then a "Saves go live instantly" note pops up beside it.
class _ItemsArt extends StatefulWidget {
  const _ItemsArt({required this.active});

  final bool active;

  @override
  State<_ItemsArt> createState() => _ItemsArtState();
}

class _ItemsArtState extends State<_ItemsArt> with SingleTickerProviderStateMixin, _PlayOnActive {
  @override
  Duration get playDuration => const Duration(milliseconds: 1100);

  @override
  bool get active => widget.active;

  @override
  void didUpdateWidget(_ItemsArt old) {
    super.didUpdateWidget(old);
    checkActive(old.active);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AnimatedBuilder(
      animation: play,
      builder: (context, _) => _PhoneScene(
        shot: 'products',
        rise: at(0, 650),
        overlays: [
          PositionedDirectional(
            end: 0,
            bottom: 18,
            child: _Chip(
              pop: at(600, 500, _spring),
              alignment: AlignmentDirectional.bottomEnd,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(color: Color(0xFF2EA863), shape: BoxShape.circle),
                    child: const Icon(Icons.check_rounded, size: 15, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  Text(t.savesGoLive, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.ink, fontSize: 13.5)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Slide 2: the real template gallery rises in while a counter runs up to 100.
class _TemplatesArt extends StatefulWidget {
  const _TemplatesArt({required this.active});

  final bool active;

  @override
  State<_TemplatesArt> createState() => _TemplatesArtState();
}

class _TemplatesArtState extends State<_TemplatesArt> with SingleTickerProviderStateMixin, _PlayOnActive {
  @override
  Duration get playDuration => const Duration(milliseconds: 1800);

  @override
  bool get active => widget.active;

  @override
  void didUpdateWidget(_TemplatesArt old) {
    super.didUpdateWidget(old);
    checkActive(old.active);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AnimatedBuilder(
      animation: play,
      builder: (context, _) {
        final number = 1 + (99 * at(400, 1400, Curves.easeOutQuart)).round();
        return _PhoneScene(
          shot: 'templates',
          rise: at(0, 650),
          overlays: [
            PositionedDirectional(
              end: 0,
              bottom: 34,
              child: _Chip(
                pop: at(300, 500, _spring),
                alignment: AlignmentDirectional.bottomEnd,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome_mosaic_rounded, size: 17, color: BrandColors.highlight),
                    const SizedBox(width: 8),
                    Text(
                      t.templateOf(number.toString().padLeft(3, '0')),
                      style: Ui.display(14, weight: FontWeight.w700).copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Slide 3: a real website rises in; its link types itself out and switches to a custom domain on Pro,
/// and the two plans float beside it.
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
  Duration get playDuration => const Duration(milliseconds: 1200);

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
    // Called from didChangeDependencies and didUpdateWidget too, where a build follows anyway.
    _custom = false;
    final total = _base.length + _name.length;
    if (still) {
      // No typing and no switching: the whole link stays put.
      _typed = total;
      return;
    }
    _typed = 0;
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

    Widget plan({required String name, required String price, required bool pro}) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          name.toUpperCase(),
          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: pro ? BrandColors.accent : BrandColors.muted),
        ),
        Text.rich(
          TextSpan(
            children: [
              TextSpan(text: price),
              TextSpan(
                text: ' ${t.perMonth}',
                style: TextStyle(fontFamily: AppFonts.body, fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 0, color: pro ? Colors.white70 : BrandColors.muted),
              ),
            ],
          ),
          style: Ui.display(20, color: pro ? Colors.white : BrandColors.ink).copyWith(letterSpacing: -0.5),
        ),
      ],
    );

    return AnimatedBuilder(
      animation: play,
      builder: (context, _) => LayoutBuilder(
        builder: (context, area) => _PhoneScene(
          shot: 'site',
          rise: at(0, 650),
          lightStatusBar: true,
          overlays: [
            PositionedDirectional(
              start: 0,
              top: area.maxHeight * 0.2,
              child: _Chip(
                pop: at(450, 500, _spring),
                alignment: AlignmentDirectional.centerStart,
                child: plan(name: t.planBasic, price: t.onbBasicPrice, pro: false),
              ),
            ),
            PositionedDirectional(
              end: 0,
              top: area.maxHeight * 0.38,
              child: _Chip(
                pop: at(600, 500, _spring),
                color: BrandColors.primary2,
                alignment: AlignmentDirectional.centerEnd,
                child: plan(name: t.planPro, price: t.onbProPrice, pro: true),
              ),
            ),
            PositionedDirectional(
              start: 8,
              end: 8,
              bottom: 26,
              child: Opacity(
                opacity: at(250, 450),
                child: Transform.translate(
                  offset: Offset(0, 12 * (1 - at(250, 450))),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 52),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: BrandColors.primary,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [BoxShadow(color: Color(0x55152A1F), blurRadius: 28, offset: Offset(0, 12), spreadRadius: -8)],
                    ),
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
                          if (!still) _Caret(color: BrandColors.accent),
                        ],
                      ),
                    ),
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
    child: Container(width: 2, height: 18, margin: const EdgeInsetsDirectional.only(start: 1), color: widget.color),
  );
}
