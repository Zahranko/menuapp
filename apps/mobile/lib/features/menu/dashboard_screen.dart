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
            padding: const EdgeInsets.fromLTRB(Ui.gutter, 14, Ui.gutter, 12),
            child: Row(children: [
              Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [BrandColors.highlight, Color.lerp(BrandColors.highlight, BrandColors.accent, 0.45)!],
                  ),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Text(business.name.isEmpty ? '?' : business.name.characters.first.toUpperCase(),
                    style: Ui.display(22, color: Colors.white)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(business.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: BrandColors.muted, fontSize: 13.5, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(titles[_tab], key: ValueKey(_tab), style: Ui.display(27)),
                  ),
                ]),
              ),
              FilledButton.icon(
                key: const Key('viewSite'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 44),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => context.push('/site'),
                icon: const Icon(Icons.visibility_outlined, size: 18),
                label: Text(t.viewSite),
              ),
            ]),
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(Ui.gutter, 0, Ui.gutter, 10),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: BoxDecoration(color: BrandColors.paper, borderRadius: BorderRadius.circular(14)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const _LiveDot(),
              const SizedBox(width: 10),
              Flexible(
                flex: 3,
                child: Text(business.displayUrl,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textDirection: TextDirection.ltr,
                    textAlign: TextAlign.start,
                    style: TextStyle(color: BrandColors.ink, fontWeight: FontWeight.w700, fontSize: 13.5)),
              ),
              const SizedBox(width: 10),
              Flexible(
                flex: 2,
                child: Text(t.savesGoLive,
                    maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.end, style: TextStyle(color: BrandColors.muted, fontSize: 12)),
              ),
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
              onPressed: () => _tab == 0 ? openProductSheet(context, null) : openCategorySheet(context, null),
              icon: const Icon(Icons.add_rounded),
              label: Text(_tab == 0 ? t.addProduct : t.addCategory),
            ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: BrandColors.hairline)),
        ),
        child: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: (i) => setState(() => _tab = i),
          destinations: [
            NavigationDestination(icon: const Icon(Icons.shopping_bag_outlined), selectedIcon: const Icon(Icons.shopping_bag_rounded), label: t.tabProducts),
            NavigationDestination(icon: const Icon(Icons.grid_view_outlined), selectedIcon: const Icon(Icons.grid_view_rounded), label: t.tabCategories),
            NavigationDestination(icon: const Icon(Icons.tune_rounded), selectedIcon: const Icon(Icons.tune_rounded), label: t.tabSettings),
          ],
        ),
      ),
    );
  }
}

/// A green dot with a soft halo: the site is live.
class _LiveDot extends StatelessWidget {
  const _LiveDot();

  @override
  Widget build(BuildContext context) => Container(
        width: 16,
        height: 16,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: BrandColors.live.withValues(alpha: 0.2), shape: BoxShape.circle),
        child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: BrandColors.live, shape: BoxShape.circle)),
      );
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
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: AppCard(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
          child: Column(children: [
            IconTile(Icons.inventory_2_outlined, size: 54),
            const SizedBox(height: 14),
            Text(title, textAlign: TextAlign.center, style: Ui.display(19, weight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(body, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted, height: 1.45)),
          ]),
        ),
      );
}
