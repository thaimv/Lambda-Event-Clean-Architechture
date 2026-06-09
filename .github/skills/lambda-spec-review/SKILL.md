---
name: lambda-spec-review
description: 'Verify Lambda implementation matches the PBI spec — compare source code against documented requirements. Use when: user asks to check spec compliance, verify implementation against spec, or validate code matches PBI.'
argument-hint: 'Path to PBI spec file (e.g. document/specs/pbi-123.md); optional Lambda name when spec lists multiple'
---

# Spec Compliance Review

## Input

```
/lambda-spec-review {path-to-spec.md}
/lambda-spec-review {path-to-spec.md} {lambda-name}
```

Second argument optional — use when the spec affects multiple Lambdas and you want to scope the review to one folder.

## Goal

Read the PBI spec → read the implemented Lambda source (and detail design when present) →
map each spec requirement to code → report **compliance gaps** where implementation diverges from or omits spec behavior.

This is a **post-implementation** check. Run after `lambda-event-impl` (see `manifest.yaml` → `prev_skill`), before generating tests.

## Rules to Load

- `.github/rules/architecture.md`
- `.github/rules/typescript-coding-standards.md`
- `./templates/pbi-spec.md` (spec structure reference)

## Safety

- **Read-only** — report gaps; do not modify source or spec unless the user explicitly asks.
- **Do not assume** — if a requirement cannot be verified from spec + code, mark as ❓ Unclear.
- Compare against **spec section 2 (Requirement Description)** as the source of truth; use detail design as supplementary context only.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
