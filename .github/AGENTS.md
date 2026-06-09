# .github — AI Agent Kit (Copilot + Cursor)

Configuration kit to help **GitHub Copilot** and **Cursor** understand and work effectively with the LambdaEvents project
(a collection of standalone event-driven AWS Lambda functions).

## Structure

```
.github/
├── AGENTS.md                 ← This file (AI kit overview)
├── copilot-instructions.md   ← Ground rules (Copilot — always loaded)
├── cursor-instructions.md    ← Cursor-specific guide (skills, conventions)
├── brain/                    ← Project memory
├── skills/                   ← Automated workflows
├── rules/                    ← Coding/architecture conventions
└── mcp/                      ← MCP tool references (platform-aware)

.cursor/
├── rules/
│   └── lambda-events.mdc     ← Cursor always-on rules
└── skills/                   ← Symlinks → .github/skills/ (Cursor auto-discovery)
```

## Components

### copilot-instructions.md

Core instruction file — Copilot **always reads this file** on each interaction. It contains:

- Architecture principles (non-negotiable)
- Safety rules (no PR merge, no automatic push, etc.)
- Navigation map to other files

**Avoid** writing detailed workflows here. Keep it concise and link to relevant docs.

### brain/ — Project Memory

Project knowledge that helps AI **understand** context without opening code first.

| File/Folder            | Content                                  | Example questions AI can answer       |
| ---------------------- | ---------------------------------------- | ------------------------------------- |
| `project-overview.md`  | Architecture, Lambda functions, glossary | "How is delete-user structured?"      |
| `project-context.json` | Lambdas, deps, commands                  | "What event triggers jwt-authorizer?" |
| `modules/{Name}.md`    | Lambda use cases, repos, DI, event type  | "What does jwt-authorizer verify?"    |
| `features/{name}.md`   | High-level feature flow                  | "How does the auth flow work?"        |
| `contexts/`            | Runtime workflow state                   | (AI-managed, gitignored)              |

**Writing guideline**: Explain like a senior dev briefing a newcomer in 1-2 minutes. Not a spec.

### skills/ — Automated Workflows

Each folder contains `SKILL.md` (instructions), `manifest.yaml` (skill contract — **read at workflow Step 1**), and optionally `workflow.md`, `templates/`, and other supporting files.

| Skill                         | Invocation                                                  | Description                                                         |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `lambda-pr-review`            | `/lambda-pr-review {PR_ID}`                                 | Review PRs/MRs from GitHub, GitLab, or Azure DevOps (auto-detected) |
| `lambda-spec-review`          | `/lambda-spec-review {spec-path} [{lambda-name}]`           | Verify implementation matches PBI spec                              |
| `lambda-init`                 | `/lambda-init`                                              | Initialize / validate project context                               |
| `lambda-event-design`         | `/lambda-event-design {spec.md or description}`             | Generate a Lambda detail design document                            |
| `lambda-event-impl`           | `/lambda-event-impl {design-doc-path}`                      | Implement a Lambda from a detail design doc                         |
| `lambda-generate-event-tests` | `/lambda-generate-event-tests {lambda-name-or-design-path}` | Generate E2E tests for a Lambda from detail design                  |
| `lambda-generate-unit-tests`  | `/lambda-generate-unit-tests {lambda-name}`                 | Generate Vitest unit tests for all layers of a Lambda function      |

Each skill can include `manifest.yaml`, `workflow.md`, `templates/`, and additional supporting files.

### rules/ — Shared Rules

Prescriptive coding and architecture rules used by multiple workflows.

| File                             | Content                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `architecture.md`                | Clean Architecture, Lambda isolation, DI with InversifyJS |
| `typescript-coding-standards.md` | Naming, conventions, patterns                             |
| `testing-strategy.md`            | Test conventions, mock patterns (Vitest)                  |
| `e2e-testing-aspects.md`         | E2E aspect catalog (S, E, B, EP, ST, N, I, A)             |
| `e2e-testing-best-practices.md`  | E2E AAA, assertions, isolation, readability               |

**Do not put here**: Lambda docs (→ `brain`), workflow steps (→ `skills`), MCP references (→ `mcp`).

### mcp/ — MCP Platform References

MCP tool references for PR/MR/issue operations. Platform is auto-detected from `git remote` — see `mcp/README.md`.

| File                        | Content                                             |
| --------------------------- | --------------------------------------------------- |
| `README.md`                 | Platform detection (GitHub / GitLab / Azure DevOps) |
| `github-tools-reference.md` | GitHub MCP usage guide (PR/issue tools)             |
| `gitlab-tools-reference.md` | GitLab MCP usage guide (MR/issue tools)             |
| `ado-tools-reference.md`    | Azure DevOps MCP usage guide                        |

### cursor-instructions.md

Cursor-specific entry point. Important: **Cursor does not use `/lambda-*` slash commands**. Skills must live under `.cursor/skills/` (symlinked from `.github/skills/`) so Cursor can auto-discover them via `SKILL.md` frontmatter.

### For Developers (Cursor)

1. Open the **`LambdaEvents/`** folder as the Cursor workspace root (not the monorepo root) so `.cursor/` is picked up.
2. Skills are symlinked: `.cursor/skills/` → `.github/skills/`. No slash commands — describe the task in Agent chat.
3. Example prompts:
   - _Initialize / verify project context_ → skill `lambda-init`
   - _Review PR #123_ → skill `lambda-pr-review`
   - _Implement delete-user from design doc_ → skill `lambda-event-impl`
   - _Generate E2E tests for delete-user_ → skill `lambda-generate-event-tests`
   - _Generate unit tests for delete-user_ → skill `lambda-generate-unit-tests`
4. If the wrong workflow runs, say: _Follow the `lambda-event-impl` skill_.
5. MCP: connect GitHub / GitLab / ADO as needed — see `.github/mcp/README.md`.

## Usage

### For Developers (GitHub Copilot)

1. Open VS Code with Copilot Chat.
2. Run `/lambda-init` for first-time context initialization.
3. Run `/lambda-pr-review 12345` to review a PR.
4. Run `/lambda-spec-review document/specs/pbi-xxx.md` after implementation to verify code matches spec.
5. Run `/lambda-event-design specs/pbi-123.md` (or description) to generate a Lambda design doc.
6. Run `/lambda-event-impl docs/delete-user.md` to implement a Lambda from a design doc.
7. Run `/lambda-generate-event-tests delete-user` to generate E2E tests for a Lambda.
8. Run `/lambda-generate-unit-tests delete-user` to generate unit tests for a Lambda.

### When Adding a New Lambda Function

1. Create `brain/modules/{LambdaName}.md` (copy from `_template.md`).
2. Update `brain/project-context.json` → `lambdas` map.

### When Adding a New Feature

1. Create `brain/features/{feature-name}.md` (copy from `_template.md`).
2. Write a high-level flow (3-7 steps).

### When Updating Rules

Edit files directly in `rules/`. All skills will automatically use the updated rules.

## Maintenance Guidelines

- **brain/**: Update when Lambda functions are added/removed or flows change significantly.
- **rules/**: Update when the team adopts new conventions.
- **skills/**: Update when AI workflows change. After adding a skill under `.github/skills/`, symlink it: `ln -sf "../../.github/skills/{name}" ".cursor/skills/{name}"`.
- **Do not over-document**: if a document needs frequent maintenance, it is probably too detailed.
