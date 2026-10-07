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

/** Compiles one stylesheet; errors are shortened to "file:line:column message". */
function compile(source) {
  try {
    return transform({ filename: source, code: readFileSync(source), minify: true, targets }).code;
  } catch (error) {
    const where = error.loc ? `:${error.loc.line}:${error.loc.column}` : "";
    throw new Error(`${path.relative(process.cwd(), source)}${where} ${error.message}`);
  }
}

function build() {
  // Compile everything first, so a CSS error leaves the previous stylesheets in place.
  const files = [];
  for (const dir of readdirSync(templatesDir, { withFileTypes: true })) {
    const source = path.join(templatesDir, dir.name, "styles.css");
    if (!dir.isDirectory() || !existsSync(source)) continue;
    const code = compile(source);
    const hash = createHash("sha256").update(code).digest("hex").slice(0, 10);
    files.push({ id: dir.name, name: `${dir.name}.${hash}.css`, code });
  }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const map = {};
  for (const file of files) {
    writeFileSync(path.join(outDir, file.name), file.code);
    map[file.id] = `/styles/${file.name}`;
  }
  writeFileSync(mapFile, JSON.stringify(map, null, 2) + "\n");
  console.log(`styles: built ${files.length} template stylesheets`);
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
