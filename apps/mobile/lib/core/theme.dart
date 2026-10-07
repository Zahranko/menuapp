import 'package:flutter/material.dart';

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
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: BrandColors.primary,
    primary: BrandColors.primary,
    secondary: BrandColors.accent,
    error: BrandColors.highlight,
    surface: BrandColors.paper,
    onSurface: BrandColors.ink,
  );
  final radius = BorderRadius.circular(14);
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: BrandColors.paper,
    appBarTheme: AppBarTheme(backgroundColor: BrandColors.paper, foregroundColor: BrandColors.ink, elevation: 0, scrolledUnderElevation: 0),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.line)),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.line)),
      focusedBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: BrandColors.primary, width: 1.6)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: BrandColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: BrandColors.primary)),
  );
}
