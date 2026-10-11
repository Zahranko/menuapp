// Builds templates/registry.json from every templates/<id>/manifest.json.
// The backend seeds its Templates table from that file, so both sides always agree.
// Usage: node scripts/build-registry.mjs [--check]   (--check fails if the committed file is stale)
//
// Arabic: every field gets "labelAr" (and "groupAr", "optionLabelsAr") from templates/_i18n/ar.json, an
// English → Arabic dictionary of editor strings; a field that already has them in its manifest keeps its own.
// Each manifest carries "ar" (name, category, description) and "defaultsAr", the Arabic starter text that
// overrides "defaults" for Arabic businesses: one entry for every non-empty text default, within the field's max.
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
