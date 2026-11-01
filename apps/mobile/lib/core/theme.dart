import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'brand.dart';

/// Colors from brand.json, never from Dart constants (see CLAUDE.md, Brand).
abstract final class BrandColors {
  static Color get primary => Color(hexToArgb(Brand.colorPrimary));
  static Color get primary2 => Color(hexToArgb(Brand.colorPrimary2));
  static Color get accent => Color(hexToArgb(Brand.colorAccent));
  static Color get highlight => Color(hexToArgb(Brand.colorHighlight));
  static Color get paper => Color(hexToArgb(Brand.colorPaper));
  static Color get ink => Color(hexToArgb(Brand.colorInk));
  static Color get muted => Color(hexToArgb(Brand.colorMuted));
  static Color get line => Color(hexToArgb(Brand.colorLine));

  /// The app background: the brand paper, lifted a little so white cards still stand out softly.
  static Color get canvas => Color.lerp(paper, Colors.white, 0.45)!;

  /// A quiet fill for inputs, chips and icon tiles.
  static Color get tint => Color.lerp(paper, Colors.white, 0.1)!;

  /// Hairlines between rows inside a card.
  static Color get hairline => line.withValues(alpha: 0.6);

  /// Green for "live" and "available".
  static const live = Color(0xFF2FA866);
}

/// Font families by role. Each one carries the Arabic brand font too (see assets/fonts/README.md).
abstract final class AppFonts {
  static const display = 'Display';
  static const body = 'Body';
}

/// Spacing, corners and shadows shared by every screen.
abstract final class Ui {
  static const gutter = 20.0;
  static const radius = 20.0;
  static const radiusSmall = 14.0;

  static List<BoxShadow> get shadow => [
        BoxShadow(color: BrandColors.primary.withValues(alpha: 0.06), blurRadius: 24, offset: const Offset(0, 8)),
        BoxShadow(color: BrandColors.primary.withValues(alpha: 0.04), blurRadius: 4, offset: const Offset(0, 1)),
      ];

  static List<BoxShadow> get lift => [
        BoxShadow(color: BrandColors.primary.withValues(alpha: 0.18), blurRadius: 28, offset: const Offset(0, 12)),
      ];

  /// True when the app shows Arabic. Arabic letters join, so Arabic text is never letter-spaced, and its
  /// taller marks and descenders need more line height than Latin.
  static bool isArabic(BuildContext context) => Localizations.maybeLocaleOf(context)?.languageCode == 'ar';

  /// A display heading in the brand's display font: tight Latin tracking, no tracking and roomier lines in Arabic.
  static TextStyle display(BuildContext context, double size, {Color? color, FontWeight weight = FontWeight.w800}) {
    final arabic = isArabic(context);
    return TextStyle(
      fontFamily: AppFonts.display,
      fontSize: size,
      fontWeight: weight,
      height: arabic ? arabicHeadingHeight : 1.08,
      letterSpacing: arabic ? 0 : -0.4,
      color: color ?? BrandColors.ink,
    );
  }

  /// Small label above a group: letter-spaced in Latin, plain in Arabic.
  static TextStyle eyebrow(BuildContext context) =>
      TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.1, color: BrandColors.muted).tracked(context);

  /// Line height for Arabic headings: Arabic hamza and dots sit above the Latin cap height.
  static const arabicHeadingHeight = 1.32;
}

extension ArabicTracking on TextStyle {
  /// This style without letter spacing when the app shows Arabic, since spacing would break the joins between letters.
  TextStyle tracked(BuildContext context) => letterSpacing == null || letterSpacing == 0 || !Ui.isArabic(context) ? this : copyWith(letterSpacing: 0);
}

/// Arabic: no letter spacing anywhere, and headings get room for Arabic marks.
TextStyle? _arabicStyle(TextStyle? style, {bool heading = false}) {
  if (style == null) return null;
  final height = style.height;
  return style.copyWith(
    letterSpacing: 0,
    height: heading && (height == null || height < Ui.arabicHeadingHeight) ? Ui.arabicHeadingHeight : height,
  );
}

TextTheme _arabicTextTheme(TextTheme t) => TextTheme(
      displayLarge: _arabicStyle(t.displayLarge, heading: true),
      displayMedium: _arabicStyle(t.displayMedium, heading: true),
      displaySmall: _arabicStyle(t.displaySmall, heading: true),
      headlineLarge: _arabicStyle(t.headlineLarge, heading: true),
      headlineMedium: _arabicStyle(t.headlineMedium, heading: true),
      headlineSmall: _arabicStyle(t.headlineSmall, heading: true),
      titleLarge: _arabicStyle(t.titleLarge, heading: true),
      titleMedium: _arabicStyle(t.titleMedium),
      titleSmall: _arabicStyle(t.titleSmall),
      bodyLarge: _arabicStyle(t.bodyLarge),
      bodyMedium: _arabicStyle(t.bodyMedium),
      bodySmall: _arabicStyle(t.bodySmall),
      labelLarge: _arabicStyle(t.labelLarge),
      labelMedium: _arabicStyle(t.labelMedium),
      labelSmall: _arabicStyle(t.labelSmall),
    );

/// The app theme. With [arabic] (MaterialApp.builder passes it when the app shows Arabic) no text is letter-spaced
/// and headings get Arabic line heights.
ThemeData buildTheme({bool arabic = false}) {
  const body = AppFonts.body;
  const display = AppFonts.display;
  final scheme = ColorScheme.fromSeed(
    seedColor: BrandColors.primary,
    primary: BrandColors.primary,
    onPrimary: Colors.white,
    secondary: BrandColors.accent,
    onSecondary: BrandColors.primary,
    error: BrandColors.highlight,
    surface: Colors.white,
    onSurface: BrandColors.ink,
    onSurfaceVariant: BrandColors.muted,
    outline: BrandColors.line,
    outlineVariant: BrandColors.hairline,
  );
  final radius = BorderRadius.circular(Ui.radiusSmall);
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: body);
  final latinText = base.textTheme.copyWith(
        headlineLarge: TextStyle(fontFamily: display, fontSize: 32, fontWeight: FontWeight.w800, height: 1.08, color: BrandColors.ink),
        headlineMedium: TextStyle(fontFamily: display, fontSize: 26, fontWeight: FontWeight.w800, height: 1.1, color: BrandColors.ink),
        headlineSmall: TextStyle(fontFamily: display, fontSize: 21, fontWeight: FontWeight.w700, height: 1.15, color: BrandColors.ink),
        titleLarge: TextStyle(fontFamily: display, fontSize: 19, fontWeight: FontWeight.w700, color: BrandColors.ink),
      ).apply(bodyColor: BrandColors.ink, displayColor: BrandColors.ink);
  final text = arabic ? _arabicTextTheme(latinText) : latinText;
  final buttonText = TextStyle(fontFamily: body, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: arabic ? 0 : 0.1);

  return base.copyWith(
    textTheme: text,
    scaffoldBackgroundColor: BrandColors.canvas,
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: AppBarTheme(
      backgroundColor: BrandColors.canvas,
      foregroundColor: BrandColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      titleTextStyle: TextStyle(fontFamily: display, fontSize: 20, fontWeight: FontWeight.w700, color: BrandColors.ink),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      hintStyle: TextStyle(color: BrandColors.muted.withValues(alpha: 0.75), fontWeight: FontWeight.w400),
      border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.line)),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.line)),
      focusedBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.primary, width: 1.6)),
      errorBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.highlight)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.highlight, width: 1.6)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: BrandColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: BrandColors.primary.withValues(alpha: 0.45),
        disabledForegroundColor: Colors.white70,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: buttonText,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: BrandColors.ink,
        backgroundColor: Colors.white,
        side: BorderSide(color: BrandColors.line),
        minimumSize: const Size(0, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: buttonText.copyWith(fontSize: 15),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: BrandColors.primary, textStyle: buttonText.copyWith(fontSize: 15)),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
        textStyle: WidgetStatePropertyAll(buttonText.copyWith(fontSize: 14.5)),
        shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
        side: WidgetStatePropertyAll(BorderSide(color: BrandColors.line)),
        backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? BrandColors.primary : Colors.white),
        foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : BrandColors.ink),
      ),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: const WidgetStatePropertyAll(Colors.white),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? BrandColors.live : BrandColors.line),
      trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
      thumbIcon: const WidgetStatePropertyAll(null),
    ),
    checkboxTheme: CheckboxThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? BrandColors.primary : Colors.white),
      side: BorderSide(color: BrandColors.line, width: 1.6),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: Colors.white,
      selectedColor: BrandColors.primary,
      side: BorderSide(color: BrandColors.line),
      shape: const StadiumBorder(),
      labelStyle: TextStyle(fontFamily: body, fontWeight: FontWeight.w600, color: BrandColors.ink),
      secondaryLabelStyle: TextStyle(fontFamily: body, fontWeight: FontWeight.w600, color: Colors.white),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      indicatorColor: BrandColors.primary,
      height: 68,
      labelTextStyle: WidgetStateProperty.resolveWith((s) => TextStyle(
            fontFamily: body,
            fontSize: 12,
            fontWeight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: s.contains(WidgetState.selected) ? BrandColors.ink : BrandColors.muted,
          )),
      iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(size: 23, color: s.contains(WidgetState.selected) ? Colors.white : BrandColors.muted)),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: BrandColors.accent,
      foregroundColor: BrandColors.primary,
      elevation: 6,
      highlightElevation: 8,
      extendedTextStyle: buttonText.copyWith(fontSize: 15),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: BrandColors.canvas,
      surfaceTintColor: Colors.transparent,
      dragHandleColor: BrandColors.line,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      titleTextStyle: TextStyle(fontFamily: display, fontSize: 21, fontWeight: FontWeight.w700, color: BrandColors.ink),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: BrandColors.primary,
      contentTextStyle: TextStyle(fontFamily: body, color: Colors.white, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    dividerTheme: DividerThemeData(color: BrandColors.hairline, thickness: 1, space: 1),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: BrandColors.primary),
    listTileTheme: ListTileThemeData(
      iconColor: BrandColors.ink,
      titleTextStyle: TextStyle(fontFamily: body, fontSize: 15.5, fontWeight: FontWeight.w600, color: BrandColors.ink),
      subtitleTextStyle: TextStyle(fontFamily: body, fontSize: 13.5, color: BrandColors.muted),
    ),
  );
}
