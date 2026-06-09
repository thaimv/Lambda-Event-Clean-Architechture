# Reserved Datasource Modules

Shared datasource DI modules under `app/lambda/src/config/di/datasources/` that are **unit-tested** but **not imported** by the two active lambda modules.

## Currently wired (in use)

| Module               | Used by                              |
| -------------------- | ------------------------------------ |
| `app.config.di`      | All lambdas (via `AppConfigModule`)  |
| `database.di`        | `delete-user`                        |
| `secrets-manager.di` | Transitive via `database.di`         |
| `api-gateway.di`     | `jwt-authorizer` (Cognito JWKS HTTP) |
| `cache.di`           | `jwt-authorizer`                     |

## Reserved (not wired yet)

| Module                  | Capability            |
| ----------------------- | --------------------- |
| `cognito-identity.di`   | Cognito Identity Pool |
| `athena.di`             | AWS Athena            |
| `cloudwatch-metrics.di` | CloudWatch metrics    |
| `dynamodb.di`           | DynamoDB              |
| `email.di`              | AWS SES               |
| `graphql.di`            | Lambda GraphQL invoke |
| `lambda.di`             | AWS Lambda invoke     |
| `message-queue.di`      | AWS SQS               |
| `object-storage.di`     | S3 / GCS              |
| `parquet-file.di`       | Parquet files         |
| `push-notification.di`  | AWS SNS               |
| `step-function.di`      | Step Functions        |
| `translate.di`          | AWS Translate         |
| `repos/user.di`         | Common user repo      |

Reserved modules remain in the repo for future lambdas. Import the relevant `*Module` in a lambda's `module.ts` when needed.
