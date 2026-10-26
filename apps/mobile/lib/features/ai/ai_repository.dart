import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_error.dart';
import '../../core/providers.dart';
import 'ai_models.dart';

/// A photo picked for the AI helper.
typedef AiPhoto = ({Uint8List bytes, String name});

/// The AI helper's calls. Every method throws [ApiError] on failure (503 ai.unavailable, 429 ai.limit, 502 ai.failed...).
class AiRepository {
  AiRepository(this._dio);

  final Dio _dio;

  /// The model can take a while, reading a long menu most of all.
  static final _slow = Options(receiveTimeout: const Duration(seconds: 90), sendTimeout: const Duration(seconds: 60));

  Future<AiStatus> status() => _call(() async => AiStatus.fromJson((await _dio.get<Map<String, dynamic>>('/api/v1/ai/status')).data!));

  /// Colors and texts for the current template from one photo.
  Future<DesignSuggestion> design(AiPhoto photo, {String? note, String? language}) => _call(() async {
        final form = FormData.fromMap({
          'file': _file(photo),
          if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
          'language': ?language,
        });
        return DesignSuggestion.fromJson((await _dio.post<Map<String, dynamic>>('/api/v1/ai/design', data: form, options: _slow)).data!);
      });

  /// Texts for the template's text settings, plus descriptions for products without one.
  Future<TextSuggestion> text({String? note, String? language}) => _call(() async {
        final body = {'note': (note ?? '').trim().isEmpty ? null : note!.trim(), 'language': language, 'includeProducts': true};
        return TextSuggestion.fromJson((await _dio.post<Map<String, dynamic>>('/api/v1/ai/text', data: body, options: _slow)).data!);
      });

  /// Categories and products read from 1 to 3 menu photos. [arabic] picks Arabic names for an Arabic website.
  Future<MenuDraft> menu(List<AiPhoto> photos, {required bool arabic}) => _call(() async {
        final form = FormData()..fields.add(MapEntry('language', arabic ? 'ar' : 'en'));
        for (final p in photos) {
          form.files.add(MapEntry('files', _file(p)));
        }
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/ai/menu', data: form, options: _slow);
        return MenuDraft.fromJson(response.data!, arabic: arabic);
      });

  /// Adds the chosen categories and products in one go. Returns how many products were added.
  Future<int> importCatalog(List<Map<String, Object?>> categories) => _call(() async {
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/catalog/import', data: {'categories': categories});
        return (response.data!['productsCreated'] as num).toInt();
      });

  static MultipartFile _file(AiPhoto photo) {
    final lower = photo.name.toLowerCase();
    final type = lower.endsWith('.png') ? 'png' : (lower.endsWith('.webp') ? 'webp' : 'jpeg');
    return MultipartFile.fromBytes(photo.bytes, filename: photo.name, contentType: DioMediaType('image', type));
  }

  static Future<T> _call<T>(Future<T> Function() run) async {
    try {
      return await run();
    } catch (e) {
      throw ApiError.from(e);
    }
  }
}

final aiRepositoryProvider = Provider<AiRepository>((ref) => AiRepository(ref.watch(dioProvider)));

/// The helper's status, or null when it can't be read (an older server, no network): the helper then stays hidden
/// instead of showing an error.
final aiStatusProvider = FutureProvider<AiStatus?>((ref) async {
  try {
    return await ref.watch(aiRepositoryProvider).status();
  } catch (_) {
    return null;
  }
});

/// Picks photos for the helper. Tests replace it; the server checks type and size again and re-encodes them.
abstract class AiPhotoPicker {
  /// One photo from the camera ([camera]) or the photo library, or null when cancelled.
  Future<AiPhoto?> one({required bool camera});

  /// Up to [limit] photos from the library.
  Future<List<AiPhoto>> many({required int limit});
}

class ImagePickerPhotos implements AiPhotoPicker {
  const ImagePickerPhotos();

  @override
  Future<AiPhoto?> one({required bool camera}) async {
    final file = await ImagePicker().pickImage(
      source: camera ? ImageSource.camera : ImageSource.gallery,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 85,
      requestFullMetadata: false,
    );
    return file == null ? null : (bytes: await file.readAsBytes(), name: file.name);
  }

  @override
  Future<List<AiPhoto>> many({required int limit}) async {
    if (limit < 2) {
      final photo = await one(camera: false);
      return photo == null ? const [] : [photo];
    }
    // Menus keep more pixels so small print stays readable.
    final files = await ImagePicker().pickMultiImage(maxWidth: 2048, maxHeight: 2048, imageQuality: 85, limit: limit, requestFullMetadata: false);
    return [for (final f in files.take(limit)) (bytes: await f.readAsBytes(), name: f.name)];
  }
}

final aiPhotoPickerProvider = Provider<AiPhotoPicker>((ref) => const ImagePickerPhotos());
