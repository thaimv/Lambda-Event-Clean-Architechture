# TypeScript Coding Standards

> Loaded when writing, reviewing, or refactoring TypeScript code.

## General

- **TypeScript strict mode** is enabled. No `any` unless absolutely necessary and commented.
- Use `const` by default; `let` only when reassignment is needed. Never `var`.
- Prefer `async/await` over `.then()/.catch()` chains.
- Prefer named exports over default exports.

## Naming Conventions

| Item               | Convention                          | Example                                      |
| ------------------ | ----------------------------------- | -------------------------------------------- |
| Files              | kebab-case                          | `delete-user.uc.impl.ts`                     |
| Classes            | PascalCase                          | `DeleteUserUseCase`                          |
| Interfaces         | PascalCase with `I` prefix          | `IUserRepo`                                  |
| Types / DTOs       | PascalCase                          | `DeleteUserRequest`, `AuthorizerResult`      |
| Variables / params | camelCase                           | `userId`, `methodArn`                        |
| Constants          | UPPER_SNAKE_CASE                    | `MAX_RETRY_COUNT`                            |
| Shared DI tokens   | UPPER_SNAKE_CASE key in `DI` object | `DI.CACHE_DATASOURCE`                        |
| Lambda DI tokens   | `{NAME}_DI_CONST` object            | `JWT_AUTHORIZER_DI_CONST.VerifyTokenUseCase` |
| Zod schemas        | camelCase with `Schema` suffix      | `verifyTokenRequestSchema`                   |
| Lambda handler     | `handler` (named export)            | `export const handler`                       |

## File Naming Suffixes

| Suffix          | Meaning                                          |
| --------------- | ------------------------------------------------ |
| `.uc.ts`        | Use case interface                               |
| `.uc.impl.ts`   | Use case implementation (`usecases/implements/`) |
| `.repo.ts`      | Repository interface                             |
| `.repo.impl.ts` | Repository implementation (`repos/implements/`)  |
| `.dto.ts`       | DTO + Zod schema                                 |
| `consts.ts`     | Lambda DI tokens / constants                     |
| `module.ts`     | Per-Lambda `@Module` declaration                 |
| `index.ts`      | Lambda entry point                               |
| `.test.ts`      | Unit test under `app/lambda/test/`               |

## Class Patterns

### Use Case

```typescript
@injectable()
export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(@inject(DELETE_USER_DI_CONST.IUserRepo) private readonly userRepo: IUserRepo) {}

  async execute(request: DeleteUserRequest): Promise<void> {
    // business logic only — no AWS event types
  }
}
```

### Presenter

```typescript
@injectable()
export class JwtAuthorizerPresenter {
  constructor(
    @inject(JWT_AUTHORIZER_DI_CONST.VerifyTokenUseCase)
    private readonly useCase: IVerifyTokenUseCase,
  ) {}

  async handle(event: APIGatewayRequestAuthorizerEvent): Promise<AuthorizerResult> {
    // parse event, Zod validate, delegate to use case
  }
}
```

### Repository Implementation

```typescript
@injectable()
export class UserRepo implements IUserRepo {
  constructor(@inject(DI.DB_CLIENT_DATASOURCE) private readonly dbClient: DBClient) {}
}
```

## Error Handling

- Use custom error classes from `app/lambda/src/common/errors/`.
- Do NOT throw generic `new Error()` from use cases.

## Imports

- Group imports: external packages → `@common/` / `@lambda/` → relative files.
- Path aliases: `@common/*` → `app/lambda/src/common/*`, `@lambda/*` → `app/lambda/src/*`.
- Use `import type` for type-only imports.

## Zod Schemas

- Co-locate in `app/lambda/src/<name>/dtos/requests/`.
- Export schema and inferred type.

```typescript
export const verifyTokenRequestSchema = z.object({
  token: z.string().min(1),
  methodArn: z.string().min(1),
});
export type VerifyTokenRequest = z.infer<typeof verifyTokenRequestSchema>;
```

## DI Tokens

- Shared infra → `app/lambda/src/common/constants/di.const.ts` (`DI`)
- Lambda-specific → `app/lambda/src/<name>/consts.ts`

```typescript
export const JWT_AUTHORIZER_DI_CONST = {
  VerifyTokenUseCase: Symbol.for('VerifyTokenUseCase'),
  Presenter: Symbol.for('JwtAuthorizerPresenter'),
};
```

## async/await Rules

- Explicit return types on exported async functions.
- Catch errors at presenter / Lambda pipe boundary unless re-throwing domain errors.
- Use `Promise.all()` for parallel independent operations.
