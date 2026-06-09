# Review Comment Template

## Inline Comment (per finding)

````markdown
**[{SEVERITY}]** {short_title}

{description_in_english}

**Suggestion:**

```typescript
{
  code_suggestion;
}
```
````

📎 Rule: {rule_name}

````

## Summary Thread (first comment on PR)
```markdown
## 🔍 Code Review Summary — PR {pr_id}

**Reviewer**: AI Code Review Agent
**Date**: {date}
**Decision**: {decision}

### Statistics
- 🔴 Critical: {n}
- 🟠 High: {n}
- 🟡 Medium: {n}
- 🟢 Low: {n}

### Assessment
{short_summary_in_english}

### Modules
{module_list}

---
*Automated review by LambdaEvents AI Code Review Agent*
````

## Thread Status Mapping

| Severity | Thread Status |
| -------- | ------------- |
| CRITICAL | `active`      |
| HIGH     | `active`      |
| MEDIUM   | `active`      |
| LOW      | `active`      |

> All comments default to `active`. Let the PR author resolve them.
