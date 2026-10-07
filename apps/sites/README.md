# Sites

Next.js (App Router) app for the public business sites (`{domain}/<slug>` and custom domains) and the marketing pages.

```
npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

Brand values come from `lib/brand.ts`, which reads `brand.json` at the repo root. Never hardcode them.
