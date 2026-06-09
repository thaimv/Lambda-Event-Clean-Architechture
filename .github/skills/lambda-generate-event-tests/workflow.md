# lambda-generate-event-tests Workflow

## Reference Files

| File                                                | Purpose                                              |
| --------------------------------------------------- | ---------------------------------------------------- |
| `document/detail-designs/lambdas/<name>/index.md`   | Request shape, response, error codes, trigger type   |
| `document/specs/<pbi>.md`                           | Requirements when design is missing                  |
| `app/lambda/src/common/constants/response.const.ts` | RESULT_CODE / ERROR_MESSAGE values                   |
| `tests/e2e/config.ts`                               | `lambdaConfig` keys, `cloudwatchConfig.logGroupArns` |
| `tests/e2e/helpers/event-test-app.ts`               | `getEventTestApp()`, lifecycle                       |
| `tests/e2e/helpers/db.ts`                           | `app.db.client` for DB assertions                    |
| `app/lambda/layer/prisma/schema.prisma`             | Model names for DB assertions                        |
| `templates/event.e2e-spec.ts`                       | E2E test scaffold                                    |

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse the argument per `manifest.yaml` → `input`:

| Input form         | Example                                                | Action                                                         |
| ------------------ | ------------------------------------------------------ | -------------------------------------------------------------- |
| Lambda folder name | `delete-user`                                          | Resolve `document/detail-designs/lambdas/delete-user/index.md` |
| Detail design path | `document/detail-designs/lambdas/delete-user/index.md` | Use directly                                                   |
| PBI spec path      | `document/specs/pbi-123.md`                            | Read spec → Lambda name from section 3.1 → resolve design path |

3. Confirm target Lambda is identified — if ambiguous → **stop and ask**.
4. **Source priority:** detail design first; spec only when design is missing.
5. If spec-only and trigger/payload/response/errors are insufficient → **stop and ask**.
6. Confirm `tests/e2e/helpers/event-test-app.ts` exists.
7. Confirm matching `lambdaConfig` key in `tests/e2e/config.ts` — add if missing.
8. Lambda must be deployed (ARN in `envs/.env.e2e`) before tests can run — warn if not.
9. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.

---

## Step 2 — Read Requirements

Extract: trigger type, `VALID_EVENT`, request params, success `result.code`, error codes, processing steps.

When reading from **PBI spec**, map sections 2 and 3.1. Infer `VALID_EVENT` from documented trigger and payload.

### Database side effects

| Lambda behavior             | DB assertion requirement                   |
| --------------------------- | ------------------------------------------ |
| Creates/updates/deletes row | **S01** (+ **ST01** for state transitions) |
| Reads persisted data        | **S01** compares response with DB row      |
| No DB touch                 | Skip DB assertions — note in report        |

---

## Step 3 — Plan Test Cases

| Aspect | Condition          | Notes                                           |
| ------ | ------------------ | ----------------------------------------------- |
| S      | Always             | `SC-001` + DB row when Lambda touches DB        |
| E      | Always             | `EB-xxx` per documented error                   |
| B      | Constrained fields | Boundary values from design                     |
| EP     | Format/enum fields | Invalid event shapes                            |
| ST     | Stateful           | Multi-step + DB read-back                       |
| N      | Optional fields    | Omit optional event fields                      |
| I      | Idempotency        | Invoke twice — `SC-001` both times              |
| A      | Auth Lambdas       | `app.invoker` or `app.withoutAuth().sendRest()` |

---

## Step 4 — Generate the Test File

Output: `tests/e2e/event/<kebab-lambda-name>.e2e-spec.ts`

Use `templates/event.e2e-spec.ts`. Follow `.github/rules/e2e-testing-aspects.md` and `e2e-testing-best-practices.md`:

- `getEventTestApp()` lifecycle, `e2eHookTimeouts`, `app.invoker.invoke()`
- AAA comments, DB assertions via `app.db.client` when applicable
- `/* eslint-disable max-lines-per-function */` at top

---

## Step 5 — Verify Output

| Check           | Pass when                                            |
| --------------- | ---------------------------------------------------- |
| File exists     | `tests/e2e/event/<name>.e2e-spec.ts` created         |
| Config          | `lambdaConfig` key present in `tests/e2e/config.ts`  |
| Test structure  | All planned aspects (S, E, …) have at least one test |
| DB assertions   | Present when Lambda reads/writes DB                  |
| Imports / types | File compiles; paths match project aliases           |
| Output contract | Matches `manifest.yaml` → `output`                   |

Report to user: output path, test count per aspect, env vars needed, new config keys, TODOs.
