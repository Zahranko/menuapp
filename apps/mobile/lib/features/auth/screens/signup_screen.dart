import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/models.dart';
import '../../../core/brand.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../../core/widgets/ui.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../auth_controller.dart';

final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

/// Strength 0 to 4, scored like the prototype: length, a digit, a capital, a symbol or 12+ characters.
int passwordStrength(String v) {
  var score = 0;
  if (v.length >= 8) score++;
  if (RegExp(r'\d').hasMatch(v)) score++;
  if (RegExp(r'[A-Z]').hasMatch(v)) score++;
  if (RegExp(r'[^A-Za-z0-9]').hasMatch(v) || v.length >= 12) score++;
  return score;
}

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  String _code = countryCodes.first;
  bool _terms = true;
  bool _busy = false;
  Map<String, String?> _errors = {};
  SlugAvailability? _slug;
  Timer? _debounce;
  int _slugRequest = 0;

  @override
  void dispose() {
    _debounce?.cancel();
    for (final c in [_name, _email, _phone, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  void _clear(String field) {
    if (_errors[field] != null) setState(() => _errors = {..._errors, field: null});
  }

  /// Checks the link 400 ms after typing stops; only the latest answer is shown.
  void _onName(String value) {
    _clear('businessName');
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      setState(() => _slug = null);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      final request = ++_slugRequest;
      try {
        final result = await ref.read(authRepositoryProvider).slugAvailability(value.trim());
        if (mounted && request == _slugRequest) setState(() => _slug = result);
      } on ApiError {
        if (mounted && request == _slugRequest) setState(() => _slug = null);
      }
    });
  }

  Map<String, String?> _validate(AppLocalizations t) {
    final email = _email.text.trim();
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    return {
      'businessName': _name.text.trim().isEmpty ? t.errBusinessName : null,
      'email': email.isEmpty ? t.errEmail : (!_emailPattern.hasMatch(email) ? t.errEmailFormat : null),
      'phone': phone.isEmpty ? t.errPhone : (phone.length < 7 || phone.length > 12 ? t.errPhoneFull : null),
      'password': _password.text.length < 8 ? t.errPasswordShort : null,
      'terms': _terms ? null : t.errTerms,
    };
  }

  Future<void> _submit() async {
    final t = AppLocalizations.of(context);
    final errors = _validate(t);
    setState(() => _errors = errors);
    if (errors.values.any((e) => e != null)) return;

    setState(() => _busy = true);
    try {
      await ref.read(authControllerProvider.notifier).register(
            businessName: _name.text.trim(),
            email: _email.text.trim(),
            phone: PhoneField.e164(_code, _phone.text),
            password: _password.text,
            locale: Localizations.localeOf(context).languageCode,
          );
    } on ApiError catch (e) {
      if (!mounted) return;
      final fields = {
        'businessName': e.field('businessName') ?? e.field('slug'),
        'email': e.field('email'),
        'phone': e.field('phone'),
        'password': e.field('password'),
      };
      setState(() => _errors = fields);
      if (fields.values.every((v) => v == null)) {
        showMessage(context, e.isNetwork ? t.errNetwork : (e.summary ?? t.errGeneric));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final strength = passwordStrength(_password.text);
    final strengthColors = [BrandColors.line, BrandColors.highlight, BrandColors.accent, Color.lerp(BrandColors.accent, BrandColors.primary2, 0.5)!, BrandColors.primary2];
    final strengthText = _password.text.isEmpty
        ? t.passwordHelp
        : [t.strengthTooShort, t.strengthWeak, t.strengthOkay, t.strengthGood, t.strengthStrong][strength];

    return Scaffold(
      appBar: AuthHeader(onBack: () => context.go('/'), wordmark: const Wordmark(size: 20)),
      body: SafeArea(
        child: AutofillGroup(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 18, 24, 32),
            children: [
              FormTitle(title: t.signupTitle, subtitle: t.signupSubtitle),
              const SizedBox(height: 24),
              LabeledField(
                fieldKey: const Key('businessName'),
                label: t.businessName,
                controller: _name,
                hint: t.businessNameHint,
                error: _errors['businessName'],
                autofillHints: const [AutofillHints.organizationName],
                icon: Icons.storefront_outlined,
                onChanged: _onName,
              ),
              if (_slug != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: (_slug!.available ? BrandColors.live : BrandColors.highlight).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(children: [
                    Icon(Icons.link_rounded, size: 17, color: BrandColors.muted),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('${Brand.domain}/${_slug!.slug}',
                          textDirection: TextDirection.ltr,
                          style: TextStyle(color: BrandColors.ink, fontWeight: FontWeight.w600, fontSize: 13.5),
                          overflow: TextOverflow.ellipsis),
                    ),
                    Icon(_slug!.available ? Icons.check_circle_rounded : Icons.cancel_rounded,
                        size: 16, color: _slug!.available ? BrandColors.live : BrandColors.highlight),
                    const SizedBox(width: 4),
                    Text(
                      _slug!.available ? t.linkAvailable : t.linkTaken,
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: _slug!.available ? BrandColors.live : BrandColors.highlight),
                    ),
                  ]),
                ),
                if (!_slug!.available && _slug!.message != null)
                  Padding(padding: const EdgeInsets.only(top: 6), child: Text(_slug!.message!, style: TextStyle(color: BrandColors.highlight, fontSize: 13))),
              ],
              const SizedBox(height: 16),
              LabeledField(
                fieldKey: const Key('email'),
                label: t.email,
                controller: _email,
                hint: t.emailHint,
                error: _errors['email'],
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                icon: Icons.mail_outline_rounded,
                onChanged: (_) => _clear('email'),
              ),
              const SizedBox(height: 16),
              PhoneField(
                label: t.phone,
                controller: _phone,
                code: _code,
                onCode: (c) => setState(() => _code = c),
                error: _errors['phone'],
                onChanged: (_) => _clear('phone'),
              ),
              const SizedBox(height: 16),
              PasswordField(
                label: t.password,
                controller: _password,
                hint: t.passwordHint,
                error: _errors['password'],
                newPassword: true,
                onChanged: (_) => setState(() => _errors = {..._errors, 'password': null}),
              ),
              const SizedBox(height: 8),
              Row(children: [
                for (var i = 0; i < 4; i++)
                  Expanded(
                    child: Container(
                      height: 5,
                      margin: EdgeInsetsDirectional.only(end: i < 3 ? 6 : 0),
                      decoration: BoxDecoration(
                        color: i < strength ? strengthColors[strength] : BrandColors.line,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
              ]),
              const SizedBox(height: 6),
              Text(strengthText, style: TextStyle(fontSize: 13, color: BrandColors.muted)),
              const SizedBox(height: 12),
              CheckboxListTile(
                value: _terms,
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: Text(t.termsAgree),
                subtitle: _errors['terms'] == null ? null : Text(_errors['terms']!, style: TextStyle(color: BrandColors.highlight)),
                onChanged: (v) => setState(() {
                  _terms = v ?? false;
                  _errors = {..._errors, 'terms': null};
                }),
              ),
              const SizedBox(height: 12),
              BusyButton(label: t.createAccount, busyLabel: t.creatingAccount, busy: _busy, onPressed: _submit),
              const SizedBox(height: 12),
              Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text(t.haveAccount),
                TextButton(onPressed: () => context.go('/login'), child: Text(t.logIn)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
