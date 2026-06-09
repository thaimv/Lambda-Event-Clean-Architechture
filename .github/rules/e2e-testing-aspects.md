# E2E Testing Aspects

Industry-standard testing aspects for **Vitest E2E** tests against LambdaEvents (event-driven Lambdas).

Each aspect maps to a `describe` block and a test ID prefix. Not every aspect applies to every Lambda — use judgment from the detail design.

---

## Prioritization

| Priority | Prefix | Aspect                    | When                                                           |
| -------- | ------ | ------------------------- | -------------------------------------------------------------- |
| 1        | `S`    | Functional / Happy Path   | Always                                                         |
| 2        | `E`    | Negative / Error Handling | Always — one test per documented error code                    |
| 3        | `B`    | Boundary Value Analysis   | Event payload has min/max length or range constraints          |
| 4        | `EP`   | Equivalence Partitioning  | Enum, UUID, fixed-format fields in payload                     |
| 5        | `ST`   | State Transition          | Lambda has verifiable side effects (DB rows, downstream calls) |
| 6        | `N`    | Null / Optional Fields    | Event payload has optional fields with different behavior      |
| 7        | `I`    | Idempotency               | Lambda should be safe to invoke more than once (retry-safe)    |
| 8        | `A`    | Authorization / Security  | Lambda validates auth (JWT, IAM) — skip if not applicable      |

---

## Aspect S — Functional / Happy Path

Test that the Lambda performs its intended business function when invoked with a valid event.

**When to apply:** Always. One test per distinct success branch.

- **S01** — Full happy path: valid event → `SC-001` **and DB row matches when Lambda touches the database**.
- **S02+** — Conditional branches: separate test per documented branch.

```typescript
// For Lambdas that parse an event body (e.g. input-driven Lambdas):
test('S01: should return SC-001 with valid event', async () => {
  // Arrange
  const event = { body: JSON.stringify({ fieldName: 'example_value' }) };

  // Act
  const result = await app.invoker.invoke(lambdaConfig.myLambda, event);

  // Assert — response
  expect(result.statusCode).toBe(200);
  expect(result.result?.code).toBe('SC-001');

  // Assert — DB row matches (required when Lambda writes to DB)
  const row = await app.db.client.<model>.findUnique({ where: { id: result.result?.data?.id } });
  expect(row?.fieldName).toBe('example_value');
});

// For no-input / batch Lambdas (e.g. delete-user — ignores event body):
test('S01: should return SC-001 with empty event', async () => {
  const result = await app.invoker.invoke(lambdaConfig.deleteUser, {});

  expect(result.statusCode).toBe(200);
  expect(result.result?.code).toBe('SC-001');

  // Assert — DB side effect (required when Lambda deletes/updates rows)
  const remaining = await app.db.client.user.count({ where: { deletedAt: { not: null } } });
  expect(remaining).toBe(0);
});
```

> **Note — authorizer Lambdas (e.g. `jwt-authorizer`)**: These return an **IAM policy** (`AuthorizerResult`), not a `RESULT_CODE` payload. Assert `result.policyDocument.Statement[0].Effect === 'Allow'` on success, or expect an invocation-level error (`FunctionError`) on deny. The `S`/`E` aspects still apply; only the assertion shape differs.

---

## Aspect E — Negative / Error Handling

Invalid event payload rejected with the correct **RESULT_CODE**.

**When to apply:** At least one test per error condition documented in the detail design.

> `result.statusCode` is always `200` for synchronous Lambda invocations — the error is in the **payload**, not the HTTP status.

**Error codes (this project):**

| Code     | Class               | Typical case                   |
| -------- | ------------------- | ------------------------------ |
| `EB-001` | Unauthorized        | Missing/invalid auth           |
| `EB-002` | BadRequest          | Business rule violation        |
| `EB-003` | NotFound            | Resource missing               |
| `EB-004` | Validation          | Zod / input validation failure |
| `EB-009` | Existed             | Duplicate resource             |
| `ES-001` | InternalServerError | Unexpected failure             |

```typescript
// For input-driven Lambdas with Zod body validation:
test('E01: should return EB-004 when required field is missing', async () => {
  const result = await app.invoker.invoke(lambdaConfig.myLambda, { body: JSON.stringify({}) });

  expect(result.statusCode).toBe(200);
  expect(result.result?.code).toBe('EB-004');
});

// For no-input Lambdas (e.g. delete-user): skip EB-004 — no validation errors possible.
// Use EB-002 / ES-001 for business/infra errors per design.
```

---

## Aspect B — Boundary Value Analysis

Test event payload fields at the edges of valid ranges.

- **B01 (min valid):** Exactly at minimum → `SC-001`
- **B02 (below min):** One below minimum → `EB-004`
- **B03 (max valid):** Exactly at maximum → `SC-001`
- **B04 (above max):** One above maximum → `EB-004`

```typescript
// Only applies to input-driven Lambdas with constrained fields — skip for no-input Lambdas like delete-user.
test('B01: should return SC-001 when fieldName is at minimum length (1 char)', async () => {
  const result = await app.invoker.invoke(lambdaConfig.myLambda, {
    body: JSON.stringify({ fieldName: 'a' }),
  });
  expect(result.result?.code).toBe('SC-001');
});
```

---

## Aspect EP — Equivalence Partitioning

One representative value per valid/invalid equivalence class.

**When to apply:** Enum, UUID, code, or identity format fields in the event payload.

```typescript
// Only applies to input-driven Lambdas — skip for no-input Lambdas like delete-user.
test('EP01: should return EB-004 when fieldName has invalid format', async () => {
  const result = await app.invoker.invoke(lambdaConfig.myLambda, {
    body: JSON.stringify({ fieldName: 'INVALID_FORMAT' }),
  });
  expect(result.result?.code).toBe('EB-004');
});
```

---

## Aspect ST — State Transition

Verify that Lambda invocation produces observable side effects — prefer **DB read-back** over a second invocation when the design does not expose a dedicated read path.

**When to apply:** Lambda modifies DB rows, sends downstream events, or has behavior that changes after first invocation.
**S01** already asserts DB for simple create/update/delete; **ST01** covers multi-step transitions (e.g. invoke twice and verify state change, or verify fields not returned in the response payload).

```typescript
test('ST01: should remove eligible rows from DB after invocation', async () => {
  // Arrange — seed eligible rows when design requires pre-existing state
  // await app.db.client.user.create({ data: { ... } });

  // Act
  const result = await app.invoker.invoke(lambdaConfig.deleteUser, {});
  expect(result.result?.code).toBe('SC-001');

  // Assert — read back via DB — state must be persisted
  const remaining = await app.db.client.user.count({ where: { deletedAt: { not: null } } });
  expect(remaining).toBe(0);

  // Second invocation — no eligible rows left, still succeeds gracefully
  const result2 = await app.invoker.invoke(lambdaConfig.deleteUser, {});
  expect(result2.result?.code).toBe('SC-001');
});
```

---

## Aspect N — Null / Optional Fields

Optional event payload fields are handled correctly when absent.

```typescript
test('N01: should return SC-001 when optional field is omitted', async () => {
  const { optionalField, ...eventWithoutOptional } = JSON.parse(VALID_EVENT.body);
  const result = await app.invoker.invoke(lambdaConfig.deleteUser, {
    body: JSON.stringify(eventWithoutOptional),
  });
  expect(result.result?.code).toBe('SC-001');
});
```

---

## Aspect I — Idempotency

Lambda invoked twice with the same event returns a consistent result.

**When to apply:** Cleanup Lambdas, upsert operations, event-driven handlers that must be retry-safe.

```typescript
test('I01: should return SC-001 when invoked twice with identical event', async () => {
  await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);
  const result = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);

  expect(result.statusCode).toBe(200);
  expect(result.result?.code).toBe('SC-001');
});
```

---

## Aspect A — Authorization / Security

Lambda rejects requests with missing or invalid auth.

**When to apply:** Lambdas that validate a JWT, IAM signature, or API key.

Two invocation styles — choose based on how the Lambda is triggered:

```typescript
// Via direct invocation (e.g. jwt-authorizer tested as a Lambda function directly)
test('A01: should return EB-001 when auth token is missing', async () => {
  const result = await app.invoker.invoke(lambdaConfig.jwtAuthorizer, {
    headers: {}, // no cookie, no Authorization header
    methodArn: 'arn:aws:execute-api:...',
  });
  expect(result.result?.code).toBe('EB-001');
});

// Via API Gateway (e.g. testing that the authorizer blocks the endpoint)
test('A01: should return 401 when request has no credentials', async () => {
  const result = await app.withoutAuth().sendRest('POST', '/protected-path', {});
  expect(result.statusCode).toBe(401);
});
```

---

## Test ID Naming Convention

| Prefix | Aspect                    | Example                    |
| ------ | ------------------------- | -------------------------- |
| `S`    | Functional / Happy Path   | `S01`, `S02`               |
| `E`    | Negative / Error Handling | `E01`, `E02`               |
| `B`    | Boundary Value Analysis   | `B01`, `B02`, `B03`, `B04` |
| `EP`   | Equivalence Partitioning  | `EP01`, `EP02`             |
| `ST`   | State Transition          | `ST01`                     |
| `N`    | Null / Optional Fields    | `N01`                      |
| `I`    | Idempotency               | `I01`                      |
| `A`    | Authorization / Security  | `A01`                      |

---

## `describe` Block Structure

```typescript
import { cloudwatchConfig, e2eHookTimeouts } from '@e2e/config';

describe('<LambdaName> - E2E (Black-box)', () => {
  const app = getLambdaTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.lambdaKey],
      // login is automatic — Cognito credentials resolved inside bootstrap()
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate();
  }, e2eHookTimeouts.afterAll);

  describe('Functional - Happy Path', () => {
    /* S */
  });
  describe('Negative - Error Handling', () => {
    /* E */
  });
  describe('Boundary Value Analysis', () => {
    /* B — when constraints exist */
  });
  describe('Equivalence Partitioning', () => {
    /* EP — enum/format fields */
  });
  describe('State Transition', () => {
    /* ST — side effects */
  });
  describe('Null / Optional Fields', () => {
    /* N — optional payload fields */
  });
  describe('Idempotency', () => {
    /* I — retry-safe Lambdas */
  });
  describe('Authorization', () => {
    /* A — auth-validating Lambdas */
  });
});
```
