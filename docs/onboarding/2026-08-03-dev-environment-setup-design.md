# Dev Environment Setup & Onboarding — Design

## Problem

There's no documented, repeatable way for a new developer to get Splexa running locally with
confidence that their environment matches everyone else's. Concretely, today:

- Node's version isn't pinned anywhere locally. CI (`build.yml`) pins `20.20.2`, but nothing stops
  a local machine from running a different major version — and in practice one already is.
- `pnpm` version is pinned (`packageManager` in root `package.json`), but nothing enforces it if a
  developer doesn't have Corepack/Volta set up.
- No `.env.example` exists for either `apps/server` or `apps/web`, despite `.gitignore` already
  allowing one (`!.env.example`) and `monorepo-rules.md` describing it as required. A new
  developer has no way to know which environment variables exist without asking someone to read
  out their own `.env` file.
- There is no root `README.md` — only the default `create-next-app` boilerplate under
  `apps/web/README.md`, which says nothing about this project.

Docker is explicitly out of scope for this design. The DB, storage, email, and WhatsApp
integrations are all cloud services (Supabase, Resend, Interakt) — there is no local infrastructure
(Postgres, Redis) to containerize, and full containerization of the apps themselves would add
local-dev friction (slower HMR, harder debugging) without solving the actual problem. Docker
becomes worth revisiting once there's a concrete deployment target that needs a container image;
that's a separate initiative, not part of this one.

## Goals

1. A new developer (mixed Mac/Windows/Linux) can go from `git clone` to `pnpm dev` working, using
   one documented set of steps, with no tribal knowledge required.
2. Node and pnpm versions are pinned per-project and auto-applied, so "works on my machine" version
   drift stops being possible by default, with a loud failure (not silent breakage) for anyone who
   bypasses the pinning tool.
3. Every environment variable either app needs is discoverable from the repo itself.

## Design

### 1. Version pinning — Volta

Add to root `package.json`:

```json
"volta": {
  "node": "20.20.2",
  "pnpm": "10.33.2"
}
```

- `node` matches the version CI already uses in `.github/workflows/build.yml`, closing the
  existing CI/local mismatch.
- `pnpm` matches the existing `packageManager` field.
- Volta auto-switches Node/pnpm on `cd` into the repo once installed — no manual `nvm use`, and it
  works identically on Mac, Windows, and Linux (unlike `nvm`, which has no first-class Windows
  support).

**Safety net:** add `"engines": { "node": "20.20.2" }` to root `package.json` and a root `.npmrc`
with `engine-strict=true`. If someone installs dependencies without Volta active, on the wrong Node
version, `pnpm install` fails immediately with a clear message instead of surfacing as a confusing
runtime error later.

### 2. `.env.example` files

**`apps/server/.env.example`** — every key present in `apps/server/.env` today, values emptied:

```
LOG_LEVEL=
NODE_ENV=development
PORT=
COOKIE_SECRET=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=
JWT_REFRESH_EXPIRY=
DATABASE_URL=
DIRECT_URL=
DB_PASSWORD=
RESEND_API_KEY=
EMAIL_PROVIDER=
EMAIL_FROM=
REPLY_TO=
STORAGE_PROVIDER=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
WHATSAPP_PROVIDER=
INTERAKT_API_KEY=
```

**`apps/web/.env.local.example`** — mirrors `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=
API_ORIGIN=
```

Both are committed (already un-ignored via `!.env.example` in `.gitignore`). `monorepo-rules.md`
already states these must be kept in sync when env vars change — this design just creates the
files that rule assumes exist.

The team uses a shared dev/staging Supabase project rather than per-developer Supabase projects.
Actual values for `DATABASE_URL`, `SUPABASE_*`, `RESEND_API_KEY`, and `INTERAKT_API_KEY` come from
the team's 1Password shared vault — the README points there rather than telling a new hire to sign
up for their own accounts.

### 3. Root `README.md`

New file (none exists today) with a "New Developer Setup" section:

1. Install [Volta](https://volta.sh)
2. Clone the repo
3. `pnpm install` — Volta selects the pinned Node/pnpm automatically; `.npmrc` engine-strict catches
   drift if Volta isn't active
4. Copy env files:
   ```
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```
5. Get shared dev credentials from the team's 1Password vault, fill into both `.env` files
6. `pnpm --filter server db:generate` — generates the Prisma client against the shared dev DB
7. `pnpm dev` — runs `apps/server` and `apps/web` together via Turborepo

Also links to `CLAUDE.md` and `.claude/README.md` so a human new hire finds the same orientation
docs an AI agent uses when working in this codebase.

### 4. Editor consistency

Add `.vscode/extensions.json` recommending: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma.
This only prompts VS Code to suggest installing them on first open of the repo — it's not
enforced, and doesn't block anyone who skips it. Existing `.vscode/settings.json` needs no changes.

## Non-Goals

- Docker / containerization of local dev or the DB (see Problem section — no local infra exists to
  containerize; revisit once there's a deployment target).
- Automating setup via a bootstrap script. Chosen: documented manual steps only, to match the
  project's small-team, YAGNI-driven approach (`developer-workflow.md`'s "Do I need this?" test).
  Revisit if onboarding friction shows up in practice.
- Solving credential *rotation* or vault tooling — 1Password already exists and is out of scope to
  change; this design only points to it.

## Manual Step (Not Code)

This design assumes a shared 1Password item (e.g. "Splexa Dev Env") containing the real values for
every key in `apps/server/.env.example` and `apps/web/.env.local.example` already exists or is
created as part of this work. Creating/populating that vault item is a manual action outside the
codebase — it must be done explicitly (not silently skipped) before a new hire can actually
complete setup, since the README will tell them to pull values from it.

## Branch

The current branch, `chore/docker-setup`, predates this design and contains no Docker work yet. It
should be renamed to reflect what's actually being built here (e.g.
`chore/dev-onboarding-setup`), per `developer-workflow.md`'s one-branch-one-purpose convention.
