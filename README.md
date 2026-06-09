# LambdaEvents

Standalone, event-driven AWS Lambda functions (TypeScript). Architecture, Lambda catalog, and folder conventions are documented in [project structure](document/standardization/project-structure.md) and [project overview](.github/brain/project-overview.md).

## Prerequisites

- Node.js 22+
- npm
- Docker — local Postgres when running `delete-user` (Prisma)

## Run a Lambda locally

Simulator lives under `out/simulator/`. Uses root `node_modules` only — **no** `npm install` in `out/simulator`.

**1. Local DB + root setup:**

```bash
npm run docker:up          # Postgres 18 on localhost:5433 (user/root, db: app)
npm install
npm run prisma:generate
```

`prisma:generate` syncs the Prisma client to root `node_modules` (see [lambda-layers-deploy.md](document/standardization/lambda-layers-deploy.md)).

Stop DB: `npm run docker:down`

**2. Configure `out/simulator/env.yml`** (`local:` block). Minimum vars per Lambda:

| Lambda           | Key env vars                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `delete-user`    | `DATABASE_URL` (`postgresql://user:root@localhost:5433/app?schema=public`), `DELETE_USER_SOFT_DELETE_RETENTION_YEARS` |
| `jwt-authorizer` | `COGNITO_USER_POOL_ID`, `COGNITO_USER_POOL_CLIENT_ID`, `ELASTICACHE_HOST`, `ELASTICACHE_PORT`                         |

Shared: `NODE_ENV`, `LOG_LEVEL`, `AWS_REGION` (and AWS credentials if calling real services).

**3. Optional event payload** — `out/simulator/events/{lambda}.json` (defaults to `events/empty.json`).

**4. Run:**

```bash
./out/simulator/run_script.sh delete-user
./out/simulator/run_script.sh jwt-authorizer
```

> **Get identity token** (`GET /identity-token`) lives in the **LambdaAPIs** repo under the `auth-api` Lambda — not in this repo.

`run_script.sh` loads `env.yml` → invokes the handler via `ts-node`. Unit tests do **not** use this file.

## Unit tests

```bash
npm run test
npm run test:ci
```

Mocks only — no env file, DB, or AWS required.

## E2E tests

```bash
# Needs envs/.env.e2e — copy from envs/.env.e2e.example and fill in values
npm run test:e2e
```

E2E tests invoke **deployed** Lambdas via AWS SDK. See [`tests/e2e/`](tests/e2e/) for helpers and [`envs/.env.e2e.example`](envs/.env.e2e.example) for required env vars.

## Lint & Format

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:ci
npm run lint:ci           # same split as CI
```

Pre-commit hooks (husky + lint-staged) run lint and format on staged files.

## Other commands

| Command                     | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `npm run build`             | TypeScript compile (`tsc`)                  |
| `npm run build:all:lambdas` | Bundle all handlers (esbuild)               |
| `npm run build:lambdas`     | Bundle + zip into `artifacts/` (same as CI) |

## Deployment (CI/CD)

Aligned with the LambdaAPIs pattern: orchestrator + reusable workflows, OIDC, GitHub Environments.

| Branch              | GitHub Environment |
| ------------------- | ------------------ |
| `develop`           | `event-develop`    |
| `staging`, `master` | `event-staging`    |

**Workflows:** `cd.yml` → `cd-build` → layer deploy (Prisma, ElastiCache) → lambda deploy (alias + version) → Step Functions.

**GitHub Environment config** (per `event-develop` / `event-staging`):

| Type   | Name                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Secret | `AWS_ROLE_TO_ASSUME`                                                                   |
| Var    | `AWS_REGION`, `AWS_ACCOUNT_ID`, `LAMBDA_ALIAS_NAME`, `KEEP_LAMBDA_VERSIONS`            |
| Var    | `LAMBDA_FUNCTION_DELETE_USER_NAME`, `LAMBDA_FUNCTION_JWT_AUTHORIZER_NAME`              |
| Var    | `PRISMA_LAYER_NAME`, `ELASTICACHE_LAYER_NAME`                                          |
| Var    | `STEP_FUNCTION_DELETE_USER_BATCH_NAME` (optional — leave empty to skip Step Functions) |

Migrate from legacy `LAMBDA_MAP` / `STEP_FUNCTION_MAP` secrets: set the vars above on each GitHub Environment instead.

**Add a Lambda:** append to `deploy/lambdas.config.json` + `cd.yml` `lambdas_config` + `resolve-env` + deploy job + `build:<name>` script.

See [lambda-layers-deploy.md](document/standardization/lambda-layers-deploy.md) for layer details.

## Documentation

| Topic             | Link                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Project structure | [document/standardization/project-structure.md](document/standardization/project-structure.md)       |
| Datasources       | [document/standardization/reserved-datasources.md](document/standardization/reserved-datasources.md) |
| Detail designs    | [document/detail-designs/](document/detail-designs/)                                                 |
| AI Copilot Kit    | [.github/AGENTS.md](.github/AGENTS.md)                                                               |

### AI Copilot Kit

Skills, rules, and project memory live under [`.github/`](.github/AGENTS.md). Available commands:

| Command                        | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `/lambda-init`                 | Validate project context before starting work                |
| `/lambda-event-design`         | Write Lambda detail design doc                               |
| `/lambda-event-impl`           | Implement an event-driven Lambda end-to-end                  |
| `/lambda-generate-unit-tests`  | Generate unit tests for a Lambda (presenter, use-case, repo) |
| `/lambda-generate-event-tests` | Generate E2E tests for a deployed Lambda                     |
| `/lambda-spec-review`          | Verify Lambda implementation matches PBI spec                |
| `/lambda-pr-review`            | Review a pull request                                        |
