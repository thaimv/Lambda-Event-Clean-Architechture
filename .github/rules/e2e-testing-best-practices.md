# E2E Test Case Best Practices

Standards for high-quality, maintainable **E2E** test cases in LambdaEvents.
Apply when generating tests via `lambda-generate-event-tests`.

---

## Structure & Organization

- **AAA Pattern** — **Arrange** → **Act** → **Assert** in every test.
- **One assertion intent per test** — Multiple `expect()` calls OK if they verify one outcome.
- **Descriptive test names** — `should <do X> when <condition Y>`; include test ID prefix (`S01`, `E01`, …).
- **Group by aspect** — `describe` blocks follow `e2e-testing-aspects.md` priority order.

---

## Test Events

- **No magic literals** — Use named constants (`VALID_EVENT`, `VALID_BODY`).
- **Defaults from detail design** — Copy from the `### Request example` section.
- **Spread to override** — `{ ...VALID_EVENT, body: JSON.stringify({ fieldName: '' }) }` for edge cases.
- **Body is always JSON string** — `body: JSON.stringify({ ... })` for `APIGatewayProxyEvent`.

```typescript
// ✅ Good
const VALID_EVENT = { body: JSON.stringify({ fieldName: 'example_value' }) };
const result = await app.invoker.invoke(lambdaConfig.deleteUser, {
  ...VALID_EVENT,
  body: JSON.stringify({ fieldName: 'a' }),
});

// ❌ Bad
const result = await app.invoker.invoke(lambdaConfig.deleteUser, { body: '{"fieldName":"a"}' });
```

---

## Assertions

- **Always check `statusCode`** — Lambda service returns `200` even on errors; the error is in the payload.
- **Assert `result.result?.code`** — Use RESULT_CODE constants, not plain strings where possible.
- **Assert DB when Lambda touches data** — After Act, query `app.db.client.<model>` and compare persisted fields to both the response payload and expected Arrange values. Do not rely on `SC-001` alone for read/write Lambdas.
- **No data on error** — `result.error` should be defined; `result.result` may still carry `{ code, message }`.

```typescript
// ✅ Happy path
expect(result.statusCode).toBe(200);
expect(result.result?.code).toBe('SC-001');

// ✅ Error path
expect(result.statusCode).toBe(200); // always 200 from Lambda service
expect(result.result?.code).toBe('EB-004');

// ❌ Wrong
expect(result.statusCode).toBe(400); // Lambda service never returns 4xx for sync invocations
```

---

## Independence & Isolation

- **No test-order dependency** — Each test passes when run alone.
- **Self-contained setup** — Create needed state in the test itself.
- **Avoid teardown** unless spec requires it — E2E often leaves test data in dev DB.

---

## Readability & Maintainability

- **Comment the "why"** — Business reason, not restating code.
- **File-level JSDoc** — Summarize Lambda purpose, trigger type, and error conditions at top.
- **Replace placeholder key** — Change every `deleteUser` occurrence to the actual Lambda key before saving.

---

## Coverage Completeness

- **Each documented error code** gets at least one `E` test.
- **Each conditional branch** in the detail design's step handle gets a test.
- **Contract-level** — Event payload → response payload; unit tests cover use case internals.

---

## Project Conventions

| Item             | Convention                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event E2E        | `tests/e2e/event/<kebab-lambda-name>.e2e-spec.ts`                                                                                                                 |
| Config           | `vitest-e2e.config.mjs`, env from `envs/.env.e2e` (copy from `envs/.env.e2e.example`)                                                                             |
| App orchestrator | `@e2e/helpers/event-test-app` — `getEventTestApp()` for `tests/e2e/event/`; `@e2e/helpers/lambda-test-app` — `getLambdaTestApp()` when Cognito + requester needed |
| Lambda invoker   | `app.invoker.invoke(arn, event)` — primary method for event-driven Lambdas                                                                                        |
| GraphQL call     | `app.requester.sendGraphQL(QUERY, variables)` — for AppSync endpoints                                                                                             |
| REST call        | `app.requester.sendRest('POST', '/path', body)` — for API Gateway endpoints                                                                                       |
| Unauthenticated  | `app.withoutAuth().sendRest(...)` / `.sendGraphQL(...)` — for A aspect tests                                                                                      |
| DB assertions    | **Required** when Lambda reads/writes DB — `app.db.client.<model>.findUnique(...)` in S01; ST01 for multi-step transitions                                        |
| Cognito login    | automatic in `app.bootstrap()` — no extra config needed                                                                                                           |
| Lambda ARNs      | `@e2e/config` — `lambdaConfig.<key>`                                                                                                                              |
| Log group ARNs   | `@e2e/config` — `cloudwatchConfig.logGroupArns.<key>`                                                                                                             |
| Lambda specs     | `document/detail-designs/lambdas/<lambda-name>/index.md`                                                                                                          |
