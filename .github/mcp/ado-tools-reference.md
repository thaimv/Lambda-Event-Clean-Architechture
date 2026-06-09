# Azure DevOps MCP Tools Reference

MCP tools reference for **Azure DevOps** (PRs / work items).

One of three equal platform references in `.github/mcp/`. Detect the host and load the matching
file — see `README.md` in this folder.

- GitHub → `github-tools-reference.md`
- GitLab → `gitlab-tools-reference.md`
- Azure DevOps → `ado-tools-reference.md` ← **this file**

## Default Values

- **Project**: `LambdaEvents`
- **Repository**: `LambdaEvents`
- **Organization**: `TEST`

## PR Tools

> **Prefer local git diff** over per-file `get_file_content` API calls.
> Use `git fetch` + `git diff` to get all changes in one operation.
> Only fall back to ADO API if git fetch fails.

| Action                   | Tool                                               | Key Params                                                                                                               |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Get PR info              | `mcp_azure-devops_repo_get_pull_request_by_id`     | `project`, `pullRequestId`                                                                                               |
| Get PR file changes      | `mcp_azure-devops_repo_get_pull_request_changes`   | `project`, `pullRequestId`                                                                                               |
| Read file content        | `mcp_azure-devops_repo_get_file_content`           | `project`, `repositoryId`, `path`, `version`, `versionType`                                                              |
| List PR threads          | `mcp_azure-devops_repo_list_pull_request_threads`  | `project`, `pullRequestId`                                                                                               |
| Create PR thread/comment | `mcp_azure-devops_repo_create_pull_request_thread` | `project`, `pullRequestId`, `repositoryId`, `content`, `status`, `filePath`?, `rightFileStartLine`?, `rightFileEndLine`? |
| Reply to comment         | `mcp_azure-devops_repo_reply_to_comment`           | `project`, `pullRequestId`, `threadId`, `content`                                                                        |
| Vote on PR               | `mcp_azure-devops_repo_vote_pull_request`          | `project`, `pullRequestId`, `vote`                                                                                       |
| Create PR                | `mcp_azure-devops_repo_create_pull_request`        | `project`, `repositoryId`, `title`, `description`, `sourceBranch`, `targetBranch`                                        |
| Update PR                | `mcp_azure-devops_repo_update_pull_request`        | `project`, `pullRequestId`                                                                                               |

## Work Item Tools

| Action        | Tool                                                  | Key Params                                               |
| ------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Get work item | `mcp_azure-devops_wit_get_work_item`                  | `project`, `id`                                          |
| My work items | `mcp_azure-devops_wit_my_work_items`                  | `project`                                                |
| WI comments   | `mcp_azure-devops_wit_list_work_item_comments`        | `project`, `workItemId`                                  |
| Link WI to PR | `mcp_azure-devops_wit_link_work_item_to_pull_request` | `project`, `workItemId`, `pullRequestId`, `repositoryId` |
| Update WI     | `mcp_azure-devops_wit_update_work_item`               | `project`, `id`                                          |
| Query WIQL    | `mcp_azure-devops_wit_query_by_wiql`                  | `project`, `query`                                       |

## Repo Tools

| Action         | Tool                                          | Key Params                |
| -------------- | --------------------------------------------- | ------------------------- |
| List repos     | `mcp_azure-devops_repo_list_repos_by_project` | `project`                 |
| List branches  | `mcp_azure-devops_repo_list_branches_by_repo` | `project`, `repositoryId` |
| List directory | `mcp_azure-devops_repo_list_directory`        | `repositoryId`, `path`    |
| Search code    | `mcp_azure-devops_search_code`                | `searchText`, `project`   |

## Safety Rules

- **NEVER** push comments to PR without user confirmation
- **NEVER** auto-vote on PRs — only recommend a vote, let user vote manually
- **NEVER** merge or abandon a PR
- **NEVER** modify code on remote — only comment
- On permission errors → save review to local file
