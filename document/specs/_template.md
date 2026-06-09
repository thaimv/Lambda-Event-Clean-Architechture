# PBI Information

PBI ID:
Title:
Platforms: Backend — Lambda Events

---

# 1. Main Objective

Describe EXACTLY ONE main change. Do not combine multiple unrelated features.

Example:

- When a user account is deleted, the `delete-user` Lambda must remove all records from the `users` table keyed by `gigyaUuid` and deregister from Cognito.

❌ Do not combine multiple unrelated features in a single PBI.
✅ Explain domain terms that are not common knowledge.

---

# 2. Requirement Description

Break down expected behavior into small steps.

Example:

- Lambda triggered by `APIGatewayProxyEvent` (or SQS / EventBridge / direct invoke).
- Validate input payload with Zod.
- Use case orchestrates: call repo → delete DB records → call external service.
- Return `SC-001` on success; throw `EB-004` on validation failure.

---

# 3. Affected Scope

## 3.1 Lambda Function

List affected Lambda folder(s) in `app/lambda/src/`.

Example:

- `delete-user`

## 3.2 Related Features

The higher-level feature this PBI belongs to.

Example:

- `user-lifecycle` — part of the user deletion flow

## 3.3 Feature Relationship

- Type: [new Lambda / extend existing Lambda / bug fix]
- Event source: `APIGatewayProxyEvent` / `SQSEvent` / `SNSEvent` / `ScheduledEvent` / other

---

# 4. Constraints / Important Notes

Example:

- Do not change unrelated Lambdas.
- Idempotent — safe to call multiple times.

---

# 5. References (Optional)

- DB schema: `app/lambda/layer/prisma/schema.prisma`
- Existing Lambda design

⚠️ Only attach documents that AI can read in the workspace.

---

> **Next step (after PBI is approved):**
> Run `/lambda-event-design document/specs/this-file.md`
> to auto-generate the detail design doc → save output to `document/detail-designs/lambdas/[lambda-name]/` or `document/detail-designs/stepfunctions/[flow-name]/`.
>
> **After implementation:**
> Run `/lambda-spec-review document/specs/this-file.md` to verify code matches the spec.
