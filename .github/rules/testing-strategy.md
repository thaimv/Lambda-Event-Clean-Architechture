# Testing Strategy

> Loaded when writing, reviewing, or analyzing test code.

## Framework & Setup

- **Unit tests**: Vitest (`vitest.config.mjs`) — in-process, no Lambda cold start
- **E2E tests**: Vitest (`vitest-e2e.config.mjs`) — invokes the **deployed** Lambda via AWS SDK or API Gateway
- **Unit test env**: mocks only — no real DB/AWS (`app/lambda/test/common/helpers/app-config.helper.ts` for config stubs)
- **E2E test env**: copy `envs/.env.e2e.example` → `envs/.env.e2e`, fill in Lambda ARNs, AWS credentials, and (optionally) Cognito + API endpoint values
- **Local Lambda runs**: `out/simulator/` + `out/simulator/env.yml`
- **Mocks**: constructor injection with mock implementations (no DI container in unit tests)

## Coverage Requirements

| Scope                          | Target                       | How                           |
| ------------------------------ | ---------------------------- | ----------------------------- |
| New UseCase                    | 100%                         | Unit tests                    |
| New Repository Impl            | ≥ 80%                        | Unit tests                    |
| New Presenter                  | ≥ 80%                        | Unit tests                    |
| Lambda entry (`index.test.ts`) | Happy path + key error cases | Unit tests                    |
| E2E (black-box)                | S + E aspects minimum        | `lambda-generate-event-tests` |

> E2E tests invoke the **deployed** Lambda — they do not instrument local source code and do not contribute to Vitest coverage reports.

## Test File Structure

Unit tests live under `app/lambda/test/` and **mirror** `app/lambda/src/`:

```
app/lambda/test/
├── common/
│   ├── helpers/              # app-config.helper.ts, shared fixtures
│   ├── datasources/          # mirrors common/datasources/
│   ├── errors/
│   ├── lambda/
│   └── utils/
├── config/
└── {lambda-name}/            # mirrors src/{lambda-name}/
    ├── index.test.ts
    ├── presenter/
    ├── repos/implements/
    └── usecases/implements/
```

E2E tests live under `tests/e2e/`:

```
tests/e2e/
├── config.ts                  # AWS config, Lambda ARNs, CloudWatch config, Cognito config, REST/GraphQL URLs
├── helpers/
│   ├── lambda-test-app.ts     # getLambdaTestApp() — lifecycle orchestrator
│   ├── invoker.ts             # direct Lambda invocation via @aws-sdk/client-lambda
│   ├── cognito-auth.ts        # Cognito login → { credentials, idToken }
│   ├── requester.ts           # sendGraphQL() / sendRest() with sensitive scan
│   ├── graphql.ts             # AppSync SigV4 signed request
│   ├── rest-api.ts            # API Gateway HTTP client (SigV4 or cookie auth)
│   ├── db.ts                  # Prisma client for DB state assertions
│   ├── cloudwatch-logs.ts     # CloudWatch Live Tail session
│   └── sensitive-leak-detector.ts
└── event/                     # one file per Lambda
    └── {lambda-name}.e2e-spec.ts
```

When generating E2E tests, load:

- `.github/rules/e2e-testing-aspects.md` — aspect types (S, E, B, …) and patterns
- `.github/rules/e2e-testing-best-practices.md` — AAA, assertions, isolation

Skills: `lambda-generate-unit-tests`, `lambda-generate-event-tests`.

## Fixture naming

Unit test stubs and mock data under `app/lambda/test/`:

| Location             | Naming                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `common/`, `config/` | Neutral — e.g. `sampleRecord`, `mockEvent`, `mockPayload`               |
| `{lambda-name}/`     | Lambda-specific OK — e.g. fixtures under `delete-user/` for that Lambda |

- Do not use names from one Lambda in `common/` or another Lambda's tests.
- Prefer shared helpers in `common/helpers/` for cross-Lambda fixtures.

## Unit Test Pattern (UseCase)

```typescript
describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let repoMock: IUserRepo;

  beforeEach(() => {
    vi.clearAllMocks();
    repoMock = { deleteSoftDeletedUsersBefore: vi.fn() } as IUserRepo;
    useCase = new DeleteUserUseCase(repoMock);
  });

  it('deletes soft-deleted users before cutoff and logs result', async () => {
    repoMock.deleteSoftDeletedUsersBefore.mockResolvedValue(3);

    await useCase.execute();

    expect(repoMock.deleteSoftDeletedUsersBefore).toHaveBeenCalledWith(expect.any(Date));
  });
});
```

## Mock Pattern

```typescript
// Inline mock — preferred for simple interfaces
const repoMock = { deleteSoftDeletedUsersBefore: vi.fn() } as IUserRepo;

// Class mock — use when interface has many methods
export class MockUserRepo implements IUserRepo {
  deleteSoftDeletedUsersBefore = vi.fn();
}
```

- Use `vi.fn()` for mock methods.
- Reset in `beforeEach` with `vi.clearAllMocks()`.
- For AWS SDK datasources, use `aws-sdk-client-mock`.

## E2E Test Pattern

```typescript
import { cloudwatchConfig, e2eHookTimeouts } from '@e2e/config';

describe('delete-user - E2E (Black-box)', () => {
  const app = getLambdaTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.deleteUser],
      // login is automatic — Cognito credentials resolved inside bootstrap()
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate(); // waits for logFlushWait, then asserts no sensitive data leaked
  }, e2eHookTimeouts.afterAll);

  describe('Functional - Happy Path', () => {
    test('S01: should return SC-001 with valid event', async () => {
      // Arrange
      const event = {};

      // Act — direct Lambda invocation (primary method for event-driven Lambdas)
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.result?.code).toBe('SC-001');

      // DB assertion (required when Lambda reads/writes DB)
      const row = await app.db.client.user.findUnique({ where: { id: '...' } });
      expect(row).toBeNull();
    });
  });

  describe('Authorization', () => {
    test('A01: should reject request with invalid auth token', async () => {
      // Via API Gateway (REST) — uses withoutAuth() for no credentials
      const result = await app.withoutAuth().sendRest('POST', '/some-endpoint', {});
      expect(result.statusCode).toBe(401);
    });
  });
});
```

## Presenter Test Pattern

Test event parsing, validation failures, and use case delegation — not business logic (those belong in use case tests).

## What to Test

- **UseCase**: all business logic branches, error cases, edge cases
- **Repository**: data mapping, query formation, error wrapping
- **Presenter**: invalid input → `ValidationError`, happy path delegation to use case
- **DataSource**: request/response parsing with mocked SDK clients
- **`index.test.ts`**: handler invokes presenter (smoke test)
- **E2E**: happy path + all documented error codes (S + E aspects minimum)

## What NOT to Test

- Trivial Zod schema definitions
- DI container wiring (covered by presenter/index tests)
- AWS SDK internals
- Generated Prisma client code
