# Status

Update this file at the end of every session: mark the row, add follow-ups and decisions.

| ID | Session | Status | PR | Notes |
|---|---|---|---|---|
| S00 | Repo bootstrap, tooling, CI | done | | .NET 10 solution, Next.js 16 sites, Flutter app, CI, brand scripts |
| S01 | Domain model and persistence | done | | Entities, value objects, EF Core + PostgreSQL, Initial migration, dev seeder |
| S02 | Auth and accounts API | done | | Register, login (email or phone), rotating refresh tokens, password reset, business profile |
| S03 | Catalog API | done | | Categories, products, image upload, outbox dispatcher, signed revalidation, audit log |
| S04 | Sites, templates, public read API | done | | Template gallery, schema-validated drafts, publish, preview tokens, public by-slug/by-host/preview with ETags |
| S05 | Plans, billing abstraction, custom domains | not started | | |
| S06 | Back office (MVC) | not started | | |
| S07 | Next.js foundation and routing | done | | Host/slug routing in proxy.ts, typed API client, fixtures, signed revalidate endpoint, preview route, fallback template |
| S08 | Next.js template 001 "Souq" and SEO | done | | Souq with all sections, shared template kit, JSON-LD, per-host robots and sitemap, Open Graph image, Playwright smoke test |
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
- `Auth__SigningKey` (32+ characters, secret, required outside Development), `Auth__Issuer`, `Auth__Audience`, `Auth__AccessTokenMinutes` (15), `Auth__RefreshTokenDays` (30) (S02).
- `Email__Smtp__Host`, `__Port`, `__UserName`, `__Password`, `__EnableSsl`: when Host is empty, emails go to the log (S02). Sender is `noReplyEmail` from brand.json.
- `Revalidation__Url` (the Next.js endpoint, for example `https://{domain}/api/revalidate`) and `Revalidation__Secret` (shared HMAC secret). The API POSTs `{"tags":["site:<slug>"]}` (plus `host:<domain>` when a custom domain changes) with header `X-Storefront-Signature` = lowercase hex HMAC-SHA256 of the exact body. Empty Url = no calls (S03, used by S07).
- `Storage__Provider` (`local` or `s3`), `Storage__PublicBaseUrl`, `Storage__LocalRoot`, and for S3/R2: `Storage__ServiceUrl`, `Storage__Bucket`, `Storage__AccessKey`, `Storage__SecretKey`, `Storage__Region` (S03). Local files are served by the API at `/media`.
- `Outbox__Enabled` (true), `Outbox__PollSeconds` (2) (S03).
- `RateLimits__AuthPerMinute` (10), `RateLimits__SlugCheckPerMinute` (60), `RateLimits__PublicPerMinute` (600), per client IP (S02).
- `Storefront__SeedSampleData` (true in Development): seeds plans, templates and the sample business `vanillamenu` (S01). Sample owner login: `owner@example.com` / `Sample-pass-123`, development only.
- `Storefront__MigrateOnStartup`: apply migrations at startup outside Development (S01). `Storefront__SkipDatabaseStartup`: skip migrate and template import (used by `export-openapi.sh`).
- Next.js (`apps/sites`, S07): `STOREFRONT_API_URL` (API base URL, default `http://localhost:5080`), `REVALIDATE_SECRET` (must equal the API's `Revalidation__Secret`), `SITES_MAIN_HOSTS` (extra hosts treated like the brand domain, default `localhost,127.0.0.1`), `IMAGE_HOSTS` (comma-separated hosts allowed for `next/image`, e.g. the storage public host), `APP_FIXTURES=1` (serve the sample site `vanillamenu` without the API; preview token `fixture`), `APP_FIXTURE_TEMPLATE` (template id for the fixture). The API's `Revalidation__Url` is `https://{domain}/api/revalidate`.
- `Storefront__TemplateRegistryFile`, `Storefront__ReservedSlugsFile`: paths when the app runs outside the repo (Docker). Found automatically inside the repo (S01).

## Follow-ups

(Things a session found that belong to another session. Format: `- [S07] what and why (found in S03)`.)

- [S09] Add a `/reset-password?email=&token=` page on the marketing site that posts to `POST /api/v1/auth/reset-password`; the reset email links there (found in S02).
- [S15] Rate limiting partitions by `RemoteIpAddress`; behind Caddy, enable forwarded headers so it sees the client IP (found in S02).
- [S04] The public API has no way to list published slugs, so the brand domain's sitemap only lists marketing pages. Add `GET /api/public/v1/sites` (slugs and published dates) and list the sites in `app/sitemap.ts` (found in S08).
- [S04] `PublicBusinessDto` has no logo; Souq reads the logo from its `logo` setting. If the business profile gets a logo later, use it as the default (found in S08).
- [S13] Souq's schema grew: `logo`, `hero.eyebrow`, `highlights.{1,2,3}.title/text`, `story.title`, `story.since`, `reviews.{1,2,3}.quote/name`. The editor renders them from the schema; group order follows the manifest (found in S08).
- [S10] The OpenAPI document has no bearer security scheme yet; add one (document transformer) before generating the Flutter client (found in S02).

## Decisions made during sessions

(Anything decided that is not in PLAN.md, with the reason.)

- S00: Next.js 16 (current stable) with Cache Components on. `apps/sites/next.config.ts` sets the Turbopack root to the repo root so `lib/brand.ts` can import `brand.json`.
- S08: Shared template kit in `apps/sites/templates/_kit/` (menu data, hours, contrast-safe accent colors, fonts, search, category tabs, item dialog, drawer, icons). Guide: `docs/templates.md`.
- S08: Accent colors are adjusted when needed so text reaches 4.5:1 (for example the default red is darkened slightly behind white button text). Sold-out products use the muted text color and a struck-through price instead of 45% opacity, for the same reason.
- S08: Souq shows only content the owner provides: no made-up ratings, review counts or "since" years. Reviews, the eyebrow line, the "since" badge and the gallery appear when filled in; highlights default to editable café copy.
- S08: The footer newsletter field opens an email to the business (no mailing-list service exists). Product photos without an image show a tinted tile with the first letter.
- S08: Open Graph images use the brand domain as `metadataBase` (`/s/<slug>/opengraph-image`), which works for custom domains too. Arabic text in OG images needs a bundled Arabic font (not done).
- S08: In fixture mode `/<template id>` shows the sample business with that template; template ids are therefore 3 to 30 lowercase letters and digits (checked by `templates:registry`).
- S08: Files (any path whose last segment has a dot) are served as they are on every host, so `/templates/...` and `/samples/...` work on custom domains. Preview tokens are matched first because they contain dots.
- S07: Cache Components are off. The sites use fetch with `next: { tags }`: `site:<slug>` (revalidate 3600 s as a safety net) and `host:<domain>` (60 s); `/api/revalidate` calls `revalidateTag(tag, { expire: 0 })`. This replaces the S00 note about Cache Components.
- S07: `proxy.ts` (Next 16's middleware) rewrites `{domain}/<slug>` to the internal route `/s/<slug>` and `/_preview/<token>` to `/s-preview/<token>`; neither can clash with a slug because slugs never contain `-` and `s` is too short. Custom hosts are resolved with `by-host` and cached in memory for 60 s; unknown hosts get the not-found page.
- S07: Marketing pages and sites are separate root layouts (`app/(marketing)`, `app/(site)`) so each site sets its own `lang`/`dir`; `app/global-not-found.tsx` handles unmatched URLs.
- S07: Templates are registered in `apps/sites/templates/registry.ts` (id → component). Ids without a component render the fallback template.
- S04: Draft settings are validated against the template schema and stored complete (missing keys take the template's defaults). Unknown keys are rejected. Field errors are keyed `settings.<key>`.
- S04: Preview tokens are HMAC-signed (key derived from `Auth__SigningKey`), valid 30 minutes; preview URL is `https://{domain}/_preview/<token>`. `GET /api/public/v1/preview/{token}` is `no-store`.
- S04: Public site responses: `Cache-Control: public, max-age=60, stale-while-revalidate=300` and a content-hash ETag (304 on `If-None-Match`). Unpublished sites are 404. `by-host` also matches `www.` + an active domain. Categories without products are left out; sold-out products stay with `isAvailable: false`.
- S04: Templates got a `Description` column (from the manifest's `description`).
- S03: The outbox keeps fine-grained event types (`ProductChanged`, `CategoryChanged`, `BusinessChanged`, `SitePublished`, `DomainActivated`, `DomainDeactivated`); the dispatcher treats them all as "site content changed" and sends one revalidation per business per batch. Retries back off from 5 seconds to 1 hour, 10 attempts.
- S03: Product images must be URLs uploaded through `/api/v1/media` by the same business. Prices with more decimals than the currency allows are rejected ("Use numbers only, like 3.50.").
- S03: Fixed the integration tests so they really use their own throwaway database (the connection string is now read when the DbContext is created).
- S02: Register requires the phone number with its country code (E.164 after removing spaces); the app combines the country picker and the number. Errors use the prototype copy; a taken link says "That link is taken. Try adding your city, like {slug}amman." and slug-availability returns a free `suggestion`.
- S02: Login errors are `auth.invalid` (wrong email, phone or password) and `auth.locked` (5 failures, 5 minutes), both 401. Refresh reuse revokes every token that grew from the reused one.
- S02: New owners start on `basic` with a 14-day `trialing` subscription (provider `none`) until D8 is decided.
- S01: Template settings are a flat JSON object keyed by schema field key (`"hero.title"`), so the editor and validator never walk nested paths. Field types: choice, palette, color, text, textarea, range, image, images, toggle, toggles, hours. Images are `preset:<name>` or an uploaded URL.
- S01: `apps/sites/templates/souq/manifest.json` and `registry.json` (built by `npm run templates:registry`, checked by `npm run templates:check`) were created early because the seeder needs a template. S08 owns the Souq manifest from here.
- S01: Added `Business.TimeZone` (default `Asia/Amman`) for "today" in opening hours, `Site.PublishedTemplateId` so changing template in the draft does not change the live site, and `RefreshToken.ReplacedById` for rotation.
- S01: Global query filters return nothing when there is no business in the token. Public and staff reads use `IgnoreQueryFilters()` in the repository method that needs it.
- S01: Persistence tests live in `Storefront.Web.IntegrationTests` and each class gets its own throwaway database.
- S00: Tests use xUnit; architecture rules use NetArchTest.Rules plus assembly reference checks.
- S00: OpenAPI document is served at `/openapi/v1.json`; `scripts/export-openapi.sh` drops the `servers` list so exports are stable.
- S00: The web manifest is `apps/sites/app/manifest.ts` (reads brand config at build time), so `rebrand.sh` only copies the favicon to `apps/sites/app/icon.svg`.
