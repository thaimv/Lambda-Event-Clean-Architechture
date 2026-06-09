---
name: lambda-pr-review
description: 'Review a PR/MR from GitHub, GitLab, or Azure DevOps — fetch, analyze, layered review, push comments. Use when: user asks to review a PR/MR, code review, PR analysis.'
argument-hint: 'PR/MR number/ID (e.g., 123)'
---

# PR Code Review

## Input

```
/lambda-pr-review {PR_ID}
/lambda-pr-review {PR_ID} --context "focus on users module changes"
/lambda-pr-review {PR_ID} --auto_push=true     # push comments without confirmation
/lambda-pr-review {PR_ID} --auto_push=false    # always wait for confirmation (default)
```

## Flags

| Flag          | Values           | Default | Effect                                                                              |
| ------------- | ---------------- | ------- | ----------------------------------------------------------------------------------- |
| `--context`   | free text        | —       | Extra focus hint for the review                                                     |
| `--auto_push` | `true` / `false` | `false` | Push review comments without asking. When omitted, defaults to manual confirmation. |

## Goal

Detect the hosting platform → fetch the PR → analyze code changes → produce layered review → push comments after human approval.

**Platform-aware**: the workflow detects the host from the git remote `origin` and loads the matching tools reference:

- GitHub → `.github/mcp/github-tools-reference.md` (GitHub MCP)
- GitLab → `.github/mcp/gitlab-tools-reference.md` (GitLab MCP)
- Azure DevOps → `.github/mcp/ado-tools-reference.md` (Azure DevOps MCP)

Auto-push is controlled solely by the `--auto_push` flag:

- `--auto_push=true` → push without confirmation.
- `--auto_push=false` or omitted → manual (wait for confirmation).

## Safety

- **MUST** wait for explicit human approval before pushing any comments to PR.
- **EXCEPTION**: auto-push is allowed only when `--auto_push=true`.
- **NEVER** auto-vote on PRs. Only recommend a vote and ask user to vote manually.
- Do not merge, abandon, or auto-approve PRs.
- **All PR comments MUST be in English** — no Vietnamese or other language in inline/thread comments.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
