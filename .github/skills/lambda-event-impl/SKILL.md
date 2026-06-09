---
name: lambda-event-impl
description: 'Implement an event-driven Lambda function from a detail design document. Use when: user asks to implement/code a Lambda from a design spec.'
argument-hint: 'Path to the detail design document (e.g. document/detail-designs/lambdas/delete-user/index.md)'
---

# Lambda Function Implementation

## Input

```
/lambda-event-impl {path-to-detail-design.md}
```

## Goal

Read the detail design document → generate complete, runnable Lambda code (TypeScript)
following LambdaEvents' Clean Architecture and conventions.

The design document is the **single source of truth**. Do not invent business rules outside it.

## Rules to Load

- `.github/rules/architecture.md`
- `.github/rules/typescript-coding-standards.md`
- `.github/rules/testing-strategy.md`

## Safety

- Stop and ask if any design field is ambiguous before writing code.
- Never invent validation rules not stated in the design.
- Do not modify existing unrelated code.
- Do not modify existing unrelated Lambda functions or shared `common/` code.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
