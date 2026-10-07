# S15 · Deployment and hardening

**Depends on:** all sessions up to S14. **Branch:** `session/s15-deploy`

## Goal
A repeatable production deployment and the safety checks needed before real customers.

## Read first
`docs/PLAN.md` sections 2 and 11. `docs/STATUS.md` follow-ups from every session.

## Build
1. Dockerfiles for `Storefront.Web` and `apps/sites` (standalone output), `deploy/docker-compose.prod.yml` with caddy, web, sites, postgres; `deploy/Caddyfile` with the host table from PLAN.md section 2 and on-demand TLS using `/internal/caddy/ask`. All hostnames come from environment variables generated from `brand.json` (`scripts/brand-env.sh`), plus `PREVIOUS_DOMAINS` (comma-separated) that 301-redirect `old/<path>` to the current domain.
2. GitHub Actions: build and push images on `main`, deploy job over SSH (secrets documented, not committed), database migration step, rollback instructions.
3. Nightly `pg_dump` to object storage with 14-day retention and a tested restore script.
4. Security pass: rate limits, request size limits, CORS (mobile needs none; back office same-origin), security headers, secrets from environment only, dependency audit (`dotnet list package --vulnerable`, `npm audit`).
5. Observability: structured logs, OpenTelemetry exporter setting, health checks wired into Caddy and an uptime check.
6. Resolve or re-file every follow-up in `docs/STATUS.md`.
7. `docs/RUNBOOK.md`: deploy, roll back, restore a backup, activate a custom domain by hand, rotate secrets, and **change the brand name** following PLAN.md section 0 step by step. Do a dry run of the rename on a branch (change `brand.json` to a dummy brand, run `rebrand.sh`, all tests and `brand-lint.sh` pass) and report it in the PR.

## Done when
- `docker compose -f deploy/docker-compose.prod.yml config` validates and both images build in the session.
- All test suites pass. `docs/STATUS.md` and `docs/RUNBOOK.md` updated.
