// Builds each template's stylesheet: templates/<id>/styles.css → public/styles/<id>.<hash>.css (minified, nesting
// compiled for older browsers) and templates/styles.generated.json (id → URL).
// Each template's page loads only its own file, so adding templates never makes other sites heavier.
// Usage: node scripts/build-styles.mjs [--watch]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import browserslist from "browserslist";
import { browserslistToTargets, transform } from "lightningcss";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(root, "templates");
const outDir = path.join(root, "public", "styles");
const mapFile = path.join(templatesDir, "styles.generated.json");
const targets = browserslistToTargets(browserslist(["chrome >= 100", "safari >= 15.4", "firefox >= 110", "edge >= 100"]));

function build() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const map = {};
  for (const dir of readdirSync(templatesDir, { withFileTypes: true })) {
    const source = path.join(templatesDir, dir.name, "styles.css");
    if (!dir.isDirectory() || !existsSync(source)) continue;
    const { code } = transform({ filename: source, code: readFileSync(source), minify: true, targets });
    const hash = createHash("sha256").update(code).digest("hex").slice(0, 10);
    const name = `${dir.name}.${hash}.css`;
    writeFileSync(path.join(outDir, name), code);
    map[dir.name] = `/styles/${name}`;
  }
  writeFileSync(mapFile, JSON.stringify(map, null, 2) + "\n");
  console.log(`styles: built ${Object.keys(map).length} template stylesheets`);
}

build();
if (process.argv.includes("--watch")) {
  let timer;
  watch(templatesDir, { recursive: true }, (_event, file) => {
    if (!file?.endsWith("styles.css")) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (error) {
        console.error(String(error));
      }
    }, 100);
  });
  console.log("styles: watching templates/*/styles.css");
}
