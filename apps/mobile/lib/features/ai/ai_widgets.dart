import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import 'ai_models.dart';

/// The helper's mark: a sparkle.
const aiIcon = Icons.auto_awesome_rounded;

/// "8 AI uses left this month", or why the helper can't be used now.
class AiStatusLine extends StatelessWidget {
  const AiStatusLine({super.key, required this.status});

  final AiStatus status;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final text = !status.available ? t.aiOff : (status.remaining == 0 ? t.aiUsedUp : t.aiRemaining(status.remaining));
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(status.usable ? Icons.bolt_rounded : Icons.info_outline_rounded, size: 17, color: BrandColors.muted),
      const SizedBox(width: 6),
      Expanded(child: Text(text, key: const Key('aiStatusLine'), style: TextStyle(color: BrandColors.muted, fontSize: 13, height: 1.35))),
    ]);
  }
}

/// A tappable row with an icon, a title and a short line under it; dimmed when [onTap] is null.
class AiActionRow extends StatelessWidget {
  const AiActionRow({super.key, required this.icon, required this.title, required this.subtitle, required this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Material(
        color: BrandColors.tint,
        borderRadius: BorderRadius.circular(Ui.radiusSmall),
        child: InkWell(
          borderRadius: BorderRadius.circular(Ui.radiusSmall),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              IconTile(icon, size: 38),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.ink, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: TextStyle(color: BrandColors.muted, fontSize: 13, height: 1.3)),
                ]),
              ),
              Icon(Icons.chevron_right_rounded, color: BrandColors.muted, textDirection: Directionality.of(context)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// A spinner with what the helper is doing; answers can take up to a minute.
class AiWorking extends StatelessWidget {
  const AiWorking({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 36),
      child: Column(children: [
        SizedBox.square(dimension: 36, child: CircularProgressIndicator(strokeWidth: 3, color: BrandColors.primary)),
        const SizedBox(height: 18),
        Text(label, textAlign: TextAlign.center, style: Ui.display(context, 18, weight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(t.aiTakesAMoment, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted, fontSize: 13.5)),
      ]),
    );
  }
}

/// A small note on a tinted background, like "AI can make mistakes".
class AiNote extends StatelessWidget {
  const AiNote(this.text, {super.key, this.icon = Icons.info_outline_rounded});

  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: BrandColors.accent.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(12)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 17, color: BrandColors.ink),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: TextStyle(color: BrandColors.ink, fontSize: 13, height: 1.35))),
        ]),
      );
}
