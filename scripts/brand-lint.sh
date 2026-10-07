#!/bin/bash
# Fails if the current brand name, short name or domain (from brand.json) is hardcoded
# in src/, apps/ or tests/. Brand values must be read from brand config instead.
# Skips build output, dependencies, generated code, and the native app folders that
# scripts/rebrand.sh writes on purpose (android/, ios/, web/, public/brand/).
set -euo pipefail
cd "$(dirname "$0")/.."

dirs=()
for d in src apps tests; do [ -d "$d" ] && dirs+=("$d"); done
if [ ${#dirs[@]} -eq 0 ]; then echo "brand-lint: no source folders yet, nothing to check"; exit 0; fi

# Unique, case-insensitive terms; a term that contains a shorter one (sufrly.com contains sufrly) is covered by it.
mapfile -t terms < <(python3 -c '
import json
b=json.load(open("brand.json"))
t=sorted({x.lower() for x in (b["brandName"],b["brandShortName"],b["domain"]) if x},key=len)
print("\n".join(x for i,x in enumerate(t) if not any(y in x for y in t[:i])))')

found=0
for t in "${terms[@]}"; do
  if grep -rniF -e "$t" "${dirs[@]}" \
      --exclude-dir={node_modules,.next,bin,obj,build,.dart_tool,generated,Migrations,android,ios,web,brand} \
      --exclude='*.lock' --exclude='package-lock.json' --exclude='pubspec.lock'; then
    found=1
  fi
done

if [ "$found" -eq 1 ]; then
  echo
  echo "brand-lint: the lines above hardcode the brand. Read the value from brand config instead (see CLAUDE.md, Brand)."
  exit 1
fi
echo "brand-lint: OK (${terms[*]} not hardcoded in ${dirs[*]})"
