---
name: lambda-init
description: 'Initialize or verify project context — scan Lambda functions, check MCP, verify prerequisites. Use when: first setup, verify readiness, check drift.'
argument-hint: 'Optional: --check to verify only'
---

# Initialize & Verify Project Context

## Input

```
/lambda-init                ← Scan codebase and refresh project-context.json
/lambda-init --check        ← Verify only: drift check + MCP (no map rewrite)
```

## Goal

**`/lambda-init`**: Scan Lambda functions → update `lambdas`, `repo_layout`, and `commands` in `project-context.json`.

**`/lambda-init --check`**: Compare codebase vs `project-context.json` → report drift and MCP status. Does **not** rewrite the `lambdas` map. If context is missing, stop and ask to run `/lambda-init` first.

## Rules to Load

- `.github/rules/architecture.md`
- Platform MCP reference (detect from `git remote`; see `.github/mcp/README.md`)

## Safety

- Read-only — no builds, no pushes, no destructive actions.
- Do NOT run `npm run build:all:lambdas`.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
