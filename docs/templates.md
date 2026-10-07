# How templates are built

A template is a folder `apps/sites/templates/<id>/`. The id is 3 to 30 lowercase letters and digits
(it is also the template's fixture URL, see below). `templates/souq/` is the reference implementation.

```
templates/<id>/
  manifest.json      Number, name, category, description, settings schema and defaults (drives the app's editor)
  Template.tsx       Server component: ({ site, preview }) => page
  context.ts         Works out everything the sections need once per render
  copy.ts            The template's fixed headings and buttons, English and Arabic
  theme.ts           Color themes and the CSS variables set from the settings
  sections/*.tsx     One file per section
  <id>.module.css    The template's own styles, with container queries for mobile and desktop
public/templates/<id>/
  presets/<name>.svg Pictures the owner can pick for image fields ("preset:<name>")
  thumbnail.png      Gallery picture, generated (see below)
```

Register the component in `templates/registry.ts` and run `npm run templates:registry`. The backend imports
`registry.json` at startup, so a new template needs no backend change.

## Shared kit (`templates/_kit/`)

Use these instead of writing your own, so every template behaves the same where it should:

| File | What it gives you |
|---|---|
| `site-data.ts` | `menu()` (non-empty categories, formatted prices, labels in the site's language, search text), `featured()`, `hoursRows()` and `todayLine()` in the business's time zone, `contact()` links, `tintFor()` for products without photos |
| `color.ts` | `accentTokens()` and `readable()`: accent fill, text on fill and accent text that always reach 4.5:1 contrast |
| `fonts.ts` | All `next/font` families as CSS variables (`fontVariables`), the three standard pairs and `forLocale()` for Arabic |
| `Picture.tsx` | Image that fills its positioned parent; optimized for storage hosts in `IMAGE_HOSTS`, plain for SVG presets |
| `MenuSearch.tsx` | Search box that filters the server-rendered menu (`data-menu-cat`, `data-q`, `data-menu-empty`) |
| `CategoryTabs.tsx` | Sticky category links that follow scrolling (plain anchors, work without JavaScript) |
| `ItemSheet.tsx` | Product details in a native `<dialog>`; any element with `data-item-id` opens it |
| `Drawer.tsx` | Mobile navigation button and panel |
| `icons.tsx` | Line icons |

## Rules every template follows

- Settings are read with the helpers in `lib/settings.ts`; never assume a key exists.
- Reuse the standard keys where they fit: `font`, `theme`, `accent`, `logo`, `hero.*`, `sections`, `announcement`, `story.*`, `gallery`, `reviews.*`, `hours`.
- A section with nothing to show is left out (no empty headings). Reviews are only what the owner typed in.
- Sold-out products stay visible with the "Sold out" label and are never featured.
- Mark each top-level section with `data-section="<name>"` (tests check the order).
- Copy comes from `lib/i18n.ts` (shared words) or the template's `copy.ts`. Both languages, always.
- Layout uses logical properties (`margin-inline-start`, `inset-inline-end`) so Arabic works right to left.
- Text contrast is at least 4.5:1 in every theme; the template's test checks it.
- `prefers-reduced-motion` turns animations off; every link and button has a visible focus style.
- No brand name or domain in the template (use `madeWith()` and `brand` from `lib/brand.ts`).

## Trying a template

`APP_FIXTURES=1 npm run dev`, then open `http://localhost:3000/<id>` (the sample business with that template)
or `/vanillamenu` (the template in `APP_FIXTURE_TEMPLATE`, default `souq`).

Thumbnails: `npm run build`, then `THUMBNAILS=1 npm run test:e2e -- --project=mobile thumbnails`.
