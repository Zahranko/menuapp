import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';
import '../theme.dart';

/// A label above a text field, with the error shown under it.
class LabeledField extends StatelessWidget {
  const LabeledField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.error,
    this.keyboardType,
    this.autofillHints,
    this.obscure = false,
    this.suffix,
    this.prefix,
    this.onChanged,
    this.textInputAction = TextInputAction.next,
    this.fieldKey,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? error;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final bool obscure;
  final Widget? suffix;
  final Widget? prefix;
  final ValueChanged<String>? onChanged;
  final TextInputAction textInputAction;
  final Key? fieldKey;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
        const SizedBox(height: 6),
        TextField(
          key: fieldKey,
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          autofillHints: autofillHints,
          textInputAction: textInputAction,
          onChanged: onChanged,
          decoration: InputDecoration(hintText: hint, errorText: error, errorMaxLines: 3, suffixIcon: suffix, prefixIcon: prefix),
        ),
      ],
    );
  }
}

/// Password field with a show/hide button.
class PasswordField extends StatefulWidget {
  const PasswordField({super.key, required this.label, required this.controller, this.hint, this.error, this.onChanged, this.newPassword = false});

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? error;
  final ValueChanged<String>? onChanged;
  final bool newPassword;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _shown = false;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return LabeledField(
      fieldKey: const Key('password'),
      label: widget.label,
      controller: widget.controller,
      hint: widget.hint,
      error: widget.error,
      obscure: !_shown,
      onChanged: widget.onChanged,
      textInputAction: TextInputAction.done,
      autofillHints: [widget.newPassword ? AutofillHints.newPassword : AutofillHints.password],
      suffix: IconButton(
        tooltip: _shown ? t.hidePassword : t.showPassword,
        icon: Icon(_shown ? Icons.visibility_off_outlined : Icons.visibility_outlined),
        onPressed: () => setState(() => _shown = !_shown),
      ),
    );
  }
}

/// Country codes offered in the prototype; Jordan first.
const countryCodes = ['+962', '+966', '+971', '+974', '+965', '+20', '+1', '+44'];

/// Country code picker and local number. [e164] joins them the way the API expects.
class PhoneField extends StatelessWidget {
  const PhoneField({super.key, required this.label, required this.controller, required this.code, required this.onCode, this.error, this.onChanged});

  final String label;
  final TextEditingController controller;
  final String code;
  final ValueChanged<String> onCode;
  final String? error;
  final ValueChanged<String>? onChanged;

  /// "+962" and "079 123 4567" become "+962791234567".
  static String e164(String code, String local) => '$code${local.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^0+'), '')}';

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return LabeledField(
      fieldKey: const Key('phone'),
      label: label,
      controller: controller,
      hint: t.phoneHint,
      error: error,
      keyboardType: TextInputType.phone,
      autofillHints: const [AutofillHints.telephoneNumberNational],
      onChanged: onChanged,
      prefix: Padding(
        padding: const EdgeInsetsDirectional.only(start: 12, end: 4),
        child: DropdownButtonHideUnderline(
          child: Semantics(
            label: t.countryCode,
            child: DropdownButton<String>(
              value: code,
              items: [for (final c in countryCodes) DropdownMenuItem(value: c, child: Text(c, textDirection: TextDirection.ltr))],
              onChanged: (v) => v == null ? null : onCode(v),
            ),
          ),
        ),
      ),
    );
  }
}

/// Primary button that shows a spinner and the busy label while [busy] is true.
class BusyButton extends StatelessWidget {
  const BusyButton({super.key, required this.label, required this.busyLabel, required this.busy, required this.onPressed});

  final String label;
  final String busyLabel;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: busy ? null : onPressed,
      child: busy
          ? Row(mainAxisSize: MainAxisSize.min, children: [
              const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
              const SizedBox(width: 10),
              Text(busyLabel),
            ])
          : Text(label),
    );
  }
}

/// Title block at the top of the sign-up and log-in screens.
class FormTitle extends StatelessWidget {
  const FormTitle({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: BrandColors.ink, height: 1.1)),
      const SizedBox(height: 8),
      Text(subtitle, style: TextStyle(fontSize: 15, color: BrandColors.muted)),
    ]);
  }
}

void showMessage(BuildContext context, String text) =>
    ScaffoldMessenger.of(context)..hideCurrentSnackBar()..showSnackBar(SnackBar(content: Text(text)));
