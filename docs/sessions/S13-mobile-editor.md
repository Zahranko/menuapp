# S13 · Flutter template gallery and design editor

**Depends on:** S04, S08, S11. **Runs alongside:** S12, S14. **Branch:** `session/s13-mobile-editor`

## Goal
Owners pick a template and customize its design with controls generated from the template's schema, seeing the real site in a live preview.

## Read first
Prototype: Templates and Customize screens. PLAN.md section 6 (schema field types and preview flow).

## Build
1. Gallery: category filter chips, two-column grid with thumbnails from `GET /templates`, number and name, "Ready" badge, tap to choose (confirm when it replaces an existing design).
2. Editor: preview area on top (WebView of `previewUrl`, refreshed after each debounced draft save, 600 ms), grouped controls below, sticky "Publish" button.
3. One widget per schema field type: `text`, `textarea`, `choice` (chips), `palette` (split swatches), `color` (swatches), `image` (presets plus upload), `images` (up to max), `range` (slider with value), `toggles` (switch list), `bool`. Unknown field types are skipped with a log line, never a crash.
4. Reset to template defaults, unsaved-changes guard on back, Publish → success state with "View site" and "Manage menu".
5. Products and prices are **not** edited here. Link to the dashboard instead.
6. Tests: each field widget, schema with unknown types, debounce and save, publish flow.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `flutter analyze` and `flutter test` pass. Screenshots in the PR.
- `docs/STATUS.md` updated.
