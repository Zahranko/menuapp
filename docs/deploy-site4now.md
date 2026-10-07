# Deploying the API to site4now

The API (`src/Storefront.Web`) runs on a site4now Windows/IIS site with a site4now SQL Server database.
`.github/workflows/deploy-site4now.yml` builds it and uploads it over FTPS.

## When it deploys

- Every push to `main`.
- A push to the `deploy` branch, which ships a branch before it is merged: `git push origin HEAD:deploy --force`.
- By hand: GitHub, **Actions**, **Deploy API (site4now)**, **Run workflow**. This button only appears once the workflow is on `main`.

## One-time setup

In GitHub, open **Settings**, then **Secrets and variables**, then **Actions**.

**Secrets** (tab *Secrets*):

| Name | Value |
|---|---|
| `FTP_PASSWORD` | The FTP password from the site4now control panel |
| `DB_PASSWORD` | The SQL Server database user's password |
| `JWT_SIGNING_KEY` | Any random text of 32 or more characters. Keep it stable: changing it signs everyone out |

**Variables** (tab *Variables*, all optional):

| Name | Default | What it is |
|---|---|---|
| `API_URL` | none | The site's address, for example `https://api.example.com`. Turns on the health check after each deploy, HTTPS enforcement (only for an `https://` address) and absolute photo URLs |
| `FTP_SERVER` / `FTP_USERNAME` / `FTP_DIR` | the current site4now account | Change these when the hosting account changes |
| `DB_SERVER` / `DB_NAME` / `DB_USER` | the current site4now database | Same |

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
- Only the API is deployed here. The Next.js sites (`apps/sites`) need a Node.js host.
