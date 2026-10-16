import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/theme.dart';
import '../../l10n/generated/app_localizations.dart';

/// Builds the web view for a page. Widget tests replace it, since platform web views don't run there.
final webViewBuilderProvider = Provider<Widget Function(String url, int reloadKey)>(
  (ref) => (url, reloadKey) => SiteWebView(url: url, reloadKey: reloadKey),
);

/// Shows a web page, with a friendly note when the page can't load (for example before the websites are hosted).
class SiteWebView extends StatefulWidget {
  const SiteWebView({super.key, required this.url, this.reloadKey = 0});

  final String url;

  /// Change it to load [url] again (the editor bumps it after each saved change).
  final int reloadKey;

  @override
  State<SiteWebView> createState() => _SiteWebViewState();
}

class _SiteWebViewState extends State<SiteWebView> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => _set(loading: true),
        onPageFinished: (_) => _set(loading: false),
        onWebResourceError: (e) {
          if (e.isForMainFrame ?? true) _set(loading: false, failed: true);
        },
        onHttpError: (e) {
          if ((e.response?.statusCode ?? 0) >= 500 || e.response?.statusCode == 404) _set(loading: false, failed: true);
        },
      ));
    _load();
  }

  @override
  void didUpdateWidget(SiteWebView old) {
    super.didUpdateWidget(old);
    if (old.url != widget.url || old.reloadKey != widget.reloadKey) _load();
  }

  void _load() {
    _failed = false;
    _controller.loadRequest(Uri.parse(widget.url));
  }

  void _set({required bool loading, bool? failed}) {
    if (!mounted) return;
    setState(() {
      _loading = loading;
      if (failed != null) _failed = failed;
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Stack(children: [
      WebViewWidget(controller: _controller),
      if (_failed)
        Positioned.fill(
          child: Container(
            color: BrandColors.paper,
            padding: const EdgeInsets.all(24),
            alignment: Alignment.center,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.cloud_off_outlined, size: 40, color: BrandColors.muted),
              const SizedBox(height: 12),
              Text(t.siteOfflineTitle, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: BrandColors.ink)),
              const SizedBox(height: 6),
              Text(t.siteOfflineBody, textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted, height: 1.4)),
              const SizedBox(height: 12),
              TextButton(onPressed: () => setState(_load), child: Text(t.tryAgain)),
            ]),
          ),
        ),
      if (_loading && !_failed) const LinearProgressIndicator(minHeight: 2),
    ]);
  }
}
