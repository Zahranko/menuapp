# S06 · Back office (ASP.NET Core MVC)

**Depends on:** S05. **Branch:** `session/s06-back-office`

## Goal
A staff-only web back office at `/admin` to run the business day to day, built with Razor views in `Areas/Admin`.

## Read first
`docs/PLAN.md` sections 1 and 7. Use the brand palette from `brand.json` (PLAN.md section 0) for a calm, readable admin UI. No SPA framework; small vanilla JS only where needed.

## Build
1. Cookie login for users in the `Staff` role, separate from the mobile JWT scheme. A seeded staff user for development. Antiforgery on every form.
2. Dashboard: counts of businesses, active subscriptions by plan, open domain requests.
3. Businesses: search by name, slug, email or phone; detail page with owner, plan, site link, product count, recent audit log.
4. Domain requests: queue filtered by status; detail page with actions "Send DNS instructions" (emails a template with the records), "Check DNS now", "Activate", "Reject" with a note. Every action is logged.
5. Templates: list with number, name, active flag; "Re-import registry" action.
6. Integration tests for authorization (owners cannot reach `/admin`) and the domain request actions.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `dotnet test Storefront.sln` passes.
- Screenshots of the four main pages in the PR description.
- `docs/STATUS.md` updated.
