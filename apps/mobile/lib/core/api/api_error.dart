import 'package:dio/dio.dart';

/// A failed API call. [fieldErrors] holds the RFC 7807 `errors` dictionary, keyed by request field.
class ApiError implements Exception {
  const ApiError({this.status, this.message, this.fieldErrors = const {}, this.isNetwork = false});

  /// Reads a ProblemDetails body; anything else becomes a general or network error.
  factory ApiError.from(Object error) {
    if (error is ApiError) return error;
    if (error is DioException) {
      final response = error.response;
      if (response == null) return const ApiError(isNetwork: true);
      final data = response.data;
      final fields = <String, String>{};
      String? message;
      if (data is Map) {
        final errors = data['errors'];
        if (errors is Map) {
          errors.forEach((key, value) {
            final text = value is List && value.isNotEmpty ? value.first.toString() : value?.toString();
            if (text != null && text.isNotEmpty) fields[_fieldKey(key.toString())] = text;
          });
        }
        message = (data['detail'] ?? data['title'])?.toString();
      }
      return ApiError(status: response.statusCode, message: message, fieldErrors: fields);
    }
    return const ApiError();
  }

  final int? status;
  final String? message;
  final Map<String, String> fieldErrors;
  final bool isNetwork;

  /// The error for one field, matched without regard to case ("Email" and "email" are the same field).
  String? field(String name) => fieldErrors[_fieldKey(name)];

  /// The first message worth showing when no field claims the error.
  String? get summary => fieldErrors.values.isNotEmpty ? fieldErrors.values.first : message;

  static String _fieldKey(String key) => key.toLowerCase();

  @override
  String toString() => 'ApiError($status, $message, $fieldErrors)';
}
