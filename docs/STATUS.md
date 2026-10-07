# Status

Update this file at the end of every session: mark the row, add follow-ups and decisions.

| ID | Session | Status | PR | Notes |
|---|---|---|---|---|
| S00 | Repo bootstrap, tooling, CI | done | | .NET 10 solution, Next.js 16 sites, Flutter app, CI, brand scripts |
| S01 | Domain model and persistence | done | | Entities, value objects, EF Core + PostgreSQL, Initial migration, dev seeder |
| S02 | Auth and accounts API | not started | | |
| S03 | Catalog API | not started | | |
| S04 | Sites, templates, public read API | not started | | |
| S05 | Plans, billing abstraction, custom domains | not started | | |
| S06 | Back office (MVC) | not started | | |
| S07 | Next.js foundation and routing | not started | | |
| S08 | Next.js template 001 "Souq" and SEO | not started | | |
| S09 | Next.js marketing pages | not started | | |
| S10 | Flutter foundation, splash, onboarding | not started | | |
| S11 | Flutter sign up and log in | not started | | |
| S12 | Flutter My menu dashboard | not started | | |
| S13 | Flutter template gallery and editor | not started | | |
| S14 | Flutter plans and custom domain | not started | | |
| S15 | Deployment and hardening | not started | | |
| S16+ | Template factory | not started | | |

## Settings other sessions need

(Setting names, URLs and secrets placeholders that one session defines and another uses.)

- `ConnectionStrings__Default`: PostgreSQL connection (S01).
- `Storefront__SeedSampleData` (true in Development): seeds plans, templates and the sample business `vanillamenu` (S01). Sample owner login: `owner@example.com` / `Sample-pass-123`, development only.
- `Storefront__MigrateOnStartup`: apply migrations at startup outside Development (S01). `Storefront__SkipDatabaseStartup`: skip migrate and template import (used by `export-openapi.sh`).
- `Storefront__TemplateRegistryFile`, `Storefront__ReservedSlugsFile`: paths when the app runs outside the repo (Docker). Found automatically inside the repo (S01).

## Follow-ups

(Things a session found that belong to another session. Format: `- [S07] what and why (found in S03)`.)

## Decisions made during sessions

(Anything decided that is not in PLAN.md, with the reason.)

- S00: Next.js 16 (current stable) with Cache Components on. `apps/sites/next.config.ts` sets the Turbopack root to the repo root so `lib/brand.ts` can import `brand.json`.
- S01: Template settings are a flat JSON object keyed by schema field key (`"hero.title"`), so the editor and validator never walk nested paths. Field types: choice, palette, color, text, textarea, range, image, images, toggle, toggles, hours. Images are `preset:<name>` or an uploaded URL.
- S01: `apps/sites/templates/souq/manifest.json` and `registry.json` (built by `npm run templates:registry`, checked by `npm run templates:check`) were created early because the seeder needs a template. S08 owns the Souq manifest from here.
- S01: Added `Business.TimeZone` (default `Asia/Amman`) for "today" in opening hours, `Site.PublishedTemplateId` so changing template in the draft does not change the live site, and `RefreshToken.ReplacedById` for rotation.
- S01: Global query filters return nothing when there is no business in the token. Public and staff reads use `IgnoreQueryFilters()` in the repository method that needs it.
- S01: Persistence tests live in `Storefront.Web.IntegrationTests` and each class gets its own throwaway database.
- S00: Tests use xUnit; architecture rules use NetArchTest.Rules plus assembly reference checks.
- S00: OpenAPI document is served at `/openapi/v1.json`; `scripts/export-openapi.sh` drops the `servers` list so exports are stable.
- S00: The web manifest is `apps/sites/app/manifest.ts` (reads brand config at build time), so `rebrand.sh` only copies the favicon to `apps/sites/app/icon.svg`.
