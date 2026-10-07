# S10 · Flutter foundation, splash and onboarding

**Depends on:** S00. **Runs alongside:** S01–S03. **Branch:** `session/s10-mobile-foundation`

## Goal
The app skeleton every other mobile session builds on, plus the first two screens matching the prototype.

## Read first
`docs/PLAN.md` section 8. Prototype: Splash and Onboarding screens, the `:root` color tokens and fonts.

## Build
1. Structure: `lib/core` (theme, router, http, storage, l10n, widgets), `lib/features/<feature>/{data,domain,presentation}`.
2. Theme built from `Brand` values (colors and fonts from `brand.json`), never Dart constants; bundled fonts; light theme only for now. Shared widgets: primary button (with loading state), text field with label and error, bottom sheet, toast/snackbar, switch row.
3. go_router with routes for every screen in PLAN.md section 8 (placeholders where not built) and an auth redirect.
4. dio client with base URL per flavor (`dev`, `prod`), auth interceptor and refresh-on-401 (against a fake until S11), Riverpod providers.
5. Localization with ARB (`en`, `ar`), RTL verified.
6. Splash: plate drawing, three menu cards fanning out, wordmark and tagline (text from `Brand`: `brandName`, `brandNameAr`, `tagline`), then onboarding (or home if logged in). Use implicit or explicit animations, total under 3 seconds, respects reduced motion.
7. Onboarding: three swipeable slides with the prototype's art and copy (live menu card, template carousel with color swatches, link typing then plans), dots, Skip, Get started.
8. Widget tests for onboarding navigation; golden tests for splash end state and each slide in `en` and `ar`.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `flutter analyze` and `flutter test` pass. Golden files committed.
- `docs/STATUS.md` updated.
