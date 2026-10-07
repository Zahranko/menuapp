# S14 · Flutter plans and custom domain

**Depends on:** S05, S12. **Branch:** `session/s14-mobile-plans-domain`

## Goal
Owners can change plan and, on Pro, request a custom domain and follow its progress.

## Read first
Prototype: My menu → Settings → Plan and Custom domain cards, the upgrade sheet. PLAN.md decisions D4 and D5.

## Build
1. Plan card with Basic ($5) and Pro ($10), current plan marked, upgrade and downgrade sheets (downgrade warns that the domain request is cancelled).
2. Purchase behind a `SubscriptionService` interface: a backend-checkout implementation (opens `checkoutUrl` in the browser and polls `/subscription`) and a stub for in-app purchase, selected by config until D5 is decided.
3. Custom domain card: locked state on Basic with "Upgrade to Pro"; request form with domain validation; progress steps (Request sent, Support emails DNS steps, You add the DNS record, Live with SSL) from the request status; cancel request.
4. Tests for each state of the domain card and plan changes against a fake API.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `flutter analyze` and `flutter test` pass.
- `docs/STATUS.md` updated with what is still needed once D4 and D5 are decided.
