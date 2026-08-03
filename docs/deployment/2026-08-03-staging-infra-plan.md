# Staging Infrastructure Implementation Plan

> **For agentic workers:** Tasks 1-5 are manual account/dashboard/DNS steps that require login
> credentials, a payment method, and human judgment calls in third-party UIs — **no subagent can
> perform them**. Only Task 6 is code. Once Tasks 1-5 are done by the human operator and the
> secrets exist in the GitHub repo, use superpowers:executing-plans or
> superpowers:subagent-driven-development for Task 6 alone.

**Goal:** Stand up a working staging environment at `staging.splexa.in` — `apps/web` on Vercel,
`apps/server` on Render, a dedicated Supabase staging project — deployed automatically via GitHub
Actions on every push to `main`.

**Architecture:** Browser → `staging.splexa.in` (Vercel, serves `apps/web`) → Next.js rewrite
proxies `/api/v1/*` server-side to the Render-hosted `apps/server` → Supabase (Postgres + Storage).
No code changes to auth/cookies/CORS — the existing `next.config.ts` rewrite already makes this
same-origin from the browser's perspective.

**Tech Stack:** Vercel (web hosting), Render (server hosting), Supabase (Postgres + Storage,
separate staging project), GitHub Actions (CI/CD), Namecheap (DNS).

## Global Constraints

- Everything is driven from GitHub Actions — no reliance on Vercel's or Render's native
  "auto-deploy on git push" git integration. Deploys must run only after the existing `build` job
  in `.github/workflows/build.yml` passes.
- No changes to authentication code, cookie config, or CORS — the same-origin rewrite already
  handles this (see spec, `docs/deployment/2026-08-03-staging-infra-design.md`).
- No messaging provider (MSG91/Interakt) setup in this plan — out of scope, deferred.
- No production/AWS setup in this plan — out of scope, deferred.
- Only one new DNS record is needed (`staging` → Vercel). Render's URL is referenced only via the
  `API_ORIGIN` env var, never exposed to users directly.
- Staging gets its own Supabase project — do not point staging at whatever Supabase project is
  currently used for local dev, so a bad staging migration or test data can never touch dev/local
  data (or vice versa).

---

## Task 1: Create the staging Supabase project (Manual)

**Nothing to code.** Do this in the Supabase dashboard (supabase.com):

- [ ] Sign in to Supabase (or create an account if you don't have one).
- [ ] Click **New Project**. Name it `splexa-staging` (or similar — distinct from any existing dev
      project). Pick a region close to India (Singapore is Supabase's closest region to India).
      Save the generated database password somewhere safe — you'll need it for the connection
      string.
- [ ] Once provisioned, go to **Project Settings → Database** and copy:
  - The **Connection string (URI)** in "Transaction" mode → this is `DATABASE_URL`.
  - The **Connection string (URI)** in "Session" mode (direct connection, port 5432) →
    this is `DIRECT_URL`.
- [ ] Go to **Project Settings → API** and copy:
  - **Project URL** → this is `SUPABASE_URL`.
  - **service_role key** (not the anon key) → this is `SUPABASE_SERVICE_ROLE_KEY`. Treat this as a
    secret — it bypasses row-level security.
- [ ] Go to **Storage** in the left sidebar, click **New bucket**, name it e.g. `documents`, and
      leave it private (not public). This name becomes `SUPABASE_STORAGE_BUCKET`.
- [ ] Keep this browser tab open (or paste the four values into a scratch note) — Task 2 needs them
      when configuring Render's environment variables.

**Verify:** In the Supabase dashboard, **Table Editor** loads with no tables yet (a fresh project) —
confirms the project is live and reachable.

---

## Task 2: Create the Render service for `apps/server` (Manual)

**Nothing to code.** Do this in the Render dashboard (render.com):

- [ ] Sign up / sign in to Render, connect your GitHub account, and grant it access to this repo.
- [ ] Click **New → Web Service**, select this repo.
- [ ] Configure:
  - **Root Directory**: leave blank (repo root) — the build command below handles the monorepo
    filtering itself.
  - **Runtime**: Node
  - **Build Command**:
    ```
    corepack enable && pnpm install --frozen-lockfile && pnpm --filter @splexa-group/shared build && pnpm --filter server db:generate && pnpm --filter server build
    ```
  - **Start Command**:
    ```
    node apps/server/dist/index.js
    ```
  - **Instance Type**: Free
- [ ] Under **Environment**, add every variable from `apps/server/.env.example` with real staging
      values:
  - `NODE_ENV=staging`
  - `PORT=5001` (Render overrides this with its own port assignment automatically — the app already
    reads `process.env.PORT` via `env.ts`, so this is just a placeholder value; Render's injected
    `PORT` wins)
  - `LOG_LEVEL=info`
  - `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
    `SUPABASE_STORAGE_BUCKET` — from Task 1
  - `STORAGE_PROVIDER=supabase`
  - `COOKIE_SECRET`, `JWT_ACCESS_SECRET` — generate fresh random values (e.g.
    `openssl rand -hex 32` run locally), do not reuse local dev secrets
  - `JWT_ACCESS_EXPIRY=15m`
  - `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER=resend` — from whatever Resend account is
    already used for dev, or a new one
  - `WHATSAPP_PROVIDER=interakt`, `INTERAKT_API_KEY` — reuse existing values if messaging isn't
    being exercised in staging yet; leave as-is since this plan doesn't touch messaging
- [ ] Do **not** click "Auto-Deploy" — turn it **off**. Deploys will be triggered explicitly from
      GitHub Actions in Task 6, not on every push automatically.
- [ ] Once the service is created, go to **Settings → Deploy Hook** and copy the URL — this is
      `RENDER_DEPLOY_HOOK`, needed in Task 5.
- [ ] Note the service's default URL (e.g. `https://splexa-server-staging.onrender.com`) — needed as
      `API_ORIGIN` in Task 3.

**Verify:** Trigger one manual deploy from the Render dashboard (since Auto-Deploy is off, use the
**Manual Deploy** button). There's no dedicated health-check route registered in
`apps/server/src/app.ts` yet, so instead confirm the server process itself is up:
`curl -i https://<your-render-url>.onrender.com/api/v1/does-not-exist` should return a
**404 JSON response from Fastify** (not a connection error/timeout) — that proves the build/start
commands and env vars are correct and the app is listening, before wiring up CI.

---

## Task 3: Create the Vercel project for `apps/web` (Manual)

**Nothing to code.** Do this in the Vercel dashboard (vercel.com):

- [ ] Sign up / sign in to Vercel, connect your GitHub account, import this repo.
- [ ] During import, set:
  - **Root Directory**: `apps/web`
  - **Framework Preset**: Next.js (should auto-detect)
- [ ] Under **Settings → Git**, turn off automatic deployments on push (or simply don't connect a
      production branch) — deploys will come from GitHub Actions in Task 6, not Vercel's own git
      integration, to keep everything gated behind the `build` job.
- [ ] Under **Settings → Environment Variables**, add:
  - `NEXT_PUBLIC_API_URL=/api/v1`
  - `API_ORIGIN=<the Render URL from Task 2>` (e.g. `https://splexa-server-staging.onrender.com`)
- [ ] Under **Settings → Domains**, add `staging.splexa.in`. Vercel will show you the exact DNS
      record to create (usually a `CNAME` to `cname.vercel-dns.com`, sometimes an `A` record to
      `76.76.21.21` depending on setup flow) — copy whatever it shows, needed for Task 4.
- [ ] Under **Settings → General**, note the **Project ID**, and under your account/team settings
      note the **Org ID** (Team ID) — both needed as `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` in Task 5.
- [ ] Under **Account Settings → Tokens**, create a new token (e.g. named `github-actions-deploy`)
      — this is `VERCEL_TOKEN`, needed in Task 5. Copy it now; Vercel won't show it again.

**Verify:** Nothing to verify yet — the domain won't resolve until Task 4's DNS record propagates.

---

## Task 4: Add the Namecheap DNS record (Manual)

- [ ] Log into Namecheap, go to **Domain List → splexa.in → Manage → Advanced DNS**.
- [ ] Add the exact record type/value Vercel showed you in Task 3 (typically):
  ```
  Type: CNAME Record
  Host: staging
  Value: cname.vercel-dns.com.
  TTL: Automatic
  ```
- [ ] Save.

**Verify:** DNS propagation can take a few minutes to a few hours. Check with:
```
dig staging.splexa.in +short
```
Once it resolves to Vercel's infrastructure, and Vercel's dashboard shows the domain as "Valid
Configuration" with SSL issued, this task is done.

---

## Task 5: Add GitHub Actions secrets (Manual)

In this repo's **Settings → Secrets and variables → Actions**, add:

- [ ] `VERCEL_TOKEN` — from Task 3
- [ ] `VERCEL_ORG_ID` — from Task 3
- [ ] `VERCEL_PROJECT_ID` — from Task 3
- [ ] `RENDER_DEPLOY_HOOK` — from Task 2
- [ ] `STAGING_DATABASE_URL` — from Task 1 (the "Transaction" mode connection string)
- [ ] `STAGING_DIRECT_URL` — from Task 1 (the "Session" mode connection string)

**Verify:** The Actions secrets list shows all six names (values are never visible again once
saved — that's expected).

---

## Task 6: Add staging deploy jobs to GitHub Actions (Code)

**Files:**
- Modify: `.github/workflows/build.yml`

**Interfaces:**
- Consumes: the six secrets from Task 5; the existing `build` job (job id `build`) in this same
  workflow file
- Produces: two new jobs, `deploy-web` and `deploy-server`, that only run on push to `main` (not on
  pull requests) and only after `build` succeeds

- [ ] **Step 1: Add the `deploy-web` job**

Add this job to `.github/workflows/build.yml`, at the same indentation level as the existing
`build` job under `jobs:`:

```yaml
  deploy-web:
    name: Deploy web (Vercel)
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel environment
        working-directory: apps/web
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build on Vercel
        working-directory: apps/web
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy prebuilt output to Vercel
        working-directory: apps/web
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

- [ ] **Step 2: Add the `deploy-server` job**

Add this job right after `deploy-web`, same indentation:

```yaml
  deploy-server:
    name: Deploy server (Render)
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run staging migrations
        working-directory: apps/server
        run: pnpm db:migrate:staging
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          DIRECT_URL: ${{ secrets.STAGING_DIRECT_URL }}

      - name: Trigger Render deploy
        run: curl --fail -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
```

- [ ] **Step 3: Validate the workflow YAML syntax**

Run: `npx --yes action-validator .github/workflows/build.yml`

Expected: no syntax errors reported. (If `action-validator` isn't available/fails to install,
alternative: use the "Validate" indicator GitHub itself shows when you open the file in the GitHub
web UI — it flags YAML/syntax errors inline.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/build.yml
git commit -m "ci: deploy apps/web to Vercel and apps/server to Render on push to main"
```

- [ ] **Step 5: Push and verify end-to-end**

This step requires Tasks 1-5 to be complete (real secrets in place).

```bash
git push
```

Then in the GitHub repo's **Actions** tab, confirm:
- The `build` job runs and passes first.
- `deploy-web` and `deploy-server` both start only after `build` succeeds, and both complete
  successfully (not skipped — if they show as skipped, the `if:` condition or branch name doesn't
  match; check you pushed to `main`).
- `https://staging.splexa.in` loads the app in a browser.
- Logging in (or any endpoint hitting `/api/v1/*`) returns real data — confirms the Vercel rewrite
  is correctly proxying to the Render-hosted server and cookies are being set/read correctly.

If `deploy-server` fails on the migration step, check `STAGING_DATABASE_URL`/`STAGING_DIRECT_URL`
match exactly what Supabase showed in Task 1 (transaction-mode vs. session-mode connection strings
are easy to swap by mistake). If `deploy-web` fails on `vercel pull`, double check
`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` match the values from Task 3 exactly.

---

## Self-Review Notes

- **Spec coverage:** Vercel setup (Task 3), Render setup (Task 2), Supabase staging project
  (Task 1), one DNS record (Task 4), GitHub-Actions-only CI/CD (Task 6) — all covered. Messaging
  provider and production/AWS are explicitly out of scope per the spec and not included here.
- **No placeholders:** every env var, command, and file path above is the actual value/command to
  use, not a description of what to fill in.
- **Task ordering:** Task 3 depends on Task 2's Render URL (for `API_ORIGIN`); Task 6 depends on
  Tasks 1, 2, 3 (for the secret values) and Task 5 (secrets must exist in the repo before the
  workflow can use them). Order above reflects these dependencies.
