# GitLab MCP Tools Reference

MCP tools reference for **GitLab** (Merge Requests / issues, via the GitLab MCP server).

One of three equal platform references in `.github/mcp/`. Detect the host and load the matching
file — see `README.md` in this folder.

- GitHub → `github-tools-reference.md`
- GitLab → `gitlab-tools-reference.md` ← **this file**
- Azure DevOps → `ado-tools-reference.md`

> GitLab calls a "PR" a **Merge Request (MR)**, identified by its **IID** (project-scoped number, e.g. `!42`).

## Default Values

- **Project**: `{namespace}/LambdaEvents` (or numeric `project_id`)
- **Default base branch**: `develop`
- **MR identifier**: MR _IID_ (project-scoped, e.g. `42`, shown as `!42`)

## MR Tools

> **Prefer local git diff** over API calls for reading changes.
> Use `git fetch` + `git diff` to get all changes in one operation.
> Only fall back to MCP/API if git fetch fails.

| Action                        | Tool                                   | Key Params                                                             |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Get MR info                   | `mcp_gitlab_get_merge_request`         | `project_id`, `merge_request_iid`                                      |
| Get MR diffs                  | `mcp_gitlab_get_merge_request_diffs`   | `project_id`, `merge_request_iid`                                      |
| List MR discussions           | `mcp_gitlab_mr_discussions`            | `project_id`, `merge_request_iid`                                      |
| Add general MR comment (note) | `mcp_gitlab_create_merge_request_note` | `project_id`, `merge_request_iid`, `body`                              |
| Create MR                     | `mcp_gitlab_create_merge_request`      | `project_id`, `source_branch`, `target_branch`, `title`, `description` |
| Update MR                     | `mcp_gitlab_update_merge_request`      | `project_id`, `merge_request_iid`                                      |
| Merge MR                      | `mcp_gitlab_merge_merge_request`       | `project_id`, `merge_request_iid`                                      |

## Inline Review Comments (diff discussion)

GitLab posts an inline comment as a **diff discussion** anchored to a position:

- `mcp_gitlab_create_merge_request_thread` — `project_id`, `merge_request_iid`, `body`, and a `position` object:
  - `base_sha`, `head_sha`, `start_sha` (from the MR diff refs)
  - `new_path` / `old_path`, `new_line` / `old_line`

> Reply to a discussion with `mcp_gitlab_create_merge_request_note` using the `discussion_id`.
> **NEVER** approve an MR automatically — that is a vote.

## Issue Tools

| Action                                          | Tool                                | Key Params                           |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Get issue                                       | `mcp_gitlab_get_issue`              | `project_id`, `issue_iid`            |
| List issue discussions                          | `mcp_gitlab_list_issue_discussions` | `project_id`, `issue_iid`            |
| Comment on issue                                | `mcp_gitlab_create_issue_note`      | `project_id`, `issue_iid`, `body`    |
| List/search issues                              | `mcp_gitlab_list_issues`            | `project_id`, `search`               |
| Link work: reference `#issue` in MR description | —                                   | use closing keywords (`Closes #123`) |

## Repo Tools

| Action                | Tool                                                       | Key Params                       |
| --------------------- | ---------------------------------------------------------- | -------------------------------- |
| List branches         | `mcp_gitlab_get_branch_diffs` / `mcp_gitlab_list_branches` | `project_id`                     |
| Get file content      | `mcp_gitlab_get_file_contents`                             | `project_id`, `file_path`, `ref` |
| Search project / code | `mcp_gitlab_search_repositories`                           | `search`                         |

## Safety Rules

- **NEVER** push review comments to an MR without user confirmation (unless `--auto_push=true`).
- **NEVER** approve an MR — only recommend a vote; let the user approve manually.
- **NEVER** merge, close, or auto-approve an MR.
- **NEVER** modify code on remote — only comment.
- On permission/auth errors → save the review to a local file.
