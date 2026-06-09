# Spec Compliance Review Workflow

## Reference Files

| File                                              | Purpose                          |
| ------------------------------------------------- | -------------------------------- |
| `./templates/pbi-spec.md`                         | Spec section layout              |
| `./templates/compliance-report.md`                | Report output format             |
| `document/detail-designs/lambdas/<name>/index.md` | Supplementary — when present     |
| `app/lambda/src/<name>/`                          | Implementation under review      |
| `.github/rules/architecture.md`                   | Layer boundaries and conventions |

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Confirm spec file path exists and is readable; confirm it matches `manifest.yaml` → `input`.
3. Confirm section **2. Requirement Description** is non-empty — if vague → **stop and ask**.
4. Parse optional `{lambda-name}` argument when spec lists multiple Lambdas (section 3.1).
5. Run `/lambda-init` if `.github/brain/project-context.json` is missing or stale.
6. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.
7. Read `.github/brain/contexts/spec-review-context.md` — if prior review exists for same spec + Lambda, show summary and ask if re-review.
8. If `prev_skill` is a list, confirm implementation exists from the matching skill; if a single name, confirm `app/lambda/src/<lambda-name>/` exists from `lambda-event-impl`.

---

## Step 2 — Parse Spec

1. Extract PBI title/ID, main objective (section 1), requirements (section 2), Lambda folder(s) (section 3.1), event source (section 3.3), constraints (section 4).
2. Resolve target Lambda(s): one → use it; multiple + name arg → scope; multiple + no arg → review each sequentially.
3. Update `spec-review-context.md` with spec path, Lambda name(s), status `PARSING`.

---

## Step 3 — Load Implementation

For each target `<lambda-name>`:

1. Confirm `app/lambda/src/<lambda-name>/` exists — if missing → record ❌ and continue report.
2. Read: `presenter/`, `usecases/implements/`, `repos/implements/`, `dtos/requests/`, `module.ts`, `consts.ts`, `index.ts`.
3. Read detail design and `brain/modules/<lambda-name>.md` when present.

---

## Step 4 — Map Requirements to Code

For each requirement in spec section 2, assign verdict: ✅ | ⚠️ | ❌ | ❓

| Requirement type             | Check in                                   |
| ---------------------------- | ------------------------------------------ |
| Trigger / event parsing      | `presenter/index.presenter.ts`, `index.ts` |
| Input validation             | `dtos/requests/`, presenter                |
| Business logic               | `usecases/implements/*.uc.impl.ts`         |
| Persistence / external calls | `repos/implements/*.repo.impl.ts`          |
| Success / error responses    | presenter, use case, `response.const`      |
| Env vars / config            | `consts.ts`, `module.ts`, use case         |

Verify section 4 constraints against use case and repo code.

---

## Step 5 — Architecture Compliance

Check against `.github/rules/architecture.md`: thin presenter, no AWS types in use case, repository isolation, Zod at boundary, correct error codes.

---

## Step 6 — Verify Output

1. Produce report using `./templates/compliance-report.md`.
2. Include: requirement table, architecture summary, overall verdict (`COMPLIANT` | `COMPLIANT_WITH_WARNINGS` | `NON_COMPLIANT`), action items.
3. Every ❌/⚠️ cites spec text and code location.
4. Update `spec-review-context.md` with verdict and open gaps.

| Check           | Pass when                           |
| --------------- | ----------------------------------- |
| Report in chat  | English, complete, no file creation |
| Evidence        | All gaps have spec + code citations |
| Verdict         | Overall compliance status stated    |
| Context saved   | `spec-review-context.md` updated    |
| Output contract | Matches `manifest.yaml` → `output`  |

**Safety:** read-only — do not modify spec or source. Suggest `manifest.yaml` → `next_skill` when complete.
