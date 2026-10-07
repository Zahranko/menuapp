# S01 · Domain model and persistence

**Depends on:** S00. **Branch:** `session/s01-domain-persistence`

## Goal
All entities from PLAN.md section 4 with their rules, mapped to PostgreSQL with a first migration and seed data.

## Read first
`docs/PLAN.md` sections 3 and 4. The prototype's dashboard (Products, Categories tabs) for field names and limits.

## Build
1. **Domain** (no packages):
   - Value objects: `Slug` (rules from CLAUDE.md plus the reserved list passed in, `Slug.FromBusinessName("Vanilla Menu")` → `vanillamenu`), `Money` (amount + currency, rounds to the currency's decimals, JOD = 3), `DomainName`, `PhoneNumber` (E.164).
   - Aggregates: `Business`; `Category` (name 1–30 chars); `Product` (name 1–60, description up to 140, price ≥ 0, label from a fixed list); `Site`; `Template`; `Subscription`; `DomainRequest` with guarded status transitions; `CustomDomain`.
   - Domain events recorded on aggregates (`ProductChanged`, `CategoryChanged`, `SitePublished`, `DomainActivated`).
2. **Application:** repository ports and `IUnitOfWork`, `ICurrentUser`, `IClock`, `IOutbox`, `Result<T>` and an `Error` type with codes.
3. **Infrastructure:** `StorefrontDbContext` with Identity (`AppUser : IdentityUser<Guid>`), entity configurations, `decimal(12,3)` prices, `jsonb` columns, unique indexes, global query filters by `ICurrentUser.BusinessId`, repositories, an EF `SaveChanges` interceptor that turns domain events into `OutboxMessages`.
4. Migration `Initial`. Seeder (development only): plans `basic` ($5) and `pro` ($10), template `souq`, and the sample business "Vanilla Menu" with the prototype's 4 categories and 11 products.
5. Tests: domain rules (slug, money rounding, DomainRequest transitions); persistence tests against PostgreSQL proving the global query filter isolates two businesses.

## Not in this session
Controllers, auth endpoints.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `dotnet test Storefront.sln` passes, including persistence tests on the local PostgreSQL.
- `dotnet ef database update` works on an empty database and the seeder runs twice without duplicating rows.
- `docs/STATUS.md` updated.
