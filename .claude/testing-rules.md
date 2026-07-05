# Testing Rules — Vitest

## Philosophy

Tests exist to catch regressions in logic that would cost you — broken auth, data leaking across firms, a reminder that never fires. They do not exist to hit a coverage percentage.

**Ask before writing a test**: "If this breaks in production, what is the impact?"

- Auth logic breaks → lawyers locked out → immediate churn. **Test it.**
- A firm's cases leaking to another firm → trust destroyed → existential. **Test it.**
- The `formatIndianDate` utility returns the wrong format → a date looks wrong → annoying. **Maybe not worth a test.**
- A pure getter returns `undefined` instead of `null` → nothing visible breaks. **Skip.**

---

## Test Location

Tests live inside the module they test, inside a `__tests__` folder:

```
modules/auth/
├── auth-service.ts
├── auth-repository.ts
├── auth-routes.ts
└── __tests__/
    └── auth.test.ts       # All auth tests in one file (or split by feature if file grows large)

modules/cases/
└── __tests__/
    └── cases.test.ts
```

Do not create one test file per source file. Group by feature/scenario, not by file. If `cases.test.ts` grows beyond 400 lines, split into `cases-service.test.ts` and `cases-repository.test.ts`.

---

## Test Clarity Over Cleverness

Each test should be readable as a plain English sentence. A junior dev or future-you at 2am should understand what it's asserting and why.

```ts
// ❌ Unclear — what is being asserted? Why does 4 matter?
it("returns 4", async () => {
  const result = await someFunction();
  expect(result).toBe(4);
});

// ✅ Clear — what scenario, what expectation, why it matters
it("returns ACTIVE, ADJOURNED, and CLOSED statuses when all case types exist for the firm", async () => {
  const statuses = await caseService.getStatusSummary(orgId);
  expect(statuses).toContain("ACTIVE");
  expect(statuses).toContain("ADJOURNED");
  expect(statuses).toContain("CLOSED");
});
```

---

## Value Range Tests (Multi-Value Returns)

When a function returns multiple fields or a collection, do not write one test per field. Write one test that asserts the critical shape:

```ts
// ❌ Over-tested — testing each value independently is noise
it('returns id', ...);
it('returns caseNumber', ...);
it('returns status', ...);
it('returns orgId', ...);

// ✅ One test that verifies the shape matters
it('returns a case with all required fields when created successfully', async () => {
  const case_ = await caseService.create(adminUser, validCaseInput);
  expect(case_).toMatchObject({
    caseNumber: validCaseInput.caseNumber,
    status: 'ACTIVE',
    orgId: adminUser.orgId,
  });
  // id and timestamps exist but we don't hard-code their values
  expect(case_.id).toBeDefined();
});
```

For a function returning 4–5 values, write **one test** checking the full object shape with `toMatchObject`. Only add a second test if there's a specific edge case (e.g., what happens when `caseNumber` is null).

---

## Auth Module Tests — What to Cover

Located at `modules/auth/__tests__/auth.test.ts`.

These are critical — they protect the most sensitive paths in the app.

```ts
describe("OTP flow", () => {
  it("generates a 6-digit OTP and stores it in Redis with 10-minute TTL");
  it("returns the channel used (whatsapp or sms) after sending OTP");
  it("locks the mobile for 15 minutes after 3 failed OTP attempts");
  it("deletes OTP from Redis after successful verification");
  it("rejects an expired OTP");
});

describe("JWT", () => {
  it("issues an access token with correct orgId and role in payload");
  it("rejects a request with an expired access token");
  it("issues a new access token given a valid refresh token cookie");
  it("rejects a refresh token that has been blacklisted (after logout)");
});

describe("multi-tenancy guard", () => {
  it(
    "does not return cases from a different firm when using a valid JWT from another firm",
  );
});
```

---

## Cases Module Tests — What to Cover

```ts
describe("case creation", () => {
  it("creates a case scoped to the authenticated user's firm");
  it("rejects creation if caseNumber already exists within the same firm");
});

describe("case access", () => {
  it("returns only cases belonging to the authenticated firm");
  it("returns 404 when a case ID exists but belongs to a different firm");
});

describe("archiving", () => {
  it("allows ADMIN to archive a case");
  it("throws ForbiddenError when a MEMBER tries to archive a case");
});
```

---

## Writing Vitest Tests

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("caseService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a case and returns it with orgId from user context, not request body", async () => {
    // Arrange
    const user = { userId: "u1", orgId: "firm-123", role: "ADMIN" };
    const input = {
      caseNumber: "DHC/001/2025",
      clientId: "c1",
      courtName: "Delhi High Court",
    };

    // Act
    const result = await caseService.create(user, input);

    // Assert
    expect(result.orgId).toBe("firm-123");
    expect(result.caseNumber).toBe("DHC/001/2025");
  });
});
```

Structure every test with **Arrange → Act → Assert** — even if not labeled, the code should follow this order.

---

## Mocking Rules

- Mock the **repository layer** in service tests — do not hit the real DB in unit tests
- Mock the **service layer** in route/integration tests
- Use `vi.mock` at the top of the file, not inside individual tests
- Prefer explicit mocks over `vi.spyOn` for clarity
- Integration tests (hitting real DB) live in a separate `__tests__/integration/` folder and run only in CI with a test DB

```ts
vi.mock("../cases-repository", () => ({
  casesRepository: {
    findAllByFirm: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));
```

---

## What NOT to Test

- Prisma model types — TypeScript catches this at compile time
- Trivial getters and setters with no logic
- Framework behavior (Fastify routing works — you don't need to test it)
- Third-party library return values
- `console.log` output
- Style and formatting

If you are writing a test for a 3-line pure function that cannot throw and has no branching, delete the test.

---

## Test Naming Convention

```
it('[action] when [condition]')
it('[subject] returns [value] when [condition]')
it('throws [ErrorType] when [condition]')
```

Examples:

- `it('locks mobile after 3 failed OTP attempts')`
- `it('returns 404 when case belongs to a different firm')`
- `it('throws ForbiddenError when MEMBER tries to archive a case')`

---

## Test Factories — Shared Test Data

Do not repeat raw object literals across test files. Use typed factory functions for test data. These live in `__tests__/factories.ts` within the module, or in `src/test-utils/` if shared across modules.

```ts
// modules/cases/__tests__/factories.ts
import type { AuthUser } from '@splexa-group/shared/models';
import type { CreateCaseInput } from '@splexa-group/shared/schemas';

export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    userId: 'user-test-1',
    orgId: 'org-test-1',
    role: 'ADMIN',
    name: 'Test Admin',
    ...overrides,
  };
}

export function makeCaseInput(overrides: Partial<CreateCaseInput> = {}): CreateCaseInput {
  return {
    clientId: 'client-test-1',
    caseNumber: 'DHC/TEST/001/2025',
    caseType: 'Civil',
    courtName: 'Delhi High Court',
    city: 'Delhi',
    ...overrides,
  };
}
```

Usage in tests:

```ts
it('returns 404 when case belongs to a different firm', async () => {
  const firmAUser = makeUser({ orgId: 'org-a' });
  const firmBCase = await casesRepository.create(makeCaseInput({ orgId: 'org-b' }));

  const result = await caseService.getById(firmAUser, firmBCase.id);
  expect(result).toBeNull();
});
```

Factories must always have sensible defaults so a test only overrides what it cares about.

---

## Forbidden — Tests

| Forbidden | Why |
|---|---|
| Real Prisma calls in unit tests | Slow, brittle, requires DB setup — mock the repository |
| `vi.mock` inside `it()` or `beforeEach()` | Hoisting issues; always at file top level |
| Testing framework behavior (Fastify routing, Zod parsing) | Trust the library |
| `expect(x).toBe(true)` without context | Write `expect(isValid).toBe(true)` — name the thing being checked |
| Asserting `console.log` output | Not production behavior |
| One describe block per source file | Group by behavior/scenario, not by file name |
| Copying test data inline 3+ times | Extract to a factory function |
| Empty catch blocks in tests | If it throws, let it fail — that's the point |
| `setTimeout` / arbitrary `sleep` in tests | Use `vi.useFakeTimers()` or mock the async operation |

---

## Running Tests

```bash
# From root
pnpm test                        # Run all tests via turbo
pnpm --filter server test        # Server tests only
pnpm --filter server test:watch  # Watch mode during development
```

Vitest config lives at `apps/server/vitest.config.ts`. Use `@vitest/coverage-v8` for coverage reports in CI, but do not enforce a minimum coverage percentage — quality over quantity.

---

## AI Agent Self-Check — Tests

Before declaring test work done:

**Coverage of what matters**
- [ ] Auth flow has: OTP lockout, JWT expiry, refresh token blacklist, cross-firm isolation
- [ ] Every new resource type has a cross-firm isolation test (valid JWT from org A cannot access org B's data)
- [ ] Every ADMIN-only mutation has a test proving a MEMBER is rejected

**Test quality**
- [ ] Test names follow: `it('[action] when [condition]')` — readable as a sentence
- [ ] Arrange → Act → Assert order — even if not labeled
- [ ] Repository is mocked in service tests — no real DB calls in unit tests
- [ ] Factories used for test data — no repeated inline object literals

**No false tests**
- [ ] No test for trivial getters/framework behavior
- [ ] No test that always passes regardless of implementation
- [ ] No `vi.mock` inside `it()` — must be at file top level
