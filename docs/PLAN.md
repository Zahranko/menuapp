# Build plan (code name: Storefront)

## 0. Brand configuration: the name is changeable

The public name is a test name for now (**Sufrly**, domain `sufrly.com`). It will change, maybe more than once,
so it lives in one file and nothing else. In this plan, `{brand}` means the brand name and `{domain}` the brand domain.

`brand.json` at the repo root (flat keys, so Flutter can read it with `--dart-define-from-file`):

```json
{
  "brandName": "Sufrly",
  "brandShortName": "sufrly",
  "brandNameAr": "سُفرة",
  "tagline": "Your menu, beautifully served.",
  "domain": "sufrly.com",
  "apiHost": "api.sufrly.com",
  "adminHost": "admin.sufrly.com",
  "customDomainTarget": "edge.storefront-infra.net",
  "supportEmail": "support@sufrly.com",
  "noReplyEmail": "no-reply@sufrly.com",
  "appId": "com.sufrly.app",
  "colorPrimary": "#15291F",
  "colorPrimary2": "#1F3A2E",
  "colorAccent": "#F2B22E",
  "colorHighlight": "#D9542C",
  "colorPaper": "#F1EFE3",
  "colorInk": "#18201B",
  "colorMuted": "#5E6A61",
  "colorLine": "#DAD8C9",
  "fontDisplay": "Bricolage Grotesque",
  "fontBody": "DM Sans",
  "fontArabic": "IBM Plex Sans Arabic"
}
```

Logo, app icon and favicon live in `brand/`.

| Where | How it reads the brand |
|---|---|
| .NET (API, back office, emails) | `BrandOptions` bound from `brand.json`; environment variables (`Brand__Domain`, ...) override per environment |
| Next.js (sites, marketing) | `lib/brand.ts` imports `brand.json` at build time; `BRAND_DOMAIN` overrides for staging |
| Flutter | `--dart-define-from-file=../../brand.json` in every run, test and build; `lib/core/brand.dart` exposes typed values |
| Things that can't read config at runtime (Android `applicationId` and label, iOS bundle ID and display name, launcher icons, favicon, web manifest) | `scripts/rebrand.sh` writes them from `brand.json` and `brand/` |
| Caddy | Hostnames from environment variables set from `brand.json` at deploy time |

Rules:
- Code, namespaces, packages, database and repo use the code name **Storefront**, which customers never see.
- `scripts/brand-lint.sh` runs in CI and fails if the current brand name, short name or domain appears in `src/`, `apps/` or `tests/`.
- User-facing text that mentions the name uses a `{brandName}` placeholder in every language.
- Custom domains point their DNS at `customDomainTarget`, a host on a separate infrastructure domain that never changes with the brand.
  Otherwise every Pro customer would have to change their DNS when the brand changes.

**Changing the name (checklist)**
1. Edit `brand.json` and replace the files in `brand/`. Run `scripts/rebrand.sh`, then `scripts/brand-lint.sh` with the new values.
2. Buy the new domain; point `{domain}`, `api.{domain}` and `admin.{domain}` at the server. Customer custom domains need no change.
3. Redeploy backend and sites. Keep the old domain for at least 12 months and 301-redirect `old-domain/<slug>` to `new-domain/<slug>` (Caddy rule), so printed QR codes and shared links keep working.
4. Update email sending (SPF, DKIM) for the new domain.
5. Before the **first** store release, settle `appId`: Apple and Google don't allow changing an app's ID after it is published. The display name and icon can change in later updates.


## 1. Product in one page

| Who | What they do |
|---|---|
| Business owner (mobile app) | Signs up with business name, email, phone and password. Picks a template, customizes the design once, then manages products and categories from the **My menu** dashboard without touching the design again. Chooses Basic ($5) or Pro ($10). On Pro, requests a custom domain. |
| Customer (website) | Opens `{domain}/<slug>` or the custom domain. Browses the menu, searches, taps an item for details, contacts the business on WhatsApp, gets directions. |
| Support staff (back office) | Handles custom domain requests, looks up businesses and subscriptions, manages templates. |

Screens and behavior are defined by the prototype `docs/prototype/app-prototype.html`:
splash, onboarding (3 slides), create account, log in, welcome, template gallery, design editor, the published site,
and the **My menu** dashboard (Products, Categories, Settings tabs).

Rule from the owner's point of view: **design is edited in the editor; content (products, categories, business info) is edited in the dashboard and goes live on save.** Design changes are drafted and published; content changes are live immediately.

## 2. System overview

```
             Flutter app (owners)                    Browsers (customers)
                     │ HTTPS + JWT                            │
                     ▼                                        ▼
      api.{domain} ┐                              {domain}/<slug>, custom domains
                     │                                        │
               ┌─────┴──────────────────────┐        ┌────────┴─────────────┐
               │ Storefront.Web (ASP.NET Core)  │◄───────│ apps/sites (Next.js) │
               │  /api/v1      owner API    │ public │  templates, SEO, ISR │
               │  /api/public  read API     │  API   └──────────▲───────────┘
               │  /admin       MVC back     │                   │ revalidate webhook (HMAC)
               │               office       │───────────────────┘
               └──┬───────────┬─────────────┘
                  │           │
             PostgreSQL   Object storage (S3-compatible) for images
```

All traffic enters through **Caddy** (reverse proxy with automatic HTTPS):

| Host | Goes to |
|---|---|
| `{domain}`, `www.{domain}` | Next.js (marketing pages and `/<slug>` sites) |
| `api.{domain}` | Storefront.Web `/api/*` |
| `admin.{domain}` | Storefront.Web `/admin/*` (staff only) |
| Any active custom domain | Next.js. Caddy issues the certificate on demand after asking Storefront.Web whether the domain is active |

One deployable backend (the monolith), one Next.js app, one Flutter app, one database.

## 3. Backend: onion architecture

| Layer | Contains | May reference |
|---|---|---|
| **Storefront.Domain** | Entities and aggregates (`Business`, `Category`, `Product`, `Site`, `Template`, `Subscription`, `DomainRequest`, `CustomDomain`), value objects (`Slug`, `Money`, `DomainName`, `PhoneNumber`), domain events (`ProductChanged`, `SitePublished`, `DomainActivated`), domain errors | nothing |
| **Storefront.Application** | One folder per feature with commands, queries, handlers and FluentValidation validators. Ports: `IBusinessRepository`, `ICatalogRepository`, `ISiteRepository`, `ITemplateRepository`, `IBillingRepository`, `IDomainRepository`, `IUnitOfWork`, `ICurrentUser`, `IClock`, `IFileStorage`, `IEmailSender`, `IPaymentProvider`, `IDnsChecker`, `IOutbox`. A `Result<T>` type for expected failures. | Domain |
| **Storefront.Infrastructure** | `StorefrontDbContext` (EF Core + Npgsql), entity configurations, migrations, repositories, ASP.NET Core Identity stores, S3 storage, SMTP email, payment adapters, DNS checker (DnsClient.NET), outbox dispatcher (`BackgroundService`), revalidation client | Application, Domain |
| **Storefront.Web** | `Program.cs` (composition root), `Controllers/Api/V1/*` (JSON), `Controllers/Api/Public/*`, `Areas/Admin` (Razor MVC back office), auth setup, ProblemDetails mapping, rate limiting, OpenAPI, health checks | all |

Handlers are plain classes, for example:

```csharp
public sealed record CreateProduct(Guid CategoryId, string Name, string? Description,
    decimal Price, string? Label, bool IsAvailable, bool IsFeatured, string? ImageUrl);

public sealed class CreateProductHandler(ICatalogRepository catalog, IUnitOfWork uow,
    ICurrentUser user, IOutbox outbox)
{
    public async Task<Result<ProductDto>> Handle(CreateProduct cmd, CancellationToken ct) { ... }
}
```

**Auth**
- ASP.NET Core Identity for users and password hashing.
- Mobile app: JWT access token (15 minutes) plus rotating refresh token (30 days, stored hashed, one per device).
  Claims: `sub` (user id), `biz` (business id).
- Back office: cookie auth, `Staff` role, separate login page.
- Login accepts email **or** phone number plus password, as in the prototype.

**Tenancy:** `ICurrentUser.BusinessId` comes from the `biz` claim. EF global query filters on every tenant entity.
Integration tests prove that business A can never read or change business B's data.

## 4. Data model

| Table | Key columns | Notes |
|---|---|---|
| `AspNetUsers` (Identity) | Id, Email, PhoneNumber, PasswordHash | Email and phone unique |
| `Businesses` | Id, OwnerUserId, Name, Slug, WhatsApp, Email, Address, Instagram, CurrencyCode (`JOD`), Locale (`ar`/`en`), CreatedAt | Slug unique, case-insensitive |
| `Categories` | Id, BusinessId, Name, SortOrder | Unique (BusinessId, lower(Name)) |
| `Products` | Id, BusinessId, CategoryId, Name, Description, Price `decimal(12,3)`, ImageUrl, Label (`Signature`, `New`, `Best seller`, `Vegan`, `Spicy` or null), IsAvailable, IsFeatured, SortOrder, CreatedAt, UpdatedAt | Sold out = `IsAvailable = false`. Featured = shown in "Signature picks" |
| `Templates` | Id (`souq`), Number (1–100), Name, Category, ThumbnailUrl, SettingsSchema `jsonb`, DefaultSettings `jsonb`, Version, IsActive | Seeded from `apps/sites/templates/registry.json` |
| `Sites` | Id, BusinessId (1:1), TemplateId, DraftSettings `jsonb`, PublishedSettings `jsonb`, PublishedAt | Design only. Content comes from Products and Categories |
| `MediaAssets` | Id, BusinessId, Url, ContentType, SizeBytes, CreatedAt | Images up to 5 MB: jpeg, png, webp |
| `Plans` | Code (`basic`, `pro`), PriceUsd, AllowsCustomDomain | Seeded |
| `Subscriptions` | Id, BusinessId, PlanCode, Status (`trialing`, `active`, `past_due`, `canceled`), Provider, ProviderRef, CurrentPeriodEnd | |
| `DomainRequests` | Id, BusinessId, Domain, Status (`Requested`, `AwaitingDns`, `Verifying`, `Active`, `Rejected`, `Cancelled`), StaffNote, HandledBy, timestamps | |
| `CustomDomains` | Domain (PK), BusinessId, ActivatedAt | Active mappings only. Read by Caddy check and Next.js host lookup |
| `RefreshTokens` | Id, UserId, TokenHash, DeviceName, ExpiresAt, RevokedAt | |
| `OutboxMessages` | Id, Type, Payload `jsonb`, OccurredAt, ProcessedAt, Attempts, LastError | Delivers revalidation and emails reliably |
| `AuditLog` | Id, BusinessId, UserId, Action, EntityType, EntityId, At | Who changed what |

Deleting a category with products requires the caller to choose: `moveTo=<categoryId>` or `deleteProducts=true`
(the prototype's confirm step). Categories without products are hidden on the public site.

## 5. API surface (v1)

Owner API (JWT, tenant-scoped):

```
POST   /api/v1/auth/register            {businessName, email, phone, password} → tokens + business
GET    /api/v1/auth/slug-availability?name=Vanilla Menu → {slug, available, suggestion}
POST   /api/v1/auth/login               {login (email or phone), password}
POST   /api/v1/auth/refresh             POST /api/v1/auth/logout
POST   /api/v1/auth/forgot-password     POST /api/v1/auth/reset-password
GET    /api/v1/me

GET|PUT /api/v1/business                name, whatsapp, address, instagram, email, locale

GET    /api/v1/categories               (with productCount)
POST   /api/v1/categories               PUT /api/v1/categories/{id}
DELETE /api/v1/categories/{id}?moveTo={id} | ?deleteProducts=true
PUT    /api/v1/categories/order         [ids]

GET    /api/v1/products?categoryId=&q=
POST   /api/v1/products                 GET|PUT|DELETE /api/v1/products/{id}
PATCH  /api/v1/products/{id}/availability   {isAvailable}
PUT    /api/v1/products/order           {categoryId, ids}

POST   /api/v1/media                    multipart image → {id, url}

GET    /api/v1/templates                (also anonymous, for the gallery)
GET    /api/v1/site                     PUT /api/v1/site/template {templateId}
PUT    /api/v1/site/draft               {settings}   (validated against the template schema)
POST   /api/v1/site/publish             POST /api/v1/site/preview-token → {token, previewUrl}

GET    /api/v1/plans                    GET /api/v1/subscription
POST   /api/v1/subscription/change      {planCode} → {checkoutUrl | status}
POST   /api/webhooks/payments/{provider}

GET|POST|DELETE /api/v1/domain-request  {"domain": "vanillamenu.com"}
```

Public read API (anonymous, used by Next.js only, responses cacheable):

```
GET /api/public/v1/sites/by-slug/{slug}     business + published settings + visible categories + products
GET /api/public/v1/sites/by-host/{host}     same, resolved through CustomDomains
GET /api/public/v1/preview/{token}          draft settings, token valid 30 minutes
GET /internal/caddy/ask?domain=example.com  200 if active custom domain, else 404 (localhost only)
```

The contract lives in `docs/api/openapi.json` (generated by the built-in ASP.NET Core OpenAPI support).
Next.js generates TypeScript types from it (`openapi-typescript`); Flutter generates its client (`openapi-generator`, `dart-dio`).

## 6. Templates: 100 designs without 100 code paths in the app

A template is a folder in `apps/sites/templates/<id>/`:

```
templates/souq/
  manifest.json      id, number, name, category, thumbnail, settings schema, default settings
  Template.tsx       React server component: ({business, catalog, settings}) => page
  sections/*.tsx     Hero, Highlights, Signature, Menu, Story, Gallery, Reviews, Visit, Footer
```

The **settings schema** is a list of typed fields. The Flutter editor renders controls from it, so adding template 37 needs no app release:

```json
{ "key": "font",        "type": "choice", "label": "Font style", "options": ["modern","elegant","bold"], "group": "Brand" }
{ "key": "theme",       "type": "palette", "label": "Color theme", "options": ["cream","sage","blush","night"], "group": "Brand" }
{ "key": "accent",      "type": "color",  "label": "Accent color", "options": ["#D9542C","#F2B22E","#2B6B4F","#7A3E6E"], "group": "Brand" }
{ "key": "hero.layout", "type": "choice", "label": "Layout", "options": ["full","split"], "group": "Hero header" }
{ "key": "hero.image",  "type": "image",  "label": "Hero image", "presets": ["counter","arches","pour","beans"], "group": "Hero header" }
{ "key": "hero.title",  "type": "text",   "label": "Headline", "max": 60, "group": "Hero header" }
{ "key": "hero.shade",  "type": "range",  "label": "Image darkness", "min": 0, "max": 90, "step": 5, "group": "Hero header" }
{ "key": "sections",    "type": "toggles","label": "Sections", "options": ["announcement","highlights","signature","story","gallery","reviews","visit"] }
{ "key": "gallery",     "type": "images", "label": "Gallery", "max": 6 }
```

`npm run templates:registry` builds `apps/sites/templates/registry.json` from all manifests. The backend seeds the
`Templates` table from that file, so the backend and Next.js always agree.

**Editor preview:** the Flutter editor saves the draft (debounced), asks for a preview token and shows
`https://{domain}/_preview/<token>` in a WebView. What the owner sees is the real template.

## 7. Key flows

**Content change goes live**
1. Owner saves a product in the app → `PUT /api/v1/products/{id}`.
2. The handler saves the product and writes an `OutboxMessage` (`SiteContentChanged`, slug and custom domains) in the same transaction.
3. The outbox dispatcher calls Next.js `POST /api/revalidate` with an HMAC signature → `revalidateTag("site:<slug>")`.
4. The next visitor gets fresh HTML. Target: under 5 seconds from save to live.

**Publish design:** `POST /site/publish` copies DraftSettings to PublishedSettings, then the same revalidation.

**Custom domain (Pro)**
1. Owner enters `vanillamenu.com` in Settings → `DomainRequest` = `Requested`. Emails go to support and the owner.
2. Staff open the request in the back office and send DNS instructions (a `CNAME` for `www` to the `customDomainTarget` host from brand.json; an `A` record for the bare domain to the server IP) → `AwaitingDns`.
3. "Check DNS" (button, plus a job every 10 minutes) verifies the records → `Active`, creates the `CustomDomains` row, revalidates.
4. Caddy asks `/internal/caddy/ask` on the first HTTPS request and issues the certificate.
5. If the owner leaves Pro, the domain is deactivated and redirects to `{domain}/<slug>`.

**Routing in Next.js (`middleware.ts`)**
- Host is `{domain}`: a reserved first path segment (`pricing`, `login`, `api`, `_preview`, ...) is served as a normal page. Anything else is treated as a slug and rewritten to `/s/<slug>`.
- Any other host: look up `by-host` (cached 60 seconds) and rewrite to `/s/<slug>`. Unknown host → 404 page.

## 8. Mobile app (Flutter)

- State: Riverpod. Routing: go_router with an auth redirect. HTTP: dio with token refresh interceptor, using the generated client.
- Secure storage for tokens (`flutter_secure_storage`). Images: `image_picker`, compressed before upload. Preview: `webview_flutter`.
- Localization: ARB files for `ar` and `en`, follows the device language, with an in-app switch. Full RTL support.
- Theme colors and fonts come from `brand.json` (section 0), never from constants in Dart. Current values match the prototype.
  The font files for the current brand are bundled as assets; `rebrand.sh` swaps them if the brand fonts change.
- Screens: splash, onboarding, sign up, log in, forgot password, welcome, template gallery, design editor, my site (WebView), My menu dashboard (Products, Categories, Settings), product and category sheets, plan change, domain request.

## 9. Public sites (Next.js)

- App Router with server components. Data fetched with `fetch(..., { next: { tags: ["site:<slug>"] } })`.
- Each template renders all sections from the prototype's "Souq" site: announcement bar, sticky header with mobile drawer, hero (full or split), highlights, signature picks, menu with search and sticky category tabs, item detail sheet, story, gallery, reviews, visit (map, hours with today highlighted, contact), footer with newsletter field.
- SEO: `generateMetadata` per site, schema.org JSON-LD (`Restaurant` or `CafeOrCoffeeShop` with `hasMenu`), sitemap and robots per host, Open Graph image.
- `next/image` with the storage domain in `remotePatterns`. The site's language and direction come from the business locale.
- Marketing pages at the root: landing, pricing ($5 / $10), links to the app stores.

## 10. Testing

| Level | Tooling | Must cover |
|---|---|---|
| Domain | xUnit | Slug rules, Money rounding (3 decimals for JOD), status transitions of DomainRequest and Subscription |
| Application | xUnit, in-memory fakes of the ports | Validation, category delete with move or delete, plan gating for custom domains |
| API | xUnit + `WebApplicationFactory` + real PostgreSQL | Auth flows, tenant isolation, every endpoint's happy path and main errors |
| Architecture | ArchUnitNET or NetArchTest | Layer dependency rules from CLAUDE.md |
| Next.js | Vitest + Testing Library, Playwright smoke test | Template renders from fixture data, routing by slug and by host, revalidate signature |
| Flutter | `flutter test` (unit + widget), golden tests for key screens | Form validation, dashboard CRUD against a fake API, RTL layout |

## 11. Deployment (recommended)

- One Linux VPS with Docker Compose: `caddy`, `web` (.NET), `sites` (Next.js standalone output), `postgres`.
  Images stored in S3-compatible storage (Cloudflare R2 or Backblaze B2). Nightly database backups to the same storage.
- GitHub Actions: build and test all three apps on every PR; build and push images on `main`; deploy over SSH.
- Mobile builds (Android and iOS) run in CI or locally. Cloud sessions run `flutter analyze` and `flutter test` only (no Android SDK or Xcode there).
- Observability: Serilog to console (JSON), OpenTelemetry traces, `/health` endpoints, uptime check.

## 12. Decisions

| # | Decision | Status |
|---|---|---|
| D1 | Database: SQL Server (was PostgreSQL 16; changed 2026-10-07 because the chosen host, site4now, offers SQL Server) | Decided |
| D2 | Backend: .NET 10 LTS monolith, onion layers, MVC back office + JSON API | Decided |
| D3 | Sites: Next.js App Router. Mobile: Flutter | Decided |
| D4 | Payment provider for web checkout (for example Paddle, Lemon Squeezy or a local gateway). Check which ones can pay out to your business's country | **OPEN** |
| D5 | Subscriptions bought inside the iOS and Android apps likely have to use Apple and Google in-app purchase (check the current store rules). Option: RevenueCat to unify both stores and the web | **OPEN** |
| D6 | Hosting: single VPS with Docker Compose and Caddy, as above | Proposed |
| D7 | SMS phone verification at sign-up (needs an SMS provider) | **OPEN**, phone stored unverified until decided |
| D8 | Free trial length, and what happens to the site when payment fails (grace period, then a "temporarily unavailable" page) | **OPEN** |
| D9 | Image storage: Cloudflare R2 | Proposed |
| D10 | Final brand name, domain and app ID (`appId` must be final before the first store release) | **OPEN**, using test name Sufrly |
| D11 | Infrastructure domain for `customDomainTarget` (any neutral domain you own) | **OPEN**, needed before S05 goes live |

Sessions build OPEN items behind interfaces (`IPaymentProvider`, `ISmsSender`) with fake implementations until you decide.

## 13. Session roadmap

Each session is one cloud session with one prompt file in `docs/sessions/`. Merge a session's PR before starting any session that depends on it.

| ID | Session | Depends on | Can run alongside |
|---|---|---|---|
| S00 | Repo bootstrap, tooling, CI | — | — |
| S01 | Domain model and persistence | S00 | S07, S10 |
| S02 | Auth and accounts API | S01 | S07, S10 |
| S03 | Catalog API (categories, products, media) | S02 | S04 |
| S04 | Sites, templates and public read API | S02 | S03 |
| S05 | Plans, billing abstraction, custom domains | S03, S04 | S08, S11 |
| S06 | Back office (MVC) | S05 | S12 |
| S07 | Next.js foundation and routing | S00 | S01–S03 |
| S08 | Next.js template 001 "Souq" and SEO | S04, S07 | S05 |
| S09 | Next.js marketing pages | S07 | any |
| S10 | Flutter foundation, splash and onboarding | S00 | S01–S03 |
| S11 | Flutter sign up and log in | S02, S10 | S03–S05 |
| S12 | Flutter My menu dashboard | S03, S11 | S06, S13 |
| S13 | Flutter template gallery and design editor | S04, S08, S11 | S12, S14 |
| S14 | Flutter plans and custom domain | S05, S12 | S13 |
| S15 | Deployment and hardening | all above | — |
| S16+ | Template factory: templates 002–100, 4–6 per session | S08, S13 | each other |

Longest chain: S00 → S01 → S02 → S04 → S08 → S13 → S15.
