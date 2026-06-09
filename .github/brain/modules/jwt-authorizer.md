# jwt-authorizer

> Loaded when reviewing or developing the JWT authorizer Lambda.

## Overview

- **Lambda**: `jwt-authorizer`
- **Trigger**: `APIGatewayRequestAuthorizerEvent`
- **Purpose**: Verify Cognito ID token from cookie; return Allow/Deny IAM policy
- **Dependencies**: Valkey/ElastiCache (JWKS cache), Cognito JWKS HTTP, `@valkey/valkey-glide` via layer

## Folder Structure

```
app/lambda/src/jwt-authorizer/
├── consts.ts
├── module.ts
├── index.ts
├── presenter/index.presenter.ts
├── dtos/requests/
├── repos/implements/jwt-signing-key.repo.impl.ts
└── usecases/implements/verify-token.uc.impl.ts
```

Tests: `app/lambda/test/jwt-authorizer/`

## Key Flow

1. Presenter extracts token via `getAccessTokenFromRequest`.
2. `VerifyTokenUseCase` validates issuer, audience, `token_use`, signature.
3. `JwtSigningKeyRepo` loads signing key — Valkey cache key `jwk-kid:{kid}`, fallback to Cognito JWKS.
4. Returns IAM policy Allow/Deny.

## Business Rules

- Only `token_use === id` tokens accepted.
- Issuer must match `COGNITO_USER_POOL_ID` region URL.
- Audience must match `COGNITO_USER_POOL_CLIENT_ID`.
- Cache failures must not block auth — fall back to JWKS fetch.

## Known Patterns / Notes

- `@valkey/valkey-glide` loaded from ElastiCache layer (not bundled in function zip).
- Requires `ELASTICACHE_*` env vars when cache is enabled.
