# Project Structure

The project applies **Clean Architecture** principles. Each Lambda function is a self-contained vertical slice; shared infrastructure lives under `common/`.

---

## Directory Overview

```
app/lambda/
├── src/
│   ├── common/                    # Shared infrastructure & framework
│   └── <lambda-name>/             # Feature Lambda (one per function)
├── test/                          # Mirrors src/ layout; *.test.ts per source file
└── layer/                         # Lambda Layers (prisma, elasticache, …)
```

---

## I. Feature Lambda (`src/<lambda-name>/`)

Each Lambda function follows the same folder contract:

```
src/<lambda-name>/
├── index.ts                       # AWS Lambda handler entry point
├── module.ts                      # DI module — wires use cases, repos, presenter
├── consts.ts                      # Lambda-scoped DI symbols
├── package.json                   # Per-lambda deploy metadata
│
├── presenter/
│   └── index.presenter.ts         # Parses event → calls use case → formats response
│
├── dtos/
│   └── requests/
│       └── <name>.request.dto.ts  # Input validation (Zod schema)
│
├── models/
│   └── <name>.model.ts            # Domain result shape
│
├── repos/                         # Data access — bridge to datasources / DB
│   ├── <name>.repo.ts             # [Interface]
│   └── implements/
│       └── <name>.repo.impl.ts
│
└── usecases/
    ├── <name>.uc.ts               # [Interface]
    └── implements/
        └── <name>.uc.impl.ts
```

### Existing Feature Lambdas

| Lambda            | Description                              |
| ----------------- | ---------------------------------------- |
| `delete-user/`    | Soft-deletes users past retention period |
| `jwt-authorizer/` | Verifies JWT via Gigya (SAP CDC) JWKS    |

> **Get identity token** is implemented in **LambdaAPIs** (`auth-api` Lambda), not in this repo.

---

## II. `src/common/` — Shared Infrastructure

```
src/common/
├── constants/
│   ├── index.ts                   # AWS_CONFIG, env constants
│   ├── response.ts                # RESULT_CODE, STATUS_CODE, ERROR_MESSAGE
│   ├── di.const.ts                # DI tokens (export const DI)
│   ├── elasticache.config.ts
│   └── gigya-jwks.config.ts
│
├── datasources/                   # Infrastructure ports & adapters
│   ├── <capability>/
│   │   ├── <capability>.datasource.ts        # [Interface / Port]
│   │   └── implements/
│   │       └── <vendor>-<capability>.datasource.impl.ts
│   │
│   ├── api-gateway/               → IApiGatewayDatasource
│   ├── athena/                    → IAthenaDatasource
│   ├── cloudwatch/                → ICloudWatchMetricsDatasource
│   ├── cognito/                   → ICognitoIdentityDatasource
│   ├── database/                  → IDBClientDatasource, ITransactionRunnerDatasource
│   │   └── implements/
│   │       ├── prisma-db-client.datasource.impl.ts
│   │       └── prisma-transaction-runner.datasource.impl.ts
│   ├── dynamodb/                  → IDynamoDBDatasource, IDynamoDBClientDatasource, IDynamoDBServiceDatasource
│   ├── email/                     → IEmailDatasource
│   │   └── implements/
│   │       └── aws-ses.email.datasource.impl.ts
│   ├── graphql/                   → IGraphQLDatasource
│   ├── lambda/                    → ILambdaDatasource
│   ├── message-queue/             → IMessageQueueDatasource
│   │   └── implements/
│   │       ├── aws-sqs.message-queue.datasource.impl.ts
│   │       └── aws-sqs.message-queue-job.datasource.impl.ts
│   ├── object-storage/            → IObjectStorageDatasource, IObjectStorageConnectorDatasource, IObjectStorageUploadDatasource
│   │   └── implements/
│   │       ├── aws-s3.object-storage.datasource.impl.ts
│   │       ├── aws-s3.object-storage-connector.datasource.impl.ts
│   │       └── gcp-gcs.object-storage-upload.datasource.impl.ts
│   ├── parquet-file/              → IParquetFileDatasource
│   ├── push-notification/         → IPushNotificationDatasource
│   │   └── implements/
│   │       └── aws-sns.push-notification.datasource.impl.ts
│   ├── secrets-manager/           → ISecretsManagerDatasource
│   ├── step-function/             → IStepFunctionDatasource
│   └── translate/                 → ITranslateDatasource
│
├── decorators/
│   └── module.decorator.ts        # @Module DI decorator
│
├── di/                            # Lives under config/, not common/
│   ├── di.config.ts               # bootstrapApplication / getInstance
│   ├── app.config.di.ts
│   ├── datasources/
│   │   └── <capability>.di.ts     # One module per datasource capability
│   └── repos/
│       └── user.di.ts
│
├── errors/
│   ├── base-error.ts
│   ├── bad-request-error.ts
│   ├── database-url-notfound-error.ts
│   ├── internal-server-error.ts
│   ├── notfound-error.ts
│   ├── secrets-notfound-error.ts
│   ├── unauthorized-error.ts
│   └── validation-error.ts
│
├── lambda/                        # Lambda runtime framework
│   ├── lambda.ts                  # Lambda class — wraps handler with pipes
│   ├── pipeline.ts                # Middleware pipeline runner
│   └── pipes/
│       ├── error-handling.pipe.ts
│       └── logging.pipe.ts
│
├── logger/
│   └── index.ts                   # logger + primaryLogger (Powertools)
│
├── models/
│   └── user.model.ts
│
├── repos/
│   └── user/
│       ├── user.repo.ts           # [Interface]
│       └── implements/
│           └── user.impl.ts
│
├── response/
│   ├── success.response.ts
│   └── error.response.ts
│
├── types/
│   ├── di.type.ts                 # Generic DI types
│   ├── lambda.type.ts             # LambdaExecutionInput/Output
│   ├── response.type.ts           # Response shape types
│   └── datasources/               # Domain types per datasource capability
│       ├── api-gateway.type.ts
│       ├── athena.type.ts
│       ├── cloudwatch.type.ts
│       ├── cognito.type.ts
│       ├── database.type.ts
│       ├── dynamodb.type.ts
│       ├── email.type.ts
│       ├── graphql.type.ts
│       ├── lambda.type.ts
│       ├── message-queue.type.ts
│       ├── object-storage.type.ts
│       ├── push-notification.type.ts
│       ├── secrets-manager.type.ts
│       ├── step-function.type.ts
│       └── translate.type.ts
│
└── utils/
    ├── cookie-util.ts
    ├── crypto.util.ts
    ├── csv-util.ts
    ├── dayjs-util.ts
    ├── env-util.ts
    ├── execution-timer.ts
    ├── object-util.ts
    ├── s3-path-util.ts
    └── sensitive-data.util.ts
```

---

## III. `test/` — Unit Tests

Mirrors `src/` exactly. Each test file targets a single source file:

```
test/<path>/<filename>.test.ts  ↔  src/<path>/<filename>.ts
```

```
test/
├── common/
│   ├── datasources/<capability>/implements/
│   ├── errors/
│   ├── lambda/pipes/
│   ├── logger/
│   ├── repos/user/implements/
│   ├── response/
│   └── utils/
├── delete-user/
└── jwt-authorizer/
```

---

## IV. Naming Conventions

### File suffixes by role

| Suffix                 | Role                                |
| ---------------------- | ----------------------------------- |
| `*.datasource.ts`      | Datasource interface (port)         |
| `*.datasource.impl.ts` | Datasource implementation (adapter) |
| `*.repo.ts`            | Repository interface                |
| `*.repo.impl.ts`       | Repository implementation           |
| `*.uc.ts`              | Use case interface                  |
| `*.uc.impl.ts`         | Use case implementation             |
| `*.di.ts`              | DI registration module              |
| `*.type.ts`            | TypeScript domain types             |
| `*.model.ts`           | Domain/result model                 |
| `*.request.dto.ts`     | Input DTO (Zod schema)              |
| `*.presenter.ts`       | Presenter layer                     |
| `*.pipe.ts`            | Pipeline middleware                 |
| `*.response.ts`        | Response helper                     |
| `*.config.ts`          | Configuration constants             |
| `*-error.ts`           | Custom error class                  |
| `*.test.ts`            | Unit test                           |

### Datasource implementation naming

Implementations are prefixed with the vendor/technology:

```
<vendor>-<capability>.datasource.impl.ts
```

| Prefix    | Technology           |
| --------- | -------------------- |
| `aws-ses` | Amazon SES           |
| `aws-sns` | Amazon SNS           |
| `aws-sqs` | Amazon SQS           |
| `aws-s3`  | Amazon S3            |
| `gcp-gcs` | Google Cloud Storage |
| `prisma`  | Prisma ORM           |

Interfaces use **capability names only** (no vendor), so implementations can be swapped without changing consumers.

### DI tokens (`di.const.ts`)

All shared tokens are exported as `DI` from `common/constants/di.const.ts`:

```ts
DI.APP_CONFIG;
DI.EMAIL_DATASOURCE;
DI.MESSAGE_QUEUE_DATASOURCE;
DI.OBJECT_STORAGE_DATASOURCE;
// …
```

Lambda-scoped tokens remain in each module's `consts.ts` (e.g. `DELETE_USER_DI_CONST`).

---

## V. Layer Communication

```
index.ts
  └─ Lambda.createHandler()
       └─ [logging.pipe → error-handling.pipe]
            └─ presenter/index.presenter.ts
                 └─ usecase/*.uc.impl.ts
                      └─ repos/*.repo.impl.ts
                           └─ common/datasources/**/*.datasource.impl.ts
                                └─ AWS SDK / Prisma / External API
```

| Layer                  | Responsibility                                  |
| ---------------------- | ----------------------------------------------- |
| **Entry (`index.ts`)** | Bootstraps DI, wraps handler                    |
| **Presenter**          | Parses event, validates input, formats response |
| **Use Case**           | Business logic, orchestrates repos              |
| **Repository**         | Data access abstraction per lambda              |
| **Datasource**         | SDK/driver adapter, shared across lambdas       |

---

## VI. Configuration Files

| File                | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `package.json`      | Dependencies, scripts                                          |
| `tsconfig.json`     | TypeScript config with path aliases (`@common/*`, `@lambda/*`) |
| `vitest.config.mjs` | Test runner config, coverage thresholds                        |
| `.gitignore`        | Ignored files                                                  |
| `README.md`         | Setup and deployment guide                                     |

---

## VII. Deploy (`deploy/` + `.github/workflows/`)

Aligned with LambdaAPIs: esbuild bundle → zip → AWS CLI deploy via reusable GitHub workflows.

```
deploy/
├── lambdas.config.json           # Local / reference lambda list
└── scripts/
    ├── 001_prepare-prisma-layer.sh
    ├── 002_prepare-elasticache-layer.sh
    ├── 003_build-lambdas-from-config.sh
    ├── 004_build-lambda-artifact.sh    # build + zip + stage artifacts/<name>/
    ├── 005_delete-old-layer-versions.sh
    ├── 006_deploy-stepfunctions-from-config.sh
    └── bundle.js                   # esbuild one handler → build/<name>/app.js

.github/workflows/
├── cd.yml                          # Orchestrator (project-specific config)
├── cd-build.yml
├── cd-deploy-lambda.yml
├── cd-deploy-prisma-layer.yml
├── cd-deploy-elasticache-layer.yml
└── cd-deploy-stepfunctions.yml
```

| Script         | Entry point                             |
| -------------- | --------------------------------------- |
| `bundle.js`    | `app/lambda/src/<lambda-name>/index.ts` |
| Handler in zip | `app.handler` on `app.js`               |

See [README.md](../../README.md#deployment-cicd) and [lambda-layers-deploy.md](lambda-layers-deploy.md).
