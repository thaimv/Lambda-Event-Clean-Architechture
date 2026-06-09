---
name: lambda-event-design
description: 'Generate a Lambda function detail design document for LambdaEvents. Use when: user asks to write or document an event-driven Lambda design spec.'
argument-hint: 'Path to PBI spec file OR brief description (e.g. document/specs/pbi-123.md or "delete-user Lambda triggered by API Gateway")'
---

# Lambda Event Detail Design

## Input

```
/lambda-event-design {path-to-spec.md}
/lambda-event-design {description of the Lambda function}
```

Both forms accepted: file path OR free-text description.

## Goal

Generate a complete Lambda detail design markdown document following LambdaEvents conventions.

Output **EXACTLY one** `.md` document — no explanation, no triple-backtick fence, no preamble.

## Rules to Load

- `document/detail-designs/_template.md`
- `document/detail-designs/lambdas/delete-user/index.md` (reference example)

## Safety

- Stop and ask if any required information is ambiguous or missing before generating.
- Never invent processing steps or error cases not stated in the spec.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
