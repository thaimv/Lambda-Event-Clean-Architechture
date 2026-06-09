# delete-user

> Loaded when reviewing or developing the delete-user Lambda.

## Overview

- **Lambda**: `delete-user`
- **Trigger**: `APIGatewayProxyEvent`
- **Purpose**: Batch cleanup — permanently delete soft-deleted user records older than the retention period
- **Dependencies**: Prisma (Aurora via layer)

## Folder Structure

```
app/lambda/src/delete-user/
├── consts.ts
├── module.ts
├── index.ts
├── presenter/index.presenter.ts
├── repos/implements/user.repo.impl.ts
└── usecases/implements/delete-user.uc.impl.ts
```

Tests: `app/lambda/test/delete-user/`

## Key Flow

1. Presenter receives API Gateway event and delegates to the use case (no request body parsing).
2. `DeleteUserUseCase` computes a cutoff date from `DELETE_USER_SOFT_DELETE_RETENTION_YEARS` (env, default 1 year).
3. `UserRepo.deleteSoftDeletedUsersBefore(cutoff)` removes matching rows via Prisma.
4. Use case logs `deletedCount`, `cutoffDatetime`, and `retentionYears`.

## Business Rules

- Retention period is controlled by `DELETE_USER_SOFT_DELETE_RETENTION_YEARS` — only records soft-deleted before the cutoff are purged.
- Safe to invoke repeatedly (idempotent batch job).
- Do not expose internal DB errors in the HTTP response.

## Known Patterns / Notes

- Uses shared Prisma layer (`001_prepare-prisma-layer.sh`).
- Long timeout (15 min) in CDK for batch/heavy deletes if configured.
- Detail design: `document/detail-designs/lambdas/delete-user/index.md`
