# Brand assets

Files for the current brand (see `brand.json` and docs/PLAN.md section 0):

- `logo.svg`: lockup (the mark, then the name in the display font, outlined) for documents and press
- `favicon.svg`: the mark alone (100x100 viewBox); also the sites favicon (`apps/sites/app/icon.svg`)
- `app-icon.png`: 1024x1024 app icon, full bleed with no transparency (iOS and launchers round the corners)
- `app-icon-foreground.png`: Android adaptive-icon foreground, the mark's letter and dot on transparent,
  sized for the 108dp canvas and its 66dp safe circle

The app and the sites draw the mark in code from the brand colors (`LogoMark` in
`apps/mobile/lib/core/widgets/logo_mark.dart`, `LogoMark` in `apps/sites/components/brand/logo-mark.tsx`),
so keep those in step with `favicon.svg`.

To rename the product, replace these files and edit `brand.json`, then run `scripts/rebrand.sh`.
