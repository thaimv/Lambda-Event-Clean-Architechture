# lambda-generate-unit-tests Workflow

## Reference Files

| File                                | Purpose                      |
| ----------------------------------- | ---------------------------- |
| `.github/rules/testing-strategy.md` | Test placement, mock pattern |
| Presenter / use-case / repo source  | Behaviour under test         |
| `templates/*.test.ts`               | Layer test scaffolds         |

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse `{lambda-name}` — must be kebab-case folder name under `app/lambda/src/`; confirm it matches `manifest.yaml` → `input`.
3. Confirm `app/lambda/src/<lambda-name>/` exists — if missing → **stop and ask**.
4. If `prev_skill` is a list, confirm the Lambda was implemented via the matching skill; if a single name, confirm implementation from `lambda-event-impl` exists under `app/lambda/src/<lambda-name>/`.
5. Identify which layers exist: `presenter/`, `usecases/implements/`, `repos/implements/`.
6. List existing tests under `app/lambda/test/<lambda-name>/` — report files that will be **skipped**.
7. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.

---

## Step 2 — Read Source Files

1. `presenter/index.presenter.ts`
2. `usecases/implements/<name>.uc.impl.ts`
3. `repos/implements/<name>.repo.impl.ts` (if exists)
4. Interface files for mock typing

---

## Step 3 — Plan Tests Per Layer

### Presenter

- **S**: Valid event → use case called → result returned
- **E**: Required field missing → `ValidationError`
- **Branch**: Each alternative parsing path

### Use Case

- **S**: Valid input + repo returns data → correct result
- **E**: Repo returns `null` → `NotFoundError` (if applicable)
- **E**: Repo throws → propagates
- **Time-sensitive**: `vi.useFakeTimers()` when `new Date()` used

### Repository

- **S**: Valid input → correct Prisma shape + mapped result
- **E**: DB throws → propagates

---

## Step 4 — Generate Test Files

Output paths:

```
app/lambda/test/<lambda-name>/presenter/index.presenter.test.ts
app/lambda/test/<lambda-name>/usecases/implements/<name>.uc.impl.test.ts
app/lambda/test/<lambda-name>/repos/implements/<name>.repo.impl.test.ts
```

Use templates under `templates/`. Follow `.github/rules/testing-strategy.md` (DI injection, `vi.fn()` mocks, `beforeEach` reset, logger mock).

---

## Step 5 — Verify Output

```bash
npx vitest run app/lambda/test/<lambda-name>/
npx vitest run --coverage --coverage.include="app/lambda/src/<lambda-name>/**" app/lambda/test/<lambda-name>/
```

| Check               | Pass when                          |
| ------------------- | ---------------------------------- |
| Files created       | One test file per layer generated  |
| All tests green     | Zero failing tests                 |
| UseCase coverage    | ≥ 100% lines                       |
| Repository coverage | ≥ 80% lines                        |
| Presenter coverage  | ≥ 80% lines                        |
| TypeScript          | Test files compile without errors  |
| Output contract     | Matches `manifest.yaml` → `output` |

If a test fails → fix the test (not source) to match actual behaviour; re-run until green.

Report to user: generated files, test count per layer, coverage %, skipped files, TODOs. Suggest `manifest.yaml` → `next_skill` when complete.
