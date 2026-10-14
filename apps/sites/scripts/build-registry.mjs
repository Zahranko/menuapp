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
//    "custom": true (any #RRGGBB color; the sites keep its text readable with _kit/color.ts).
//  - "Footer" (footer.nameSize, after the template's own footer fields if it has some), "Social media" (social.show)
//    and "Order button" (order.action, order.shape, order.label) at the end.
// Their defaults keep every site as it was. A manifest may only set its own default for "social.show" (templates whose
// footer already showed Instagram and WhatsApp icons list them, so those icons stay).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");
const registryPath = path.join(root, "registry.json");
// Optional "tier": "basic" (default when absent) or "pro" (Pro plan only; the backend gates choosing and publishing).
const TIERS = new Set(["basic", "pro"]);
const FIELD_TYPES = new Set(["choice", "palette", "color", "text", "textarea", "range", "image", "images", "toggle", "toggles", "hours"]);
const TEXT_TYPES = new Set(["text", "textarea"]);
const dictionary = JSON.parse(readFileSync(path.join(root, "_i18n", "ar.json"), "utf8"));
const logoSettings = JSON.parse(readFileSync(path.join(root, "_kit", "logo-settings.json"), "utf8"));
const siteOptions = JSON.parse(readFileSync(path.join(root, "_kit", "site-options.json"), "utf8"));
/** Shared settings a manifest may give its own default (in "defaults"). */
const OWN_DEFAULTS = new Set(["social.show"]);

function fail(message) {
  console.error(`templates:registry: ${message}`);
  process.exit(1);
}

const manifests = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "manifest.json")))
  .map((d) => {
    const manifest = JSON.parse(readFileSync(path.join(root, d.name, "manifest.json"), "utf8"));
    if (!/^[a-z0-9]{3,30}$/.test(d.name)) fail(`${d.name}: template ids use 3 to 30 lowercase letters and digits (they double as fixture URLs)`);
    if (manifest.id !== d.name) fail(`${d.name}/manifest.json has id "${manifest.id}"; it must match the folder name`);
    for (const key of ["number", "name", "category", "version", "schema", "defaults"]) {
      if (manifest[key] === undefined) fail(`${d.name}: missing "${key}"`);
    }
    if (manifest.tier !== undefined && !TIERS.has(manifest.tier)) fail(`${d.name}: "tier" must be "basic" or "pro" (or left out for basic)`);
    withLogoOptions(d.name, manifest);
    withSiteOptions(d.name, manifest);
    const keys = new Set();
    for (const field of manifest.schema) {
      if (!FIELD_TYPES.has(field.type)) fail(`${d.name}: field "${field.key}" has unknown type "${field.type}"`);
      if (keys.has(field.key)) fail(`${d.name}: duplicate field "${field.key}"`);
      keys.add(field.key);
      if (!(field.key in manifest.defaults)) fail(`${d.name}: no default for "${field.key}"`);
    }
    manifest.schema = manifest.schema.map((field) => withArabic(d.name, field));
    checkArabicText(d.name, manifest);
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
  const shared = [...siteOptions.fontsAndColors.fields, ...siteOptions.fields];
  for (const field of shared) {
    if (manifest.schema.some((f) => f.key === field.key)) fail(`${id}: "${field.key}" comes from templates/_kit/site-options.json; remove it from the manifest`);
    if (field.key in manifest.defaults && !OWN_DEFAULTS.has(field.key)) fail(`${id}: "${field.key}" comes from templates/_kit/site-options.json; remove its default`);
  }
  const own = Object.fromEntries([...OWN_DEFAULTS].filter((key) => key in manifest.defaults).map((key) => [key, manifest.defaults[key]]));
  for (const key of Object.keys(own)) delete manifest.defaults[key];

  // Fonts and colors: the template's own fields move after the logo's group, with the shared font choice.
  const { group, moves, accentExtras } = siteOptions.fontsAndColors;
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
  manifest.schema.splice(afterLogo, 0, font, ...siteOptions.fontsAndColors.fields.map((f) => ({ ...f, group })), theme, accent);

  // Footer, social media and order button.
  for (const field of siteOptions.fields) {
    const last = manifest.schema.findLastIndex((f) => f.group === field.group);
    manifest.schema.splice(last < 0 ? manifest.schema.length : last + 1, 0, { ...field });
  }

  const defaults = {};
  for (const [key, value] of Object.entries(manifest.defaults)) {
    defaults[key] = value;
    if (key === "font") defaults["font.family"] = siteOptions.defaults["font.family"];
  }
  for (const [key, value] of Object.entries(siteOptions.defaults)) {
    if (!(key in defaults)) defaults[key] = key in own ? own[key] : value;
  }
  manifest.defaults = defaults;
  for (const value of own["social.show"] ?? []) {
    if (!siteOptions.fields.find((f) => f.key === "social.show").options.includes(value)) fail(`${id}: unknown account "${value}" in "social.show"`);
  }
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
if (process.argv.includes("--check")) {
  const current = existsSync(registryPath) ? readFileSync(registryPath, "utf8") : "";
  if (current !== output) fail("registry.json is out of date; run npm run templates:registry");
  console.log(`templates:registry: up to date (${manifests.length} templates)`);
} else {
  writeFileSync(registryPath, output);
  console.log(`templates:registry: wrote ${manifests.length} templates`);
}
