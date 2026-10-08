import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand.dart';
import '../../../core/theme.dart';
import '../../../core/widgets/ui.dart';
import '../../../l10n/generated/app_localizations.dart';

/// First screen for signed-out owners: three slides on what the app does, with sign-up and log-in always in reach.
class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  final _pages = PageController();
  int _page = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_pages.hasClients) return;
      _pages.animateToPage((_page + 1) % 3, duration: const Duration(milliseconds: 600), curve: Curves.easeOutCubic);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final slides = [
      (art: const _MenuArt(), title: t.onbItemsTitle, body: t.onbItemsBody),
      (art: const _TemplatesArt(), title: t.onbTemplatesTitle, body: t.onbTemplatesBody),
      (art: const _ShareArt(), title: t.onbShareTitle, body: t.onbShareBody),
    ];
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: BrandColors.primary,
        body: DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const AlignmentDirectional(0.9, -0.85).resolve(Directionality.of(context)),
              radius: 1.1,
              colors: [BrandColors.primary2, BrandColors.primary],
            ),
          ),
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Padding(padding: EdgeInsets.fromLTRB(24, 16, 24, 0), child: Wordmark(onDark: true)),
                Expanded(
                  child: PageView.builder(
                    controller: _pages,
                    itemCount: slides.length,
                    onPageChanged: (i) {
                      setState(() => _page = i);
                    },
                    itemBuilder: (context, i) => _Slide(art: slides[i].art, title: slides[i].title, body: slides[i].body),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (var i = 0; i < slides.length; i++)
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: i == _page ? 22 : 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: i == _page ? BrandColors.accent : Colors.white.withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(9),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 22),
                      FilledButton(
                        style: FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary),
                        onPressed: () => context.go('/signup'),
                        child: Text(t.createAccount),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        style: TextButton.styleFrom(foregroundColor: Colors.white, minimumSize: const Size.fromHeight(48)),
                        onPressed: () => context.go('/login'),
                        child: Text(t.logIn),
                      ),
                    ],
                  ),
                ),
              ],
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
          Expanded(child: Center(child: art)),
          Text(title, style: Ui.display(30, color: Colors.white)),
          const SizedBox(height: 12),
          Text(body, style: TextStyle(color: Colors.white.withValues(alpha: 0.72), fontSize: 15.5, height: 1.5)),
          const SizedBox(height: 26),
        ],
      ),
    );
  }
}

/// Slide 1: a small menu card with three items and an "Add item" button.
class _MenuArt extends StatelessWidget {
  const _MenuArt();

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final items = [
      (t.sampleItem1, t.sampleItem1Note, '3.50', Icons.coffee_rounded, const Color(0xFFB9824F)),
      (t.sampleItem2, t.sampleItem2Note, '2.25', Icons.bakery_dining_rounded, const Color(0xFF8DA35A)),
      (t.sampleItem3, t.sampleItem3Note, '4.00', Icons.cake_rounded, const Color(0xFFE0A33C)),
    ];
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 290,
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: Ui.lift),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(t.sampleCafe, style: Ui.display(17, weight: FontWeight.w700)),
                  ),
                  _Tag(t.sampleDrinks),
                ],
              ),
              const SizedBox(height: 12),
              for (final (name, note, price, icon, color) in items)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(color: color.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(12)),
                        child: Icon(icon, color: color, size: 22),
                      ),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
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
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        PositionedDirectional(
          end: -14,
          bottom: -18,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: BrandColors.accent, borderRadius: BorderRadius.circular(99), boxShadow: Ui.lift),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add_rounded, size: 18, color: BrandColors.primary),
                const SizedBox(width: 4),
                Text(
                  t.addItem,
                  style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.primary, fontSize: 13.5),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Slide 2: three fanned website cards in different looks.
class _TemplatesArt extends StatelessWidget {
  const _TemplatesArt();

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    Widget site(Color bg, Color hero, Color ink, double angle, Offset shift) => Transform.translate(
      offset: shift,
      child: Transform.rotate(
        angle: angle,
        child: Container(
          width: 150,
          height: 230,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20), boxShadow: Ui.lift),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 96,
                decoration: BoxDecoration(color: hero, borderRadius: BorderRadius.circular(12)),
              ),
              const SizedBox(height: 10),
              for (final w in [90.0, 120.0, 70.0, 110.0, 80.0])
                Container(
                  width: w,
                  height: 8,
                  margin: const EdgeInsets.only(bottom: 9),
                  decoration: BoxDecoration(color: ink.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(4)),
                ),
            ],
          ),
        ),
      ),
    );
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 320,
          height: 260,
          child: Stack(
            alignment: Alignment.center,
            children: [
              site(const Color(0xFFF6DDD3), const Color(0xFF7A3E8E), const Color(0xFF3B1B45), -0.16, const Offset(-82, 14)),
              site(const Color(0xFF1C1C1C), const Color(0xFFE2572B), Colors.white, 0.16, const Offset(82, 14)),
              site(Colors.white, BrandColors.highlight, BrandColors.ink, 0, Offset.zero),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _Tag(t.templateOf('001'), dark: true),
      ],
    );
  }
}

/// Slide 3: the site link with the places it gets shared.
class _ShareArt extends StatelessWidget {
  const _ShareArt();

  @override
  Widget build(BuildContext context) {
    final round = [Icons.qr_code_2_rounded, Icons.chat_rounded, Icons.photo_camera_rounded];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99), boxShadow: Ui.lift),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 9,
                height: 9,
                decoration: const BoxDecoration(color: BrandColors.live, shape: BoxShape.circle),
              ),
              const SizedBox(width: 10),
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(text: '${Brand.domain}/'),
                    TextSpan(
                      text: 'yourname',
                      style: TextStyle(color: BrandColors.highlight),
                    ),
                  ],
                ),
                textDirection: TextDirection.ltr,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final icon in round)
              Container(
                width: 64,
                height: 64,
                margin: const EdgeInsets.symmetric(horizontal: 9),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
                ),
                child: Icon(icon, color: BrandColors.accent, size: 28),
              ),
          ],
        ),
      ],
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag(this.text, {this.dark = false});

  final String text;
  final bool dark;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: dark ? Colors.white.withValues(alpha: 0.1) : BrandColors.accent.withValues(alpha: 0.24),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Text(
      text.toUpperCase(),
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: dark ? Colors.white : BrandColors.ink),
    ),
  );
}
