# MCP Platform References

MCP tool references for PR/MR/issue operations. One of three equal platform docs — there is no
default; the active platform is whatever the repository host is.

## Platform Detection

```bash
git remote get-url origin
```

| Remote contains                        | Platform     | Reference file              |
| -------------------------------------- | ------------ | --------------------------- |
| `github.com`                           | GitHub       | `github-tools-reference.md` |
| `gitlab.com` (or self-hosted GitLab)   | GitLab       | `gitlab-tools-reference.md` |
| `dev.azure.com` / `*.visualstudio.com` | Azure DevOps | `ado-tools-reference.md`    |

If ambiguous or no remote → ask the user which platform the PR/MR is on.

## Files

| File                        | MCP server       | Operations                                       |
| --------------------------- | ---------------- | ------------------------------------------------ |
| `github-tools-reference.md` | GitHub MCP       | PRs, issues, inline review (pending review flow) |
| `gitlab-tools-reference.md` | GitLab MCP       | MRs, issues, diff discussions                    |
| `ado-tools-reference.md`    | Azure DevOps MCP | PRs, work items, threads                         |

## Used by

- `skills/lambda-pr-review/` — detect platform in Step 0, load matching reference
- `skills/lambda-init/` — verify MCP connectivity per platform
