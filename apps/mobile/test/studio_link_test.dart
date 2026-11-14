import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/site/studio_link.dart';

void main() {
  test('refresh waits until the page is ready', () {
    final link = StudioLink();
    expect(link.refresh(), isFalse);
    link.receive('{"type":"ready","version":1}');
    expect(link.ready, isTrue);
    expect(link.refresh(), isTrue);
    expect(link.refreshes, 1);
    link.pageStarted();
    expect(link.refresh(), isFalse);
  });

  test('passes taps on the page to the editor', () {
    final picks = <StudioPick>[];
    final link = StudioLink(onPick: picks.add);
    link.receive('{"type":"pick","section":"hero","element":"btn"}');
    link.receive('{"type":"pick","section":"menu","element":null}');
    expect(picks.map((p) => '${p.section}/${p.element}'), ['hero/btn', 'menu/null']);
  });

  test('ignores anything unexpected', () {
    final picks = <StudioPick>[];
    final link = StudioLink(onPick: picks.add);
    for (final m in ['not json', '[1]', '{"type":"pick"}', '{"type":"pick","section":""}', '{"type":"other"}']) {
      link.receive(m);
    }
    expect(picks, isEmpty);
    expect(link.ready, isFalse);
  });

  test('tells listeners when pick mode changes', () {
    final link = StudioLink();
    var calls = 0;
    link.addListener(() => calls++);
    link.picking = true;
    link.picking = true;
    link.picking = false;
    expect(calls, 2);
  });
}
