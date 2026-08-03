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
