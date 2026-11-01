import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';
import '../currency.dart';
import '../theme.dart';
import 'ui.dart';

/// "US dollar · USD": a currency's name in the app's language and its code.
String currencyLabel(BuildContext context, String code) {
  final c = currencyFor(code);
  final name = c.nameFor(context);
  return name == c.code ? c.code : '$name · ${c.code}';
}

/// Opens the searchable currency list with [selected] checked. Returns the chosen code, or null when closed.
Future<String?> showCurrencyPicker(BuildContext context, {required String selected}) =>
    showFormSheet<String>(context, (_) => CurrencyPickerSheet(selected: selected));

/// The currency sheet: a search box over every supported currency, matching names in both languages, codes and signs.
class CurrencyPickerSheet extends StatefulWidget {
  const CurrencyPickerSheet({super.key, required this.selected});

  final String selected;

  @override
  State<CurrencyPickerSheet> createState() => _CurrencyPickerSheetState();
}

class _CurrencyPickerSheetState extends State<CurrencyPickerSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final shown = currencies.where((c) => c.matches(_query)).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(t.chooseCurrency, style: Ui.display(context, 24)),
        const SizedBox(height: 6),
        Text(t.chooseCurrencySub, style: TextStyle(color: BrandColors.muted, height: 1.4)),
        const SizedBox(height: 14),
        TextField(
          key: const Key('currencySearch'),
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: t.searchCurrencies,
            prefixIcon: Icon(Icons.search_rounded, color: BrandColors.muted),
          ),
          onChanged: (v) => setState(() => _query = v),
        ),
        const SizedBox(height: 8),
        if (shown.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(t.noCurrencyMatches, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted)),
          ),
        for (final c in shown)
          ListTile(
            key: Key('currency-${c.code}'),
            contentPadding: EdgeInsets.zero,
            leading: CurrencySign(c),
            title: Text(c.nameFor(context), style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
            subtitle: Text(c.code, style: TextStyle(color: BrandColors.muted)),
            selected: c.code == widget.selected,
            trailing: c.code == widget.selected ? Icon(Icons.check_rounded, color: BrandColors.primary) : null,
            onTap: () => Navigator.pop(context, c.code),
          ),
      ],
    );
  }
}

/// The currency's sign in a rounded tile, like the icon tiles that lead other rows.
class CurrencySign extends StatelessWidget {
  const CurrencySign(this.currency, {super.key, this.size = 40});

  final Currency currency;
  final double size;

  @override
  Widget build(BuildContext context) {
    final sign = currency.symbolFor(context);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(horizontal: 3),
      decoration: BoxDecoration(color: BrandColors.accent.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(size * 0.32)),
      child: FittedBox(
        child: Text(sign, maxLines: 1, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.primary, fontSize: sign.length > 2 ? 12 : 16)),
      ),
    );
  }
}

/// A row that shows the chosen currency and opens the picker, styled like the app-language row.
class CurrencyRow extends StatelessWidget {
  const CurrencyRow({super.key, required this.code, required this.onTap, this.help, this.error, this.enabled = true});

  final String code;
  final VoidCallback onTap;

  /// A line under the row, like "You can change it later in Settings."
  final String? help;

  /// Shown instead of [help], in the error color.
  final String? error;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Material(
        color: BrandColors.paper,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          key: const Key('currencyRow'),
          enabled: enabled,
          leading: CurrencySign(currencyFor(code), size: 36),
          title: Text(t.currency, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
          subtitle: Text(currencyLabel(context, code), style: TextStyle(color: BrandColors.muted)),
          trailing: Icon(Icons.chevron_right_rounded, color: BrandColors.muted),
          onTap: onTap,
        ),
      ),
      if ((error ?? help) != null) ...[
        const SizedBox(height: 6),
        Text(error ?? help!, style: TextStyle(fontSize: 13, color: error != null ? BrandColors.highlight : BrandColors.muted, height: 1.4)),
      ],
    ]);
  }
}
