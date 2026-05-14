# Monorepo Rules — pnpm Workspaces + Turborepo

## Workspace Structure

```
root/
├── apps/
│   ├── web/              # Next.js 14 frontend
│   └── server/           # Fastify backend
├── packages/
│   └── shared/           # Shared types, schemas, constants
├── .claude/              # Skill files (these files)
├── .eslintrc.cjs         # Root ESLint config (extended by apps)
├── .prettierrc           # Root Prettier config (used by all)
├── turbo.json            # Turborepo pipeline config
├── pnpm-workspace.yaml   # Workspace definition
└── package.json          # Root package (devDeps: turbo, prettier, eslint)
```

---

## pnpm Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// root package.json
{
  "private": true,
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3.x",
    "@typescript-eslint/parser": "^7.x",
    "@typescript-eslint/eslint-plugin": "^7.x",
    "eslint": "^8.x",
    "eslint-plugin-import": "^2.x"
  }
}
```

---

## Turborepo Pipeline

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

`^build` means "build my dependencies first." This ensures `packages/shared` is compiled before `apps/web` or `apps/server` tries to use it.

---

## Adding Dependencies

### Package-Specific Dependency
```bash
# Add to a specific app/package
pnpm --filter web add @tanstack/react-query
pnpm --filter server add fastify
pnpm --filter shared add zod

# Add dev dependency
pnpm --filter server add -D vitest
```

### Shared Dev Tooling (used across all)
```bash
# Add to root
pnpm add -w -D prettier eslint
```

### Never
```bash
# Never mix package managers
npm install ...
yarn add ...

# Never install at root unless it's a dev tool used across all workspaces
pnpm add react   # React is only for web — add it to apps/web
```

---

## Package Versioning Rules

Before adding any package:

1. **Check publish date**: `npm show <package> time.modified` — reject if last publish > 1 year ago without a clear maintenance statement
2. **Check vulnerabilities**: `pnpm audit` after adding — fix before committing
3. **Check download trends**: prefer packages with consistent or growing weekly downloads
4. **Check open issues**: a package with 500+ open issues and no recent activity is risky
5. **Prefer packages with TypeScript types built-in** — avoid `@types/*` when the main package includes types

### Pinning Strategy
```json
// Use ^ for minor/patch flexibility, not * or latest
{
  "dependencies": {
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  }
}
```

Never use `*` or `latest` in `package.json` — these produce unpredictable installs.

---

## Running Commands

```bash
# Run in all workspaces via turbo
pnpm dev                          # Start all apps in dev mode
pnpm build                        # Build all apps
pnpm test                         # Run all tests
pnpm lint                         # Lint all workspaces

# Run in a specific workspace
pnpm --filter server dev
pnpm --filter web dev
pnpm --filter server test
pnpm --filter web build

# Run a specific package script directly
pnpm --filter server exec prisma migrate dev
pnpm --filter server exec prisma studio
```

---

## Environment Files

```
apps/server/
├── .env              # Gitignored — real secrets
├── .env.example      # Committed — all keys, empty values
└── .env.test         # Gitignored — test DB URL

apps/web/
├── .env.local        # Gitignored — real values
└── .env.local.example # Committed — all keys, empty values
```

`.env` files are never committed. `.env.example` is always kept up to date — if you add a variable, update the example file in the same commit.

---

## TypeScript Project References

Each app and package has its own `tsconfig.json`. The root `tsconfig.json` is the base config extended by each.

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```json
// apps/server/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## CI Expectations

The CI pipeline (when set up) runs in this order:
1. `pnpm install --frozen-lockfile` — reproducible installs
2. `pnpm lint` — zero lint errors
3. `pnpm build` — all packages build successfully
4. `pnpm test` — all tests pass

A PR that fails any of these steps is not merged.

---

## Lockfile

The `pnpm-lock.yaml` is always committed. If it changes unexpectedly (someone ran `npm install`), that's a red flag — revert and find out why.

When the lockfile gets merge conflicts, resolve by running `pnpm install` — do not manually edit the lockfile.

---

## Cleanup After Changes

| Change | Cleanup Required |
|---|---|
| Removed a feature | Remove its `package.json` dependencies; run `pnpm install` |
| Moved code from one app to shared | Remove duplicate from app, ensure shared exports it |
| Renamed a file | Update all import paths; search codebase for old name |
| Updated a major version | Test the app end-to-end; update `.env.example` if config changed |
| Removed an API endpoint | Remove its types from `shared`, its route from `routes.ts`, its API call from frontend `lib/api/` |

---

## Forbidden — Monorepo

| Forbidden | Why |
|---|---|
| `npm install` or `yarn add` in any workspace | Only `pnpm` — mixing package managers corrupts the lockfile |
| `pnpm add <pkg>` at root for an app-specific package | Root is for cross-workspace dev tooling only |
| Importing `apps/web` code from `apps/server` (or vice versa) | Apps are independent — share through `packages/shared` only |
| Committing `pnpm-lock.yaml` with manual edits | Regenerate with `pnpm install` — never hand-edit |
| `*` or `latest` version pins in `package.json` | Produces non-reproducible installs |
| Adding a new package without running `pnpm audit` | May introduce known vulnerabilities |
| Putting backend or frontend framework code in `packages/shared` | Shared package must be platform-agnostic |

---

## AI Agent Self-Check — Monorepo Changes

Before declaring monorepo-related work done:

**Dependencies**
- [ ] New package added to the correct workspace (`--filter server`, `--filter web`, or `-w` for root tooling)
- [ ] `pnpm audit` run after adding — zero high/critical vulnerabilities
- [ ] `.env.example` updated if the new package requires environment variables
- [ ] `pnpm-lock.yaml` updated by `pnpm install`, not manually edited

**Shared package**
- [ ] Any type used by both apps lives in `packages/shared`, not duplicated
- [ ] Nothing with a `fastify`, `react`, `next`, or `prisma` import landed in `packages/shared`
- [ ] `packages/shared/src/index.ts` exports the new type/schema/constant

**Build**
- [ ] `pnpm build` passes after the change
- [ ] `pnpm lint` passes — no import-order or unused-import errors