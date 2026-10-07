# How templates are built

A template is a folder `apps/sites/templates/<id>/`. The id is 3 to 30 lowercase letters and digits
(it is also the template's fixture URL, see below). `templates/souq/` is the reference implementation.

```
templates/<id>/
  manifest.json      Number, name, category, description, sample business, settings schema and defaults (drives the app's editor)
  Template.tsx       Server component: ({ site }) => page. Root element: data-template="<id>" className="t-<name>"
  styles.css         The template's own styles, all nested under .t-<name>, container queries for mobile and desktop
  (anything else)    Souq splits into context.ts, copy.ts, theme.ts and sections/; small templates keep copy and palettes in Template.tsx
public/templates/<id>/
  thumbnail.png      Gallery picture, generated (see below)
  art/               Decorations only this template uses (optional)
public/presets/<name>.svg       Shared picture library; an image field offers some of them with "presets": [...]
public/samples/food/<name>.svg  Product illustrations used by the sample businesses
```

Add the component to `templates/registry.ts` and run `npm run templates:registry`.
The backend imports `registry.json` at startup, so a new template needs no backend change.

## Styles: one stylesheet per template

Each template's `styles.css` is built on its own by `scripts/build-styles.mjs` (lightningcss: nesting and modern color
functions are compiled for the browsers we support) into `public/styles/<id>.<hash>.css`. `<TemplateStyles id="<id>" />`
links it, so a site only downloads its own template's CSS. The build runs before `dev`, `build`, `test`, `typecheck`
and `lint`; `npm run styles:watch` rebuilds while you edit. Both outputs are generated and not committed.

- Put every rule inside `.t-<name> { ... }` so templates never leak into each other. `@keyframes` cannot be nested: put them at the end of the file, named `<name>-<animation>`.
- Make the root the size container (`container: page / inline-size`) and write desktop rules in
  `@container page (min-width: 760px)`. A container cannot style itself, so rules for the root use `@media`.
- `app/(site)/kit.css` gives the kit blocks (hours, contact, credits, item sheet, sold-out tiles, `.sr-only`, `ul.plain`)
  neutral defaults at zero specificity; any rule in a template overrides them.

## Design variables

`themeVars(settings, locale, { palettes, fonts, radius?, defaultAccent? })` from `_kit/theme.ts` sets on the root:

| Variable | Meaning |
|---|---|
| `--bg --surf --ink --muted --line` | The chosen color theme (extra palette keys become variables too, for example `--frame`) |
| `--acc --acc-ink --acc-text --acc-soft` | Accent fill, text on the fill, accent-colored text and a soft tint, always at 4.5:1 contrast |
| `--fd --fb --fw --ft --fs` | Display font, body font, heading weight, tracking and size scale of the chosen font pair |
| `--r` | Corner radius from the `corners` setting |

Font pairs (`fonts.ts`): modern, elegant, bold, classic, soft, grotesk, hand, condensed, mono, round, naskh.
Arabic sites switch to IBM Plex Sans Arabic (Amiri for naskh) automatically.

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
| `context.ts` | `siteContext(site)`: everything above worked out once (sections, picks, contact, hours, today, reviews, gallery, `on()`, `text()`, `image()`) |
| `blocks.tsx` | `TopBars` (skip link, preview bar, announcement), `Logo`, `ProductPicture`, `HoursList`, `ContactList`, `Credits`, `ProductSheet` |
| `CatalogControls.tsx` | Search, category chips and price sort over a product grid (`data-product`, `data-cat`, `data-q`, `data-price`, `data-order`) |
| `icons.tsx` | Line icons |

## Rules every template follows

- Settings are read with the helpers in `lib/settings.ts`; never assume a key exists.
- Reuse the standard keys where they fit: `font`, `theme`, `accent`, `logo`, `hero.*`, `sections`, `announcement`, `story.*`, `gallery`, `reviews.*`, `hours`.
- A section with nothing to show is left out (no empty headings). Reviews are only what the owner typed in.
- Sold-out products stay visible with the "Sold out" label and are never featured.
- Mark each top-level section with `data-section="<name>"` (tests check the order).
- Copy comes from `lib/i18n.ts` (shared words) or the template's `copy.ts`. Both languages, always.
- Layout uses logical properties (`margin-inline-start`, `inset-inline-end`) so Arabic works right to left.
- Text contrast is at least 4.5:1 in every theme; `e2e/templates.spec.ts` runs axe on every theme and in Arabic.
- `prefers-reduced-motion` turns animations off; every link and button has a visible focus style.
- No brand name or domain in the template (use `madeWith()` and `brand` from `lib/brand.ts`).

## Trying a template

`APP_FIXTURES=1 npm run dev`, then open `http://localhost:3000/<id>` (the template's own sample business, set by
`"sample"` in the manifest: cafe, restaurant, sweets, drinks, fastfood, asian, brunch, pizza or shop) or `/vanillamenu` (the café
with the template in `APP_FIXTURE_TEMPLATE`, default `souq`). `/_preview/fixture.<id>.<theme>.<en|ar>` shows any
theme in either language.

Tests: `templates/all-templates.test.tsx` renders every registered template with every theme, in Arabic, with 1 and
200 products, with every section off and with no products. `e2e/templates.spec.ts` checks loading, horizontal
overflow, the item dialog and accessibility on a phone.

Thumbnails: `npm run build`, then `THUMBNAILS=1 npm run test:e2e -- --project=mobile thumbnails`.
