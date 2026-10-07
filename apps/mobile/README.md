# Mobile

Flutter app for business owners. Always pass the brand file:

```
flutter pub get
flutter analyze
flutter test --dart-define-from-file=../../brand.json
flutter run --dart-define-from-file=../../brand.json
```

App ID, display name and icons are written from `brand.json` by `scripts/rebrand.sh`.
