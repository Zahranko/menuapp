// Builds templates/registry.json from every templates/<id>/manifest.json.
// The backend seeds its Templates table from that file, so both sides always agree.
// Usage: node scripts/build-registry.mjs [--check]   (--check fails if the committed file is stale)
//
// Arabic: every field gets "labelAr" (and "groupAr", "optionLabelsAr") from templates/_i18n/ar.json, an
// English → Arabic dictionary of editor strings; a field that already has them in its manifest keeps its own.
// Each manifest carries "ar" (name, category, description) and "defaultsAr", the Arabic starter text that
// overrides "defaults" for Arabic businesses: one entry for every non-empty text default, within the field's max.
//
// Logo options: every template's schema gets the shared fields of templates/_kit/logo-settings.json (logo frame, size,
// position and "show business name") right after its "logo" field, in the same group, with their defaults. Manifests
// never list them; templates/_kit/logo.ts reads them, and _kit/logo.css styles them.
//
// Site options: every template also gets the shared fields of templates/_kit/site-options.json, read by
// templates/_kit/options.ts and styled by _kit/options.css:
//  - "Fonts & colors": the template's own "font", "theme" and "accent" move into this group (right after the logo's
//    group), with the shared font choice ("font.family") after "font". The accent gets more color presets and
//    "custom": true (any #RRGGBB color; the sites keep its text readable with _kit/color.ts). The shared background
//    color ("colors.background", in "afterTheme") comes right after "theme"; _kit/background.ts recolors the theme with it.
//  - "Footer" (footer.nameSize, after the template's own footer fields if it has some), "Social media" (social.show)
//    and "Order button" (order.action, order.shape, order.label) at the end.
// Their defaults keep every site as it was. A manifest may only set its own default for "social.show" (templates whose
// footer already showed Instagram and WhatsApp icons list them, so those icons stay).
//
// Cards: every template gets the shared fields of templates/_kit/card-settings.json (card style, border, border color,
// corners, photo shape, spacing) in a "Cards" group right after "Fonts & colors". templates/_kit/cards.ts reads them and
// _kit/cards.css styles every product card (.kit-card) and category tile (.kit-cat). "auto" keeps the template's look.
//
// Page style: every template gets the shared fields of templates/_kit/style-settings.json (text size, heading style and
// letter spacing, space between sections, buttons, photo shapes, section dividers, background texture and motion) in a
// "Page style" group right after "Cards". templates/_kit/style.ts turns them into data attributes on the template's root
// and _kit/style.css styles them; "auto" keeps the template's look. A manifest may leave some out with
// "pageStyle": { "skip": ["style.motion"] } (left out of registry.json), for a template with its own version of a setting.
//
// Page layout: every template gets the shared fields of templates/_kit/layout-settings.json (header layout, header look,
// header while scrolling and the layout of the top of the page, "hero.variant") in a "Page layout" group right after
// "Page style". templates/_kit/layout.ts reads them, _kit/Top.tsx renders the shared headers and openings and
// _kit/layout.css styles them; "auto" keeps the template's own header and opening. A template's own "hero.layout" (its
// own versions of its opening) moves into this group right after "hero.variant", relabelled as what "Template default"
// shows. A manifest may leave fields or options out with
// "layout": { "skip": ["header.sticky"], "skipOptions": { "hero.variant": ["menu"] } } (left out of registry.json).
//
// Menu layout: every template gets the shared fields of templates/_kit/menu-settings.json (menu layout, columns on big
// screens, product photos and their proportions, prices, category links and category titles) in a "Menu layout" group
// right after "Page layout". templates/_kit/menu.ts reads them, _kit/Menu.tsx renders the shared menu and _kit/menu.css
// styles it; "auto" everywhere keeps the template's own menu. A template's own menu choices move into this group right
// after "menu.layout" with "menu": { "own": ["carte.style"] } (they are what "Template default" shows). A manifest may
// leave fields or options out with "menu": { "skip": [...], "skipOptions": { "menu.layout": [...] } } (left out of registry.json).
//
// Sections: every template gets the shared fields of templates/_kit/sections-settings.json in a "Sections" group right
// after "Menu layout": "sections.order", the order of its sections between the opening and the footer (a field of type
// "order": its value is the list of the template's section names; its options are the names, in the template's own
// order, labelled from the shared list), then one layout per kind of section the template has (highlights when it has
// "highlights.1.title", the story when it has "story.text", photos when it has "gallery", reviews when it has
// "reviews.1.quote", the visit section when it has "hours", and always the footer). templates/_kit/sections.ts reads them,
// _kit/Sections.tsx renders the shared sections and ordered() puts the sections in the owner's order; "auto" and the
// template's own order keep the page exactly as before. The template's own "Sections" fields (which sections show and the
// announcement) move into the group, after the shared ones. Each manifest lists its sections in
// "sectionsLayout": { "order": ["highlights", "menu", "story", "visit"] } (names from the shared list, in the order the
// template renders them), and may leave fields or options out with "skip" and "skipOptions" (left out of registry.json).
//
// Previews: a "choice" field may carry "previews", a small picture per option ({ "pill": "/kit/previews/buttons-pill.svg" }),
// which the app's editor shows as picture tiles. Every key must be one of the field's options and every picture must exist
// in public/.
//
// Signature options: a manifest may add options only that template has to the shared layout fields, in
//   "signature": { "hero.variant": [{ "id": "board", "base": "type", "label": "Chalkboard", "labelAr": "سبورة",
//                                     "preview": "/templates/chalkboard/previews/hero-board.svg" }], "menu.layout": [...] }
// Fields: header.layout, hero.variant, menu.layout and the section layouts. Each option builds on a shared option of the
// field ("base": its markup and layout) and the template's own CSS (templates/<id>/signature.css) turns it into the
// template's own version, keyed on data-sig="<id>" (_kit/signatures.ts). The options go right after "auto", so the
// owner sees them first, and the field lists them in "signature". Ids are unique across every template. The mapping
// option → base goes to templates/_kit/signatures.generated.json for the sites.
//
// Looks: a manifest lists 4 to 6 named presets in "looks": [{ "id": "night", "label": { "en": "Night souq", "ar": "..." },
// "values": { "theme": "night", "hero.variant": "stall", ... } }]: a bundle of values across the kit groups, colors and
// fonts that the editor applies in one tap. Values may only set fields the template has (no texts, photos, hours or
// facts), each to one of its options (or a #RRGGBB color where the field takes any color). In registry.json every look of a
// template sets the same settings: one a look leaves out gets the template's default there.
//
// Hero slider: each manifest says what its opening looks like in "heroSlider" (left out of registry.json):
//   { "kind": "backdrop" | "panel" | "band", "source": "hero.image" | "hero.images", "skip": ["hero.overlay", ...],
//     "defaults": { "hero.transition": "fade" } }   (optional: the template's own defaults, so its slideshow stays as it was)
// backdrop: text on the photo; panel: the photo in its own frame; band: no photo before (a photo strip appears once the
// owner adds photos). The fields of templates/_kit/hero-settings.json whose "kinds" include the template's kind go in a
// "Hero slider" group right after the group of the template's hero photo (or headline). With "source": "hero.image" the
// template also gets "hero.slides" (more photos after the main one); a band template gets "hero.slides" as its only
// photos; "hero.images" templates (several photos already) use their own field. "skip" leaves out fields the template
// already has its own version of (such as its own "Image darkness"). templates/_kit/hero.ts and HeroSlider.tsx render them.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");
const registryPath = path.join(root, "registry.json");
// Optional "tier": "basic" (default when absent) or "pro" (Pro plan only; the backend gates choosing and publishing).
const TIERS = new Set(["basic", "pro"]);
const FIELD_TYPES = new Set(["choice", "palette", "color", "text", "textarea", "range", "image", "images", "toggle", "toggles", "hours", "order"]);
const TEXT_TYPES = new Set(["text", "textarea"]);
const dictionary = JSON.parse(readFileSync(path.join(root, "_i18n", "ar.json"), "utf8"));
const logoSettings = JSON.parse(readFileSync(path.join(root, "_kit", "logo-settings.json"), "utf8"));
const siteOptions = JSON.parse(readFileSync(path.join(root, "_kit", "site-options.json"), "utf8"));
const cardSettings = JSON.parse(readFileSync(path.join(root, "_kit", "card-settings.json"), "utf8"));
const heroSettings = JSON.parse(readFileSync(path.join(root, "_kit", "hero-settings.json"), "utf8"));
const styleSettings = JSON.parse(readFileSync(path.join(root, "_kit", "style-settings.json"), "utf8"));
const layoutSettings = JSON.parse(readFileSync(path.join(root, "_kit", "layout-settings.json"), "utf8"));
const menuSettings = JSON.parse(readFileSync(path.join(root, "_kit", "menu-settings.json"), "utf8"));
const sectionsSettings = JSON.parse(readFileSync(path.join(root, "_kit", "sections-settings.json"), "utf8"));
const publicDir = path.join(root, "..", "public");
const HERO_KINDS = new Set(Object.keys(heroSettings.kinds));
const HERO_SOURCES = new Set(["hero.image", "hero.images"]);
/** Shared settings a manifest may give its own default (in "defaults"). */
const OWN_DEFAULTS = new Set(["social.show"]);
/** What each shared section layout needs in the template's schema to have something to show. */
const SECTION_CONTENT = { highlights: "highlights.1.title", story: "story.text", gallery: "gallery", reviews: "reviews.1.quote", visit: "hours" };

/** Shared fields that take template-only ("signature") options. */
const SIGNATURE_FIELDS = new Set(["header.layout", "hero.variant", "menu.layout", ...sectionsSettings.fields.map((f) => f.key)]);
/** option → base per template and field, written to templates/_kit/signatures.generated.json. */
const signatureMap = {};
const signatureIds = new Map();
/** Field types a look may set: values that change the look, never the owner's texts, photos or facts. */
const LOOK_TYPES = new Set(["choice", "palette", "color", "toggle", "range"]);

/** Tests: "--manifest <file>" uses that file in place of the manifest with the same id; "--dry" checks without writing. */
const swapAt = process.argv.indexOf("--manifest");
const swap = swapAt > 0 ? JSON.parse(readFileSync(process.argv[swapAt + 1], "utf8")) : null;

function fail(message) {
  console.error(`templates:registry: ${message}`);
  process.exit(1);
}

const manifests = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "manifest.json")))
  .map((d) => {
    const read = JSON.parse(readFileSync(path.join(root, d.name, "manifest.json"), "utf8"));
    const manifest = swap?.id === d.name ? swap : read;
    if (!/^[a-z0-9]{3,30}$/.test(d.name)) fail(`${d.name}: template ids use 3 to 30 lowercase letters and digits (they double as fixture URLs)`);
    if (manifest.id !== d.name) fail(`${d.name}/manifest.json has id "${manifest.id}"; it must match the folder name`);
    for (const key of ["number", "name", "category", "version", "schema", "defaults"]) {
      if (manifest[key] === undefined) fail(`${d.name}: missing "${key}"`);
    }
    if (manifest.tier !== undefined && !TIERS.has(manifest.tier)) fail(`${d.name}: "tier" must be "basic" or "pro" (or left out for basic)`);
    withLogoOptions(d.name, manifest);
    withSiteOptions(d.name, manifest);
    withCardOptions(d.name, manifest);
    withStyleOptions(d.name, manifest);
    withLayoutOptions(d.name, manifest);
    withMenuOptions(d.name, manifest);
    withSectionOptions(d.name, manifest);
    withHeroOptions(d.name, manifest);
    withSignatureOptions(d.name, manifest);
    const keys = new Set();
    for (const field of manifest.schema) {
      if (!FIELD_TYPES.has(field.type)) fail(`${d.name}: field "${field.key}" has unknown type "${field.type}"`);
      if (keys.has(field.key)) fail(`${d.name}: duplicate field "${field.key}"`);
      keys.add(field.key);
      if (!(field.key in manifest.defaults)) fail(`${d.name}: no default for "${field.key}"`);
      checkPreviews(d.name, field);
      if (field.type === "order") checkOrder(d.name, field, manifest.defaults[field.key]);
    }
    manifest.schema = manifest.schema.map((field) => withArabic(d.name, field));
    checkArabicText(d.name, manifest);
    checkLooks(d.name, manifest);
    return manifest;
  })
  .sort((a, b) => a.number - b.number);

/** Adds the shared logo options after the "logo" image field, and their defaults after the logo's default. */
function withLogoOptions(id, manifest) {
  const at = manifest.schema.findIndex((f) => f.key === "logo");
  if (at < 0 || manifest.schema[at].type !== "image") fail(`${id}: every template needs a "logo" image field (the logo options attach to it)`);
  for (const field of logoSettings.fields) {
    if (manifest.schema.some((f) => f.key === field.key) || field.key in manifest.defaults) {
      fail(`${id}: "${field.key}" comes from templates/_kit/logo-settings.json; remove it from the manifest`);
    }
  }
  const group = manifest.schema[at].group;
  const fields = logoSettings.fields.map((field) => (group === undefined ? { ...field } : { key: field.key, type: field.type, label: field.label, group, ...field }));
  manifest.schema.splice(at + 1, 0, ...fields);
  const defaults = {};
  for (const [key, value] of Object.entries(manifest.defaults)) {
    defaults[key] = value;
    if (key === "logo") Object.assign(defaults, logoSettings.defaults);
  }
  if (!("logo" in manifest.defaults)) Object.assign(defaults, logoSettings.defaults);
  manifest.defaults = defaults;
}

/** Adds the shared site options (fonts and colors, footer, social media, order button); see the header comment. */
function withSiteOptions(id, manifest) {
  const shared = [...siteOptions.fontsAndColors.fields, ...siteOptions.fontsAndColors.afterTheme, ...siteOptions.fields];
  for (const field of shared) {
    if (manifest.schema.some((f) => f.key === field.key)) fail(`${id}: "${field.key}" comes from templates/_kit/site-options.json; remove it from the manifest`);
    if (field.key in manifest.defaults && !OWN_DEFAULTS.has(field.key)) fail(`${id}: "${field.key}" comes from templates/_kit/site-options.json; remove its default`);
  }
  const own = Object.fromEntries([...OWN_DEFAULTS].filter((key) => key in manifest.defaults).map((key) => [key, manifest.defaults[key]]));
  for (const key of Object.keys(own)) delete manifest.defaults[key];

  // Fonts and colors: the template's own fields move after the logo's group, with the shared font choice.
  const { group, moves, accentExtras, afterTheme } = siteOptions.fontsAndColors;
  const moved = moves.map((key) => {
    const at = manifest.schema.findIndex((f) => f.key === key);
    if (at < 0) fail(`${id}: every template needs a "${key}" field (the shared font and color options attach to it)`);
    return manifest.schema.splice(at, 1)[0];
  });
  const [font, theme, accent] = moved.map((f) => ({ ...f, group, groupAr: undefined }));
  if (accent.type !== "color") fail(`${id}: "accent" must be a color field`);
  const lower = new Set(accent.options.map((o) => o.toUpperCase()));
  accent.options = [...accent.options, ...accentExtras.filter((c) => !lower.has(c.toUpperCase()))];
  accent.custom = true;
  const logoGroup = manifest.schema.find((f) => f.key === "logo").group;
  const afterLogo = manifest.schema.findLastIndex((f) => f.group === logoGroup) + 1;
  const inGroup = (fields) => fields.map((f) => ({ ...f, group }));
  manifest.schema.splice(afterLogo, 0, font, ...inGroup(siteOptions.fontsAndColors.fields), theme, ...inGroup(afterTheme), accent);

  // Footer, social media and order button.
  for (const field of siteOptions.fields) {
    const last = manifest.schema.findLastIndex((f) => f.group === field.group);
    manifest.schema.splice(last < 0 ? manifest.schema.length : last + 1, 0, { ...field });
  }

  const defaults = {};
  for (const [key, value] of Object.entries(manifest.defaults)) {
    defaults[key] = value;
    if (key === "font") defaults["font.family"] = siteOptions.defaults["font.family"];
    if (key === "theme") for (const f of afterTheme) defaults[f.key] = siteOptions.defaults[f.key];
  }
  for (const [key, value] of Object.entries(siteOptions.defaults)) {
    if (!(key in defaults)) defaults[key] = key in own ? own[key] : value;
  }
  manifest.defaults = defaults;
  for (const value of own["social.show"] ?? []) {
    if (!siteOptions.fields.find((f) => f.key === "social.show").options.includes(value)) fail(`${id}: unknown account "${value}" in "social.show"`);
  }
}

/** Inserts `fields` after the last field of the group `after` (or at the end), with their defaults. */
function insertGroup(manifest, fields, defaults, after) {
  const last = after === undefined ? -1 : manifest.schema.findLastIndex((f) => f.group === after);
  manifest.schema.splice(last < 0 ? manifest.schema.length : last + 1, 0, ...fields);
  for (const field of fields) manifest.defaults[field.key] = structuredClone(defaults[field.key]);
}

/** Adds the shared card options (templates/_kit/card-settings.json) in a "Cards" group after "Fonts & colors". */
function withCardOptions(id, manifest) {
  for (const field of cardSettings.fields) {
    if (manifest.schema.some((f) => f.key === field.key) || field.key in manifest.defaults) fail(`${id}: "${field.key}" comes from templates/_kit/card-settings.json; remove it from the manifest`);
  }
  const fields = cardSettings.fields.map((f) => ({ key: f.key, type: f.type, label: f.label, group: cardSettings.group, ...f }));
  insertGroup(manifest, fields, cardSettings.defaults, siteOptions.fontsAndColors.group);
}

/** Adds the shared page style options (templates/_kit/style-settings.json) in a "Page style" group after "Cards". */
function withStyleOptions(id, manifest) {
  const skip = new Set(manifest.pageStyle?.skip ?? []);
  delete manifest.pageStyle;
  for (const key of skip) if (!styleSettings.fields.some((f) => f.key === key)) fail(`${id}: "pageStyle.skip" has unknown field "${key}"`);
  for (const field of styleSettings.fields) {
    if (manifest.schema.some((f) => f.key === field.key) || field.key in manifest.defaults) fail(`${id}: "${field.key}" comes from templates/_kit/style-settings.json; remove it from the manifest`);
  }
  const fields = styleSettings.fields
    .filter((f) => !skip.has(f.key))
    .map((f) => ({ key: f.key, type: f.type, label: f.label, group: styleSettings.group, groupAr: styleSettings.groupAr, ...f }));
  insertGroup(manifest, fields, styleSettings.defaults, cardSettings.group);
}

/** Adds the shared page layout options (templates/_kit/layout-settings.json) in a "Page layout" group after "Page style". */
function withLayoutOptions(id, manifest) {
  const { skip: skipped = [], skipOptions = {}, ...rest } = manifest.layout ?? {};
  delete manifest.layout;
  if (Object.keys(rest).length) fail(`${id}: "layout" takes only "skip" and "skipOptions"`);
  const skip = new Set(skipped);
  const known = (key) => layoutSettings.fields.find((f) => f.key === key);
  for (const key of skip) if (!known(key)) fail(`${id}: "layout.skip" has unknown field "${key}"`);
  for (const [key, options] of Object.entries(skipOptions)) {
    const field = known(key);
    if (!field) fail(`${id}: "layout.skipOptions" has unknown field "${key}"`);
    for (const o of options) if (o === "auto" || !field.options.includes(o)) fail(`${id}: "layout.skipOptions.${key}" cannot leave out "${o}"`);
  }
  for (const field of layoutSettings.fields) {
    if (manifest.schema.some((f) => f.key === field.key) || field.key in manifest.defaults) fail(`${id}: "${field.key}" comes from templates/_kit/layout-settings.json; remove it from the manifest`);
  }
  const { group, groupAr } = layoutSettings;
  const fields = layoutSettings.fields
    .filter((f) => !skip.has(f.key))
    .map((f) => {
      const out = { key: f.key, type: f.type, label: f.label, group, groupAr, ...f };
      const left = new Set(skipOptions[f.key] ?? []);
      if (left.size === 0) return out;
      const keep = (o) => !left.has(o);
      const pick = (map) => map && Object.fromEntries(Object.entries(map).filter(([o]) => keep(o)));
      return { ...out, options: f.options.filter(keep), optionLabels: pick(f.optionLabels), optionLabelsAr: pick(f.optionLabelsAr), previews: pick(f.previews) };
    });
  // The template's own versions of its opening go right after "hero.variant": they are what "Template default" shows.
  const defaults = { ...layoutSettings.defaults };
  const own = manifest.schema.findIndex((f) => f.key === "hero.layout");
  if (own >= 0 && fields.some((f) => f.key === "hero.variant")) {
    const [field] = manifest.schema.splice(own, 1);
    const at = fields.findIndex((f) => f.key === "hero.variant") + 1;
    fields.splice(at, 0, { ...field, label: layoutSettings.ownHeroLayout.label, labelAr: layoutSettings.ownHeroLayout.labelAr, group, groupAr });
    defaults["hero.layout"] = manifest.defaults["hero.layout"];
    delete manifest.defaults["hero.layout"];
  }
  insertGroup(manifest, fields, defaults, styleSettings.group);
}

/** Leaves out the fields in `skip` and the options in `skipOptions` of shared fields (labels and pictures with them). */
function pruned(id, what, fields, skipped, skipOptions) {
  const skip = new Set(skipped);
  const known = (key) => fields.find((f) => f.key === key);
  for (const key of skip) if (!known(key)) fail(`${id}: "${what}.skip" has unknown field "${key}"`);
  for (const [key, options] of Object.entries(skipOptions)) {
    const field = known(key);
    if (!field) fail(`${id}: "${what}.skipOptions" has unknown field "${key}"`);
    for (const o of options) if (o === "auto" || !field.options.includes(o)) fail(`${id}: "${what}.skipOptions.${key}" cannot leave out "${o}"`);
  }
  return fields
    .filter((f) => !skip.has(f.key))
    .map((f) => {
      const left = new Set(skipOptions[f.key] ?? []);
      if (left.size === 0) return f;
      const keep = (o) => !left.has(o);
      const pick = (map) => map && Object.fromEntries(Object.entries(map).filter(([o]) => keep(o)));
      return { ...f, options: f.options.filter(keep), optionLabels: pick(f.optionLabels), optionLabelsAr: pick(f.optionLabelsAr), previews: pick(f.previews) };
    });
}

/** Adds the shared menu layout options (templates/_kit/menu-settings.json) in a "Menu layout" group after "Page layout". */
function withMenuOptions(id, manifest) {
  const { skip = [], skipOptions = {}, own = [], ...rest } = manifest.menu ?? {};
  delete manifest.menu;
  if (Object.keys(rest).length) fail(`${id}: "menu" takes only "own", "skip" and "skipOptions"`);
  for (const field of menuSettings.fields) {
    if (manifest.schema.some((f) => f.key === field.key) || field.key in manifest.defaults) fail(`${id}: "${field.key}" comes from templates/_kit/menu-settings.json; remove it from the manifest`);
  }
  const { group, groupAr } = menuSettings;
  const fields = pruned(id, "menu", menuSettings.fields, skip, skipOptions).map((f) => ({ key: f.key, type: f.type, label: f.label, group, groupAr, ...f }));
  // The template's own menu choices go right after "menu.layout": they are what "Template default" shows.
  const defaults = { ...menuSettings.defaults };
  const moved = own.map((key) => {
    const at = manifest.schema.findIndex((f) => f.key === key);
    if (at < 0) fail(`${id}: "menu.own" names "${key}", which is not in the schema`);
    const [field] = manifest.schema.splice(at, 1);
    defaults[key] = manifest.defaults[key];
    delete manifest.defaults[key];
    return { ...field, group, groupAr };
  });
  const at = fields.findIndex((f) => f.key === "menu.layout") + 1;
  fields.splice(at > 0 ? at : 0, 0, ...moved);
  insertGroup(manifest, fields, defaults, layoutSettings.group);
}

/** Adds the shared section options (templates/_kit/sections-settings.json) in a "Sections" group after "Menu layout". */
function withSectionOptions(id, manifest) {
  const { order, skip = [], skipOptions = {}, ...rest } = manifest.sectionsLayout ?? {};
  delete manifest.sectionsLayout;
  if (Object.keys(rest).length) fail(`${id}: "sectionsLayout" takes only "order", "skip" and "skipOptions"`);
  const labels = sectionsSettings.order.labels;
  if (!Array.isArray(order) || order.length < 2) fail(`${id}: "sectionsLayout.order" must list the template's sections (at least two) in the order it renders them`);
  for (const name of order) if (!(name in labels)) fail(`${id}: "sectionsLayout.order" has unknown section "${name}" (known: ${Object.keys(labels).join(", ")})`);
  if (new Set(order).size !== order.length) fail(`${id}: "sectionsLayout.order" lists a section twice`);
  if (!order.includes("menu")) fail(`${id}: "sectionsLayout.order" must include "menu"`);
  const all = [sectionsSettings.order, ...sectionsSettings.fields];
  for (const field of all) {
    if (manifest.schema.some((f) => f.key === field.key) || field.key in manifest.defaults) fail(`${id}: "${field.key}" comes from templates/_kit/sections-settings.json; remove it from the manifest`);
  }
  const { group, groupAr } = sectionsSettings;
  const has = (section) => section === "footer" || manifest.schema.some((f) => f.key === SECTION_CONTENT[section]);
  const layouts = sectionsSettings.fields.filter((f) => has(f.section)).map((f) => Object.fromEntries(Object.entries(f).filter(([k]) => k !== "section")));
  const { key, type, label, labelAr } = sectionsSettings.order;
  const fields = pruned(id, "sectionsLayout", layouts, skip.filter((k) => k !== key), skipOptions).map((f) => ({ key: f.key, type: f.type, label: f.label, group, groupAr, ...f }));
  const orderField = {
    key,
    type,
    label,
    labelAr,
    group,
    groupAr,
    options: order,
    optionLabels: Object.fromEntries(order.map((n) => [n, labels[n]])),
    optionLabelsAr: Object.fromEntries(order.map((n) => [n, sectionsSettings.order.labelsAr[n]])),
  };
  const shown = skip.includes(key) ? [] : [orderField];
  // The template's own "Sections" fields (which sections show, the announcement) join the group, after the shared ones.
  const own = manifest.schema.filter((f) => f.group === group);
  manifest.schema = manifest.schema.filter((f) => f.group !== group);
  const ownDefaults = Object.fromEntries(own.map((f) => [f.key, manifest.defaults[f.key]]));
  insertGroup(manifest, [...shown, ...fields, ...own], { ...sectionsSettings.defaults, [key]: order, ...ownDefaults }, menuSettings.group);
}

/** Checks an "order" field: its options are the names to order and its default lists each of them once. */
function checkOrder(id, field, value) {
  if (!Array.isArray(field.options) || field.options.length < 2) fail(`${id}: "${field.key}" needs at least two options to order`);
  if (!Array.isArray(value) || value.length !== field.options.length || field.options.some((o) => !value.includes(o))) {
    fail(`${id}: the default of "${field.key}" must list each of its options once`);
  }
}

/** Checks a field's option pictures: a choice field, known options and pictures that exist in public/. */
function checkPreviews(id, field) {
  if (field.previews === undefined) return;
  if (field.type !== "choice") fail(`${id}: field "${field.key}" has "previews", which only choice fields take`);
  if (field.previews === null || typeof field.previews !== "object" || Array.isArray(field.previews)) fail(`${id}: "previews" of "${field.key}" must map options to pictures`);
  for (const [option, url] of Object.entries(field.previews)) {
    if (!field.options.includes(option)) fail(`${id}: "previews" of "${field.key}" has unknown option "${option}"`);
    if (typeof url !== "string" || !/^\/[a-z0-9/_.-]+\.svg$/.test(url)) fail(`${id}: preview "${url}" of "${field.key}" must be a path like /kit/previews/name.svg`);
    if (!existsSync(path.join(publicDir, url))) fail(`${id}: preview ${url} of "${field.key}" is missing from public/`);
  }
}

/** Adds the shared hero slider options (templates/_kit/hero-settings.json) for the template's kind of opening. */
function withHeroOptions(id, manifest) {
  const hero = manifest.heroSlider;
  delete manifest.heroSlider;
  if (!hero || !HERO_KINDS.has(hero.kind)) fail(`${id}: "heroSlider.kind" must be one of ${[...HERO_KINDS].join(", ")}`);
  const skip = new Set(hero.skip ?? []);
  for (const key of skip) if (!heroSettings.fields.some((f) => f.key === key)) fail(`${id}: "heroSlider.skip" has unknown field "${key}"`);
  for (const key of ["hero.slides", ...heroSettings.fields.map((f) => f.key)]) {
    if (manifest.schema.some((f) => f.key === key) || key in manifest.defaults) fail(`${id}: "${key}" comes from templates/_kit/hero-settings.json; remove it from the manifest`);
  }
  let anchor;
  const fields = [];
  if (hero.kind === "band") {
    if (hero.source !== undefined) fail(`${id}: a "band" opening has no "heroSlider.source" (its photos are "hero.slides")`);
    if (manifest.schema.some((f) => f.key === "hero.image" || f.key === "hero.images")) fail(`${id}: a template with a hero photo is "backdrop" or "panel", not "band"`);
    anchor = manifest.schema.find((f) => f.key === "hero.title") ?? manifest.schema.find((f) => f.group === siteOptions.fontsAndColors.group);
    fields.push({ ...heroSettings.bandSlides });
  } else {
    if (!HERO_SOURCES.has(hero.source)) fail(`${id}: "heroSlider.source" must be "hero.image" or "hero.images"`);
    anchor = manifest.schema.find((f) => f.key === hero.source);
    if (!anchor) fail(`${id}: "heroSlider.source" names "${hero.source}", which is not in the schema`);
    const type = hero.source === "hero.image" ? "image" : "images";
    if (anchor.type !== type) fail(`${id}: "${hero.source}" must be an ${type} field`);
    if (hero.source === "hero.image") fields.push({ ...heroSettings.slides });
  }
  for (const { kinds, ...field } of heroSettings.fields) {
    if (kinds.includes(hero.kind) && !skip.has(field.key)) fields.push(field);
  }
  const grouped = fields.map((f) => ({ key: f.key, type: f.type, label: f.label, group: heroSettings.group, ...f }));
  const own = hero.defaults ?? {};
  for (const key of Object.keys(own)) if (!grouped.some((f) => f.key === key)) fail(`${id}: "heroSlider.defaults" has "${key}", which the template does not get`);
  insertGroup(manifest, grouped, { ...heroSettings.defaults, ...own }, anchor?.group);
}


/** Adds the template's own options (manifest "signature") to the shared layout fields, right after "auto". */
function withSignatureOptions(id, manifest) {
  const own = manifest.signature;
  delete manifest.signature;
  if (own === undefined) return;
  if (own === null || typeof own !== "object" || Array.isArray(own)) fail(`${id}: "signature" maps field keys to lists of options`);
  for (const [key, options] of Object.entries(own)) {
    if (!SIGNATURE_FIELDS.has(key)) fail(`${id}: "signature" cannot add options to "${key}" (only ${[...SIGNATURE_FIELDS].join(", ")})`);
    const at = manifest.schema.findIndex((f) => f.key === key);
    if (at < 0) fail(`${id}: "signature" names "${key}", which the template does not have`);
    if (!Array.isArray(options) || options.length === 0) fail(`${id}: "signature.${key}" must list at least one option`);
    const field = { ...manifest.schema[at] };
    const added = [];
    for (const o of options) {
      const where = `${id}: "signature.${key}" option "${o?.id}"`;
      if (typeof o?.id !== "string" || !/^[a-z][a-z0-9]{2,19}$/.test(o.id)) fail(`${id}: signature option ids use 3 to 20 lowercase letters and digits`);
      if (field.options.includes(o.id)) fail(`${where} is already an option of the field`);
      if (signatureIds.has(o.id)) fail(`${where} is also a signature option of ${signatureIds.get(o.id)}; ids are unique across templates`);
      signatureIds.set(o.id, id);
      if (o.base === "auto" || !field.options.includes(o.base)) fail(`${where} needs a "base": one of the field's shared options`);
      for (const k of ["label", "labelAr"]) if (typeof o[k] !== "string" || o[k].trim() === "") fail(`${where} needs "${k}"`);
      if (typeof o.preview !== "string" || !/^\/templates\/[a-z0-9]+\/previews\/[a-z0-9-]+\.svg$/.test(o.preview) || !o.preview.startsWith(`/templates/${id}/previews/`)) fail(`${where} needs a "preview" SVG in /templates/${id}/previews/`);
      const picture = path.join(publicDir, o.preview);
      if (!existsSync(picture)) fail(`${where}: ${o.preview} does not exist`);
      if (readFileSync(picture, "utf8").includes("<text")) fail(`${where}: ${o.preview} uses <text>; draw it with shapes so it looks the same everywhere`);
      const extra = Object.keys(o).filter((k) => !["id", "base", "label", "labelAr", "preview"].includes(k));
      if (extra.length) fail(`${where} has unknown keys: ${extra.join(", ")}`);
      added.push(o);
      ((signatureMap[id] ??= {})[key] ??= {})[o.id] = o.base;
    }
    const ids = added.map((o) => o.id);
    const after = (list) => [list[0], ...ids, ...list.slice(1)];
    const map = (current, pick) => Object.fromEntries(after(field.options).map((opt) => [opt, ids.includes(opt) ? pick(added.find((a) => a.id === opt)) : current?.[opt]]).filter(([, v]) => v !== undefined));
    field.optionLabels = map(field.optionLabels, (o) => o.label);
    field.optionLabelsAr = map(field.optionLabelsAr, (o) => o.labelAr);
    field.previews = map(field.previews, (o) => o.preview);
    field.options = after(field.options);
    field.signature = ids;
    manifest.schema[at] = field;
  }
}


/** Checks the template's looks ("looks"): 4 to 6 named presets of known fields and options. */
function checkLooks(id, manifest) {
  const looks = manifest.looks;
  if (looks === undefined) return;
  if (!Array.isArray(looks) || looks.length < 4 || looks.length > 6) fail(`${id}: "looks" must list 4 to 6 looks`);
  const fields = new Map(manifest.schema.map((f) => [f.key, f]));
  const seen = new Set();
  for (const look of looks) {
    const where = `${id}: look "${look?.id}"`;
    if (typeof look?.id !== "string" || !/^[a-z][a-z0-9]{1,30}$/.test(look.id)) fail(`${id}: look ids use 2 to 31 lowercase letters and digits`);
    if (seen.has(look.id)) fail(`${where} is listed twice`);
    seen.add(look.id);
    for (const lang of ["en", "ar"]) if (typeof look.label?.[lang] !== "string" || look.label[lang].trim() === "" || look.label[lang].length > 24) fail(`${where} needs "label.${lang}" (up to 24 characters)`);
    if (look.values === null || typeof look.values !== "object" || Object.keys(look.values).length < 3) fail(`${where} needs "values" (at least three settings)`);
    for (const [key, value] of Object.entries(look.values)) {
      const field = fields.get(key);
      if (!field) fail(`${where} sets "${key}", which the template does not have`);
      if (!LOOK_TYPES.has(field.type)) fail(`${where} sets "${key}", a ${field.type} field; looks only set choices, colors, switches and ranges`);
      const ok =
        field.type === "toggle"
          ? typeof value === "boolean"
          : field.type === "range"
            ? typeof value === "number" && value >= field.min && value <= field.max
            : typeof value === "string" && (field.options.includes(value) || (field.type === "color" && field.custom === true && /^#[0-9A-F]{6}$/.test(value)));
      if (!ok) fail(`${where} sets "${key}" to ${JSON.stringify(value)}, which it does not take`);
    }
  }
  // Every look sets the same settings (any a look leaves out keeps the template's default), in the schema's order, so
  // going from one look to another never leaves a part of the last one behind.
  const keys = manifest.schema.map((f) => f.key).filter((key) => looks.some((l) => key in l.values));
  manifest.looks = looks.map((l) => ({
    id: l.id,
    label: { en: l.label.en, ar: l.label.ar },
    values: Object.fromEntries(keys.map((key) => [key, structuredClone(key in l.values ? l.values[key] : manifest.defaults[key])])),
  }));
}

/** The Arabic for an editor string: the manifest's own, else the dictionary's. */
function arabic(id, field, what, english, own) {
  const value = own ?? dictionary[english];
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${id}: field "${field.key}" has no Arabic ${what} for "${english}"; add it to templates/_i18n/ar.json`);
  }
  return value;
}

/** The field with labelAr, groupAr and optionLabelsAr, each placed right after its English twin. */
function withArabic(id, field) {
  const out = {};
  for (const [key, value] of Object.entries(field)) {
    if (key === "labelAr" || key === "groupAr" || key === "optionLabelsAr") continue;
    out[key] = value;
    if (key === "label") out.labelAr = arabic(id, field, "label", value, field.labelAr);
    if (key === "group") out.groupAr = arabic(id, field, "group", value, field.groupAr);
    if (key === "optionLabels") {
      out.optionLabelsAr = Object.fromEntries(
        Object.entries(value).map(([option, english]) => [option, arabic(id, field, `label of option "${option}"`, english, field.optionLabelsAr?.[option])]),
      );
    }
  }
  if (out.labelAr === undefined) fail(`${id}: field "${field.key}" has no "label"`);
  return out;
}

/** Checks "ar" and "defaultsAr": complete, text only and within each field's max. */
function checkArabicText(id, manifest) {
  for (const key of ["name", "category", "description"]) {
    if (typeof manifest.ar?.[key] !== "string" || manifest.ar[key].trim() === "") fail(`${id}: missing Arabic "ar.${key}"`);
  }
  const defaultsAr = manifest.defaultsAr;
  if (defaultsAr === null || typeof defaultsAr !== "object" || Array.isArray(defaultsAr)) fail(`${id}: missing "defaultsAr" (the Arabic starter text)`);
  const fields = new Map(manifest.schema.map((f) => [f.key, f]));
  for (const [key, value] of Object.entries(defaultsAr)) {
    const field = fields.get(key);
    if (!(key in manifest.defaults)) fail(`${id}: "defaultsAr" has "${key}", which is not in "defaults"`);
    if (typeof value !== "string" || value.trim() === "") fail(`${id}: "defaultsAr.${key}" must be non-empty text`);
    if (!field || !TEXT_TYPES.has(field.type)) fail(`${id}: "defaultsAr.${key}" is not a text field; only text defaults get Arabic`);
    if (field.max !== undefined && value.length > field.max) fail(`${id}: "defaultsAr.${key}" is ${value.length} characters; the field allows ${field.max}`);
  }
  for (const field of manifest.schema) {
    const english = manifest.defaults[field.key];
    if (TEXT_TYPES.has(field.type) && typeof english === "string" && english.trim() !== "" && !(field.key in defaultsAr)) {
      fail(`${id}: "defaults.${field.key}" is English text with no Arabic in "defaultsAr"`);
    }
  }
}

const numbers = new Set();
for (const m of manifests) {
  if (numbers.has(m.number)) fail(`template number ${m.number} is used twice`);
  numbers.add(m.number);
}

const output = JSON.stringify({ templates: manifests }, null, 2) + "\n";
const signaturesPath = path.join(root, "_kit", "signatures.generated.json");
const signatures = JSON.stringify(Object.fromEntries(manifests.filter((m) => signatureMap[m.id]).map((m) => [m.id, signatureMap[m.id]])), null, 2) + "\n";
if (process.argv.includes("--dry")) {
  console.log(`templates:registry: valid (${manifests.length} templates)`);
} else if (process.argv.includes("--check")) {
  const current = existsSync(registryPath) ? readFileSync(registryPath, "utf8") : "";
  if (current !== output) fail("registry.json is out of date; run npm run templates:registry");
  if ((existsSync(signaturesPath) ? readFileSync(signaturesPath, "utf8") : "") !== signatures) fail("_kit/signatures.generated.json is out of date; run npm run templates:registry");
  console.log(`templates:registry: up to date (${manifests.length} templates)`);
} else {
  writeFileSync(registryPath, output);
  writeFileSync(signaturesPath, signatures);
  console.log(`templates:registry: wrote ${manifests.length} templates`);
}
