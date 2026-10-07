# Storefront

Storefront is the code name. The product's public name is not fixed yet: it is currently **Sufrly**, a test name,
and it lives only in `brand.json` (see **Brand** below).

The product lets a small business (café, restaurant, shop) build a menu or catalog website from a phone.
The owner signs up, picks one of 100 templates, customizes it (hero, colors, logo, sections), and manages
products and categories from a simple dashboard. Sites live at `{domain}/<slug>`. Pro owners can
request their own domain, which support sets up.

Plans: **Basic $5/month** (site at `{domain}/<slug>`), **Pro $10/month** (Basic + custom domain on request).

The full plan is in `docs/PLAN.md`. The clickable design prototype is `docs/prototype/app-prototype.html`.
Open it in a browser. It is the reference for every screen's layout, copy, colors and behavior.
Where the prototype or these docs say `Sufrly` or `{domain}`, read "the brand name" and "the brand domain from `brand.json`".

## Repo map

```
brand.json                   Brand name, domains, emails, colors, fonts, app ID. The ONLY place these are written
brand/                       Logo, app icon, favicon for the current brand
src/                         ASP.NET Core monolith (onion architecture)
  Storefront.Domain/             Entities, value objects, domain events. No package references.
  Storefront.Application/        Use cases, interfaces (ports), DTOs, validators. References Domain only.
  Storefront.Infrastructure/     EF Core + SQL Server, Identity stores, storage, email, payments, jobs.
  Storefront.Web/                MVC back office (Areas/Admin), JSON API (/api/v1), composition root.
tests/
  Storefront.Domain.Tests/  Storefront.Application.Tests/  Storefront.Web.IntegrationTests/  Storefront.ArchitectureTests/
apps/
  sites/                     Next.js (App Router): public sites + marketing pages at {domain}
  mobile/                    Flutter app for business owners
docs/
  PLAN.md                    Architecture, data model, API, flows, decisions
  STATUS.md                  Which sessions are done; update it at the end of every session
  sessions/                  One file per cloud session. Do exactly what your session file says
  api/openapi.json           Committed API contract. Regenerate whenever the API changes
  reserved-slugs.txt         Slugs nobody can register (shared by backend and Next.js)
  prototype/app-prototype.html  Design reference
scripts/                     cloud-setup.sh, brand-lint.sh, and later session-start.sh, rebrand.sh, export-openapi.sh
```

## Commands

| What | Command |
|---|---|
| Build backend | `dotnet build Storefront.sln` |
| Test backend | `dotnet test Storefront.sln` |
| Run API + back office | `dotnet run --project src/Storefront.Web` |
| New migration | `dotnet ef migrations add <Name> -p src/Storefront.Infrastructure -s src/Storefront.Web` |
| Export OpenAPI | `scripts/export-openapi.sh` (writes `docs/api/openapi.json`) |
| Sites: install, check, build | `cd apps/sites && npm ci && npm run lint && npm run typecheck && npm test && npm run build` |
| Mobile: check | `cd apps/mobile && flutter pub get && flutter analyze && flutter test --dart-define-from-file=../../brand.json` |
| Brand check | `scripts/brand-lint.sh` (fails if the brand name or domain is hardcoded) |
| Apply a brand change | `scripts/rebrand.sh` (app IDs, display names, icons, favicon) |

Database: SQL Server (the production host is site4now; deploy: `docs/deploy-site4now.md`). Local: `docker compose -f docker-compose.dev.yml up -d` (user `sa`, password `Storefront_dev1`).
Cloud sessions cannot download SQL Server, so integration tests run in CI there.
Connection string env var: `ConnectionStrings__Default`.

## Architecture rules (enforced by Storefront.ArchitectureTests)

- Dependencies point inward only: Web → Infrastructure → Application → Domain. Domain references nothing.
- Application defines interfaces (repositories, `IUnitOfWork`, `IFileStorage`, `IEmailSender`, `IPaymentProvider`, `IClock`, `ICurrentUser`).
  Infrastructure implements them. Web wires them up in `Program.cs` and nowhere else.
- Controllers stay thin: bind the request, call one use case, map the result to HTTP.
- One folder per feature in Application (`Catalog/Products/CreateProduct.cs` holds the command, validator and handler).
- No MediatR and no AutoMapper (both need paid licenses for commercial use). Use plain handler classes registered in DI and map by hand.
- Validation with FluentValidation in Application. Errors return RFC 7807 ProblemDetails with an `errors` dictionary keyed by field.
- Multi-tenancy: every tenant-owned entity has `BusinessId`. EF global query filters scope reads to the current business. Never accept a `businessId` from the client.

## Brand (the name will change)

- Never write the brand name, short name, domain, support email, colors, fonts or app ID in code, tests, emails, views, ARB files or copy.
  Read them from brand config: `BrandOptions` (.NET), `lib/brand.ts` (Next.js), `Brand` (Flutter, from `--dart-define-from-file=../../brand.json`).
- User-facing strings that mention the name use a placeholder: `"Made with {brandName}"`, ARB `"madeWith": "Made with {brandName}"`.
- Code identifiers use the code name `Storefront` (namespaces, packages, DB name). The code name never appears to users.
- `scripts/brand-lint.sh` must pass before every PR.

## Conventions

- .NET 10 (LTS), C# nullable enabled, warnings as errors in src/. File-scoped namespaces.
- IDs: `Guid` created with `Guid.CreateVersion7()`. Times: `DateTimeOffset` in UTC.
- Money: `decimal(12,3)` plus the business currency code (default `JOD`, which has 3 decimal places). Never `double`.
- API: `/api/v1/...`, JSON camelCase, plural nouns, `PUT` for full updates, `PATCH` for single-field changes, `204` for deletes.
- Public read API for Next.js: `/api/public/v1/...`, anonymous, cache-friendly.
- Slugs: lowercase `a-z0-9`, 3 to 30 characters, not in `docs/reserved-slugs.txt`.
- Copy and labels: take them from the prototype. Write for business owners, not developers.
- Arabic and English: every user-facing string is localized. Layout must work right-to-left.

## How to work in a session

1. Read this file, `docs/PLAN.md`, `docs/STATUS.md`, then your session file in `docs/sessions/`.
2. Work on branch `session/<id>` (for example `session/s03-catalog-api`). Commit in small, working steps.
3. Stay inside your session's scope. If you find something another session must change, write it under "Follow-ups" in `docs/STATUS.md` instead of changing it.
4. If the API changes, regenerate `docs/api/openapi.json` in the same PR.
5. Before you finish, every command in your session's **Done when** list must pass. Paste their results in the PR description.
6. Update `docs/STATUS.md` (mark the session done, list follow-ups and any decision you made), then open a PR.
7. A decision marked **OPEN** in `docs/PLAN.md` is not yours to make. Build behind an interface with a fake implementation and say so in the PR.
