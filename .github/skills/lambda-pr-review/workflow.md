# PR Review Workflow

## Reference

### Rules to Load

- `.github/rules/architecture.md`
- `.github/rules/typescript-coding-standards.md`
- `./review-criteria.md`
- Tests changed → `.github/rules/testing-strategy.md`
- Per affected module → `.github/brain/modules/{ModuleName}.md`

### Templates

- `./templates/review-report.md` — chat summary
- `./templates/review-comment.md` — inline comment format

### Tool Selection

| Need                     | Use                               | NOT                   |
| ------------------------ | --------------------------------- | --------------------- |
| Read file in working dir | `read_file` tool                  | `cat`, `head`, `tail` |
| Search text              | `grep_search` tool                | `grep -rn`, `rg`      |
| Find files               | `file_search` tool                | `find`, `ls`          |
| PR branch file           | `git show branch:file` (terminal) | —                     |
| Unified diff             | `git diff` (terminal)             | —                     |

Only use terminal for git operations that require branch-specific access.

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse `{PR_ID}` and flags (`--context`, `--auto_push`); confirm they match `manifest.yaml` → `input`.
3. Read `.github/brain/project-context.json` — if `generated_at` is null → **stop**: run `/lambda-init` first.
4. Detect platform from `git remote get-url origin`:
   - `github.com` → load `.github/mcp/github-tools-reference.md`
   - GitLab → `.github/mcp/gitlab-tools-reference.md`
   - Azure DevOps → `.github/mcp/ado-tools-reference.md`
   - Ambiguous → ask user
5. Load rules listed above.
6. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.

---

## Step 2 — Fetch PR Data

1. Get PR/MR metadata via platform MCP tool (title, author, branches, status).
2. Fetch diff locally:
   ```bash
   git fetch origin {source_branch}:{source_branch} {target_branch}:{target_branch}
   git diff {target_branch}...{source_branch} -- . \
     ':!*.js' ':!*.js.map' ':!package-lock.json' ':!*.generated.ts'
   ```
3. If filtered diff is empty → **stop**: no reviewable changes.
4. Parse diff → identify affected modules and layers.

---

## Step 3 — Analyze Code

Load `brain/modules/` for affected modules. Review each changed file:

- **Architecture**: thin presenter, use-case isolation, DI, no cross-module imports
- **Code quality**: naming, no unjustified `any`, Zod at boundary, error classes
- **Tests** (if changed): constructor injection mocks, edge cases, E2E coverage
- **Security**: no secrets, parameterized queries, no PII in logs

Classify findings per `./review-criteria.md` severity.

---

## Step 4 — Build Review Report

1. Format report using `./templates/review-report.md`.
2. Build idempotent comment payload with markers: `<!-- copilot-review: {file}:{line}:{category} -->`
3. De-duplicate against existing PR comments; skip already-posted markers.
4. Resolve `--auto_push` mode (default: manual — wait for explicit approval before pushing).

Push inline comments via platform MCP when approved or `--auto_push=true`. Push summary as general PR comment.

---

## Step 5 — Verify Output

| Check               | Pass when                                          |
| ------------------- | -------------------------------------------------- |
| Report in chat      | Complete summary with severity counts              |
| Findings coverage   | All changed reviewable files addressed             |
| Comments            | Pushed or queued per user approval / `--auto_push` |
| Idempotency         | Duplicate markers skipped                          |
| Vote recommendation | Shown — user votes manually (never auto-vote)      |
| Output contract     | Matches `manifest.yaml` → `output`                 |

Show recommended vote:

```
📊 Recommended vote: {Approved / Approved with suggestions / Waiting for author}
⚠️  You must vote manually on the PR page.
```

All PR comments **must be in English**.
