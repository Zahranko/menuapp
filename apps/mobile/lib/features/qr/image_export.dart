import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gal/gal.dart';
import 'package:share_plus/share_plus.dart';

/// Saves a picture to the phone's photos, or hands it to the share sheet. Tests swap in a fake.
abstract class ImageExporter {
  /// Throws when the picture could not be saved (for example, access to photos was refused).
  Future<void> save(Uint8List png, String name);

  Future<void> share(Uint8List png, String name, {required String text, Rect? origin});
}

class DeviceImageExporter implements ImageExporter {
  const DeviceImageExporter();

  @override
  Future<void> save(Uint8List png, String name) async {
    if (!await Gal.hasAccess() && !await Gal.requestAccess()) throw StateError('No access to photos');
    await Gal.putImageBytes(png, name: name);
  }

  @override
  Future<void> share(Uint8List png, String name, {required String text, Rect? origin}) => SharePlus.instance.share(ShareParams(
        files: [XFile.fromData(png, mimeType: 'image/png', name: '$name.png')],
        fileNameOverrides: ['$name.png'],
        text: text,
        sharePositionOrigin: origin,
      ));
}

final imageExporterProvider = Provider<ImageExporter>((_) => const DeviceImageExporter());

/// The PNG of the [RepaintBoundary] under [key], [width] pixels wide (its height follows its shape).
Future<Uint8List> capturePng(GlobalKey key, {required double width}) async {
  final boundary = key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  final image = await boundary.toImage(pixelRatio: width / boundary.size.width);
  try {
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    return data!.buffer.asUint8List();
  } finally {
    image.dispose();
  }
}

/// Where the share sheet should point from on tablets: the widget that asked for it.
Rect? originOf(BuildContext context) {
  final box = context.findRenderObject();
  return box is RenderBox && box.hasSize ? box.localToGlobal(Offset.zero) & box.size : null;
}
