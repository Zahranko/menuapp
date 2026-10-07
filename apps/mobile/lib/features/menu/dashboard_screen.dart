import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import 'categories_tab.dart';
import 'category_sheet.dart';
import 'product_sheet.dart';
import 'products_tab.dart';
import 'settings_tab.dart';

/// My menu: products, categories and settings. Every save goes live on the website.
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  late int _tab = widget.initialTab;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    if (auth is! SignedIn) return const SizedBox.shrink();
    final business = auth.business;
    final titles = [t.tabProducts, t.tabCategories, t.tabSettings];

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 12, 8),
            child: Row(children: [
              CircleAvatar(
                radius: 21,
                backgroundColor: BrandColors.accent,
                child: Text(business.name.isEmpty ? '?' : business.name.characters.first.toUpperCase(),
                    style: TextStyle(color: BrandColors.primary, fontWeight: FontWeight.w800, fontSize: 18)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(business.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: BrandColors.muted, fontSize: 13)),
                  Text(titles[_tab], style: TextStyle(color: BrandColors.ink, fontSize: 24, fontWeight: FontWeight.w800)),
                ]),
              ),
              FilledButton(
                key: const Key('viewSite'),
                style: FilledButton.styleFrom(minimumSize: const Size(0, 40), padding: const EdgeInsets.symmetric(horizontal: 14)),
                onPressed: () => context.push('/site'),
                child: Text(t.viewSite),
              ),
            ]),
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(color: BrandColors.primary, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF52D17C), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(business.displayUrl,
                    maxLines: 1, overflow: TextOverflow.ellipsis, textDirection: TextDirection.ltr,
                    textAlign: TextAlign.start, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
              ),
              Text(t.savesGoLive, style: TextStyle(color: BrandColors.accent, fontSize: 12, fontStyle: FontStyle.italic)),
            ]),
          ),
          Expanded(
            child: IndexedStack(index: _tab, children: const [ProductsTab(), CategoriesTab(), SettingsTab()]),
          ),
        ]),
      ),
      floatingActionButton: _tab == 2
          ? null
          : FloatingActionButton.extended(
              key: const Key('addButton'),
              backgroundColor: BrandColors.accent,
              foregroundColor: BrandColors.primary,
              onPressed: () => _tab == 0 ? openProductSheet(context, null) : openCategorySheet(context, null),
              icon: const Icon(Icons.add),
              label: Text(_tab == 0 ? t.addProduct : t.addCategory, style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        backgroundColor: Colors.white,
        indicatorColor: BrandColors.accent.withValues(alpha: 0.35),
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.shopping_bag_outlined), selectedIcon: const Icon(Icons.shopping_bag), label: t.tabProducts),
          NavigationDestination(icon: const Icon(Icons.grid_view_outlined), selectedIcon: const Icon(Icons.grid_view_rounded), label: t.tabCategories),
          NavigationDestination(icon: const Icon(Icons.settings_outlined), selectedIcon: const Icon(Icons.settings), label: t.tabSettings),
        ],
      ),
    );
  }
}

/// Shows the error of a failed load with a retry button.
class LoadError extends StatelessWidget {
  const LoadError({super.key, required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(errorText(t, error), textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted)),
          const SizedBox(height: 12),
          LightButton(label: t.tryAgain, onPressed: onRetry),
        ]),
      ),
    );
  }
}

/// Empty state with a bold first line, as in the prototype.
class EmptyNote extends StatelessWidget {
  const EmptyNote({super.key, required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: BrandColors.line)),
        child: Column(children: [
          Text(title, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: BrandColors.ink)),
          const SizedBox(height: 6),
          Text(body, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted, height: 1.4)),
        ]),
      );
}
