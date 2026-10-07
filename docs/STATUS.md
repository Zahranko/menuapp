# Status

Update this file at the end of every session: mark the row, add follow-ups and decisions.

| ID | Session | Status | PR | Notes |
|---|---|---|---|---|
| S00 | Repo bootstrap, tooling, CI | done | | .NET 10 solution, Next.js 16 sites, Flutter app, CI, brand scripts |
| S01 | Domain model and persistence | done | | Entities, value objects, EF Core + PostgreSQL, Initial migration, dev seeder |
| S02 | Auth and accounts API | done | | Register, login (email or phone), rotating refresh tokens, password reset, business profile |
| S03 | Catalog API | done | | Categories, products, image upload, outbox dispatcher, signed revalidation, audit log |
| S04 | Sites, templates, public read API | done | | Template gallery, schema-validated drafts, publish, preview tokens, public by-slug/by-host/preview with ETags |
| S05 | Plans, billing abstraction, custom domains | in progress | | Done on the `test` branch: plans seeded everywhere, `GET /plans`, `GET /subscription`, `POST /subscription/change` through `IPaymentProvider` (fake, applies at once), `GET/POST/DELETE /domain-request` with Pro gating, brand-domain refusal and cancel-on-downgrade, `Billing:TestMode`. Not yet: webhook, DNS checker job, Caddy ask endpoint |
| S06 | Back office (MVC) | not started | | |
| S07 | Next.js foundation and routing | done | | Host/slug routing in proxy.ts, typed API client, fixtures, signed revalidate endpoint, preview route, fallback template |
| S08 | Next.js template 001 "Souq" and SEO | done | | Souq with all sections, shared template kit, JSON-LD, per-host robots and sitemap, Open Graph image, Playwright smoke test |
| S09 | Next.js marketing pages | not started | | |
| S10 | Flutter foundation, splash, onboarding | not started | | |
| S11 | Flutter sign up and log in | in progress | | Sign up (live link check, strength bar, API field errors), log in by email or phone, forgot password, welcome with the live link, secure token storage, refresh on 401, en/ar. Not yet: generated Dart client, screenshots |
| S12 | Flutter My menu dashboard | done | | On the `test` branch: header with View site, live link bar, Products (stats, search, filter chips, grouped list, optimistic sold-out switch with rollback, pull to refresh), product sheet (photo upload, validation, label, Signature picks, delete with confirm), Categories (counts, Hidden on site, arrows to reorder, add, rename, delete with move or delete), Settings (website, business info, plan, domain, account), site in a WebView |
| S13 | Flutter template gallery and editor | done | | On the `test` branch: gallery with filter chips and thumbnails, confirm before replacing a design, editor with WebView preview refreshed after each 600 ms debounced draft save, a control per schema field type (unknown types skipped), reset to defaults, save before leaving, Publish with View site and Manage menu |
| S14 | Flutter plans and custom domain | done | | On the `test` branch: Basic/Pro plan card with upgrade and downgrade sheets (checkout URL opens in the browser when a provider needs it), domain card locked on Basic, request form, four progress steps, cancel. Waits on D4/D5 for real payments |
| S15 | Deployment and hardening | in progress | | API security done early: forwarded headers for Caddy, HTTPS-only with HSTS, security headers, global and per-owner rate limits, sign-out everywhere. Deployment still to do |
| S16+ | Template factory | in progress | | Batch 1: templates 002 to 006 (Linen List, Night Market, Arch Story, Pocket Catalog, Chalk Board), per-template stylesheets, sample businesses, axe checks. Batch 2: 007 to 011 (Bento, Neon Diner, Zen, Bistro Card, Pizzeria). Batch 3: 012 to 016 (Ticket, Garden, Mono Grid, Spice Route, Polaroid). Service websites: 017 to 021 (Atelier, Clinic, Agency, Pulse, Handy). Plan for the rest: `docs/templates-catalog.md` |

## Settings other sessions need

(Setting names, URLs and secrets placeholders that one session defines and another uses.)

- `ConnectionStrings__Default`: SQL Server connection (S01; PostgreSQL until the site4now move).
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

- [S15] The owners' websites (`apps/sites`) are not hosted yet, so "View site" and the editor preview show "This page isn't online yet". Host them (Vercel or a Node host), then set the `SITES_URL` deploy variable so site links and previews point there, and `Revalidation__Url`/`Secret` so saves refresh the pages (found on the test branch).
- [S05] Still to do: payment webhook, DNS checker job for `AwaitingDns` requests, `/internal/caddy/ask`, and the real payment provider adapter once D5/D8 are decided. Staff move domain requests forward in the back office (S06) (found on the test branch).
- [S13] Template schema labels and option labels are English only; the editor shows them as they are. Add Arabic labels to the manifests (for example `labelAr`) (found on the test branch).
- [S12] Categories reorder with arrows only (no drag), and there is no RTL golden test yet (found on the test branch).

- [S11] Generate the Dart client from `docs/api/openapi.json` (`scripts/gen-dart-client.sh`) and replace the hand-written calls in `apps/mobile/lib/features/auth/auth_repository.dart` (found in S11 early).
- [S02] API error messages are English only; the app shows them as they come. Return a localized message (Accept-Language) or a stable code the app can translate (found in S11 early).
- [S15] `scripts/session-start.sh` still starts PostgreSQL. Cloud sessions can't download SQL Server, so integration tests only run in CI; update the hook if a SQL Server image becomes reachable (found in the site4now move).
- [S09] Add a `/reset-password?email=&token=` page on the marketing site that posts to `POST /api/v1/auth/reset-password`; the reset email links there (found in S02).
- [S15] When deploying, set `Security__KnownNetworks` (or `Security__KnownProxies`) to Caddy's address or Docker network, otherwise forwarded headers are ignored and every request looks like it came from Caddy (found in S15 API security).
- [S04] The public API has no way to list published slugs, so the brand domain's sitemap only lists marketing pages. Add `GET /api/public/v1/sites` (slugs and published dates) and list the sites in `app/sitemap.ts` (found in S08).
- [S04] `PublicBusinessDto` has no logo; Souq reads the logo from its `logo` setting. If the business profile gets a logo later, use it as the default (found in S08).
- [S13] Souq's schema grew: `logo`, `hero.eyebrow`, `highlights.{1,2,3}.title/text`, `story.title`, `story.since`, `reviews.{1,2,3}.quote/name`. The editor renders them from the schema; group order follows the manifest (found in S08).
- [S10] The OpenAPI document has no bearer security scheme yet; add one (document transformer) before generating the Flutter client (found in S02).

## Decisions made during sessions

(Anything decided that is not in PLAN.md, with the reason.)

- Test branch (owner asked for a fully working test build with a Pro account): the `test` branch deploys like `deploy` and turns on `Billing:TestMode`, which puts every account (new and existing) on an active Pro plan with provider `test`. Plan changes use `FakePaymentProvider` until D5/D8 are decided. `Storefront:SitesBaseUrl` (deploy variable `SITES_URL`) sets where site links and preview links point, so the websites can be hosted somewhere other than the brand domain at first. The API serves template thumbnails and preset pictures from `wwwroot` (copied by the deploy) so the app's gallery and editor work without the websites host; the app reads them from `assetsBaseUrl` (defaults to the API).
- Mobile (S12 to S14 on the test branch): signed-in owners land on My menu; new owners see the welcome screen first with "Choose a template". Web views are built through `webViewBuilderProvider` so widget tests can replace them. Changes in the catalog reload the list from the API after saving (counts stay right); the sold-out switch and category order update at once and roll back on failure.

- S11 (early, owner asked to connect the app to the live API): the app's API address comes from `apps/mobile/config/production.json` (`--dart-define-from-file`, next to `brand.json`), so a host change doesn't touch the brand file; without it the app falls back to `https://{apiHost}`. The API client is hand-written dio for now (`lib/core/api/`), with a queued interceptor so parallel 401s share one refresh (the API revokes a reused refresh token); refresh and the retry go through a client without interceptors. Signed-in owners land on the welcome screen until the dashboard (S12) exists. A start screen stands in for the splash and onboarding (S10).
- Hosting (owner's choice): the API runs on site4now (Windows/IIS) with its SQL Server database, so the database moved from PostgreSQL to SQL Server. One fresh `Initial` migration replaces the PostgreSQL ones (nothing was deployed yet). JSON columns are `nvarchar(max)`, product search uses `LIKE` (SQL Server's default collation ignores case, and `[` is escaped), the category name key is `LOWER([Name])`, and `MediaAsset.Url` is limited to 800 characters so its index stays under the 1700-byte key limit. CI runs the integration tests on a SQL Server 2022 container.
- Deploy: `.github/workflows/deploy-site4now.yml` publishes a self-contained win-x64 build over FTPS on pushes to `main` or `deploy`, writes `web.config` (out-of-process, settings as environment variables, `MigrateOnStartup`), and uses `app_offline.htm` while uploading. Setup and secrets: `docs/deploy-site4now.md`. HTTPS is enforced only when the `API_URL` variable is an https address.
- iOS build: `codemagic.yaml` has an unsigned IPA workflow and a signed TestFlight workflow for `apps/mobile` (setup in `docs/ios-build.md`). `rebrand.sh` also writes `appId` into its `bundle_identifier`. The iOS app is iPhone only and portrait only, and declares `ITSAppUsesNonExemptEncryption = false` (HTTPS only).
- S15 (API security, done early): `UseStorefrontSecurity` runs first. It applies `X-Forwarded-For`/`-Proto` from trusted proxies only (loopback plus `Security:KnownProxies`/`KnownNetworks`, one hop), so rate limits and HTTPS checks see the real client.
- S15: HTTPS only (`Security:RequireHttps`, off in Development and tests). Plain-HTTP GET/HEAD get a 308 to https; other methods get 400 instead of a redirect, so a password or token is never sent twice in the clear. `/health` works over HTTP for the container check. HSTS is 365 days with subdomains (no `preload`, because custom domains are owned by businesses).
- S15: Every response sends `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` and no `Server` header. `/api` adds `CSP default-src 'none'` and `Cross-Origin-Resource-Policy: same-origin`. `/api/v1` responses are `Cache-Control: no-store` unless the endpoint sets its own. Request bodies are capped at 1 MB (`Security:MaxRequestBodyBytes`); uploads keep their own larger limit. No CORS policy is registered on purpose.
- S15: Rate limits: the named per-IP policies stay (auth 10, slug check 60, public 600 a minute), and every request also counts against 1200 a minute per IP and 300 a minute per signed-in owner (`RateLimits:GlobalPerMinute`, `OwnerPerMinute`). A 429 has `Retry-After` and a ProblemDetails body.
- S15: Tokens: only HS256 is accepted, and issuer, audience, signature and expiry are all required, so `alg: none` and tampered tokens fail. Outside Development the app refuses to start with the development signing key or a key shorter than 32 characters. Resetting a password signs out every device, and `POST /api/v1/auth/logout-all` lets an owner do the same.
- S15: `scripts/export-openapi.sh` turns HTTPS enforcement off for its local run and no longer overwrites `openapi.json` with an empty file on failure.
- S00: Next.js 16 (current stable) with Cache Components on. `apps/sites/next.config.ts` sets the Turbopack root to the repo root so `lib/brand.ts` can import `brand.json`.
- S08: Shared template kit in `apps/sites/templates/_kit/` (menu data, hours, contrast-safe accent colors, fonts, search, category tabs, item dialog, drawer, icons). Guide: `docs/templates.md`.
- S08: Accent colors are adjusted when needed so text reaches 4.5:1 (for example the default red is darkened slightly behind white button text). Sold-out products use the muted text color and a struck-through price instead of 45% opacity, for the same reason.
- S08: Souq shows only content the owner provides: no made-up ratings, review counts or "since" years. Reviews, the eyebrow line, the "since" badge and the gallery appear when filled in; highlights default to editable café copy.
- S08: The footer newsletter field opens an email to the business (no mailing-list service exists). Product photos without an image show a tinted tile with the first letter.
- S08: Open Graph images use the brand domain as `metadataBase` (`/s/<slug>/opengraph-image`), which works for custom domains too. Arabic text in OG images needs a bundled Arabic font (not done).
- S08: In fixture mode `/<template id>` shows the sample business with that template; template ids are therefore 3 to 30 lowercase letters and digits (checked by `templates:registry`).
- S08: Files (any path whose last segment has a dot) are served as they are on every host, so `/templates/...` and `/samples/...` work on custom domains. Preview tokens are matched first because they contain dots.
- S16: Each template has a plain `styles.css` nested under `.t-<name>`, built per template by `scripts/build-styles.mjs` into `public/styles/<id>.<hash>.css` and linked with `<TemplateStyles>`. CSS modules were dropped because Next bundled every template's module CSS into every page, and that grows with each template. Souq was moved over too.
- S16: Shared picture presets live in `public/presets/` and sample product illustrations in `public/samples/food/`; any template can offer any preset.
- S16: Fixture mode has nine sample businesses (café, restaurant, sweets, drinks, street food, Asian, brunch, pizza, shop). Each template's manifest names its `"sample"` (the backend ignores that key). `/_preview/fixture.<id>.<theme>.<en|ar>` shows any theme in either language.
- S16: Every template is checked by one shared unit test (all themes, Arabic, 1 and 200 products, everything off, no products) and by `e2e/templates.spec.ts` (load, no sideways scroll, item dialog, axe WCAG A/AA per theme and in Arabic).
- S16: The product also makes websites for service businesses. Service templates (017 to 021) use five service samples in fixture mode (salon, clinic, studio, gym, home) with illustrations in `public/samples/services/`, the kit in `templates/_kit/services.ts`, and say "Not available" instead of "Sold out". JSON-LD picks the schema.org type from the template's category (BeautySalon, Dentist, MedicalClinic, ExerciseGym, ProfessionalService, HomeAndConstructionBusiness, Store, CafeOrCoffeeShop, else Restaurant); non-food types list services in `hasOfferCatalog` instead of `hasMenu`. Planned menu templates moved to 022 onward.
- S16: Font pairs grew to eleven (adds grotesk, hand, condensed, mono, round, naskh); fonts load only when a template uses them (`preload: false`).
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
