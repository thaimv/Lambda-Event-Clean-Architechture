# lambda-init Workflow

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse input for `--check` flag; confirm it matches `manifest.yaml` → `input`.
3. Read `.github/brain/project-context.json` (treat missing file or missing `generated_at` as uninitialized).
4. Choose mode:

| Input     | Context file                | Mode          | Action if invalid                        |
| --------- | --------------------------- | ------------- | ---------------------------------------- |
| `--check` | missing / no `generated_at` | **Stop**      | Report: run `/lambda-init` first         |
| `--check` | exists                      | **Verify**    | Continue read-only (Steps 2–4)           |
| no flag   | missing / exists            | **Full Scan** | Continue and refresh context (Steps 2–4) |

---

## Step 2 — Scan Lambda Functions

**Full Scan mode only** — skip in Verify mode.

1. List `app/lambda/src/` subdirectories — skip `common` and `config`.
2. For each Lambda: check `consts.ts`, `module.ts`, `index.ts`, `presenter/`, `repos/`, `usecases/`, `dtos/`, `models/`.
3. Determine event source from `presenter/index.presenter.ts`.
4. Determine datasource dependencies from DI tokens in repos.
5. Build the `lambdas` map and sync `repo_layout`, `commands`, `key_files` in `project-context.json`.
6. Warn when `.github/brain/modules/{lambda-name}.md` is missing — do not auto-create.
7. Set `generated_at` to current ISO timestamp and write `project-context.json`.

---

## Step 3 — Verify / Drift Check

Compare codebase vs `project-context.json`:

| Drift type                                    | Action              |
| --------------------------------------------- | ------------------- |
| In codebase, not in json                      | Report as **new**   |
| In json, not in codebase                      | Report as **stale** |
| `repo_layout.areas.lambda_functions` mismatch | Report drift        |
| `commands` mismatch vs `package.json`         | Report drift        |
| Missing `brain/modules/{lambda-name}.md`      | Report warning      |

**Verify mode (`--check`)**: report only — do not write `project-context.json`.

---

## Step 4 — Verify MCP Connectivity

1. Detect platform from `git remote get-url origin` — see `.github/mcp/README.md`.
2. Test matching MCP (GitHub / GitLab / Azure DevOps).
3. On success → update `capabilities.host` and matching MCP flag.
4. On failure → warning only; do not block.

---

## Step 5 — Verify Output

Confirm and report:

```
✅ project-context.json — up-to-date ({n} Lambda functions)   [Full Scan only]
✅ MCP {GitHub|GitLab|Azure DevOps} — connected
⚠️  Drift detected: {details}
⚠️  Missing brain docs: {list}
ℹ️  Mode: Full Scan | Verify (--check)
```

| Check                  | Pass when                                    |
| ---------------------- | -------------------------------------------- |
| `project-context.json` | Written (Full Scan) or unchanged (`--check`) |
| `lambdas` map          | Matches `app/lambda/src/` scan               |
| `generated_at`         | Updated on Full Scan                         |
| Report delivered       | User sees status summary in chat             |
| Output contract        | Matches `manifest.yaml` → `output`           |

If Verify mode and context file was missing → report `❌ run /lambda-init first` and stop.
