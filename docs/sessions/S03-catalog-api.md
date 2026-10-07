# S03 · Catalog API: categories, products, images

**Depends on:** S02. **Runs alongside:** S04. **Branch:** `session/s03-catalog-api`

## Goal
Everything the My menu dashboard needs: create, read, update, delete and reorder categories and products, sold-out switch, image upload, and every change reaching the public site.

## Read first
`docs/PLAN.md` sections 4, 5 and 7 ("Content change goes live"). Prototype: My menu → Products and Categories tabs, the product sheet and the category delete confirmation.

## Build
1. Categories: list with `productCount`, create, rename (duplicate names rejected case-insensitively), delete with `moveTo` or `deleteProducts=true` (400 if the category has products and neither is given), reorder.
2. Products: list filtered by category and search text, get, create, update, delete, `PATCH availability`, reorder within a category. Product category must belong to the same business.
3. `POST /api/v1/media`: multipart image, max 5 MB, jpeg/png/webp checked by file signature, stored through `IFileStorage` (S3-compatible adapter + a local disk adapter for development), returns a public URL.
4. Every change writes `SiteContentChanged` to the outbox (via domain events). Implement the outbox dispatcher `BackgroundService` and an `ISiteRevalidator` that POSTs `{tags:["site:<slug>"]}` to the Next.js revalidate URL with an `X-Storefront-Signature` HMAC-SHA256 header. Retries with backoff; failures logged, never block the request.
5. Audit log rows for create, update and delete.
6. Integration tests: all endpoints, delete-with-move, tenant isolation, outbox row written in the same transaction.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `dotnet test Storefront.sln` passes.
- `docs/api/openapi.json` regenerated.
- `docs/STATUS.md` updated (note the revalidate URL setting name and HMAC secret setting name for S07).
