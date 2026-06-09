---
applyTo: '**'
description: 'Constitution — absolute rules every agent interaction must follow. Skills provide workflows; rules provide domain knowledge.'
---

# LambdaEvents — Copilot Instructions

Collection of standalone event-driven AWS Lambda functions. Node.js · TypeScript · AWS Lambda · InversifyJS · Prisma (Aurora PostgreSQL, shared layer) · DynamoDB · ElastiCache/Valkey · SQS · SNS · SES · Cognito · StepFunctions · Athena. Each Lambda is fully self-contained — no shared router.

## .github Structure

```
.github/
├── copilot-instructions.md      # This file — constitution (always loaded by Copilot)
├── cursor-instructions.md       # Cursor entry point (Agent / Chat)
├── brain/                       # Project knowledge (mental model)
│   ├── project-overview.md      # Project intro (architecture, Lambda functions, terms)
│   ├── project-context.json     # Structured project facts (lambdas, deps, commands)
│   ├── modules/                 # Per-Lambda docs (components, DI, event type)
│   ├── features/                # Per-feature flow docs
│   └── contexts/                # Runtime state per workflow (gitignored)
├── skills/                      # SKILL.md-based workflows (auto-discovered by Copilot)
│   ├── lambda-pr-review/        # PR/MR review workflow (GitHub / GitLab / ADO)
│   ├── lambda-spec-review/      # Spec compliance — code vs PBI spec
│   ├── lambda-init/             # Project init/verify workflow
│   ├── lambda-event-design/     # Generate Lambda detail design doc
│   ├── lambda-event-impl/       # Implement Lambda from design doc
│   ├── lambda-generate-event-tests/ # Generate E2E tests from detail design
│   └── lambda-generate-unit-tests/  # Generate unit tests for a Lambda
├── rules/                       # Prescriptive rules (coding standards, architecture)
│   ├── architecture.md
│   ├── typescript-coding-standards.md
│   ├── testing-strategy.md
│   ├── e2e-e2e-testing-aspects.md  # E2E aspect catalog (S, E, B, …)
│   └── e2e-e2e-testing-best-practices.md  # E2E test writing standards
└── mcp/                         # MCP tool references (platform-aware)
    ├── README.md                # Platform detection (GitHub / GitLab / Azure DevOps)
    ├── github-tools-reference.md
    ├── gitlab-tools-reference.md
    └── ado-tools-reference.md
```

**Flow**: skill invoked → read `manifest.yaml` + `SKILL.md` → read `workflow.md` → load rules/brain → execute steps → verify output per manifest.

**Cursor**: Skills auto-discover from `.cursor/skills/` (symlinks to `.github/skills/`). No slash commands — see `cursor-instructions.md`.

## Agent Rules

### Language

- User-facing: **English**
- Code / comments / brain files: **English**

### Safety

- Checkpoint before any write operations (PR comments, WI updates)
- Checkpoint before git push / PR creation
- Never merge, abandon, or auto-approve PRs
- Never auto-vote on PRs — only recommend
- Never run destructive operations without confirmation

### Constraints

- Verify before stating — no assumptions
- No whitespace-only changes
- Follow existing codebase patterns
- File-by-file edits with complete implementations

## Core Principles

These are **absolute and non-negotiable**:

1. **Clean Architecture**: Event flows Presenter → UseCase → Repository → DataSource. Each layer depends only on inner layers.
2. **Standalone per Lambda**: Each Lambda function in `app/lambda/src/<name>/` is fully self-contained. No cross-Lambda direct imports — share only via `app/lambda/src/common/`.
3. **DI via InversifyJS + `@Module`**: Each Lambda declares its own `module.ts` with `@Module({ providers: [...] })`. Bootstrapped via `bootstrapApplication(<Module>)` in `index.ts`. Tokens are `Symbol.for(...)` in `common/constants/di.const.ts` and `<name>/consts.ts`.
4. **Presenter as thin adapter**: `presenter/index.presenter.ts` parses the raw AWS event type (`APIGatewayProxyEvent`, `SQSEvent`, `SNSEvent`, etc.) and delegates to the use case. No business logic in the presenter.
5. **UseCase owns business logic**: No AWS/HTTP types in use cases. Use cases depend only on repository interfaces.
6. **Repository wraps datasource**: Returns domain models, never raw SDK/Prisma types to upper layers.
7. **Validation at the boundary**: Validate input with Zod in the presenter before passing to use case.
8. **Every new Lambda needs tests**: unit tests under `app/lambda/test/<name>/` for presenter, use case, and repos; E2E tests under `tests/e2e/event/` for the deployed Lambda handler.

> For detailed architecture rules → see `rules/architecture.md`
> For coding conventions, naming, patterns → see `rules/typescript-coding-standards.md`

## Navigation

| What                                                     | Where                                  |
| -------------------------------------------------------- | -------------------------------------- |
| Project overview (architecture, Lambda functions, terms) | `brain/project-overview.md`            |
| Project facts (lambdas, deps, commands, stack)           | `brain/project-context.json`           |
| Architecture & module rules                              | `rules/architecture.md`                |
| TypeScript coding standards & patterns                   | `rules/typescript-coding-standards.md` |
| Testing conventions                                      | `rules/testing-strategy.md`            |
| MCP platform detection                                   | `mcp/README.md`                        |
| GitHub MCP tool reference                                | `mcp/github-tools-reference.md`        |
| GitLab MCP tool reference                                | `mcp/gitlab-tools-reference.md`        |
| Azure DevOps MCP tool reference                          | `mcp/ado-tools-reference.md`           |
| Per-Lambda docs (use cases, repos, event type)           | `brain/modules/{LambdaName}.md`        |
| Feature business flows                                   | `brain/features/{feature-name}.md`     |
| PR review workflow                                       | `skills/lambda-pr-review/`             |
| Spec compliance workflow                                 | `skills/lambda-spec-review/`           |
| Init/verify workflow                                     | `skills/lambda-init/`                  |
| Lambda detail design doc generator                       | `skills/lambda-event-design/`          |
| Lambda implementation guide                              | `skills/lambda-event-impl/`            |
| E2E tests from Lambda detail design                      | `skills/lambda-generate-event-tests/`  |
| Unit tests for a Lambda function                         | `skills/lambda-generate-unit-tests/`   |
| E2E aspect catalog                                       | `rules/e2e-testing-aspects.md`         |
| E2E test writing standards                               | `rules/e2e-testing-best-practices.md`  |

## AI Navigation Tips

- Read `project-context.json` before broad search.
- Source root is `app/lambda/src/`. Path aliases: `@common/` → `src/common/`, `@lambda/` → `src/`.
- Each Lambda: `<name>/index.ts` (entry) → `<name>/module.ts` (DI) → `<name>/presenter/` → usecase → repo.
- Shared datasources, errors, utils → `app/lambda/src/common/`. DI tokens in `common/constants/di.const.ts`.
- Tests: `app/lambda/test/<name>/` mirroring `app/lambda/src/<name>/`.

## MCP

PR/MR/issue operations are platform-aware — detect the host from `git remote get-url origin`:

- **github**: GitHub MCP server — repo/PR/issue operations. See `mcp/github-tools-reference.md`.
- **gitlab**: GitLab MCP server — repo/MR/issue operations. See `mcp/gitlab-tools-reference.md`.
- **azure-devops**: `npx @azure-devops/mcp {org}` — ADO project/repo/PR/WI operations. See `mcp/ado-tools-reference.md`.
- Platform detection: `mcp/README.md`
