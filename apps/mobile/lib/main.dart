import 'package:flutter/material.dart';

import 'core/brand.dart';

void main() {
  runApp(const StorefrontApp());
}

class StorefrontApp extends StatelessWidget {
  const StorefrontApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: Brand.brandName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Color(hexToArgb(Brand.colorPrimary))),
        scaffoldBackgroundColor: Color(hexToArgb(Brand.colorPaper)),
      ),
      home: const PlaceholderHome(),
    );
  }
}

class PlaceholderHome extends StatelessWidget {
  const PlaceholderHome({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(Brand.brandName, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(Brand.tagline),
          ],
        ),
      ),
    );
  }
}
