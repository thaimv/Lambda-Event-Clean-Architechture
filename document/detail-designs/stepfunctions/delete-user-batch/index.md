[[_TOC_]]

# Delete User Batch Step Function

## 1. Description

This Step Function runs the `delete-user` Lambda as a scheduled batch job.
The Lambda permanently removes soft-deleted users from `user_information` when their soft-delete date is older than the configured retention period.

The workflow invokes the Lambda once, validates the Lambda response code, and completes or fails accordingly.

## 2. Workflow Diagram

::: mermaid
graph TD
A[Start] --> B["DeleteUser (Lambda invoke)"]
B --> C{CheckDeleteUserResult}
C -->|result.code = SC-001| D[Success]
C -->|other| E[TaskFailed]
D --> F((End))
E --> F
:::

## 3. Request and response

### Request

No input fields are required. The Lambda ignores the event payload and derives the retention cutoff from environment configuration.

```json
{}
```

| Field | Type | Required | Description         |
| ----- | ---- | -------- | ------------------- |
| —     | —    | —        | No input parameters |

### Response

#### Success response

When the Lambda returns `result.code = 'SC-001'`, the Step Function ends in the `Success` state.

```json
{
  "result": {
    "code": "SC-001"
  },
  "data": null
}
```

#### Failure response

If the Lambda returns any code other than `SC-001` (for example `ES-001` on internal error), the Step Function transitions to `TaskFailed` and the execution fails with:

- **Error**: `TaskError`
- **Cause**: `Failed to delete user batch: <resultCode>`

## 4. States Description

### 4.1. DeleteUser

- **Type**: `Task`
- **Resource**: `arn:aws:states:::lambda:invoke`
- **Description**: Invokes the `delete-user` Lambda function.
- **Arguments**:
  - `FunctionName`: `arn:aws:lambda:__REGION__:__ACCOUNT_ID__:function:__LAMBDA_DELETE_USER__:$LATEST`
  - `Payload.input`: Step Function input (`{% $states.input %}`)
- **Assign**: Stores the Lambda response code (`{% $states.result.Payload.result.code %}`) as `resultCode`
- **Next**: `CheckDeleteUserResult`

### 4.2. CheckDeleteUserResult

- **Type**: `Choice`
- **Description**: Validates the Lambda response and routes to success or failure.
- **Choices**:
  - If `resultCode = 'SC-001'` → `Success`
- **Default**: `TaskFailed`

### 4.3. Success

- **Type**: `Succeed`
- **Description**: Terminal state for a successful batch delete run.

### 4.4. TaskFailed

- **Type**: `Fail`
- **Description**: Terminal state when the Lambda response is not successful.
- **Error**: `TaskError`
- **Cause**: `Failed to delete user batch: {% $resultCode %}`

## 5. Configuration

| Setting             | Value                                                        |
| ------------------- | ------------------------------------------------------------ |
| Workflow definition | `app/stepfunction/workflows/delete-user-batch/workflow.json` |
| State machine name  | `delete-user-batch`                                          |
| Timeout             | 900 seconds                                                  |
| Query language      | JSONata                                                      |

### Lambda placeholder

| Placeholder              | Config key    | GitHub Environment var             |
| ------------------------ | ------------- | ---------------------------------- |
| `__LAMBDA_DELETE_USER__` | `delete-user` | `LAMBDA_FUNCTION_DELETE_USER_NAME` |

### CD config (GitHub Environment vars)

| Var                                    | Example                                       |
| -------------------------------------- | --------------------------------------------- |
| `STEP_FUNCTION_DELETE_USER_BATCH_NAME` | `delete-user-batch`                           |
| `LAMBDA_FUNCTION_DELETE_USER_NAME`     | AWS Lambda function name for `delete-user`    |
| `AWS_ACCOUNT_ID`, `AWS_REGION`         | Used to render `__ACCOUNT_ID__`, `__REGION__` |

Workflow definition path is fixed in `cd.yml` → `app/stepfunction/workflows/delete-user-batch/workflow.json`.

## 6. Related Lambda

| Lambda        | Path                         | Description                                                                  |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `delete-user` | `app/lambda/src/delete-user` | Deletes soft-deleted users past the retention period from `user_information` |

Retention is controlled by the `DELETE_USER_SOFT_DELETE_RETENTION_YEARS` environment variable (default: 1 year).
