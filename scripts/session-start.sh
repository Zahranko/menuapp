#!/bin/bash
# SessionStart hook for Claude Code cloud sessions: starts PostgreSQL and restores dependencies.
# Does nothing outside cloud sessions. Never fails the hook.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$(dirname "$0")/.." || exit 0

if command -v service >/dev/null 2>&1; then
  service postgresql start >/dev/null 2>&1 || true
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='storefront'" 2>/dev/null | grep -q 1 \
    || sudo -u postgres psql -c "CREATE ROLE storefront LOGIN PASSWORD 'storefront' CREATEDB" >/dev/null 2>&1 || true
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='storefront'" 2>/dev/null | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE storefront OWNER storefront" >/dev/null 2>&1 || true
fi

if command -v dotnet >/dev/null 2>&1; then
  dotnet restore Storefront.sln >/dev/null 2>&1 || true
fi
if command -v npm >/dev/null 2>&1 && [ -f apps/sites/package-lock.json ]; then
  (cd apps/sites && npm ci --no-audit --no-fund >/dev/null 2>&1) || true
fi
if command -v flutter >/dev/null 2>&1 && [ -f apps/mobile/pubspec.yaml ]; then
  (cd apps/mobile && flutter pub get >/dev/null 2>&1) || true
fi
exit 0
