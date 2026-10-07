#!/bin/bash
# Writes the API contract to docs/api/openapi.json by starting the API and downloading its OpenAPI document.
set -euo pipefail
cd "$(dirname "$0")/.."

port="${OPENAPI_PORT:-5099}"
dotnet build src/Storefront.Web -c Release -v quiet >/dev/null
ASPNETCORE_URLS="http://127.0.0.1:${port}" ASPNETCORE_ENVIRONMENT=OpenApiExport Storefront__SkipDatabaseStartup=true Auth__SigningKey=openapi-export-only-signing-key-0123456789 \
  dotnet run --project src/Storefront.Web -c Release --no-build --no-launch-profile >/tmp/storefront-openapi.log 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  if curl -fsS --noproxy "*" "http://127.0.0.1:${port}/openapi/v1.json" -o /tmp/storefront-openapi.json 2>/dev/null; then
    mkdir -p docs/api
    # Drop the servers list: it holds this temporary port and would change every export.
    python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); d.pop("servers",None); print(json.dumps(d,indent=2))' \
      /tmp/storefront-openapi.json > docs/api/openapi.json
    echo "export-openapi: wrote docs/api/openapi.json"
    exit 0
  fi
  sleep 1
done
echo "export-openapi: the API did not start; see /tmp/storefront-openapi.log" >&2
exit 1
