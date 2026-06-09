---
name: lambda-generate-unit-tests
description: >
  Read a Lambda function's source files and generate Vitest unit tests for all layers
  (presenter, use case, repository).
  Use when asked to "generate unit tests for <lambda>", "write tests for <lambda>",
  "add unit tests to <lambda>", or "generate unit tests".
argument-hint: 'Lambda name (e.g. delete-user or jwt-authorizer)'
---

# lambda-generate-unit-tests

Generate Vitest unit tests for all layers of an event-driven Lambda function.

## Input

```
/lambda-generate-unit-tests {lambda-name}
```

## Goal

Read source files of a Lambda → generate complete, runnable Vitest unit test files
covering presenter, use-case, and repository layers.

Run after `lambda-event-impl` (see `manifest.yaml` → `prev_skill`). Recommended after `lambda-spec-review` passes.

## Rules to Load

- `.github/rules/testing-strategy.md`

## Safety

- Skip files that already have corresponding test files (report them).
- Never modify source files — generate test files only.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
