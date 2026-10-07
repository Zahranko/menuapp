# S09 · Next.js marketing pages

**Depends on:** S07. **Branch:** `session/s09-marketing`

## Goal
The `{domain}` home, pricing, terms and privacy pages in the brand of the mobile app.

## Read first
Prototype: splash and onboarding screens for brand, copy and illustrations. PLAN.md section 1.

## Build
1. Home: hero explaining the product in one line (the `tagline` from `brand.json`), three steps (list items, pick a template, share one link), template showcase using real template thumbnails, pricing teaser, app store buttons (links configurable), footer.
2. Pricing: Basic $5/month and Pro $10/month with the exact differences from PLAN.md. No invented features.
3. Terms and Privacy pages with clearly marked placeholder text for a lawyer to replace.
4. Arabic and English versions (`/ar`), RTL for Arabic.
5. Tests and Lighthouse as in S08.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- All `apps/sites` checks pass. Screenshots in the PR. `docs/STATUS.md` updated.
