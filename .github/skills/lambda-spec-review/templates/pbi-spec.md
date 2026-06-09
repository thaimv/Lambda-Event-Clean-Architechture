# PBI Information

PBI ID:
Title:
Platforms: Backend Lambda (LambdaEvents)

---

# 1. Main Objective (VERY IMPORTANT)

Describe EXACTLY ONE main change. Do not combine multiple unrelated feature changes.

Example:

- When API Gateway invokes `jwt-authorizer`, the Lambda must verify the Cognito ID token from the cookie and return an Allow IAM policy.

❌ Do not combine multiple unrelated features in a single PBI.
✅ Explain domain terms when they are not common (e.g., `kid` is the JWT header key ID used to look up the Cognito JWKS signing key).

---

# 2. Requirement Description

Break down expected behavior into small steps, similar to writing tasks for a junior developer.

Example:

- Trigger: `APIGatewayRequestAuthorizerEvent` on `jwt-authorizer`.
- Read JWT from cookie via `getAccessTokenFromRequest`.
- Validate issuer, audience, `token_use === id`, and signature against JWKS (cache in Valkey when available).
- Return Allow/Deny IAM policy for the requested `methodArn`.
- Clarify difficult domain terms directly in the spec.

---

# 3. Affected Scope

## 3.1 Lambda Functions

List affected folders under `app/lambda/src/` (not `common` or `config` unless infra-only).

Example:

- `jwt-authorizer`

## 3.2 Related Features

The higher-level feature this PBI belongs to. AI will load `brain/features/{feature-name}.md`.

Example:

- `api-auth` — JWT verification for protected API Gateway routes

## 3.3 Feature Relationship

- Type: [new Lambda / change existing Lambda / bug fix / infra-only]
- Affected Lambda: `delete-user` / `jwt-authorizer` / …
- Event source: API Gateway / SQS / SNS / Step Functions / …
- If sub-task: specify which step in the feature flow (see `brain/features/{name}.md`)

---

# 4. Constraints / Important Notes

Constraints that AI must not change on its own.

Example:

- Do not change ElastiCache TTL env vars without infra review.
- Backward compatible — existing authorizer behavior for valid tokens must not break.
- JWKS cache miss must fall back to Cognito (authorizer still works if Valkey is down).

---

# 5. References (Optional)

- Detail design under `document/detail-designs/lambdas/{name}/`
- Prisma schema (`app/lambda/layer/prisma/schema.prisma`) if DB changes
- CDK / env vars for new infrastructure

⚠️ Attach only documents that AI can actually access/read in the workspace.
Do not link external documents if AI cannot read their content.
