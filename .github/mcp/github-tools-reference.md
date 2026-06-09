# GitHub MCP Tools Reference

MCP tools reference for **GitHub** (PRs / issues, via the GitHub MCP server).

One of three equal platform references in `.github/mcp/`. Detect the host and load the matching
file — see `README.md` in this folder.

- GitHub → `github-tools-reference.md` ← **this file**
- GitLab → `gitlab-tools-reference.md`
- Azure DevOps → `ado-tools-reference.md`

## Default Values

- **Owner**: `{github-org-or-user}`
- **Repository**: `LambdaEvents`
- **Default base branch**: `develop`
- **PR identifier**: PR _number_ (e.g. `123`, shown as `#123`)

## PR Tools

> **Prefer local git diff** over API calls for reading changes.
> Use `git fetch` + `git diff` to get all changes in one operation.
> Only fall back to MCP/API if git fetch fails.

| Action                  | Tool                                   | Key Params                                            |
| ----------------------- | -------------------------------------- | ----------------------------------------------------- |
| Get PR info             | `mcp_github_get_pull_request`          | `owner`, `repo`, `pullNumber`                         |
| Get PR diff             | `mcp_github_get_pull_request_diff`     | `owner`, `repo`, `pullNumber`                         |
| Get PR changed files    | `mcp_github_get_pull_request_files`    | `owner`, `repo`, `pullNumber`                         |
| List PR review comments | `mcp_github_get_pull_request_comments` | `owner`, `repo`, `pullNumber`                         |
| List PR reviews         | `mcp_github_get_pull_request_reviews`  | `owner`, `repo`, `pullNumber`                         |
| Add general PR comment  | `mcp_github_add_issue_comment`         | `owner`, `repo`, `issue_number` (= PR number), `body` |
| Create PR               | `mcp_github_create_pull_request`       | `owner`, `repo`, `title`, `head`, `base`, `body`      |
| Update PR               | `mcp_github_update_pull_request`       | `owner`, `repo`, `pullNumber`                         |
| Merge PR                | `mcp_github_merge_pull_request`        | `owner`, `repo`, `pullNumber`                         |

## Inline Review Comments (pending review flow)

GitHub posts inline comments through a **pending review**, not one call per comment:

1. `mcp_github_create_pending_pull_request_review` — `owner`, `repo`, `pullNumber`
2. `mcp_github_add_pull_request_review_comment_to_pending_review` — `owner`, `repo`, `pullNumber`, `path`, `line` (or `startLine`+`line`), `side` (`RIGHT`/`LEFT`), `body`
3. `mcp_github_submit_pending_pull_request_review` — `owner`, `repo`, `pullNumber`, `event` (`COMMENT` to comment without voting)

> Use `event: COMMENT` only. **NEVER** submit `APPROVE` or `REQUEST_CHANGES` automatically — that is a vote.

## Issue Tools

| Action                                          | Tool                            | Key Params                              |
| ----------------------------------------------- | ------------------------------- | --------------------------------------- |
| Get issue                                       | `mcp_github_get_issue`          | `owner`, `repo`, `issue_number`         |
| List issue comments                             | `mcp_github_get_issue_comments` | `owner`, `repo`, `issue_number`         |
| Comment on issue                                | `mcp_github_add_issue_comment`  | `owner`, `repo`, `issue_number`, `body` |
| Search issues                                   | `mcp_github_search_issues`      | `query`                                 |
| Link work: reference `#issue` in PR body/commit | —                               | use closing keywords (`Closes #123`)    |

## Repo Tools

| Action           | Tool                           | Key Params                     |
| ---------------- | ------------------------------ | ------------------------------ |
| List branches    | `mcp_github_list_branches`     | `owner`, `repo`                |
| Get file content | `mcp_github_get_file_contents` | `owner`, `repo`, `path`, `ref` |
| Search code      | `mcp_github_search_code`       | `query`                        |

## Safety Rules

- **NEVER** push review comments to a PR without user confirmation (unless `--auto_push=true`).
- **NEVER** submit a review as `APPROVE` / `REQUEST_CHANGES` — only recommend a vote; let the user vote manually.
- **NEVER** merge, close, or auto-approve a PR.
- **NEVER** modify code on remote — only comment.
- On permission/auth errors → save the review to a local file.
