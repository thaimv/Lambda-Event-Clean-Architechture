[[_TOC_]]

# JWT Authorizer

### Lambda: [project_id]-[env]-jwt-authorizer-func

## Description

- API Gateway **REQUEST** custom authorizer.
- Verifies Cognito **ID token** from the request and returns an IAM policy (`Allow` / throws `Unauthorized`).
- Signing keys are loaded from Valkey cache (`jwk-kid:{kid}`) with fallback to Cognito JWKS over HTTP.

## Environment

- `COGNITO_USER_POOL_ID`, `COGNITO_USER_POOL_CLIENT_ID`, `COGNITO_USER_POOL_REGION`
  - Used to validate JWT `iss`, `aud`, and `token_use`.
- `ELASTICACHE_*` (optional but recommended)
  - Valkey/ElastiCache connection for JWKS cache. Cache failures fall back to JWKS fetch.

## Request

### Trigger

`APIGatewayRequestAuthorizerEvent` — API Gateway passes `methodArn` and request headers when a protected route is called.

### Request example

```json
{
  "type": "REQUEST",
  "methodArn": "arn:aws:execute-api:eu-west-2:123456789012:abcdef/dev/GET/user",
  "headers": {
    "Cookie": "project_access_token=<cognito-id-token>"
  }
}
```

Alternative — Bearer header:

```json
{
  "type": "REQUEST",
  "methodArn": "arn:aws:execute-api:eu-west-2:123456789012:abcdef/dev/GET/user",
  "headers": {
    "Authorization": "Bearer <cognito-id-token>"
  }
}
```

### Request params

| Field       | Source                           | Required | Notes                                                                 |
| ----------- | -------------------------------- | -------- | --------------------------------------------------------------------- |
| `methodArn` | API Gateway event                | Yes      | Execute-API ARN of the route being authorized; echoed in IAM policy   |
| Token       | Cookie or `Authorization` header | Yes      | Cookie name: `project_access_token`; or `Authorization: Bearer <jwt>` |

Token extraction order: `headers.cookie` / `headers.Cookie` / `multiValueHeaders`, then `Authorization` Bearer.

## Response

### Success

Returns a raw **IAM policy document** (not `RESULT_CODE`):

```json
{
  "principalId": "",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow",
        "Resource": "arn:aws:execute-api:eu-west-2:123456789012:abcdef/dev/GET/user"
      }
    ]
  }
}
```

`Resource` matches the incoming `methodArn`.

### Error

Authorizer **throws** `Unauthorized` — API Gateway treats this as deny. On direct Lambda invoke, the SDK surfaces `FunctionError`.

| Condition                         | Behaviour                                     |
| --------------------------------- | --------------------------------------------- |
| Missing / empty token             | Throw `Unauthorized`                          |
| Missing `methodArn`               | Throw `Unauthorized` (validation failure)     |
| Invalid issuer / audience / use   | Throw `Unauthorized`                          |
| Invalid signature / key not found | Throw `Unauthorized`                          |
| Unexpected error                  | Throw `Unauthorized` (logged with error code) |

## Step handle

### Step 1: Extract token from request

- Read JWT from `project_access_token` cookie or `Authorization: Bearer` header via `getAccessTokenFromRequest`.

### Step 2: Validate request shape

- Zod schema: `token` (non-empty string), `methodArn` (non-empty string).

### Step 3: Verify JWT claims

- Parse header/payload; require `token_use === id`.
- `iss` must match Cognito User Pool issuer URL.
- `aud` must match `COGNITO_USER_POOL_CLIENT_ID`.

### Step 4: Verify signature

- Resolve signing key by `kid` — Valkey cache first, then Cognito JWKS.
- `jwt.verify` with resolved PEM.

### Step 5: Return Allow policy

- Build IAM policy with `Effect: Allow` and `Resource: methodArn`.

## Sequence diagram

:::mermaid
sequenceDiagram
participant APIGW as API Gateway
participant Lambda as jwt-authorizer
participant Valkey as Valkey/ElastiCache
participant Cognito as Cognito JWKS

    APIGW->>Lambda: REQUEST authorizer event (methodArn + headers)

    Note over Lambda: Step 1–2: Extract token, validate methodArn
    Lambda->>Lambda: Parse JWT header/payload

    Note over Lambda: Step 3: Check iss, aud, token_use
    Lambda->>Valkey: GET jwk-kid:{kid}
    alt Cache hit
        Valkey-->>Lambda: JWK
    else Cache miss
        Lambda->>Cognito: Fetch JWKS
        Cognito-->>Lambda: JWK
    end

    Note over Lambda: Step 4–5: Verify signature, return Allow policy
    Lambda-->>APIGW: IAM policy (Allow on methodArn)

    Note over Lambda: Error handling
    alt Token invalid or missing
        Lambda-->>APIGW: Throw Unauthorized (deny)
    end

:::

## E2E notes

- **Test runner auth**: none — `getEventTestApp()` invokes Lambda directly (no Cognito login for the runner).
- **Invoke target**: `JWT_AUTHORIZER_LAMBDA_ARN` — ARN of this Lambda (`arn:aws:lambda:...`).
- **Event `methodArn`**: Execute-API ARN (`arn:aws:execute-api:...`) inside the event payload. Not the Lambda ARN. E2E may use a synthetic ARN; the authorizer echoes it in `policyDocument.Statement[0].Resource`.
- **Happy path (S01/S02)**: requires a **real Cognito idToken in the event** — set `E2E_COGNITO_ID_TOKEN` or configure `TEST_USER_*` + pool/client for live login.
- **Deny paths (A/E)**: no Cognito needed — tests send missing/invalid tokens via `app.invoker.invoke()`.
