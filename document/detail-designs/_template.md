[[_TOC_]]

# [Lambda Name]

> Generated from spec: `document/specs/[pbi-id].md`
> **Next step:** Run `/lambda-event-impl document/detail-designs/lambdas/[lambda-name]/index.md` to implement.

> **Tip**: Use `/lambda-event-design {document/specs/pbi-xxx.md}` to auto-generate this document from a PBI spec.

### Lambda: [project_id]-[env]-[lambda-folder-name]-func

## Description

- [Short description of what this Lambda does and when it runs]

## Environment

- No additional custom variables.

<!-- Or list env vars, e.g.:
- `ENV_VAR_NAME`
  - [Description]
  - Default: `[value]`
-->

## Request

### Request example

```json
{}
```

### Request params

- No parameters.

## Response

### Success

```json
{
  "result": {
    "code": "SC-001",
    "message": "Success"
  }
}
```

### Error

#### EB-004 — Validation failed

```json
{
  "result": {
    "code": "EB-004",
    "message": "Bad request."
  },
  "error": {
    "error_message": "[validation error detail]",
    "error_detail": null
  }
}
```

#### EB-001 — Unauthorized

```json
{
  "result": {
    "code": "EB-001",
    "message": "Unauthorized."
  },
  "error": {
    "error_message": "Unauthorized.",
    "error_detail": null
  }
}
```

#### EB-002 — Bad request

```json
{
  "result": {
    "code": "EB-002",
    "message": "Invalid input."
  },
  "error": {
    "error_message": "[business rule error detail]",
    "error_detail": null
  }
}
```

#### EB-003 — Not found

```json
{
  "result": {
    "code": "EB-003",
    "message": "Resource not found."
  },
  "error": {
    "error_message": "Resource not found.",
    "error_detail": null
  }
}
```

#### EB-009 — Resource already exists

```json
{
  "result": {
    "code": "EB-009",
    "message": "[resource] already exists."
  },
  "error": {
    "error_message": "[resource] already exists.",
    "error_detail": null
  }
}
```

#### ES-001 — Internal Server Error

```json
{
  "result": {
    "code": "ES-001",
    "message": "An unexpected error occurred."
  },
  "error": {
    "error_message": "An unexpected error occurred.",
    "error_detail": null
  }
}
```

## Step handle

### Step 1: [First step title]

- [Describe step 1]

### Step 2: [Main processing step title]

- [Describe the main business logic]

### Step N: Return response success

- [Describe final response]

## Sequence diagram

:::mermaid
sequenceDiagram
participant Trigger as Trigger/Event
participant Lambda as Lambda
participant DB as Database

    Trigger->>Lambda: [Event description]

    Note over Lambda: Step 1: [Step 1 description]
    Lambda->>Lambda: [Step 1 action]

    Note over Lambda,DB: Step 2: [Step 2 description]
    Lambda->>DB: [DB query]
    DB-->>Lambda: [Result]

    Note over Lambda: Step N: Return success
    Lambda-->>Trigger: Success response (SC-001)

    Note over Lambda: Error handling
    alt Database/Unexpected error occurs
        Lambda-->>Trigger: Return error response (ES-001)
    end

:::
