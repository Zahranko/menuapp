// Builds templates/registry.json from every templates/<id>/manifest.json.
// The backend seeds its Templates table from that file, so both sides always agree.
// Usage: node scripts/build-registry.mjs [--check]   (--check fails if the committed file is stale)
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");
const registryPath = path.join(root, "registry.json");
const FIELD_TYPES = new Set(["choice", "palette", "color", "text", "textarea", "range", "image", "images", "toggle", "toggles", "hours"]);

function fail(message) {
  console.error(`templates:registry: ${message}`);
  process.exit(1);
}

const manifests = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "manifest.json")))
  .map((d) => {
    const manifest = JSON.parse(readFileSync(path.join(root, d.name, "manifest.json"), "utf8"));
    if (manifest.id !== d.name) fail(`${d.name}/manifest.json has id "${manifest.id}"; it must match the folder name`);
    for (const key of ["number", "name", "category", "version", "schema", "defaults"]) {
      if (manifest[key] === undefined) fail(`${d.name}: missing "${key}"`);
    }
    const keys = new Set();
    for (const field of manifest.schema) {
      if (!FIELD_TYPES.has(field.type)) fail(`${d.name}: field "${field.key}" has unknown type "${field.type}"`);
      if (keys.has(field.key)) fail(`${d.name}: duplicate field "${field.key}"`);
      keys.add(field.key);
      if (!(field.key in manifest.defaults)) fail(`${d.name}: no default for "${field.key}"`);
    }
    return manifest;
  })
  .sort((a, b) => a.number - b.number);

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
