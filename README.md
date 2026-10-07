# Storefront

Working code name for the product. The customer-facing name (currently **Sufrly**, a test name) lives only in `brand.json`, so it can change at any time.

Menu and catalog websites for small businesses, built and managed from a phone.

- Plan and architecture: `docs/PLAN.md`
- Design prototype: `docs/prototype/app-prototype.html` (open in a browser)
- Building it with Claude cloud sessions: `docs/HOW-TO-RUN-SESSIONS.md`
- Conventions for anyone working in the repo: `CLAUDE.md`

Stack: ASP.NET Core (.NET 10) monolith with onion architecture and an MVC back office, PostgreSQL,
Next.js for the public sites, Flutter for the owners' app.
