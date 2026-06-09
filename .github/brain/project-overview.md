# LambdaEvents — Project Overview

## What is this project?

LambdaEvents is a collection of **standalone, event-driven AWS Lambda functions**. Unlike a monolith-modular API backend, each Lambda function here is **fully self-contained** — it has its own module, DI wiring, presenter, repos, and use cases. Functions are triggered by API Gateway, Cognito, SQS, StepFunctions, or other AWS event sources.

## Who uses it?

Internal backend services and infrastructure. Functions handle cross-cutting concerns like authentication, user lifecycle events, and integrations with external systems.

## Architecture in one sentence

Each Lambda = one standalone vertical slice: `Presenter → UseCase → Repository → DataSource`, bootstrapped independently with InversifyJS.

---

## Lambda Functions

| Function         | Trigger                            | Purpose                                                                            |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `delete-user`    | `APIGatewayProxyEvent`             | Batch cleanup — permanently delete soft-deleted user records past retention period |
| `jwt-authorizer` | `APIGatewayRequestAuthorizerEvent` | API Gateway custom authorizer — verifies JWT, returns IAM policy                   |

---

## Lambda function structure

Each Lambda lives under `app/lambda/src/<name>/`:

```
app/lambda/src/<name>/
├── consts.ts                     # DI tokens (Symbol.for)
├── module.ts                     # @Module — registers providers + presenter
├── index.ts                      # Lambda entry point (Lambda class + bootstrapApplication)
├── presenter/
│   └── index.presenter.ts        # Parses event → calls use case → returns result
├── dtos/
│   └── requests/[name].request.dto.ts  # Zod schema + inferred type
├── models/
│   └── [name].model.ts           # Domain model interfaces
├── repos/
│   ├── [name].repo.ts            # Interface
│   └── implements/
│       └── [name].repo.impl.ts   # Implementation
└── usecases/
    ├── [name].uc.ts              # Interface
    └── implements/
        └── [name].uc.impl.ts     # Business logic
```

Tests mirror source under `app/lambda/test/<name>/`.

---

## Lambda entry pattern

```ts
// app/lambda/src/<name>/index.ts
bootstrapApplication(<Name>Module);

export const handler = new Lambda<EventType, ResponseType>((event, _context) =>
  getInstance<NamePresenter>(DI_CONST.Presenter).handle(event),
).createHandler();
```

No router. The presenter parses the raw Lambda event directly.

---

## Tech stack

- **Runtime**: Node.js 22, TypeScript
- **Local DB**: PostgreSQL 18 (Docker, port `5433`)
- **Relational DB (prod)**: Aurora PostgreSQL via Prisma

---

## Shared infrastructure (`app/lambda/src/common/`)

Available datasources (inject via DI tokens in `di.const.ts`):

| Datasource                 | DI token area             | Description              |
| -------------------------- | ------------------------- | ------------------------ |
| Prisma (Aurora)            | `DI.DB_CLIENT_DATASOURCE` | PostgreSQL via Prisma    |
| DynamoDB                   | `DI.DYNAMODB_*`           | AWS DynamoDB             |
| Cache (Valkey/ElastiCache) | `DI.CACHE_DATASOURCE`     | Redis-compatible cache   |
| S3 / GCS                   | `DI.OBJECT_STORAGE_*`     | File storage             |
| SQS                        | `DI.MESSAGE_QUEUE_*`      | Message queue            |
| SNS                        | `DI.PUSH_NOTIFICATION_*`  | Push notifications / SNS |
| SES                        | `DI.EMAIL_DATASOURCE`     | Email via AWS SES        |
| Cognito Identity           | `DI.COGNITO_IDENTITY_*`   | Federated identity       |
| Athena                     | `DI.ATHENA_DATASOURCE`    | Analytics queries        |
| StepFunctions              | `DI.STEP_FUNCTION_*`      | Workflow orchestration   |
| CloudWatch Metrics         | `DI.CLOUDWATCH_*`         | Custom metrics           |
| Secrets Manager            | `DI.SECRETS_MANAGER_*`    | Secret retrieval         |
| Lambda (invoke)            | `DI.LAMBDA_DATASOURCE`    | Invoke other Lambdas     |
| GraphQL                    | `DI.GRAPHQL_DATASOURCE`   | GraphQL client           |
| Parquet                    | `DI.PARQUET_FILE_*`       | Parquet file handling    |
| API Gateway                | `DI.API_GATEWAY_*`        | API Gateway management   |

---

## DI wiring

- Tokens defined in `app/lambda/src/common/constants/di.const.ts` (shared infrastructure) and `app/lambda/src/<name>/consts.ts` (per-Lambda).
- Each Lambda's `module.ts` declares its own `@Module({ providers: [...] })`.
- `bootstrapApplication(<Module>)` in `index.ts` wires the container.
- `getInstance<T>(token)` retrieves the presenter instance.

---

## Error handling

All errors propagate through the `Lambda` class wrapper. Throw the appropriate class from `app/lambda/src/common/errors/`:
`ValidationError`, `BadRequestError`, `NotFoundError`, `UnauthorizedError`, `ExistedError`, `InternalServerError`.

---

## Glossary

| Term                   | Meaning                                                     |
| ---------------------- | ----------------------------------------------------------- |
| Standalone Lambda      | One Lambda function = one vertical slice, no shared routing |
| Presenter              | Parses the raw AWS event; no business logic                 |
| UseCase                | Business logic; no AWS types                                |
| Repo                   | Wraps datasource queries; returns domain models             |
| `Lambda` class         | Thin wrapper creating the `handler` export                  |
| `bootstrapApplication` | Wires InversifyJS container from `@Module`                  |
| `getInstance<T>`       | Resolves a DI-registered instance from the container        |
