# How to build the app with Claude cloud sessions

This guide is for you, the person starting the sessions. Each session builds one piece, opens a pull request, and you merge it before starting the sessions that depend on it.

## One-time setup

1. **Create the repository.** Make a private GitHub repo (for example `storefront`; the repo name doesn't need to match the brand). Copy everything from this kit into it (keep the folder structure) and push to `main`.
2. **Connect GitHub.** At [claude.ai/code](https://claude.ai/code), connect GitHub and install the Claude GitHub App on that repo.
3. **Create a cloud environment** named `Storefront` from the environment selector:
   - **Network access:** Trusted. It already allows NuGet, npm, pub.dev, GitHub and the Flutter downloads.
   - **Environment variables:**
     ```
     DOTNET_CLI_TELEMETRY_OPTOUT=1
     DOTNET_NOLOGO=1
     NEXT_TELEMETRY_DISABLED=1
     ConnectionStrings__Default=Host=localhost;Database=storefront;Username=storefront;Password=storefront
     ```
   - **Setup script:** paste the whole of `scripts/cloud-setup.sh`. It installs the .NET 10 SDK and Flutter, which cloud sessions don't have pre-installed. The first session takes a few minutes longer while it runs, then it is cached.
4. **Decide what you can now** from PLAN.md section 12 (payment provider, in-app purchase, trial length). Write your answers into the table before S05 and S14. Until then those sessions build with fake implementations.

## Starting a session

Start a new cloud session on the repo with the `Storefront` environment and send this prompt, changing the file name:

```
Read CLAUDE.md, then carry out docs/sessions/S03-catalog-api.md.
Work on branch session/s03-catalog-api and open a pull request when everything in its "Done when" list passes.
```

When it finishes:
1. Open the diff in the session, read the PR description (it lists test results and any decisions).
2. Ask for changes in the same session if something is off.
3. Merge the PR. Only then start sessions that depend on it.

## Order

Run them in this order. Sessions on the same line can run at the same time in separate sessions.

| Step | Sessions |
|---|---|
| 1 | S00 |
| 2 | S01, S07, S10 |
| 3 | S02, S09 |
| 4 | S03, S04, S11 |
| 5 | S05, S08, S12 |
| 6 | S06, S13, S14 |
| 7 | S15 |
| 8 onward | S16 template factory, as many sessions as you like (002–006, 007–011, …) |

## Tips

- One session, one file. Small sessions finish faster and are easier to review than "build the whole backend".
- Parallel sessions share your plan's usage limits, so running three at once uses them three times as fast.
- If CI fails on a PR, turn on **Auto-fix** in the session so Claude fixes it.
- To try the backend yourself: `docker compose -f docker-compose.dev.yml up -d`, then `dotnet run --project src/Storefront.Web`.
- Mobile builds for real phones (APK, iOS) run on your computer or in CI. Cloud sessions run Flutter's analyzer and tests only.
- **Changing the name later:** edit `brand.json` and the files in `brand/`, run `scripts/rebrand.sh`, redeploy. The full checklist is in PLAN.md section 0. You can also ask any cloud session to do it.
- Keep `docs/STATUS.md` honest. It is how each new session knows what the previous ones did.
