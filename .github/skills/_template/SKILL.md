---
name: _template
description: 'Template for creating a new skill. Copy this folder and rename.'
---

# Skill Name

## Input

```
/{skill-name} {argument}
```

## Goal

One paragraph: what this skill does, what it produces.

## Rules to Load

- `.github/rules/architecture.md`
- `.github/rules/typescript-coding-standards.md`
- (add more as needed)

## Safety

- List any safety constraints specific to this skill.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.

Copy this folder and update `SKILL.md`, `workflow.md`, and `manifest.yaml` together.
`manifest.yaml` required fields: `name`, `version`, `description`, `input`, `output`,
`script`, `templates` (`templates/*` or `none`), `context_budget`, `prev_skill`, `next_skill`.
Use `none` when not applicable. `prev_skill` / `next_skill` may be a **single skill name** or a **YAML list** when multiple paths apply.
