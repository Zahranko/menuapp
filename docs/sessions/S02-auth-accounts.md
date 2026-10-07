# S02 · Auth and accounts API

**Depends on:** S01. **Branch:** `session/s02-auth-accounts`

## Goal
Owners can register, log in with email or phone, stay logged in, and reset their password.

## Read first
`docs/PLAN.md` sections 3 (Auth) and 5. Prototype screens "Create account" and "Log in" for fields, rules and error copy.

## Build
1. `POST /api/v1/auth/register` {businessName, email, phone, password}: creates user, business (slug from the name), site with template `souq` defaults, and a `trialing` subscription on `basic`. Returns tokens and business. Errors per field, using the prototype's messages ("That link is taken. Try adding your city, like vanillamenuamman.").
2. `GET /api/v1/auth/slug-availability?name=` → `{slug, available, suggestion}`. Rate limited.
3. `POST /auth/login` (email or phone + password), `/auth/refresh` (rotating refresh tokens, reuse detection revokes the chain), `/auth/logout`, `/auth/forgot-password` (always 202; emails a link through `IEmailSender`), `/auth/reset-password`, `GET /api/v1/me`.
4. Password rule: at least 8 characters with a number and a capital letter (matches the prototype hint). Lockout after 5 failed attempts for 5 minutes.
5. `GET|PUT /api/v1/business` for name, WhatsApp, address, Instagram, email, locale. Changing the name does **not** change the slug.
6. Development `IEmailSender` writes emails to the log; real SMTP adapter configured by settings.
7. Rate limiting on auth endpoints. Regenerate `docs/api/openapi.json`.
8. Integration tests for every endpoint, including refresh token reuse and tenant isolation.

## Done when
- `scripts/brand-lint.sh` passes (no hardcoded brand name or domain).
- `dotnet test Storefront.sln` passes.
- `docs/api/openapi.json` is regenerated and committed.
- `docs/STATUS.md` updated.
