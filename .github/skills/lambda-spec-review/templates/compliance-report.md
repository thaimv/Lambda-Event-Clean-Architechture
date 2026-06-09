# Spec Compliance Report Template

```markdown
# 📋 Spec Compliance Review — {PBI Title}

## Information

| Field             | Value                        |
| ----------------- | ---------------------------- |
| **Spec**          | `{spec_path}`                |
| **Lambda**        | `{lambda-name}`              |
| **Review Date**   | {date}                       |
| **Detail Design** | {design_path or "not found"} |

## Overall Verdict

**{COMPLIANT | COMPLIANT_WITH_WARNINGS | NON_COMPLIANT}**

| Metric             | Count |
| ------------------ | ----- |
| ✅ Compliant       | {n}   |
| ⚠️ Partial / drift | {n}   |
| ❌ Missing / wrong | {n}   |
| ❓ Unclear         | {n}   |

## Requirement Compliance

| #   | Spec requirement (summary) | Verdict     | Evidence                 |
| --- | -------------------------- | ----------- | ------------------------ |
| 1   | {requirement}              | ✅/⚠️/❌/❓ | `{file}:{line}` — {note} |

## Architecture Compliance

| Check               | Verdict  | Notes |
| ------------------- | -------- | ----- |
| Thin presenter      | ✅/⚠️/❌ |       |
| Use case isolation  | ✅/⚠️/❌ |       |
| Repository layer    | ✅/⚠️/❌ |       |
| Boundary validation | ✅/⚠️/❌ |       |
| Error codes         | ✅/⚠️/❌ |       |

## Action Items

### ❌ Must fix (spec non-compliance)

{items}

### ⚠️ Should fix (partial / drift)

{items}

### ❓ Needs clarification

{items}

---

_Review by LambdaEvents Spec Compliance Agent_
```
