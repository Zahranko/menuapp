# S11 · Flutter sign up and log in

**Depends on:** S02, S10. **Branch:** `session/s11-mobile-auth`

## Goal
Real accounts from the app: create account, log in with email or phone, forgot password, welcome screen.

## Read first
Prototype: Create account, Log in, Welcome screens (field order, live slug preview, password strength bar, error copy). `docs/api/openapi.json` auth endpoints.

## Build
1. Generate the Dart API client from `docs/api/openapi.json` into `apps/mobile/lib/core/api/generated/` with a script `scripts/gen-dart-client.sh`.
2. Create account: business name with live `{domain}/<slug>` preview and availability check (debounced 400 ms), email, phone with country code picker (default +962), password with show/hide and strength bar, terms checkbox. Field errors from the API mapped to fields.
3. Log in: Email/Phone segmented control, password, forgot password sheet.
4. Tokens in secure storage; refresh interceptor; logout clears everything.
5. Welcome: business name, copyable link, next steps, "Choose a template".
6. Tests: form validation, API error mapping, refresh flow with a mocked server.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `flutter analyze` and `flutter test` pass.
- PR shows a screen recording or screenshots of sign up and log in against the local API.
- `docs/STATUS.md` updated.
