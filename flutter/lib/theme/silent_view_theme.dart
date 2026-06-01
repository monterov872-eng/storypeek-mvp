import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SilentViewColors {
  static const black = Color(0xFF000000);
  static const surface = Color(0xFF0C0C0C);
  static const card = Color(0xFF141414);
  static const border = Color(0xFF252525);
  static const neon = Color(0xFF9B5CFF);
  static const neonDim = Color(0xFF6B3FD4);
  static const white = Color(0xFFFFFFFF);
  static const muted = Color(0xFF8E8E93);
}

class SilentViewTheme {
  static ThemeData dark() {
    const scheme = ColorScheme.dark(
      surface: SilentViewColors.surface,
      onSurface: SilentViewColors.white,
      primary: SilentViewColors.neon,
      onPrimary: SilentViewColors.white,
      secondary: SilentViewColors.neonDim,
      error: Color(0xFFFF6B6B),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: SilentViewColors.black,
      colorScheme: scheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: SilentViewColors.white,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          color: SilentViewColors.white,
          fontWeight: FontWeight.w700,
          fontSize: 28,
          letterSpacing: -0.5,
        ),
        titleLarge: TextStyle(
          color: SilentViewColors.white,
          fontWeight: FontWeight.w600,
          fontSize: 20,
        ),
        titleMedium: TextStyle(
          color: SilentViewColors.white,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        bodyLarge: TextStyle(color: SilentViewColors.white, fontSize: 16),
        bodyMedium: TextStyle(color: SilentViewColors.muted, fontSize: 14),
        labelLarge: TextStyle(
          color: SilentViewColors.white,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SilentViewColors.card,
        hintStyle: const TextStyle(color: SilentViewColors.muted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: SilentViewColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: SilentViewColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: SilentViewColors.neon, width: 1.5),
        ),
      ),
      cardTheme: CardThemeData(
        color: SilentViewColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: SilentViewColors.border),
        ),
      ),
      dividerColor: SilentViewColors.border,
    );
  }
}
