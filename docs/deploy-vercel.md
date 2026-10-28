# Hosting the websites on Vercel

The owners' websites and the editor preview (`apps/sites`, Next.js) run on Vercel. The API stays on site4now
(`docs/deploy-site4now.md`). Sites live at `https://<project>.vercel.app/<slug>` until the brand domain is connected.

## 1. Create the project

1. Sign in at vercel.com with GitHub and choose **Add New**, then **Project**.
2. Import the repository. Under **Root Directory**, choose `apps/sites`. Leave the framework (Next.js) and the
   build settings as they are. Keep "Include files outside the root directory" on (the default): the build reads
   `brand.json` and `docs/` from the repo root.
3. Under **Environment Variables**, add:

| Name | Value |
|---|---|
| `STOREFRONT_API_URL` | The API's address, like `https://alamalhosp-001-site7.itempurl.com` |
| `REVALIDATE_SECRET` | Any random text of 32 or more characters. The same value goes into GitHub below |

4. Choose **Deploy**. To deploy a branch other than the default one, open **Settings**, **Git**, and set
   **Production Branch** (for example `test`).

The project's own `.vercel.app` addresses work as the main host without more settings (`lib/routing.ts`).

## 2. Point the API at it

In GitHub, open **Settings**, then **Secrets and variables**, then **Actions**:

- Variable `SITES_URL`: the Vercel address, like `https://menuapp.vercel.app` (no slash at the end).
- Secret `REVALIDATE_SECRET`: the same value as on Vercel.

The next API deploy uses them: site links and editor previews point at Vercel, and every save in the app
refreshes the website at once.
