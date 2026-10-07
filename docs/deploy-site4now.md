# Deploying the API to site4now

The API (`src/Storefront.Web`) runs on a site4now Windows/IIS site with a site4now SQL Server database.
`.github/workflows/deploy-site4now.yml` builds it and uploads it over FTPS.

## When it deploys

- Every push to `main`.
- A push to the `deploy` branch, which ships a branch before it is merged: `git push origin HEAD:deploy --force`.
- A push to the `test` branch. It works like `deploy` and also turns on billing test mode: every account,
  new or existing, is on an active Pro plan, so every feature can be tried without paying.
- By hand: GitHub, **Actions**, **Deploy API (site4now)**, **Run workflow**. This button only appears once the workflow is on `main`.

## One-time setup

In GitHub, open **Settings**, then **Secrets and variables**, then **Actions**.

**Secrets** (tab *Secrets*):

| Name | Value |
|---|---|
| `FTP_PASSWORD` | The FTP password from the site4now control panel |
| `DB_PASSWORD` | The SQL Server database user's password |
| `JWT_SIGNING_KEY` | Any random text of 32 or more characters. Keep it stable: changing it signs everyone out |
| `REVALIDATE_SECRET` | Optional. The same value as on the websites host (`docs/deploy-vercel.md`), so saves refresh the websites at once |

**Variables** (tab *Variables*, all optional):

| Name | Default | What it is |
|---|---|---|
| `API_URL` | the current site4now address | The site's address. Used for the health check after each deploy, HTTPS enforcement (only for an `https://` address) and photo URLs |
| `FTP_SERVER` / `FTP_USERNAME` | the current site4now account | Change these when the hosting account changes |
| `FTP_DIR` | `/TestMobileApp` | The site's own folder as the FTP login sees it. The login's top folder holds other sites, so the deploy refuses `/` |
| `DB_SERVER` / `DB_NAME` / `DB_USER` | the current site4now database | Same |
| `SITES_URL` | empty (the brand domain); on `test`, `https://menuapp-alpha-eight.vercel.app` | Where the owners' websites (`apps/sites`) are hosted, like `https://sites.example.vercel.app`. Used for each site's link and the editor preview |
| `BILLING_TEST_MODE` | `true` on the `test` branch, otherwise `false` | Puts every account on an active Pro plan. Only for test servers |

## What a deploy does

1. Fails early, with a message naming what is missing, when a secret is not set.
2. Publishes a self-contained `win-x64` build, so the host needs no .NET installed. IIS runs it out of process, so the
   app pool's 32/64-bit setting does not matter.
3. Writes `web.config` with the settings as environment variables: the connection string, the signing key,
   `Storefront__MigrateOnStartup=true` (the database schema is created or updated when the app starts) and storage under `App_Data/media`.
   IIS never serves `web.config`.
4. Uploads `app_offline.htm` so IIS stops the app, uploads only the changed files, then removes `app_offline.htm`.
   `App_Data/` (uploaded photos) and `logs/` on the server are never touched.
5. When `API_URL` is set, waits for `/health` to answer.

## When something goes wrong

- The app writes its startup errors to `logs/stdout_*.log` on the host. Open them over FTP.
- A failed run shows the reason as an error on the workflow run in GitHub's **Actions** tab.

## Limits of this host

- IIS stops an idle app after about 20 minutes. The first request after that is slow, and the outbox (site refresh
  messages) only runs while the app is awake.
- Photos are stored on the site's disk (`App_Data/media`). Back that folder up, or switch `Storage__Provider` to `s3` later.
- Only the API is deployed here. The Next.js sites (`apps/sites`) run on Vercel: `docs/deploy-vercel.md`.
