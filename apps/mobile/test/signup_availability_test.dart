import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'widget_test.dart' show pumpApp;

void main() {
  testWidgets('sign up warns about a used email and phone before it is sent', (tester) async {
    final api = await pumpApp(tester, (path, body) {
      if (path.endsWith('account-availability')) {
        return (status: 200, body: {'email': 'An account with this email already exists. Log in instead.', 'phone': null});
      }
      return (status: 404, body: null);
    });
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('email')), 'owner@shop.test');
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    expect(find.text('An account with this email already exists. Log in instead.'), findsOneWidget);
    final check = api.requests.lastWhere((r) => r.path.endsWith('account-availability'));
    expect(check.queryParameters, {'email': 'owner@shop.test'});
    expect(api.requests.where((r) => r.path.endsWith('/register')), isEmpty);
  });

  testWidgets('the warning goes away once the email is free', (tester) async {
    var taken = true;
    await pumpApp(tester, (path, body) {
      if (path.endsWith('account-availability')) {
        return (status: 200, body: {'email': taken ? 'An account with this email already exists. Log in instead.' : null, 'phone': null});
      }
      return (status: 404, body: null);
    });
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('email')), 'owner@shop.test');
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();
    expect(find.text('An account with this email already exists. Log in instead.'), findsOneWidget);

    taken = false;
    await tester.enterText(find.byKey(const Key('email')), 'new.owner@shop.test');
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();
    expect(find.text('An account with this email already exists. Log in instead.'), findsNothing);
  });
}
