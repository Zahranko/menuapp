# S04 · Sites, templates and the public read API

**Depends on:** S02. **Runs alongside:** S03. **Branch:** `session/s04-sites-templates`

## Goal
Owners can choose a template, save draft design settings, preview and publish. Next.js can read any published site by slug or host.

## Read first
`docs/PLAN.md` sections 5, 6 and 7. Prototype: Templates, Customize and Your website screens.

## Build
1. Template registry import: read `apps/sites/templates/registry.json` (create it with the `souq` manifest from PLAN.md section 6 if S07/S08 have not yet). Upsert into `Templates` at startup in development and through an admin action later.
2. Settings validation: a validator that checks a settings object against a template's schema (types, allowed options, text length, image URLs belonging to the business's media).
3. `GET /api/v1/templates` (anonymous allowed), `GET /api/v1/site`, `PUT /api/v1/site/template` (resets draft to the new template's defaults), `PUT /api/v1/site/draft`, `POST /api/v1/site/publish`, `POST /api/v1/site/preview-token` (signed, 30 minutes, returns `previewUrl`).
4. Public API: `GET /api/public/v1/sites/by-slug/{slug}`, `by-host/{host}`, `preview/{token}`. The response holds business info, published settings, template id, categories in order (only those with products) and products in order with `isAvailable` and `isFeatured`. Send `Cache-Control` and `ETag`.
5. Publishing writes `SitePublished` to the outbox (revalidation reuses S03's dispatcher; if S03 is not merged yet, add the outbox write only and leave a follow-up).
6. Tests: schema validation cases, publish flow, preview token expiry, public endpoints return 404 for unknown slugs and never expose drafts.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `dotnet test Storefront.sln` passes.
- `docs/api/openapi.json` regenerated.
- `docs/STATUS.md` updated.
