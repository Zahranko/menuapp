import 'dart:convert';

import 'package:flutter/widgets.dart';

/// A part of the page the owner tapped in the preview: its section ("hero", "menu", …) and the piece inside it ("btn", …).
class StudioPick {
  const StudioPick(this.section, this.element);

  final String section;
  final String? element;
}

/// The editor's link to the preview page (apps/sites/lib/studio.ts): turns "tap a part to edit it" on and off, asks the
/// page to show the latest draft in place, and hears which part the owner tapped. The web view does the talking.
class StudioLink extends ChangeNotifier {
  StudioLink({this.onPick});

  /// Called when the owner taps a part of the page while [picking].
  final void Function(StudioPick pick)? onPick;

  bool _picking = false;
  bool _ready = false;
  int _refreshes = 0;

  bool get picking => _picking;

  /// True once the page in the web view answered; false again while a new page loads.
  bool get ready => _ready;

  /// Counts [refresh] calls; the web view asks the page to refresh each time it changes.
  int get refreshes => _refreshes;

  set picking(bool value) {
    if (value == _picking) return;
    _picking = value;
    notifyListeners();
  }

  /// Asks the page to show the latest saved draft without reloading, so it keeps its scroll position.
  /// False when the page can't (still loading, or an older page): reload it instead.
  bool refresh() {
    if (!_ready) return false;
    _refreshes++;
    notifyListeners();
    return true;
  }

  /// The web view started loading a page; it isn't ready until it says so.
  void pageStarted() => _ready = false;

  /// A message from the page (JSON); anything unexpected is ignored.
  void receive(String message) {
    Object? data;
    try {
      data = jsonDecode(message);
    } on FormatException {
      return;
    }
    if (data is! Map) return;
    switch (data['type']) {
      case 'ready':
        _ready = true;
        notifyListeners();
      case 'pick':
        final section = data['section'];
        final element = data['element'];
        if (section is String && section.isNotEmpty) onPick?.call(StudioPick(section, element is String ? element : null));
    }
  }
}

/// Gives the web view under it a [StudioLink] (the editor's preview has one; other web views don't).
class StudioScope extends InheritedWidget {
  const StudioScope({super.key, required this.link, required super.child});

  final StudioLink link;

  static StudioLink? maybeOf(BuildContext context) => context.getInheritedWidgetOfExactType<StudioScope>()?.link;

  @override
  bool updateShouldNotify(StudioScope oldWidget) => link != oldWidget.link;
}
