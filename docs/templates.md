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
italic, condensed letters, outlines or letter spacing. Outlines go only on display headings (the opening headline and
section titles), never on labels, header, footer or highlight titles. On a phone (560px and under), larger and big
text leaves headings at the template's size, capital display headings are set 12% smaller, and wide spacing is
reduced, so a word in a heading never breaks in the middle (display headings wrap only between words; the one
exception is a business name heading, `.kit-name`, where a made-up word longer than the screen breaks). On a dark
theme (`color-scheme: dark` on the root) the paper texture is a faint fine grain and the grain texture is fainter. Motion uses CSS scroll-driven animations inside
`@media (prefers-reduced-motion: no-preference)`, with no JavaScript, and changes nothing in browsers without them.

What a template marks so the options can reach it:

- `data-k="btn"` on call-to-action links and buttons (not the floating order button, which has its own shape option).
- `data-k="photo"` on photo boxes in sections (story, gallery, about). Product photos use `.kit-card-media` and
  `.kit-cat-media`. Add `fill` for a gallery tile that must keep its grid cell, and `overlay` for a photo with text laid
  over it: those keep a rounded box instead of a circle, arch or blob.
- `data-k="boxed"` on a section drawn as a card of its own: it gets no divider band.
- `data-k="label"` on a small section heading (under 26px on a phone at the default text size): it stays solid when
  headings are outlined.
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

## Page layout (`_kit/layout-settings.json`, `layout.ts`, `Top.tsx`, `layout.css`)

Every template gets a shared "Page layout" group (تخطيط الصفحة), added by `scripts/build-registry.mjs` right after
"Page style". Each option starts on `auto` ("Template default"), which renders the template's own header and opening
untouched; any other value swaps in a shared header or opening from `_kit/Top.tsx`, drawn by `_kit/layout.css` (imported
by every `styles.css` after `hero.css`) with the template's own variables (`--bg --surf --ink --muted --line --acc
--acc-ink --acc-text --acc-soft --fd --fb --fw --ft --r`; Souq's `--s*` names are read as fallbacks), its heading rules
and its decorations around it, so it reads as part of the template.

| Key | Options |
|---|---|
| `header.layout` | auto, classic (logo at the start, links and button at the end), centered (logo in the middle, links on a row under it), split (links around the logo), pill (a floating rounded bar), big (a tall header with the name set large), minimal (logo and menu button), drawer (menu button first, links in a side panel) |
| `header.style` | auto, solid, transparent (lies over a full-width top photo in light type), glass (frosted), accent |
| `header.sticky` | auto, on, off (header while scrolling) |
| `hero.variant` | auto, full, split, framed, poster, collage, arch, stacked (photo under centered text), menu (menu first: featured products straight away), type (text only), circle |

- A template's own `hero.layout` (Souq, Atlas, Bloom, Ember, Lumen, Maison) moves into this group right after
  `hero.variant`, labelled "Template default: its own top": it is what `auto` shows.
- `header.style` and `header.sticky` also restyle a template's own header (any `[data-section="header"]` that is not a
  masthead); solid and glass also set its text in the page's ink, since their background is the page color. A shared
  header is sticky unless it is the big one or the owner chose "Scrolls away"; the big one stays on screen only on
  phones even with "Stays at the top", because on a wide screen it is a few hundred pixels tall. A see-through header
  stays on screen only in browsers with scroll-driven animations (it turns solid as the page scrolls) and scrolls away
  elsewhere. A transparent or glass header, and the floating bar, lie over the photo when the opening is a full-width
  photo (the shared "full", or a template's own photo backdrop).
- Openings that need a photo use the hero photos; without any they use product photos (one at a time), and without
  those a tile with the business's first letter. "Three photos" fills up with product photos. The hero slider takes
  turns in one photo box (not in the poster's and circle's small ones). Only the full photo follows `hero.height`,
  `hero.overlay` and `hero.textPosition`.
- Links: one-page templates pass their section links (`basicLinks()` for menu, story and visit); Pro templates pass
  their pages (`pageLinks()` in `_premium/pages.ts`) and show the shared opening on the home page only.

How a template wires it:

```tsx
const top = pageTop(ctx, { photos: heroPics, backdrop: true /* its own opening has its photo behind the text */ });
<SiteHeader ctx={ctx} top={top} links={basicLinks(ctx, { story })} cta={orderCta(order)}>{its own <header>}</SiteHeader>
<SiteHero ctx={ctx} top={top} actions={[...]}>{its own opening}</SiteHero>
```

Templates whose header is also their opening (Bistro, Chalk Board, Linen, Monogrid, Neon Diner, Polaroid, Spice Route,
Ticket) wrap it in `SiteMasthead` with a `fallback` header layout and mark it `data-k="masthead"`: a shared header
goes above it and it becomes the opening; a shared opening replaces it, under the fallback header unless the owner
picked one.

A template leaves fields or options out with `"layout": { "skip": ["header.sticky"], "skipOptions": { "hero.variant":
["menu"] } }` in its manifest (none does today). `templates/page-layout.test.tsx` renders every template with every
layout, `e2e/page-layout.spec.ts` checks every layout on every template on a phone (paired with a fixed seed per
template, English and Arabic). In fixture mode the tokens are `hl` (header layout), `hst` (header look), `stk` (header
while scrolling) and `hv` (opening), for example `/_preview/fixture.souq.default.ar.hl_split-hst_glass-hv_collage`.
Preview pictures: `public/kit/previews/header-*.svg`, `headerstyle-*.svg`, `sticky-*.svg` and `hero-*.svg`.

## Menu layout (`_kit/menu-settings.json`, `menu.ts`, `Menu.tsx`, `MenuNav.tsx`, `menu.css`)

Every template gets a shared "Menu layout" group (تخطيط القائمة), added by `scripts/build-registry.mjs` right after
"Page layout". Each option starts on `auto` ("Template default"). With every option on `auto` the template's own menu
renders untouched. Changing any of them swaps in the shared menu of `_kit/Menu.tsx`, drawn by `_kit/menu.css` (imported
by every `styles.css` after `layout.css`) with the template's own `--k-*` variables, fonts and corners. An option left on
`auto` then takes what fits the layout (`resolveMenu()` in `menu.ts`), and the layout itself, when left on `auto`, is
the shared layout closest to the template's own menu (the `like` prop).

| Key | Options |
|---|---|
| `menu.layout` | auto, grid (cards in a grid), list (list with prices), compact (printed menu, dotted leaders), large (big photos), magazine (photo and text side by side, alternating), masonry (mosaic), carousel (each category a row that scrolls sideways), tiles (photo tiles with the name on the photo) |
| `menu.columns` | auto, one, two, three, four (columns on big screens; phones show one or two) |
| `menu.photos` | auto, top, side, none |
| `menu.photoShape` | auto, square, wide, tall |
| `menu.price` | auto, inline (next to the name), badge (a pill), corner (on the photo's corner), under (under the name), large |
| `menu.categoryNav` | auto, chips (scrolling buttons), tabs, sidebar (a side list from 860px wide, buttons below), dropdown, none |
| `menu.categoryTitle` | auto, simple, line, number, banner (over the category's first photo), ornament (centered with ornaments) |

- Card style, borders, corners, the circle photo and the space between cards come from the "Cards" group
  (`cards.*`): the shared products are `.kit-card`, their photos `.kit-card-media`, their lists `.kit-cards`.
- Mends: tiles never put photos beside the text, the magazine never above it, a corner price without photos is a pill,
  and the category links hide with fewer than two categories. `auto` links are buttons, except on catalog templates
  (Pocket, Drop, which keep their own filters) and on Pro menu pages that have their own links (`ownNav`).
- Once the owner picks shared category links, the template's own ones marked `data-k="catnav"` hide.
- A template whose own menu choices fit here lists them in its manifest, `"menu": { "own": ["density"] }` (Atlas
  `density`, Ember and Lumen `cards`, Linen `columns`, Maison `carte.style`, Zen `photos`): they move into the group
  right after `menu.layout` and only apply while it is `auto`. `"skip"` and `"skipOptions"` work as for the page layout
  (none uses them).
- A menu section with no side space of its own sets `--kit-mn-pad` for the shared menu (Pizzeria, Night Market,
  Monogrid, Folio).

How a template wires it (its own menu stays the children):

```tsx
<SiteMenu ctx={ctx} like="list" level={2} id="menu-list" empty={t.noResults}>{its own menu}</SiteMenu>
```

Props: `like` (required), `level` (category headings h2 or h3, default 3 under the section's own h2), `sections`
(default `ctx.sections`; Pro pages pass `menuSections()` or `categorySections()` from `_premium/pages.ts`), `id` (keep
the id `MenuSearch` filters), `empty` (no-results text), `catalog` (adds the `data-product`, `data-cat`, `data-price`
and `data-order` that `CatalogControls` reads), `services` and `pricePrefix` (service templates: "Not available",
"From"), `page` (a whole menu or category page), `ownNav`, `flat` (one list without category titles) and `action` (a
button on each product beside the one that opens it, `{ href, label, icon }` or null: Pocket's "Ask" on WhatsApp,
Handy and Atelier's "Book").

`templates/menu-layout.test.tsx` renders every template with every layout (defaults unchanged, every product shown,
English and Arabic, unique ids, one h1, Pro menu and category pages), and `e2e/menu-layout.spec.ts` checks every layout on
every template on a phone (other options picked from a seed per template, English and Arabic), plus the drop-down, the
search, the filters and the side list. In fixture mode the tokens are `ml` (layout), `mcol` (columns), `mph` (photos),
`mrat` (photo proportions), `mpr` (prices), `mnav` (category links) and `mtit` (category titles), for example
`/_preview/fixture.souq.default.ar.ml_tiles-mnav_tabs-mtit_number`. Preview pictures: `public/kit/previews/menu-*.svg`,
`menucols-*.svg`, `menuphotos-*.svg`, `menushape-*.svg`, `menuprice-*.svg`, `menunav-*.svg` and `menutitle-*.svg`.

## Sections (`_kit/sections-settings.json`, `sections.ts`, `Sections.tsx`, `sections.css`)

Every template gets a shared "Sections" group (الأقسام), added by `scripts/build-registry.mjs` right after "Menu
layout". It holds the order of the sections, then one layout per kind of section the template has, then the template's
own "Sections" fields (which sections show, the announcement). Every option starts on `auto` ("Template default") and
the template's own order: the page then renders exactly as before. A layout other than `auto` swaps in the shared
section of `_kit/Sections.tsx`, drawn by `_kit/sections.css` (imported by every `styles.css` after `menu.css`) with the
template's own `--k-*` variables, fonts and corners.

| Key | Shown when the template has | Options |
|---|---|---|
| `sections.order` | always | the template's sections, between the opening (always first) and the footer (always last) |
| `highlights.layout` | `highlights.1.title` | auto, icons (in a row), cards, numbered (a numbered list), statement (one big line), alternating (side by side with photos), marquee (a moving strip) |
| `story.layout` | `story.text` | auto, beside (photo beside the text), behind (photo behind the text), quote (the first sentence big), timeline, columns, letter (a signed note) |
| `gallery.layout` | `gallery` | auto, grid, masonry, carousel (a slider), polaroid, feature (one big photo and small ones), strip (a full-width row) |
| `reviews.layout` | `reviews.1.quote` | auto, cards, quote (one big quote), carousel, wall (sticky notes), summary (stars and short quotes) |
| `visit.layout` | `hours` | auto, map (map, details and hours), cards (hours, place, contact), table (a big hours table), centered (today's hours large), banner (a colored band) |
| `footer.layout` | always | auto, simple, columns, big (the name large), centered, minimal |

`sections.order` is a field of type `order`: its options are the template's section names (from `order.labels` in
`sections-settings.json`, such as `menu`, `highlights`, `story`, `gallery`, `reviews`, `faq`, `visit`) and its value is
the list in the owner's order. The backend (`TemplateSchema`) accepts only distinct known names; names left out keep
their place after the named ones (`sectionOrder()` in `sections.ts`), so a template that gains a section later still
shows it. The mobile editor shows it as a list with up and down buttons.

Each manifest lists its sections in the order it renders them, which is also the default:

```json
"sectionsLayout": { "order": ["highlights", "signature", "menu", "story", "gallery", "reviews", "visit"] }
```

`"skip"` and `"skipOptions"` work as for the page layout (none uses them). A template's own section that the shared list
has under another name uses the shared name (Folio and Drop's picks are `highlights`), and links to it still sort with
it (`ANCHOR_ALIASES` in `sections.ts`: `work`, `lookbook` and `street` are the gallery, `process`, `how` and `week` the
steps, `contact` the visit section).

How a template wires it (its own section stays the children, shown while the layout is `auto`):

```tsx
{ordered(ctx, {
  highlights: <SiteHighlights ctx={ctx}>{its own highlights}</SiteHighlights>,
  menu: <SiteMenu ...>{its own menu}</SiteMenu>,
  story: <SiteStory ctx={ctx} title={c.story} eyebrow={c.about}>{its own story}</SiteStory>,
  gallery: <SiteGallery ctx={ctx} title={c.photos} viewer>{its own gallery}</SiteGallery>,
  reviews: <SiteReviews ctx={ctx} title={c.reviews}>{its own reviews}</SiteReviews>,
  visit: <SiteVisit ctx={ctx} title={c.visit} cta={book}>{its own visit section}</SiteVisit>,
})}
<SiteFooter ctx={ctx} links={links} social={socialAccounts(site, SOCIAL_DEFAULT)} tagline={...}>{its own footer}</SiteFooter>
```

- `ordered(ctx, parts)` renders the parts in the owner's order; the keys are the manifest's names, in the template's
  own order, and a part may be `null` when it does not show.
- `together(ctx, own, kinds)` is for templates that draw some sections in one grid (Bento, Pocket, Bistro, Monogrid):
  true while the order and those layouts are the template's own, otherwise the template renders them one by one.
- `numbered(ctx, shown)` gives chapter numbers in the owner's order (Maison), `sharedLayout(ctx, kind)` says whether a
  shared layout is on (Clinic moves its highlights out of the opening then), and `orderedLinks(ctx, links)` /
  `sortLinks()` put section links in the owner's order. The shared header (`KitHeader`) sorts its links itself.
- Props every section takes: `id` (keep the id the template's links use), `title`, `eyebrow`, `heading` (false on a page
  whose h1 already names the section). Each also takes its content, defaulting to the standard keys: `items`
  (highlights), `text`, `photo`, `since` and `more` (story), `photos`, `viewer` and `more` (gallery: with `viewer` each
  photo is a button with `data-photo="<index>"` that opens the template's photo viewer), `reviews`, `cta` (visit),
  `links`, `social` and `tagline` (footer).
- Missing content: a section with nothing to show renders nothing (the footer and the visit section always render),
  the story without a photo is a colored panel or a band with the first letter, and parts of the visit section without
  hours, an address or contact details leave themselves out.
- Multi-page Pro sites order the sections of their home page; the visit page wraps its visit, story and reviews.

`templates/sections-layout.test.tsx` renders every template with every layout and with its sections reversed (defaults
unchanged, opening first and footer last, English and Arabic, unique ids, labels that point at headings, header links in
the owner's order, the least content, the visit page of multi-page sites), and `e2e/sections-layout.spec.ts` checks every layout on every template on a phone (English and
Arabic, the last page with the least content, axe, no sideways scroll, links landing), the reversed order in both
languages, and that the photo slider scrolls inside itself and opens the viewer. In fixture mode the tokens are `hil`
(highlights), `stl` (story), `gll` (gallery), `rvl` (reviews), `vsl` (visit), `ftl` (footer) and `so` (the order,
names joined with `+`), for example `/_preview/fixture.souq.default.ar.so_reviews+menu-stl_quote-gll_carousel`. Preview
pictures: `public/kit/previews/highlights-*.svg`, `story-*.svg`, `gallery-*.svg`, `reviews-*.svg`, `visit-*.svg` and
`footer-*.svg`.

## Signature options and looks (manifest `"signature"` and `"looks"`)

Every template has 1 to 3 **signature options**: options of a shared layout field (`header.layout`, `hero.variant`,
`menu.layout` or `story.layout`) that only that template has, for example Ticket's "Admission ticket" opening and
"Tear-off tickets" menu. They are written in the manifest:

```json
"signature": {
  "hero.variant": [{ "id": "stub", "base": "poster", "label": "Admission ticket", "labelAr": "تذكرة دخول",
                     "preview": "/templates/ticket/previews/hero-stub.svg" }]
}
```

- `scripts/build-registry.mjs` puts each one right after "Template default" (`auto`) in the field's options, with its
  labels and picture, marks the field with `"signature": [ids]`, and writes `_kit/signatures.generated.json`. It refuses a
  field that takes no signature, an `auto` or unknown base, an id that is a shared option or another template's signature,
  missing labels, and a picture that is not in `public/templates/<id>/previews/`, is missing, or contains `<text>`.
- Each one is drawn by its `base` (a shared option), so it has the same words, links, photos and accessibility.
  `_kit/signatures.ts` turns it into the base for the kit and puts `data-sig="<id>"` on the header, opening, menu or story
  section, and the list of every signature in use on the template root. Decorations go in an `aria-hidden` `.kit-sig-art` slot.
- The look is the template's own CSS: `templates/<id>/signature.css`, imported at the end of `styles.css`, keyed on
  `[data-sig="<id>"]`. It must work right to left, in light and dark themes, on a phone and a desktop, without photos and
  with reduced motion.

Every template also has 4 to 6 **looks**: named sets of design settings the owner applies with one tap (the "Looks"
strip at the top of the app's editor; the AI helper is told about them too):

```json
"looks": [{ "id": "receipt", "label": { "en": "Till receipt", "ar": "إيصال الصندوق" },
            "values": { "theme": "thermal", "accent": "#D3412F", "font": "mono", "menu.layout": "auto" } }]
```

- Ids are `a-z0-9` with no dashes (fixture tokens split on `-`), and names are up to 24 characters.
- Looks set only choices, themes, colors, switches and sizes, never texts or photos. Each value must be one the field takes.
- The registry gives every look of a template the same keys, filling the ones it leaves out with the defaults, so
  applying one look after another leaves nothing behind.
- The API stores them in `Templates.Looks` (`TemplateSchema.ValidLooksAsync` checks them again on import). The app reads
  them from `GET /api/v1/templates` (`looks`).
- The gallery thumbnail shows the first look.

Tests: `templates/signatures.test.tsx` (the registry rules, each signature on its base in both languages with nothing but
its marks and decorations added, each look from the `look_<id>` fixture token) and `e2e/signatures.spec.ts` (every
signature, all of them on the least content, and every look on a phone, half in Arabic, with axe, no sideways scroll and no
page errors). In fixture mode: `/_preview/fixture.ticket.default.ar.hv_stub-ml_tickets` or `/_preview/fixture.ticket.default.en.look_receipt`.

## Random combinations

Owners mix everything at once, so `e2e/combinations.spec.ts` renders random option sets on every template from the
production build. `e2e/combinations.ts` builds them from `registry.json` with a seeded random generator: a look as a base,
then colors, fonts, every shared group, the signature options and a random section order, plus long names, labels,
logos and more photos, half in Arabic, on a phone and a desktop, sometimes on an inner page of the Pro templates. Each
page must pass axe (WCAG 2 A/AA and 2.2 target size), have no sideways scroll and no page or console errors, keep heading
and button text inside its box (nothing cut off by a box that hides its overflow), keep the main call to action clear of
fixed or sticky bars, give every image an alt text, and keep text readable on what is really behind it: text that axe
can't judge (over photos, gradients, textures) is measured on a screenshot of its place with all text hidden.

Two combinations per template run by default (CI); `COMBOS=1` runs twelve and `COMBOS=<n>` runs n. `COMBO_SHOTS=<dir>`
saves a screenshot of each page, `COMBO_REPORT=<file>` writes one JSON line per page, `COMBO_URL=<path>` checks one page
and `COMBO_REPLAY=<file>` checks again the pages that had issues in a report. Any schema field can be set from a fixture
token as `f<n>_<value>` (field n of the template's schema, counted from 0: an option index, `c<rrggbb>` for a color, `1`/`0`,
a number, or option indexes joined by `+`, `n` for none), for example
`/_preview/fixture.pulse.default.en.look_volt-f12_2-f37_0+2+1`.

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

Thumbnails: `npm run build`, then `THUMBNAILS=1 npm run test:e2e -- --project=mobile thumbnails` (each in its first look).
