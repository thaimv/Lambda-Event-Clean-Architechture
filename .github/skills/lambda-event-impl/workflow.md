# Lambda Function Implementation Workflow

## Appendix — Module structure

```
app/lambda/src/<lambda-folder>/
├── consts.ts
├── module.ts
├── index.ts
├── presenter/index.presenter.ts
├── dtos/requests/, dtos/responses/
├── models/
├── repos/<name>.repo.ts, repos/implements/<name>.repo.impl.ts
└── usecases/<name>.uc.ts, usecases/implements/<name>.uc.impl.ts
```

Path aliases: `@common/*` → `app/lambda/src/common/*`, `@lambda/*` → `app/lambda/src/*`

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Confirm detail design document path exists and is readable; confirm it matches `manifest.yaml` → `input`.
3. Read the design fully.
4. Extract: Lambda name/folder, event source, request validation, response shape, error codes, env vars, processing steps.
5. Build a checklist mapping 100% of design items to code artifacts.
6. If any design field is ambiguous → **stop and ask** before writing code.
7. If Lambda folder already exists → identify what to add vs create.

---

## Step 2 — Simulator Event File

Create `out/simulator/event-<lambda-folder>.json` with a valid sample payload:

```json
{
  "body": "{\"fieldName\": \"example_value\"}",
  "pathParameters": {},
  "queryStringParameters": {}
}
```

For non-HTTP triggers (SQS, SNS, etc.), use the appropriate event shape from the design.

---

## Step 3 — Update run_script.sh

Add a mapping branch to `out/simulator/run_script.sh`:

```bash
if [ "$LAMBDA" = "<lambda-folder>" ]; then
  EVENT_FILE="event-<lambda-folder>.json"
  HANDLER_PATH="../../app/lambda/src/<lambda-folder>/index"
fi
```

Insert before the final `cat > temp.js` block. Do not remove existing entries.

---

## Step 4 — DI Constants (`consts.ts`)

```ts
import { DI } from '@common/constants/di.const';

export const MY_LAMBDA_DI_CONST = {
  Presenter: Symbol.for('MyLambdaPresenter'),
  IMyRepo: Symbol.for('IMyRepo'),
  IMyUseCase: Symbol.for('IMyUseCase'),
};
```

---

## Step 5 — Request DTO (`dtos/requests/<name>.request.dto.ts`)

```ts
import { z } from 'zod';

export const MyRequestSchema = z.object({
  fieldName: z.string().trim().min(1),
});

export type MyRequest = z.infer<typeof MyRequestSchema>;
```

Validation rules must exactly match the design document.

---

## Step 6 — Repository Layer

**Interface** (`repos/<name>.repo.ts`) and **implementation** (`repos/implements/<name>.repo.impl.ts`):

- `@injectable()`, inject `DI.*_DATASOURCE` tokens
- Prisma only unless design requires otherwise
- Map Prisma result → domain model before returning

---

## Step 7 — Use-case Layer

**Interface** (`usecases/<name>.uc.ts`) and **implementation** (`usecases/implements/<name>.uc.impl.ts`):

- No AWS event types in use case
- Business logic and repo calls only
- Throw domain errors (`NotFoundError`, `BadRequestError`, etc.)

---

## Step 8 — Presenter (`presenter/index.presenter.ts`)

- Parse raw AWS event type from design (`APIGatewayProxyEvent`, `SQSEvent`, etc.)
- `safeParse` with Zod → throw `ValidationError` on failure
- `logger.appendKeys(...)` at entry (exclude sensitive fields)
- Delegate to use case — no business logic

---

## Step 9 — Module (`module.ts`)

```ts
@Module({
  imports: [DatabaseDatasourceModule], // only datasources this Lambda uses
  providers: [
    { provide: MY_LAMBDA_DI_CONST.Presenter, useClass: MyPresenter },
    { provide: MY_LAMBDA_DI_CONST.IMyRepo, useClass: MyRepo },
    { provide: MY_LAMBDA_DI_CONST.IMyUseCase, useClass: MyUseCase },
  ],
})
export class MyLambdaModule {}
```

---

## Step 10 — Lambda Entry Point (`index.ts`)

```ts
import 'reflect-metadata';
import { Lambda } from '@common/lambda/lambda';
import { bootstrapApplication, getInstance } from '@lambda/config/di/di.config';
import { MY_LAMBDA_DI_CONST } from '@lambda/<lambda-folder>/consts';
import { MyLambdaModule } from '@lambda/<lambda-folder>/module';
import type { MyPresenter } from '@lambda/<lambda-folder>/presenter/index.presenter';
import type { APIGatewayProxyEvent } from 'aws-lambda';

bootstrapApplication(MyLambdaModule);

export const handler = new Lambda<APIGatewayProxyEvent, void>((event, _context) =>
  getInstance<MyPresenter>(MY_LAMBDA_DI_CONST.Presenter).handle(event),
).createHandler();
```

---

## Step 11 — Verify Output

Run quality gates:

```bash
npm run lint:ci
npm run format:ci
```

Confirm output checklist:

| Artifact                                   | Pass when                                                |
| ------------------------------------------ | -------------------------------------------------------- |
| `out/simulator/event-<lambda-folder>.json` | Valid sample payload                                     |
| `out/simulator/run_script.sh`              | Mapping entry added                                      |
| `consts.ts`                                | DI tokens defined                                        |
| Request DTO                                | Zod schema matches all design validation rules           |
| Response DTO                               | Matches design success shape                             |
| Domain model                               | Interface created                                        |
| Repository                                 | Interface + implementation                               |
| Use case                                   | Interface + implementation                               |
| Presenter                                  | Correct event type, validates, delegates                 |
| `module.ts`                                | All providers registered; only needed datasource imports |
| `index.ts`                                 | Entry point wired correctly                              |
| Errors                                     | Correct classes and `RESULT_CODE` / `ERROR_MESSAGE`      |
| Logging                                    | Structured logs; no sensitive data in logs               |
| Lint / format                              | `npm run lint:ci` and `npm run format:ci` pass           |
| Clean code                                 | No dead code, no TODO left                               |
| Output contract                            | Matches `manifest.yaml` → `output`                       |

Report output paths and any checklist items still open. Suggest `manifest.yaml` → `next_skill` when complete.

---

## Appendix — Error handling

| Situation               | Error class           | Result code |
| ----------------------- | --------------------- | ----------- |
| Input validation fails  | `ValidationError`     | `EB-004`    |
| Resource not found      | `NotFoundError`       | `EB-003`    |
| Unauthenticated         | `UnauthorizedError`   | `EB-001`    |
| Business rule violated  | `BadRequestError`     | `EB-002`    |
| Resource already exists | `ExistedError`        | `EB-009`    |
| Unexpected error        | `InternalServerError` | `ES-001`    |

Source: `app/lambda/src/common/errors/`, `@common/constants/response.const`.

## Appendix — Layer communication

```
AWS Event → Lambda.createHandler() → Presenter → UseCase → Repo → Datasource
```
