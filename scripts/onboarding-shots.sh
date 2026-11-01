#!/bin/bash
# Remakes the app's onboarding pictures, apps/mobile/assets/onboarding/{site,products,templates}_{en,ar}.webp (780 x 1688):
#   1. the showcase site (apps/sites/lib/fixtures.ts showcaseSite) at phone size, plus the product photos and
#      template thumbnails the app screens show (apps/sites/e2e/onboarding-shots.spec.ts);
#   2. the app's Products and Templates screens (apps/mobile/test/onboarding_shots_test.dart);
#   3. cut, framed and encoded as WebP by the same Playwright spec.
# Needs Chromium for Playwright and Flutter. Regenerate the gallery thumbnails first when templates or the demo
# business change: cd apps/sites && THUMBNAILS=1 npx playwright test --project=mobile thumbnails
# Usage: scripts/onboarding-shots.sh [work folder]  (SKIP_BUILD=1 reuses the current apps/sites build)
set -euo pipefail
cd "$(dirname "$0")/.."
root="$PWD"
work="$(mkdir -p "${1:-/tmp/storefront-onboarding}" && cd "${1:-/tmp/storefront-onboarding}" && pwd)"

cd "$root/apps/sites"
[ "${SKIP_BUILD:-}" = "1" ] || npm run build
ONBOARDING_SHOTS="$work" npx playwright test --project=mobile onboarding-shots

cd "$root/apps/mobile"
flutter test test/onboarding_shots_test.dart --update-goldens --dart-define-from-file=../../brand.json --dart-define=ONBOARDING_SHOTS="$work"

cd "$root/apps/sites"
ONBOARDING_STEP=finish ONBOARDING_SHOTS="$work" npx playwright test --project=mobile onboarding-shots
echo "onboarding-shots: wrote apps/mobile/assets/onboarding (work files in $work)"
