import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

typedef FakeResponse = ({int status, Object? body});

/// Answers dio requests from a function, and records them.
class FakeApi implements HttpClientAdapter {
  FakeApi(this.handle);

  final FakeResponse Function(RequestOptions request) handle;
  final List<RequestOptions> requests = [];

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    requests.add(options);
    final r = handle(options);
    return ResponseBody.fromString(
      r.body == null ? '' : jsonEncode(r.body),
      r.status,
      headers: {
        Headers.contentTypeHeader: [r.status >= 400 ? 'application/problem+json' : Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

Map<String, Object?> authBody({String access = 'access-1', String refresh = 'refresh-1', String name = 'Vanilla Menu'}) => {
      'accessToken': access,
      'accessTokenExpiresAt': '2030-01-01T00:00:00Z',
      'refreshToken': refresh,
      'refreshTokenExpiresAt': '2030-01-01T00:00:00Z',
      'business': business(name: name),
    };

Map<String, Object?> business({String name = 'Vanilla Menu'}) => {
      'id': '0190a000-0000-7000-8000-000000000001',
      'name': name,
      'slug': 'vanillamenu',
      'siteUrl': 'https://example.test/vanillamenu',
      'whatsApp': null,
      'email': 'hello@vanillamenu.test',
      'address': null,
      'instagram': null,
      'locale': 'en',
      'currencyCode': 'JOD',
      'timeZone': 'Asia/Amman',
    };
