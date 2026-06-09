# LambdaEvents — Cursor Instructions

Use this file when working in **Cursor** (Agent / Chat). Shared constitution: `copilot-instructions.md`.

## Copilot vs Cursor — skills

|                 | GitHub Copilot                                                                   | Cursor IDE                                                                                                        |
| --------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Skill files** | `.github/skills/{name}/SKILL.md`                                                 | `.cursor/skills/{name}/SKILL.md` (symlink → `.github/skills/`)                                                    |
| **Invoke**      | Slash command: `/lambda-event-impl document/detail-designs/lambdas/foo/index.md` | **No slash commands.** Describe the task in chat; Cursor matches `description` in frontmatter and loads the skill |
| **Rules**       | `copilot-instructions.md`                                                        | `.cursor/rules/*.mdc` + optional read of `copilot-instructions.md`                                                |

Cursor does **not** read `.github/skills/` directly. Symlinks under `.cursor/skills/` point to the same content so both tools stay in sync.

## What Cursor loads

| Source                            | Purpose                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| `.cursor/rules/*.mdc`             | Always-on project rules                                            |
| `.cursor/skills/*/SKILL.md`       | Auto-discovered workflows (via `name` + `description` frontmatter) |
| `.github/copilot-instructions.md` | Full constitution — read on complex tasks                          |
| `.github/rules/`                  | Architecture, TypeScript, testing (+ E2E aspects/best-practices)   |
| `.github/brain/`                  | Project memory                                                     |
| `.github/mcp/`                    | PR/MR/issue tool references                                        |

## Skills (Cursor — natural language)

Agent should apply the matching skill when the user asks for:

| Task                  | Skill (under `.cursor/skills/`) |
| --------------------- | ------------------------------- |
| Init / verify context | `lambda-init`                   |
| PR review             | `lambda-pr-review`              |
| Spec compliance       | `lambda-spec-review`            |
| Lambda detail design  | `lambda-event-design`           |
| Lambda implementation | `lambda-event-impl`             |
| E2E tests (lambda)    | `lambda-generate-event-tests`   |
| Unit tests (lambda)   | `lambda-generate-unit-tests`    |

Example prompts (no `/` needed):

- _Review PR #42_
- _Implement delete-user from `document/detail-designs/lambdas/delete-user/index.md`_
- _Verify delete-user code matches `document/specs/pbi-123.md`_

If the agent does not pick the right skill, say explicitly: _Follow the `lambda-event-impl` skill_.

## Key conventions (quick reference)

- **Datasource DI modules** (`app/lambda/src/config/di/datasources/*.di.ts`): `{Name}DatasourceModule`
- **Common repo DI**: `CommonUserRepo` in `app/lambda/src/config/di/repos/user.di.ts`
- **Implementation classes** in `app/lambda/src/common/datasources/**/implements/`: `{Name}Datasource`
- **Errors**: `ERROR_MESSAGE` from `@common/constants/response.const`
- **Tests**: follow `.github/rules/testing-strategy.md`
- **Detail design** (`document/detail-designs/`) is source of truth for new Lambdas

## Path aliases

- `@common/` → `app/lambda/src/common/`
- `@lambda/` → `app/lambda/src/`

## MCP

Detect platform from `git remote` — see `.github/mcp/README.md`.
