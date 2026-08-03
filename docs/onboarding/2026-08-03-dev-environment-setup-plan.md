# Dev Environment Setup & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it possible for a new hire to go from `git clone` to a working `pnpm dev` using one documented, version-pinned path, with no tribal knowledge and no silent version drift.

**Architecture:** Pure configuration/docs work — no application code changes. Pin Node/pnpm via Volta + an `engines`/`.npmrc` trip-wire, add the two missing `.env.example` files, write a root `README.md`, and add `.vscode/extensions.json`. Docker is explicitly out of scope (see spec).

**Tech Stack:** pnpm workspaces, Turborepo, Volta, Prisma (server), Next.js (web).

## Global Constraints

- Node version pinned everywhere must be `22.22.3` (matches `.github/workflows/build.yml`).
- pnpm version pinned everywhere must be `10.33.2` (matches root `package.json`'s existing `packageManager` field — do not change that field).
- No shared credential vault (1Password/Bitwarden both require a paid org plan the team doesn't have) — credentials are handed over teammate-to-teammate. Nothing in this plan should reference or assume a vault tool.
- Docker is out of scope for every task in this plan.
- Follow this repo's existing file-naming and doc-location conventions (`.claude/monorepo-rules.md`, `developer-workflow.md`) — this plan and its doc live under `docs/onboarding/`, not `docs/superpowers/`.

---

### Task 1: Rename the branch to match its actual purpose

**Files:** None (git operation only).

**Interfaces:** None.

- [ ] **Step 1: Confirm the branch has no upstream (safe to rename locally without force-pushing)**

Run: `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
Expected: `fatal: no upstream configured for branch 'chore/docker-setup'`

If this instead prints a remote branch name, stop and tell the user — renaming a pushed branch needs a coordinated delete+push, which is a destructive-ish action requiring explicit confirmation first.

- [ ] **Step 2: Rename the branch**

```bash
git branch -m chore/docker-setup chore/dev-onboarding-setup
```

- [ ] **Step 3: Verify**

Run: `git branch --show-current`
Expected: `chore/dev-onboarding-setup`

(No commit — a branch rename has nothing to stage.)

---

### Task 2: Pin Node/pnpm with Volta + add an engine trip-wire

**Files:**
- Modify: `package.json` (root)
- Create: `.npmrc` (root)

**Interfaces:** None — this is root-level tooling config, nothing downstream depends on new exports.

- [ ] **Step 1: Add the `volta` and `engines` fields to root `package.json`**

Open `package.json` and add these two top-level fields (alongside the existing `packageManager`, `scripts`, `devDependencies` — don't touch those):

```json
"engines": {
  "node": "22.22.3"
},
"volta": {
  "node": "22.22.3",
  "pnpm": "10.33.2"
}
```

- [ ] **Step 2: Create root `.npmrc` with the engine trip-wire**

```
engine-strict=true
```

- [ ] **Step 3: Verify the trip-wire actually fires on a mismatched Node version**

This is the "test" for this task — a config change has no unit test, so we verify by deliberately trying to break it.

Run: `node -e "console.log(process.version)"` to see your current Node version, then:

```bash
pnpm install --dry-run
```

- If your local Node version does **not** match `22.22.3`, expect pnpm to fail with an error mentioning `engines` / unsupported Node version.
- If your local Node version **does** match `22.22.3` (e.g. because Volta is already active from a previous project), the install proceeds normally — that's also correct behavior, it just means you can't observe the trip-wire firing on this machine. In that case, confirm the fields are present with:

```bash
node -e "console.log(require('./package.json').engines, require('./package.json').volta)"
```

Expected: prints `{ node: '22.22.3' } { node: '22.22.3', pnpm: '10.33.2' }`

- [ ] **Step 4: Run the full install to make sure nothing else broke**

Run: `pnpm install`
Expected: completes successfully (assuming a compatible Node is active), lockfile unchanged (`git status` shows no diff on `pnpm-lock.yaml`).

- [ ] **Step 5: Commit**

```bash
git add package.json .npmrc
git commit -m "chore: pin Node/pnpm versions via Volta, add engine-strict trip-wire"
```

---

### Task 3: Add `apps/server/.env.example`

**Files:**
- Create: `apps/server/.env.example`
- Reference (read-only, do not modify): `apps/server/.env`

**Interfaces:** None — this is a template file, no code imports it.

- [ ] **Step 1: Confirm the exact key list in the real `.env` file (without printing values)**

Run:
```bash
sed 's/=.*/=/' apps/server/.env
```

This prints every key from the real `.env` with values stripped — use this output as the source of truth for which keys go in the example file (don't hand-type a list from memory, in case new keys have been added since this plan was written).

- [ ] **Step 2: Create `apps/server/.env.example` with those keys — empty for secrets, real working values for non-secrets**

Cross-check Step 1's key list against what `apps/server/src/config/env.ts` actually reads before finalizing this file — a real `.env` can carry leftover keys nothing reads anymore, and can miss optional keys (like the R2 storage credentials) that only matter under certain provider settings.

```
LOG_LEVEL=debug
NODE_ENV=development
PORT=5001
COOKIE_SECRET=
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRY=15m
DATABASE_URL=
DIRECT_URL=

RESEND_API_KEY=
EMAIL_PROVIDER=resend
EMAIL_FROM=

STORAGE_PROVIDER=supabase
# R2 — optional, required only when STORAGE_PROVIDER=r2
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

WHATSAPP_PROVIDER=interakt
INTERAKT_API_KEY=
```

If Step 1's output has keys not listed here, verify against `env.ts` whether they're still read before adding them — don't assume everything in a developer's local `.env` is still live.

- [ ] **Step 3: Verify the file is tracked by git (not accidentally ignored)**

Run: `git check-ignore -v apps/server/.env.example`
Expected: no output (exit code 1) — meaning the file is NOT ignored. If this prints something, the `.gitignore`'s `!.env.example` rule isn't matching for some reason; stop and investigate before continuing (don't just force-add).

- [ ] **Step 4: Verify the file has no real secret values leaked into it**

Run: `grep -vE '^[A-Z_0-9]+=$|^$|^NODE_ENV=development$|^LOG_LEVEL=debug$|^PORT=5001$|^JWT_ACCESS_EXPIRY=15m$|^EMAIL_PROVIDER=resend$|^STORAGE_PROVIDER=supabase$|^WHATSAPP_PROVIDER=interakt$|^# R2 .*$' apps/server/.env.example`
Expected: no output — every line is either `KEY=` (empty), blank, a `#` comment, or one of the intentional non-secret defaults listed above.

- [ ] **Step 5: Commit**

```bash
git add apps/server/.env.example
git commit -m "docs(server): add .env.example"
```

---

### Task 4: Add `apps/web/.env.local.example`

**Files:**
- Create: `apps/web/.env.local.example`
- Reference (read-only, do not modify): `apps/web/.env.local`

**Interfaces:** None.

- [ ] **Step 1: Confirm the exact key list**

```bash
sed 's/=.*/=/' apps/web/.env.local
```

- [ ] **Step 2: Create `apps/web/.env.local.example` — with real default values, not blanks**

Both keys are read via nullish coalescing in code (`apps/web/src/api/client.ts` and
`apps/web/next.config.ts`, e.g. `process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"`). An empty string
is a *defined* value, so `??` will NOT fall through to the default — copying a blank-valued
`.env.local.example` into `.env.local` would silently break local dev by overriding the working
default with `""`. Use the same values the code's fallbacks already use:

```
NEXT_PUBLIC_API_URL=/api/v1
API_ORIGIN=http://127.0.0.1:5001
```

(Add any additional keys Step 1 revealed — check whether each one is read via `??` with a
fallback before deciding whether it needs a real value here or can stay blank.)

- [ ] **Step 3: Verify not ignored**

Run: `git check-ignore -v apps/web/.env.local.example`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/.env.local.example
git commit -m "docs(web): add .env.local.example"
```

---

### Task 5: Add `.vscode/extensions.json`

**Files:**
- Create: `.vscode/extensions.json`
- Reference (read-only, do not modify): `.vscode/settings.json`

**Interfaces:** None.

- [ ] **Step 1: Create the file**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

- [ ] **Step 2: Verify it's valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('.vscode/extensions.json', 'utf8'))"`
Expected: no output, exit code 0 (a JSON parse error would print and exit non-zero).

- [ ] **Step 3: Commit**

```bash
git add .vscode/extensions.json
git commit -m "chore(editor): recommend ESLint/Prettier/Tailwind/Prisma extensions"
```

---

### Task 6: Write root `README.md`

**Files:**
- Create: `README.md` (root — none exists today; `apps/web/README.md` is unrelated `create-next-app` boilerplate and is left untouched)

**Interfaces:** None — this is documentation, nothing imports it. It references files created in Tasks 2–5, so do this task last.

- [ ] **Step 1: Write the file**

```markdown
# Splexa

Multi-tenant legal practice management SaaS for Indian law firms (Phase 1). Backend: Fastify +
Prisma + PostgreSQL (via Supabase). Frontend: Next.js + React Query + Zustand + Tailwind. Monorepo:
pnpm workspaces + Turborepo.

## New Developer Setup

1. **Install [Volta](https://volta.sh)** (pins this repo's exact Node/pnpm versions automatically —
   works the same on Mac, Windows, and Linux):

   ```bash
   curl https://get.volta.sh | bash   # Mac/Linux
   ```

   On Windows, download the installer from [volta.sh](https://volta.sh).

2. **Clone the repo and `cd` into it.** Volta will pick up the pinned Node/pnpm versions
   automatically from `package.json` — no `nvm use` or manual version switching needed.

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

   If this fails with an error about Node engine versions, you're not running the pinned Node
   version (`22.22.3`) — check that Volta installed correctly and is active (`volta list all`).

4. **Set up environment variables:**

   ```bash
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```

   Get the real values for both files from a teammate directly (there's no shared credential vault
   for this project — ask whoever is onboarding you). Fill them into the two files you just copied.

5. **Generate the Prisma client** (reads the schema only — no database connection required):

   ```bash
   pnpm --filter server db:generate
   ```

6. **Build the shared package** (`apps/server` and `apps/web` both import its compiled output, which
   isn't checked into git):

   ```bash
   pnpm --filter @splexa-group/shared build
   ```

7. **Start both apps:**

   ```bash
   pnpm dev
   ```

   `apps/web` runs on http://localhost:3000, `apps/server` on the port set by `PORT` in your `.env`.

## Project Orientation

Before writing any code, read [`CLAUDE.md`](CLAUDE.md) and [`.claude/README.md`](.claude/README.md) —
they cover the architecture, the non-negotiable rules (multi-tenancy, layering, naming), and which
skill file to read for your task. This applies whether you're a human or an AI agent working in
this codebase.

## Common Commands

```bash
pnpm dev                          # Run both apps in dev mode
pnpm build                        # Build all apps
pnpm lint                         # Lint all workspaces
pnpm typecheck                    # Type-check all workspaces
pnpm --filter server db:studio    # Open Prisma Studio
pnpm --filter server test         # Run server tests
```
```

- [ ] **Step 2: Verify all referenced files actually exist**

```bash
test -f apps/server/.env.example && \
test -f apps/web/.env.local.example && \
test -f CLAUDE.md && \
test -f .claude/README.md && \
echo "all referenced files exist"
```

Expected: `all referenced files exist`. If this fails, Tasks 3/4 weren't completed first — do them before this task.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add root README with new-hire setup instructions"
```

---

## Final Verification

After all 6 tasks are complete, do a full dry run as if you were the new hire:

- [ ] **Step 1: Confirm every new/modified file is committed**

Run: `git status --short`
Expected: no output (clean tree) — everything from Tasks 1–6 has been committed.

- [ ] **Step 2: Confirm the branch name matches its purpose**

Run: `git branch --show-current`
Expected: `chore/dev-onboarding-setup`

- [ ] **Step 3: Fresh install works end-to-end**

```bash
pnpm install
pnpm --filter server db:generate
pnpm --filter @splexa-group/shared build
pnpm build
```

Expected: all four succeed with no errors. (`pnpm dev` is not run here since it's a persistent process — spot-check it manually if you want full confidence.)

- [ ] **Step 4: Confirm no secrets leaked into any committed example file**

Both example files intentionally carry non-secret default values (see Tasks 3/4), so a plain
"every line is blank" check would false-positive on those. List each file's non-blank lines and
manually confirm each one is an expected default, not a real credential:

```bash
git show HEAD:apps/server/.env.example | grep -vE '^[A-Z_0-9]+=$|^$|^#'
git show HEAD:apps/web/.env.local.example | grep -vE '^[A-Z_]+=$|^$'
```

Expected `apps/server/.env.example` output: exactly `NODE_ENV=development`, `LOG_LEVEL=debug`,
`PORT=5001`, `JWT_ACCESS_EXPIRY=15m`, `EMAIL_PROVIDER=resend`, `STORAGE_PROVIDER=supabase`,
`WHATSAPP_PROVIDER=interakt` — no other values. Expected `apps/web/.env.local.example` output:
exactly `NEXT_PUBLIC_API_URL=/api/v1`, `API_ORIGIN=http://127.0.0.1:5001` — no other values.
Anything else in either output is a leaked secret — stop and investigate.
