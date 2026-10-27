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
public/samples/services/<name>.svg  Service illustrations (scissors, tooth, dumbbell, wrench...) for the service samples
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
| `services.ts` | For service websites: `bookLink(ctx, service?)` (WhatsApp link that starts with the `book.message` setting), `highlights()`, `steps()`, `faqs()` from numbered settings (`steps.1.title`, `faq.1.q`...) |

Clothing stores (Folio, Drop, Couture) also use `templates/_fashion/`: `details()` turns "Sizes: XS–L. Colors: Sand, Black" in a description (Arabic "المقاسات:" and "الألوان:") into sizes and colors, `ProductSheet` is a product dialog with size buttons whose WhatsApp message carries the chosen size, `PhotoViewer` is a photos-only gallery viewer (`data-photo="<index>"` opens it), `items.ts` builds their props and `base.css` holds their structure (import it after the kit files). Sale prices are a Custom label such as "Sale −30%".

## Page style (`_kit/style-settings.json`, `style.ts`, `style.css`)

Every template gets a shared "Page style" group (شكل الصفحة), added by `scripts/build-registry.mjs` right after the
"Cards" group. Each option is a choice whose first value, `auto` ("Template default"), keeps the template exactly as
designed:

| Key | Options |
|---|---|
| `style.textSize` | auto, smaller, larger, big |
| `style.headings` | auto, normal, uppercase, italic, condensed, outlined |
| `style.tracking` | auto, tight, normal, wide (letter spacing in headings) |
| `style.spacing` | auto, compact, airy (space between sections) |
| `style.buttons` | auto, pill, rounded, square, outline, underline, shadow |
| `style.photos` | auto, rounded, square, soft, arch, circle, blob |
| `style.dividers` | auto, none, line, wave, slant, zigzag, dots |
| `style.texture` | auto, none, dots, grain, paper, grid, stripes |
| `style.motion` | auto, none, fade, rise, playful (on scroll) |

`optionRoot(ctx)` puts one `data-ps-*` attribute on the root for each option that is not `auto` (`styleAttributes()`),
and `_kit/style.css`, imported by every `styles.css` after `hero.css`, styles them. Its rules use `!important` under
those attributes, so they win over the template only when the owner picked something. Arabic headings never get
italic, condensed letters or letter spacing. Motion uses CSS scroll-driven animations inside
`@media (prefers-reduced-motion: no-preference)`, with no JavaScript, and changes nothing in browsers without them.

What a template marks so the options can reach it:

- `data-k="btn"` on call-to-action links and buttons (not the floating order button, which has its own shape option).
- `data-k="photo"` on photo boxes in sections (story, gallery, about). Product photos use `.kit-card-media` and
  `.kit-cat-media`. Add `fill` for a gallery tile that must keep its grid cell, and `overlay` for a photo with text laid
  over it: those keep a rounded box instead of a circle, arch or blob.
- `data-k="boxed"` on a section drawn as a card of its own: it gets no divider band.
- `calc(<n>px * var(--kit-space, 1))` in the vertical padding and margins of the sections.
- Sections are found by `data-section`. The header, hero, announcement, ticker, order bar and footer never get
  dividers or motion.

A template leaves an option out with `"pageStyle": { "skip": ["style.motion"] }` in its manifest. Today Atlas, Bloom,
Couture, Ember, Lumen and Maison skip `style.motion`, because they have their own motion switch.
`templates/page-style.test.tsx` checks every template, and `_kit/style.test.ts` checks the options.
In fixture mode, `/_preview/fixture.<id>.<theme>.<en|ar>.ts_big-hs_condensed-btn_pill-pic_arch-div_wave-tex_grain-mo_rise`
tries them (tokens: `ts hs tr sp btn pic div tex mo`).

### Option pictures (`"previews"`)

Any `choice` field may carry `"previews": { "<option>": "/kit/previews/<name>.svg" }`, and the app's editor then shows
picture tiles with the option's name under each, instead of chips. Paths are site-relative SVGs in `public/`. The
registry build fails if a preview names an unknown option or a missing file. The API passes previews through in
`GET /api/v1/templates` (`TemplateSchema` reads them and the importer drops any that are not a site-relative SVG). The
app loads them from `AppConfig.asset()`, like thumbnails, and the deploy copies `public/kit` to the API's `wwwroot/kit`.
Page style pictures are 80×80 tiles in `public/kit/previews/` (`auto.svg` is shared by every "Template default").

## Rules every template follows

- Settings are read with the helpers in `lib/settings.ts`; never assume a key exists.
- Reuse the standard keys where they fit: `font`, `theme`, `accent`, `logo`, `hero.*`, `sections`, `announcement`, `story.*`, `gallery`, `reviews.*`, `hours`.
- A section with nothing to show is left out (no empty headings). Reviews are only what the owner typed in.
- Sold-out products stay visible with the "Sold out" label and are never featured. Service templates say "Not available" instead (`t.unavailable`, `<ProductSheet services />`).
- Service websites (salon, clinic, studio, gym, home services) treat categories as service groups and products as services: book on WhatsApp, "From" prices (`prices.from`), steps and questions.
- Mark each top-level section with `data-section="<name>"` (tests check the order).
- Copy comes from `lib/i18n.ts` (shared words) or the template's `copy.ts`. Both languages, always.
- Layout uses logical properties (`margin-inline-start`, `inset-inline-end`) so Arabic works right to left.
- Text contrast is at least 4.5:1 in every theme; `e2e/templates.spec.ts` runs axe on every theme and in Arabic.
- `prefers-reduced-motion` turns animations off; every link and button has a visible focus style.
- No brand name or domain in the template (use `madeWith()` and `brand` from `lib/brand.ts`).

## Trying a template

`APP_FIXTURES=1 npm run dev`, then open `http://localhost:3000/<id>` (the template's own sample business, set by
`"sample"` in the manifest: cafe, restaurant, sweets, drinks, fastfood, asian, brunch, pizza, shop, or the service samples salon, clinic, studio, gym and home) or `/vanillamenu` (the café
with the template in `APP_FIXTURE_TEMPLATE`, default `souq`). `/_preview/fixture.<id>.<theme>.<en|ar>` shows any
theme in either language.

Tests: `templates/all-templates.test.tsx` renders every registered template with every theme, in Arabic, with 1 and
200 products, with every section off and with no products. `e2e/templates.spec.ts` checks loading, horizontal
overflow, the item dialog and accessibility on a phone.

Thumbnails: `npm run build`, then `THUMBNAILS=1 npm run test:e2e -- --project=mobile thumbnails`.
