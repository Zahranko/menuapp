import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_error.dart';
import '../../../core/brand.dart';
import '../../../core/providers.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../auth_controller.dart';

final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  String _code = countryCodes.first;
  bool _withPhone = false;
  bool _busy = false;
  Map<String, String?> _errors = {};

  @override
  void dispose() {
    for (final c in [_email, _phone, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final t = AppLocalizations.of(context);
    final email = _email.text.trim();
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    final errors = <String, String?>{
      'login': _withPhone
          ? (phone.length < 7 ? t.errPhone : null)
          : (email.isEmpty ? t.errEmail : (!_emailPattern.hasMatch(email) ? t.errEmailFormat : null)),
      'password': _password.text.isEmpty ? t.errPassword : null,
    };
    setState(() => _errors = errors);
    if (errors.values.any((e) => e != null)) return;

    setState(() => _busy = true);
    try {
      await ref.read(authControllerProvider.notifier).logIn(
            login: _withPhone ? PhoneField.e164(_code, _phone.text) : email,
            password: _password.text,
          );
    } on ApiError catch (e) {
      if (!mounted) return;
      final field = e.field('login') ?? e.field('password');
      if (e.status == 401 || field != null) {
        // Wrong login or locked: the API's message goes under the password, where the user looks next.
        setState(() => _errors = {'password': field ?? e.summary ?? t.errGeneric});
      } else {
        showMessage(context, e.isNetwork ? t.errNetwork : (e.summary ?? t.errGeneric));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _forgot() async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ForgotSheet(initialEmail: _email.text.trim()),
    );
    if (sent == true && mounted) showMessage(context, AppLocalizations.of(context).resetSent);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(leading: BackButton(onPressed: () => context.go('/'))),
      body: SafeArea(
        child: AutofillGroup(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
            children: [
              FormTitle(title: t.loginTitle, subtitle: t.loginSubtitle),
              const SizedBox(height: 24),
              Semantics(
                label: t.loginWith,
                child: SegmentedButton<bool>(
                  segments: [
                    ButtonSegment(value: false, label: Text(t.tabEmail)),
                    ButtonSegment(value: true, label: Text(t.tabPhone)),
                  ],
                  selected: {_withPhone},
                  showSelectedIcon: false,
                  onSelectionChanged: (s) => setState(() {
                    _withPhone = s.first;
                    _errors = {};
                  }),
                ),
              ),
              const SizedBox(height: 16),
              if (_withPhone)
                PhoneField(
                  label: t.phone,
                  controller: _phone,
                  code: _code,
                  onCode: (c) => setState(() => _code = c),
                  error: _errors['login'],
                )
              else
                LabeledField(
                  fieldKey: const Key('email'),
                  label: t.email,
                  controller: _email,
                  hint: t.emailHint,
                  error: _errors['login'],
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                ),
              const SizedBox(height: 16),
              PasswordField(label: t.password, controller: _password, hint: t.passwordHintLogin, error: _errors['password']),
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: TextButton(onPressed: _forgot, child: Text(t.forgotPassword)),
              ),
              const SizedBox(height: 4),
              BusyButton(label: t.logIn, busyLabel: t.loggingIn, busy: _busy, onPressed: _submit),
              const SizedBox(height: 12),
              Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text(t.newTo(Brand.brandName)),
                TextButton(onPressed: () => context.go('/signup'), child: Text(t.createAnAccount)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}

class _ForgotSheet extends ConsumerStatefulWidget {
  const _ForgotSheet({required this.initialEmail});

  final String initialEmail;

  @override
  ConsumerState<_ForgotSheet> createState() => _ForgotSheetState();
}

class _ForgotSheetState extends ConsumerState<_ForgotSheet> {
  late final _email = TextEditingController(text: widget.initialEmail);
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final t = AppLocalizations.of(context);
    final email = _email.text.trim();
    if (!_emailPattern.hasMatch(email)) {
      setState(() => _error = email.isEmpty ? t.errEmail : t.errEmailFormat);
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).forgotPassword(email);
      if (mounted) Navigator.of(context).pop(true);
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.isNetwork ? t.errNetwork : (e.field('email') ?? e.summary ?? t.errGeneric));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        FormTitle(title: t.forgotTitle, subtitle: t.forgotBody),
        const SizedBox(height: 16),
        LabeledField(
          fieldKey: const Key('forgotEmail'),
          label: t.email,
          controller: _email,
          hint: t.emailHint,
          error: _error,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
        ),
        const SizedBox(height: 16),
        BusyButton(label: t.sendLink, busyLabel: t.sendLink, busy: _busy, onPressed: _send),
      ]),
    );
  }
}
