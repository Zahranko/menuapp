# S12 · Flutter My menu dashboard

**Depends on:** S03, S11. **Branch:** `session/s12-mobile-dashboard`

## Goal
Owners manage products, categories and business info without touching the design, and every save is live.

## Read first
Prototype: My menu screen, all three tabs, the product sheet, the category sheet with its delete options, and Settings. PLAN.md sections 5 and 7.

## Build
1. Shell: header with logo, business name and tab title, "View site" button, live link bar ("Saves go live instantly"), bottom tabs Products / Categories / Settings, floating Add button.
2. Products tab: stats (products, sold out, categories), search, category filter chips, grouped list with thumbnail, price, label and sold-out tag, availability switch with optimistic update and rollback on error, pull to refresh, empty states.
3. Product sheet (add and edit): photo (pick, compress, upload through `/media`), name, description, price in the business currency, category, label, Available, Feature in Signature picks, Save, Delete with inline confirmation.
4. Categories tab: ordered list with product counts, "Hidden on site" for empty ones, move up and down (and drag to reorder), add and rename sheet, delete with "move products to …" or "delete them too".
5. Settings tab: website card (Edit design, Copy link), business info form, plan card (read-only until S14), account (change password, log out).
6. "View site" opens the live site in a WebView screen.
7. Tests: widget tests for each sheet's validation, CRUD against a fake repository, optimistic toggle rollback, RTL golden of the products tab.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `flutter analyze` and `flutter test` pass. Screenshots in the PR.
- `docs/STATUS.md` updated.
