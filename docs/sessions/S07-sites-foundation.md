# S07 · Next.js foundation and routing

**Depends on:** S00. **Runs alongside:** S01–S03. **Branch:** `session/s07-sites-foundation`

## Goal
The Next.js app can serve any business site by slug or custom domain, refresh on demand, and show draft previews, using fixture data until the backend API is merged.

## Read first
`docs/PLAN.md` sections 5, 6, 7 ("Routing in Next.js") and 9.

## Build
1. Data layer `lib/api.ts`: `getSiteBySlug`, `getSiteByHost`, `getPreview`, typed from `docs/api/openapi.json` with `openapi-typescript` when it has the public endpoints; otherwise hand-written types matching PLAN.md section 5, marked for replacement. A fixture mode (`APP_FIXTURES=1`) serving the "Vanilla Menu" sample.
2. `middleware.ts`: slug routing on the main host, reserved segments from `docs/reserved-slugs.txt` (copied at build time), host lookup for custom domains with a 60-second cache, rewrite to `/s/[slug]`.
3. `app/s/[slug]/page.tsx` selecting the template component from the registry by `templateId`; `not-found.tsx` with a friendly page.
4. `app/_preview/[token]/page.tsx` rendering draft settings, `noindex`, no caching.
5. `app/api/revalidate/route.ts` verifying the `X-Storefront-Signature` HMAC and calling `revalidateTag` for each tag.
6. Template registry: `templates/registry.ts` (id → component) and `npm run templates:registry` building `templates/registry.json` from every `manifest.json`. A minimal placeholder template so routing can be tested.
7. Locale and direction from the business locale (`<html lang dir>`).
8. Tests: middleware routing table (slug, reserved, custom host, unknown host), revalidate signature valid and invalid, registry build.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `npm run lint && npm run typecheck && npm test && npm run build` pass in `apps/sites`.
- `APP_FIXTURES=1 npm run dev` serves `/vanillamenu` with the placeholder template.
- `docs/STATUS.md` updated, with the environment variable names for the API base URL and the revalidate secret listed under "Settings other sessions need".
