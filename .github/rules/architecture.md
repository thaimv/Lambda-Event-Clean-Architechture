# Architecture Rules

> Loaded when reviewing, writing, or analyzing code that touches Lambda structure, layers, or DI.

## Architecture Style

**Clean Architecture** — strict dependency rule: outer layers depend on inner layers, never the reverse.

Each Lambda function is a **standalone vertical slice** under `app/lambda/src/<name>/`. There is no shared router.

```
Presenter (index.ts + index.presenter.ts)
    ↓ depends on
UseCase (Business Logic)
    ↓ depends on
Repository (Data Access — interface only)
    ↑ depends on
DataSource (Prisma / DynamoDB / S3 / HTTP / Cache)  ← app/lambda/src/common/datasources/
```

## Layer Responsibilities

| Layer          | Location                                    | Contains                                      | May Import                      | Must NOT Import                  |
| -------------- | ------------------------------------------- | --------------------------------------------- | ------------------------------- | -------------------------------- |
| Presenter      | `app/lambda/src/<name>/presenter/`          | Parse AWS event, Zod validation, map response | UseCase interfaces, DTO schemas | Repository / DataSource directly |
| UseCase        | `app/lambda/src/<name>/usecases/`           | Business logic, orchestration                 | Repository interfaces           | Data layer directly              |
| Repository     | `app/lambda/src/<name>/repos/`              | Data access abstraction                       | DataSource interfaces           | UseCase or Presenter             |
| DataSource     | `app/lambda/src/common/datasources/{name}/` | DB / SDK clients                              | Prisma, AWS SDK                 | UseCase or Presenter             |
| Common         | `app/lambda/src/common/`                    | Shared errors, utils, lambda pipes, repos     | runtime libs                    | Lambda-specific business logic   |
| Infrastructure | `app/lambda/src/config/`                    | DI bootstrap, datasource DI modules, config   | `common/*`, contracts           | Lambda-specific business logic   |

## Lambda Function Structure

Each Lambda lives in `app/lambda/src/<name>/`:

```
app/lambda/src/<name>/
├── consts.ts                     # DI tokens (Symbol.for) + lambda constants
├── module.ts                     # @Module — providers + presenter
├── index.ts                      # Entry: bootstrapApplication + Lambda handler
├── presenter/
│   └── index.presenter.ts        # Parse event → validate → use case → result
├── dtos/
│   ├── requests/                 # Zod schemas + inferred types
│   └── responses/
├── models/                       # Domain model interfaces
├── repos/
│   ├── {entity}.repo.ts          # Interface
│   └── implements/
│       └── {entity}.repo.impl.ts
└── usecases/
    ├── {feature}.uc.ts           # Interface
    └── implements/
        └── {feature}.uc.impl.ts
```

Unit tests mirror source under `app/lambda/test/<name>/` (not inside the Lambda folder).

## Isolation Rules

1. **No cross-Lambda imports** — `delete-user` must NOT import from `jwt-authorizer/` directly.
2. **Share via `app/lambda/src/common/`** — datasources, errors, utils, shared repos.
3. **Share via DI interfaces** — inject shared datasource/repo tokens from `common/constants/di.const.ts`.
4. Each Lambda has its own `module.ts` and `consts.ts` — no composition module + router pattern.

## DI with InversifyJS (`@Module` decorator)

DI is wired with `@Module` (`common/decorators/module.decorator`). `bootstrapApplication(<Module>)` in `index.ts` binds providers from module metadata.

### Tokens

- Shared infrastructure → `app/lambda/src/common/constants/di.const.ts` (`DI.*`)
- Lambda-specific → `app/lambda/src/<name>/consts.ts` (e.g. `JWT_AUTHORIZER_DI_CONST`)

### Module Pattern

```typescript
@Module({
  imports: [AppConfigModule, CacheDatasourceModule, ApiGatewayDatasourceModule],
  providers: [
    { provide: JWT_AUTHORIZER_DI_CONST.JwtSigningKeyRepo, useClass: JwtSigningKeyRepo },
    { provide: JWT_AUTHORIZER_DI_CONST.VerifyTokenUseCase, useClass: VerifyTokenUseCase },
    { provide: JWT_AUTHORIZER_DI_CONST.Presenter, useClass: JwtAuthorizerPresenter },
  ],
})
export class JwtAuthorizerModule {}
```

### Injection Pattern

```typescript
@injectable()
export class VerifyTokenUseCase implements IVerifyTokenUseCase {
  constructor(
    @inject(JWT_AUTHORIZER_DI_CONST.JwtSigningKeyRepo)
    private readonly jwtSigningKeyRepo: IJwtSigningKeyRepo,
  ) {}
}
```

### Rules

- Every class in the dependency graph must use `@injectable()`.
- Import `reflect-metadata` at the Lambda entry point (`index.ts`), not in every class.
- Constructor injection only — no property injection.

## Lambda Handler Pattern

Handlers are **thin** — bootstrap module, delegate to presenter via `Lambda` class + pipes.

```typescript
// app/lambda/src/jwt-authorizer/index.ts
import 'reflect-metadata';
import { Lambda } from '@common/lambda/lambda';
import { bootstrapApplication, getInstance } from '@lambda/config/di/di.config';
import { JWT_AUTHORIZER_DI_CONST } from '@lambda/jwt-authorizer/consts';
import { JwtAuthorizerModule } from '@lambda/jwt-authorizer/module';
import type { JwtAuthorizerPresenter } from '@lambda/jwt-authorizer/presenter/index.presenter';

bootstrapApplication(JwtAuthorizerModule);

export const handler = new Lambda((event) =>
  getInstance<JwtAuthorizerPresenter>(JWT_AUTHORIZER_DI_CONST.Presenter).handle(event),
).createHandler();
```

**Forbidden in presenter/handler**: business logic, direct DB/SDK calls, complex branching on domain data.

## Infrastructure (`app/lambda/src/config/`)

- `di/di.config.ts` — InversifyJS container, `bootstrapApplication`, `getInstance`
- `di/datasources/*.di.ts` — one `@Module` per datasource group (database, cache, cognito, …)
- `di/app.config.di.ts` — binds `DI.APP_CONFIG`
- `app.config.ts` — environment configuration (ElastiCache, Cognito, RDS, …)

Datasource DI modules are **imported** by each Lambda's `module.ts` as needed.

## Database & Cache Selection

| Data Type              | Store              | Access                                              |
| ---------------------- | ------------------ | --------------------------------------------------- |
| Relational / user data | Aurora PostgreSQL  | Prisma via `DI.DB_CLIENT_DATASOURCE` (shared layer) |
| Cache (JWKS, etc.)     | Valkey/ElastiCache | `@valkey/valkey-glide` via `DI.CACHE_DATASOURCE`    |
| Event / log / ranking  | DynamoDB           | `@aws-sdk/lib-dynamodb`                             |
| Files                  | S3 / GCS           | object-storage datasources                          |

Use the datasource appropriate to the data type. JWKS caching uses ElastiCache — not in-memory across invocations.

## Validation Rules

- Validate at the **presenter** boundary with **Zod** (`dtos/requests/`).
- Inner layers receive typed, validated data — no re-validation.
- Never pass raw `event.body` / unvalidated headers to use cases.

## Error Handling

- Use custom errors from `app/lambda/src/common/errors/`.
- UseCase throws domain errors; presenter / `Lambda` pipes map to HTTP/IAM responses.
- Repository wraps DB errors into domain errors.
- Never expose raw DB errors or stack traces in responses.

## Logic Placement Summary

| Logic Type                      | Where                           |
| ------------------------------- | ------------------------------- |
| Input validation                | Presenter + Zod DTOs            |
| Business rules / orchestration  | UseCase                         |
| Data access / caching / mapping | Repository + DataSource         |
| Response / policy formatting    | Presenter                       |
| Shared utilities                | `app/lambda/src/common/utils/`  |
| Error classification            | `app/lambda/src/common/errors/` |
