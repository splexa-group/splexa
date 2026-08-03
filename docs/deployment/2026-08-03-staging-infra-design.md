# Staging Infrastructure Design

## Context

Splexa has no deployment infrastructure yet — only a domain (`splexa.in`, registered on Namecheap)
and a GitHub Actions workflow that builds and type-checks on every push/PR
(`.github/workflows/build.yml`). This doc covers getting a **staging environment** live at
`staging.splexa.in`, deployed and managed entirely through GitHub Actions.

Production (`app.splexa.in`) is intentionally **out of scope** here. The plan is to build on AWS
once the product is ready to ship (weeks/months out), so designing production infra now would be
guessing at requirements that aren't settled yet. When that time comes, it gets its own design doc.

Scheduled hearing reminders (cron/WhatsApp/SMS sending) are also **out of scope** for this round —
deferred until that feature is actively being built. The hosting choice below was made specifically
*without* assuming an always-on background scheduler; if reminders come back into scope, revisit
whether the server platform still fits (see [Cron / Reminders](#cron--reminders-deferred) below).

Messaging provider selection is also deferred, and for a stronger reason than just scheduling: the
codebase already has a working WhatsApp integration built around **Interakt**
(`apps/server/src/integrations/whatsapp/interakt-adapter.ts`, `whatsapp-interface.ts`, plus
`WHATSAPP_PROVIDER`/`INTERAKT_API_KEY` in `env.ts` and `.env.example`) — an earlier pass at this doc
proposed MSG91 without checking existing code first. No SMS integration exists yet. This plan does
**not** set up any messaging provider account; that decision (keep Interakt vs. switch) belongs to
whoever picks up reminders.

---

## Platform Choices

| Concern | Platform | Why |
|---|---|---|
| Web (`apps/web`, Next.js) | **Vercel** (free Hobby tier) | Zero-config Next.js hosting, generous free tier for a testing-stage app |
| Server (`apps/server`, Fastify) | **Render** (free Web Service tier) | Genuinely free indefinitely (vs. Railway's one-time trial credit → ~$5/mo after). Free tier spins down after 15 min idle and cold-starts (~30-60s) on the next request — acceptable for a low-traffic feedback/testing environment with no background job depending on the server staying awake |
| Database | **Supabase** (Postgres) | Already the project-wide decision (`README.md`) — not a new choice |
| Documents | **Supabase Storage** | Already the project-wide decision (`developer-workflow.md`: "S3 (use Supabase Storage for Phase 1)") |

Total new platforms to set up: **Vercel, Render** (Supabase already exists; messaging provider setup
is deferred — see above).

---

## Architecture

```
Browser
  │
  ▼
staging.splexa.in  (Vercel — apps/web)
  │
  ├─ / , /login, /cases, ...        → served directly by Next.js
  │
  └─ /api/v1/*                      → Next.js rewrite (next.config.ts, API_ORIGIN env var)
                                        proxies server-side to the Render URL
                                        │
                                        ▼
                                 apps/server on Render (Fastify)
                                        │
                                        ▼
                                 Supabase (Postgres + Storage)
```

**Why no auth changes are needed:** `apps/server` sets `access_token`/`refresh_token` as `httpOnly`
cookies with `sameSite: "strict"` and no `domain` attribute (`auth.helper.ts`) — this only works if
the browser sees a single origin. `apps/web/next.config.ts` already rewrites `/api/v1/:path*` to an
`API_ORIGIN` env var, so the browser only ever talks to `staging.splexa.in`; Next.js proxies the
request to Render server-side. This is the same mechanism that already makes cookies work in local
dev today, where `web` (`:3000`) and `server` (a different port) are technically different origins.
Pointing `API_ORIGIN` at the Render URL keeps the same trick working in staging — no CORS, no cookie
`domain`/`sameSite` changes, no code changes.

---

## DNS (Namecheap — one-time manual step)

Only one record is needed. Render's backend is never addressed directly by users — it's only
referenced internally via `API_ORIGIN` — so it needs no DNS entry of its own.

```
CNAME   staging   cname.vercel-dns.com.
```

(Exact target confirmed from Vercel's domain settings once the project + custom domain are added —
Vercel may specify an `A` record to `76.76.21.21` instead depending on setup flow; follow whatever
Vercel's dashboard shows for `staging.splexa.in`.)

---

## CI/CD Pipeline (extends `.github/workflows/build.yml`)

Everything is driven from GitHub Actions — no reliance on Vercel's or Render's native
"auto-deploy on git push" integration — so a deploy only happens after build & type-check pass.

1. **Build & type-check** (existing job) — runs on every PR and push to `main`.
2. **Deploy web** — on push to `main`, after the build job succeeds: run `vercel deploy --prod`
   via the Vercel CLI, authenticated with `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`
   (GitHub secrets).
3. **Deploy server** — same trigger: run Prisma migrations against the staging Supabase DB using the
   existing `pnpm --filter server db:migrate:staging` script (already in `apps/server/package.json`,
   runs `prisma migrate deploy` with `ENV_FILE=.env`), then
   `curl -X POST $RENDER_DEPLOY_HOOK` (a secret URL from Render's dashboard) to trigger Render to
   pull and deploy the latest `main` commit.

Both deploy jobs run after build/type-check succeeds, not in parallel with it.

---

## Secrets (GitHub repo secrets, or a `staging` GitHub Environment)

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `RENDER_DEPLOY_HOOK`
- `DATABASE_URL` (Supabase staging project connection string, used by the migration step)
- Any `apps/server/.env` values Render needs, added directly in Render's dashboard as environment
  variables (not GitHub secrets, since Render reads them at runtime, not at Actions-run time)
- `apps/web` env vars (including `API_ORIGIN` pointing at the Render service URL), added in Vercel's
  project settings

---

## Cron / Reminders (deferred)

Not designed here. Flagging one constraint for whoever picks this up: an in-process scheduler
(e.g. `node-cron`) requires the server to stay running continuously. Render's **free** tier sleeps
after 15 minutes of inactivity, which would silently stop reminders from firing. If reminders come
back into scope before this changes, either upgrade Render past the free tier, move to a platform
that doesn't sleep (e.g. Railway), or move the schedule itself out of the app process (e.g. an
external scheduled trigger that hits an endpoint, which also wakes the service).

---

## Production (backlog)

Production (`app.splexa.in`) will be built on AWS once the product is ready to ship. Not designed
here — revisit with its own design doc when that's actually next up.
