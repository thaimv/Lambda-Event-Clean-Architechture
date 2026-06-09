---
name: lambda-generate-event-tests
description: >
  Read a Lambda detail design and generate a Vitest E2E black-box test file
  that invokes the deployed Lambda via AWS SDK and asserts the response.
  Use when asked to "generate e2e tests for <lambda>", "create event tests for <lambda>",
  "write black-box tests for <lambda>", "generate e2e event tests", or from a PBI spec file.
argument-hint: 'Lambda name, path to detail design, or path to PBI spec (e.g. delete-user, document/detail-designs/lambdas/delete-user/index.md, document/specs/pbi-123.md)'
---

# lambda-generate-event-tests

Generate a Vitest E2E (black-box) test file that invokes a deployed Lambda via `app.invoker.invoke()`.

## Input

```
/lambda-generate-event-tests {lambda-name}
/lambda-generate-event-tests {path-to-detail-design.md}
/lambda-generate-event-tests {path-to-spec.md}
```

Accepted forms: Lambda folder name, detail design path, or PBI spec path (e.g. `document/specs/pbi-123.md`).

## Goal

Read a Lambda detail design (or PBI spec when design is missing) → generate a complete, runnable Vitest E2E test file at
`tests/e2e/event/<kebab-lambda-name>.e2e-spec.ts`.

## Rules to Load

- `.github/rules/e2e-testing-aspects.md`
- `.github/rules/e2e-testing-best-practices.md`
- `.github/rules/testing-strategy.md`

## Safety

- Lambda must be deployed before E2E tests can run.
- Stop and ask if `lambdaConfig` key or ARN is missing from `tests/e2e/config.ts`.
- Stop and ask if a spec file lacks enough detail for E2E (trigger, payload, success/error responses).

## DB verification (mandatory when applicable)

If the Lambda reads from or writes to the database, generated tests **must** assert DB state via
`app.db.client` — not `SC-001` alone. See workflow Step 2 (Database side effects) and Step 4
(DB assertions rule).

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
