# Review Report Template

```markdown
# 🔍 Code Review Report — PR {pr_id}

## Information

| Field             | Value                   |
| ----------------- | ----------------------- |
| **Title**         | {title}                 |
| **Author**        | {author}                |
| **Branch**        | `{source}` → `{target}` |
| **Review Date**   | {date}                  |
| **Changed Files** | {file_count} files      |
| **Modules**       | {module_list}           |

## Findings Summary

| Severity    | Count            |
| ----------- | ---------------- |
| 🔴 CRITICAL | {critical_count} |
| 🟠 HIGH     | {high_count}     |
| 🟡 MEDIUM   | {medium_count}   |
| 🟢 LOW      | {low_count}      |

## Overall Assessment

| Criterion          | Assessment               | Notes  |
| ------------------ | ------------------------ | ------ |
| Clean Architecture | {GOOD/AVERAGE/NEEDS_FIX} | {note} |
| Module Boundaries  | {GOOD/AVERAGE/NEEDS_FIX} | {note} |
| DI Patterns        | {GOOD/AVERAGE/NEEDS_FIX} | {note} |
| Input Validation   | {GOOD/AVERAGE/NEEDS_FIX} | {note} |
| Code Quality       | {GOOD/AVERAGE/NEEDS_FIX} | {note} |
| Test Coverage      | {GOOD/AVERAGE/NEEDS_FIX} | {note} |
| Security           | {GOOD/AVERAGE/NEEDS_FIX} | {note} |

## Score: {score}/10

## Decision: **{APPROVE / APPROVE_WITH_COMMENTS / REQUEST_CHANGES}**

---

## Detailed Findings

### 🔴 CRITICAL

{critical_findings}

### 🟠 HIGH

{high_findings}

### 🟡 MEDIUM

{medium_findings}

### 🟢 LOW

{low_findings}

---

_Review by LambdaEvents AI Code Review Agent_
```
