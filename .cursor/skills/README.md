# Cursor Skills

Cursor **auto-discovers** skills only under `.cursor/skills/` (not `.github/skills/`).

Each entry here is a **symlink** to the matching folder in `.github/skills/` — one source of truth for both tools:

| Tool               | Location                           | How to invoke                                                        |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------- |
| **GitHub Copilot** | `.github/skills/{name}/`           | Slash command, e.g. `/lambda-event-impl docs/foo.md`                 |
| **Cursor**         | `.cursor/skills/{name}/` (symlink) | Natural language; agent picks skill from `description` in `SKILL.md` |

When adding a new skill, create it under `.github/skills/` (include `SKILL.md`, `workflow.md`, and `manifest.yaml`) then add a symlink:

```bash
ln -sf "../../.github/skills/my-new-skill" ".cursor/skills/my-new-skill"
```
