# Lambda Event Detail Design Workflow

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Determine input form:
   - **File path** → read the spec at that path.
   - **Free-text description** → use as the requirement source.
3. If file path: confirm the file exists and is readable.
4. Extract: Lambda name, event source/trigger, payload fields + validation, response shape, error cases, processing steps, environment variables.
5. If any required information is ambiguous or missing → **stop and ask** before generating.

---

## Step 2 — Load References

1. Read `document/detail-designs/_template.md` — follow its structure exactly.
2. Reference example: `document/detail-designs/lambdas/delete-user/index.md`.
3. Planned output path: `document/detail-designs/lambdas/[lambda-name]/index.md`.
4. Only include error subsections that apply — remove the rest.
5. Omit template metadata blocks from output.

---

## Step 3 — Generate Detail Design

1. Write the complete detail design markdown following the template structure.
2. Include simulator notes: `out/simulator/event-<lambda-folder>.json` and `out/simulator/run_script.sh` mapping.
3. Document only errors relevant to this Lambda (see Error code reference below).
4. Output **exactly one** `.md` document — no preamble, no code-fence wrapper around the whole file.

---

## Step 4 — Verify Output

| Check              | Pass when                                                |
| ------------------ | -------------------------------------------------------- |
| Single file        | Exactly one markdown document produced                   |
| Output path        | `document/detail-designs/lambdas/[lambda-name]/index.md` |
| Template structure | All required sections from `_template.md` present        |
| Request/response   | Shapes and validation rules documented                   |
| Error codes        | Only applicable codes from `response.const.ts`           |
| Simulator          | Event file + `run_script.sh` entry documented            |
| Output contract    | Matches `manifest.yaml` → `output`                       |

Report the output path to the user. Suggest `manifest.yaml` → `next_skill` when complete.

---

## Appendix — Presenter responsibilities

- Parse the raw AWS event (`APIGatewayProxyEvent`, `SQSEvent`, etc.) into a typed DTO.
- Validate input using Zod — throw `ValidationError` on failure.
- Call the use case, map result to response DTO.
- No business logic in the presenter.

## Appendix — Error code reference

Source of truth: `app/lambda/src/common/constants/response.const.ts` → `RESULT_CODE`.

| Code     | HTTP | Description                 | Error class           |
| -------- | ---- | --------------------------- | --------------------- |
| `SC-001` | 200  | Success                     | —                     |
| `ES-001` | 500  | Unexpected server error     | `InternalServerError` |
| `EB-001` | 401  | Unauthorized                | `UnauthorizedError`   |
| `EB-002` | 400  | Bad request (business rule) | `BadRequestError`     |
| `EB-003` | 404  | Resource not found          | `NotFoundError`       |
| `EB-004` | 400  | Validation error (Zod)      | `ValidationError`     |
| `EB-009` | 400  | Resource already exists     | `ExistedError`        |
