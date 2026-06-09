[[_TOC_]]

# Delete User

### Lambda: [project_id]-[env]-delete-user-func

## Description

- Cleanup lambda for hard-deleting users from `users`.
- Target rows are users that were soft-deleted and kept longer than retention.

## Environment

- `DELETE_USER_SOFT_DELETE_RETENTION_YEARS`
  - Number of years to keep soft-deleted users before hard delete.
  - Default: `1`.
  - Must be a positive integer; otherwise the default is used.

## Request

### Request example

```json
{}
```

### Request params

- No parameters required.
- The incoming event is ignored.

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

#### ES-001 - Internal Server Error

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

### Step 1: Calculate retention cutoff datetime

- Read `DELETE_USER_SOFT_DELETE_RETENTION_YEARS` from env.
- Compute cutoff as `now - retentionYears`.

### Step 2: Delete expired soft-deleted users

- Delete rows from table `users` via Prisma `user.deleteMany` where:
  - `delete_datetime IS NOT NULL`
  - `delete_datetime <= cutoffDatetime`

### Step 3: Log cleanup result

- Log `retentionYears`, `cutoffDatetime`, and `deletedCount`.

### Step 4: Return response success

## Sequence diagram

:::mermaid
sequenceDiagram
participant Trigger as Trigger/Event
participant Lambda as Lambda
participant PostgresDB as PostgresDB

    Trigger->>Lambda: Trigger cleanup lambda

    Note over Lambda: Step 1: Build cutoffDatetime from env retention years
    Lambda->>Lambda: cutoffDatetime = now - retentionYears

    Note over Lambda,PostgresDB: Step 2: Hard-delete expired soft-deleted users
    Lambda->>PostgresDB: DELETE FROM users<br/>WHERE delete_datetime IS NOT NULL<br/>AND delete_datetime <= cutoffDatetime
    PostgresDB-->>Lambda: deletedCount

    Note over Lambda: Step 3: Log cleanup summary
    Lambda->>Lambda: Log retentionYears, cutoffDatetime, deletedCount

    Note over Lambda: Step 4: Return success
    Lambda-->>Trigger: Success response (SC-001)

    Note over Lambda: Error handling
    alt Database/Unexpected error occurs
        Lambda-->>Trigger: Return error response (ES-001)
    end

:::
