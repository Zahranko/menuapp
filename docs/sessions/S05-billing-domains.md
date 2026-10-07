# S05 · Plans, billing abstraction and custom domains

**Depends on:** S03, S04. **Branch:** `session/s05-billing-domains`

## Goal
Basic ($5) and Pro ($10) plans with gating, a payment provider interface ready for the real provider, and the full custom domain request flow on the backend.

## Read first
`docs/PLAN.md` sections 7 ("Custom domain") and 12 (D4, D5, D8 are OPEN). Prototype: My menu → Settings → Plan and Custom domain.

## Build
1. `IPaymentProvider` (create checkout, change plan, cancel, parse and verify webhook). `FakePaymentProvider` that activates immediately in development. Webhook endpoint `POST /api/webhooks/payments/{provider}` updating `Subscriptions` idempotently.
2. `GET /api/v1/plans`, `GET /api/v1/subscription`, `POST /api/v1/subscription/change`.
3. Gating: domain requests need an active `pro` subscription. Downgrading or cancelling Pro cancels open domain requests and deactivates the custom domain (writes revalidation).
4. Domain requests: `GET|POST|DELETE /api/v1/domain-request`, one open request per business, domain normalized (lowercase, no scheme, no path), rejected if it is the brand domain, a subdomain of it, the `customDomainTarget` host, or already active elsewhere. Emails to support and owner.
5. `IDnsChecker` (DnsClient.NET) checking the `www` CNAME and apex A record against settings; a job every 10 minutes for `AwaitingDns` requests; activation creates `CustomDomains` and writes revalidation.
6. `GET /internal/caddy/ask?domain=` answering only requests from localhost or the configured proxy network.
7. Tests for gating, status transitions, webhook idempotency, ask endpoint.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `dotnet test Storefront.sln` passes. `docs/api/openapi.json` regenerated.
- PR description lists exactly what the real payment provider adapter must implement.
- `docs/STATUS.md` updated.
