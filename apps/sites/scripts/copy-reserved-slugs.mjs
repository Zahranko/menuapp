// Copies docs/reserved-slugs.txt into lib/reserved-slugs.generated.json so the proxy can read it without file access.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, "..", "..", "..", "docs", "reserved-slugs.txt");
const target = path.join(here, "..", "lib", "reserved-slugs.generated.json");
const slugs = readFileSync(source, "utf8")
  .split("\n")
  .map((l) => l.trim().toLowerCase())
  .filter((l) => l && !l.startsWith("#"));
writeFileSync(target, JSON.stringify(slugs, null, 2) + "\n");
