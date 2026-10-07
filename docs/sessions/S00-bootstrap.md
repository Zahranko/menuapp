# S00 · Repo bootstrap, tooling and CI

**Depends on:** nothing. **Branch:** `session/s00-bootstrap`

## Goal
An empty but fully wired monorepo where every later session can build and test on the first try.

## Read first
`CLAUDE.md`, `docs/PLAN.md` sections 2, 3, 10 and 11.

## Build
1. `Storefront.sln` with the four `src/` projects and four `tests/` projects from the repo map, targeting `net10.0`.
   Project references follow the onion rules. `Directory.Build.props`: nullable, implicit usings, `TreatWarningsAsErrors` for `src/`.
   `Directory.Packages.props` for central package versions. `global.json` pinning the installed SDK.
2. `Storefront.Web`: minimal `Program.cs` with `/health`, ProblemDetails, built-in OpenAPI document, Serilog console logging.
3. `tests/Storefront.ArchitectureTests`: rules that fail if Domain references any project or package, if Application references Infrastructure or Web, or if Infrastructure references Web.
4. `apps/sites`: Next.js with TypeScript (strict), App Router, ESLint, Vitest, `npm run typecheck`. One placeholder page.
5. `apps/mobile`: Flutter package `storefront_app`, `flutter_lints`, one widget test. Android and iOS folders included. The app ID and display name come from `brand.json` through `scripts/rebrand.sh` (step 12), never typed by hand.
6. `docs/reserved-slugs.txt`: at least `admin api app www mail help support pricing login signup register about blog terms privacy contact s _next _preview static assets dashboard settings`, plus the brand's `shortName` from `brand.json`, added by the backend and Next.js at startup (not written into the file).
7. `scripts/session-start.sh` (see below), `.claude/settings.json` registering it as a SessionStart hook, `scripts/export-openapi.sh`.
8. `.github/workflows/ci.yml`: three jobs (backend with a PostgreSQL 16 service, sites, mobile) that run the commands in CLAUDE.md.
9. `docker-compose.dev.yml` with PostgreSQL 16 for local development outside the cloud.
10. Mark S00 done in `docs/STATUS.md` (the file already exists).
11. `.editorconfig`, `.gitignore` for .NET, Node and Flutter.
12. **Brand configuration** (PLAN.md section 0):
    - `brand.json` and `scripts/brand-lint.sh` already exist in the repo. Keep them; add `brand-lint.sh` to CI.
    - `brand/` folder with placeholder `logo.svg`, `app-icon.png` (1024×1024) and `favicon.svg`.
    - Backend: `BrandOptions` record in Application, bound from `brand.json` (loaded as a configuration file by `Storefront.Web`, values overridable by environment variables `Brand__Domain` and so on).
    - Next.js: `lib/brand.ts` reading `brand.json` at build time, with `BRAND_DOMAIN` env override for staging.
    - Flutter: `lib/core/brand.dart` reading values passed with `--dart-define-from-file=../../brand.json` (keys are flat, so this works directly). Add the flag to every run, test and build command in CLAUDE.md and CI.
    - `scripts/rebrand.sh`: reads `brand.json` and updates what can't read config at runtime: Android `applicationId` and label, iOS bundle ID and display name, launcher icons and splash from `brand/`, web manifest and favicon.
    - `scripts/brand-lint.sh`: fails if the current brand name, short name or domain from `brand.json` appears anywhere in `src/`, `apps/` or `tests/` (case-insensitive), except generated files. Run it in CI and in the Done when list of every session.

`scripts/session-start.sh` must:
- exit 0 immediately unless `CLAUDE_CODE_REMOTE` is `true`;
- start the pre-installed PostgreSQL (`service postgresql start`) and create role `storefront` (password `storefront`, CREATEDB) and database `storefront` if missing;
- run `dotnet restore`, `npm ci` in `apps/sites`, `flutter pub get` in `apps/mobile`, each only if the tool exists, never failing the hook (`|| true`).

## Not in this session
Entities, endpoints, real pages or screens.

## Done when
- `dotnet build Storefront.sln` and `dotnet test Storefront.sln` pass (architecture tests included).
- `cd apps/sites && npm ci && npm run lint && npm run typecheck && npm test && npm run build` passes.
- `cd apps/mobile && flutter analyze && flutter test` passes.
- `bash scripts/session-start.sh` runs cleanly twice in a row.
- `docs/STATUS.md` marks S00 done.
