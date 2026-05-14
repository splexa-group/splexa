# TypeScript & Linting Rules

## TypeScript — Strict Mode, Always

Both `apps/server` and `apps/web` use TypeScript in strict mode. There are no exceptions. Do not disable strict rules per-file or per-line to make something "easier to ship."

### Required `tsconfig.json` settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### No `any`

`any` defeats TypeScript. Use:

- `unknown` when the type is genuinely unknown — then narrow it with guards
- A specific type when you know the shape
- A generic `T` when the type is caller-determined

```ts
// ❌
function parseResponse(data: any) {
  return data.id;
}

// ✅
function parseResponse(data: unknown): string {
  if (typeof data !== "object" || data === null || !("id" in data)) {
    throw new ValidationError("Invalid response shape");
  }
  return String((data as { id: unknown }).id);
}
```

### No Non-Null Assertions

`!` is a lie you tell the compiler. Handle nullability explicitly.

```ts
// ❌
const user = await userRepo.findById(id)!;

// ✅
const user = await userRepo.findById(id);
if (!user) throw new NotFoundError("User not found");
```

### Explicit Return Types on Exported Functions

Public functions (exported from a module) always have explicit return types. Internal functions can rely on inference if the return type is obvious.

```ts
// ✅ Explicit on exports
export async function createCase(
  orgId: string,
  input: CreateCaseInput,
): Promise<Case> {
  return casesRepository.create({ ...input, orgId });
}

// ✅ Inferred fine for small internals
function buildWhereClause(filters: CaseFilters) {
  return { status: filters.status, orgId: filters.orgId };
}
```

---

## ESLint Configuration

Use `@typescript-eslint/eslint-plugin` + `eslint-plugin-import` + `eslint-plugin-unicorn` (selective rules).

Key rules that are enforced:

```js
// .eslintrc.cjs (at root, extended by apps)
module.exports = {
  rules: {
    // TypeScript
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-non-null-assertion": "error",

    // Imports
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc" },
      },
    ],
    "import/no-duplicates": "error",
    "no-unused-vars": "off", // Handled by @typescript-eslint version

    // Code quality
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    eqeqeq: ["error", "always"],
  },
};
```

### Unused Imports — Zero Tolerance

ESLint `@typescript-eslint/no-unused-vars` is set to `error`. Before committing, run:

```bash
pnpm lint
```

Any unused import is a build error in CI.

---

## Import Rules

### Path Aliases — Always

```ts
// ✅ Use aliases
import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/errors";
import { CaseStatus } from "@splexa/shared";

// ❌ Never relative paths across folders
import { prisma } from "../../../lib/db";
import { CaseStatus } from "../../packages/shared/src";
```

### Import Group Order

Groups separated by one blank line:

```ts
// Group 1: Node.js built-ins
import { randomUUID } from "crypto";
import { join } from "path";

// Group 2: External packages (node_modules)
import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

// Group 3: Internal workspace packages
import type { Case, AuthUser } from "@splexa/shared";

// Group 4: Internal via alias
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { caseService } from "@/modules/cases/cases-service";

// Group 5: Relative (same module only)
import { casesRepository } from "./cases-repository";
import type { CaseFilters } from "./cases-schema";
```

### Type-Only Imports

When importing only a TypeScript type, use `import type`:

```ts
// ✅
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Case } from "@splexa/shared";

// ❌ Imports a value when only the type is needed (bloats the bundle)
import { FastifyRequest } from "fastify";
```

---

## Naming Conventions

### Variables and Constants

```ts
// Regular variables — camelCase
const activeCases = [];
const userorgId = req.user.orgId;

// Boolean variables — named as questions
const isActive = case_.status === "ACTIVE";
const hasAccess = user.role === "ADMIN";
const canArchive = user.role === "ADMIN" && case_.orgId === user.orgId;

// Constants (true constants, not runtime values) — SCREAMING_SNAKE_CASE
const MAX_OTP_ATTEMPTS = 3;
const OTP_TTL_SECONDS = 600;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
```

### Functions

```ts
// Action functions — verb + noun
createCase(...)
archiveCase(...)
sendHearingReminder(...)
buildPortalUrl(...)
assertUserCanModifyCase(...)

// Query functions — get/find + noun
findCaseById(...)
getCasesForFirm(...)
getUserByMobile(...)

// Boolean functions — is/has/can + condition
isOtpExpired(...)
hasActivePlan(organization)
canUserArchiveCase(user, case_)
```

### Types and Interfaces

```ts
// Types — PascalCase
type CaseStatus = "ACTIVE" | "ADJOURNED" | "CLOSED";

// Interfaces — PascalCase, no `I` prefix
interface AuthUser {
  userId: string;
  orgId: string;
  role: UserRole;
}

// Props interfaces — ComponentName + Props
interface CaseCardProps {
  case_: Case;
  onArchive: (id: string) => void;
}
```

---

## File Naming — All Files in Repo

**kebab-case everywhere**:

```
cases-service.ts      ✅
casesService.ts       ❌
CasesService.ts       ❌

use-cases-query.ts    ✅
useCasesQuery.ts      ❌

case-card.tsx         ✅
CaseCard.tsx          ❌ (even React components)

auth-plugin.ts        ✅
authPlugin.ts         ❌
```

Framework exceptions (these must match what the framework expects):

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` — Next.js App Router
- `middleware.ts` — Next.js middleware
- `next.config.ts`, `tailwind.config.ts` — config files

---

## Prettier Configuration

Formatting is handled by Prettier. Do not debate formatting in code review — Prettier decides.

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Run before commit:

```bash
pnpm format     # prettier --write .
pnpm lint       # eslint --fix .
```

Both run in CI. PRs that fail lint or format checks are not merged.

---

## Blank Lines Between Groups

In any file, blank lines separate logical groups:

```ts
// Imports (grouped as above)

// Constants
const MAX_ATTEMPTS = 3;

// One blank line

// Helper types/interfaces
interface OtpValidationResult { ... }

// One blank line

// Main exported function
export async function validateOtp(...): Promise<OtpValidationResult> {
  // ...
}

// One blank line before each additional export
export async function sendOtp(...) {
  // ...
}
```

Inside a function, blank lines separate logical steps:

```ts
async function createCase(user: AuthUser, input: CreateCaseInput) {
  // Validate access
  if (user.role !== "ADMIN") throw new ForbiddenError("...");

  // Check for duplicate case number within firm
  const existing = await casesRepository.findByCaseNumber(
    input.caseNumber,
    user.orgId,
  );
  if (existing) throw new ValidationError("Case number already exists");

  // Create the case
  const case_ = await casesRepository.create({ ...input, orgId: user.orgId });

  return case_;
}
```
