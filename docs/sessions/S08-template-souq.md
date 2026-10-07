# S08 · Template 001 "Souq" and SEO

**Depends on:** S04, S07. **Branch:** `session/s08-template-souq`

## Goal
A production-quality port of the prototype's "Souq" website, driven by the settings schema, plus SEO.

## Read first
`docs/prototype/app-prototype.html`: open the "Your website" screen and its desktop view (the monitor icon), and read the `renderSite()` function and the `.w-*` styles. PLAN.md sections 6 and 9.

## Build
1. `templates/souq/manifest.json` with the full schema: font style (modern, elegant, bold), color theme (cream, sage, blush, night), accent (4 swatches), corners (rounded, sharp), dotted texture, hero layout (full, split), hero image (presets or upload), headline, subtext, image darkness, section toggles, announcement text, story text and photo, gallery (up to 6 photos).
2. Sections as server components: announcement bar, sticky header with mobile drawer, hero, highlights, signature picks (featured, available products, max 3), menu with search and sticky category tabs, item detail sheet (client component), story, gallery, reviews, visit (map image, opening hours with today highlighted in the business time zone, contact, buttons), footer with newsletter field.
3. Sold-out products show the "Sold out" label and are dimmed, as in the prototype. Categories without products are hidden.
4. CSS: CSS modules or Tailwind, with design tokens as CSS variables set from settings (the prototype's `siteVars()`). Container-query layout for mobile and desktop like the prototype. Visible focus states, `prefers-reduced-motion` respected, 4.5:1 contrast in all four themes.
5. Fonts via `next/font` (Bricolage Grotesque, DM Sans, Cormorant Garamond, Manrope, Syne, IBM Plex Sans Arabic). Arabic sites use RTL and the Arabic font.
6. Preset hero images: export the prototype's SVG illustrations to `public/templates/souq/` files.
7. SEO: `generateMetadata`, JSON-LD (`CafeOrCoffeeShop` or `Restaurant` with `hasMenu` sections and offers), per-host `sitemap.xml` and `robots.txt`, Open Graph image route.
8. Tests: renders fixture data in every theme without errors; snapshot of section order; JSON-LD is valid JSON with prices; a Playwright smoke test on `/vanillamenu` at 390 px and 1280 px wide.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- All `apps/sites` checks pass and the Playwright smoke test passes.
- Lighthouse (mobile) on the fixture site: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95. Paste scores in the PR.
- Screenshots of mobile and desktop in the PR. `docs/STATUS.md` updated.
