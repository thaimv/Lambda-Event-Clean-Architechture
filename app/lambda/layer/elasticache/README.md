# ElastiCache Lambda Layer

Lambda layer that bundles ValKey/Redis client libraries for **`jwt-authorizer`**. The function bundle externalizes `@valkey/valkey-glide` and loads it from this layer at runtime (`deploy/scripts/bundle.js`).

## Contents

| Package                              | Used by `jwt-authorizer`                          |
| ------------------------------------ | ------------------------------------------------- |
| `@valkey/valkey-glide`               | Yes — primary client                              |
| `@valkey/valkey-glide-linux-x64-gnu` | Yes — native binary for Lambda (Linux x64, glibc) |

## Platform support

- OS: Linux (Amazon Linux 2)
- Architecture: x64
- libc: glibc (GNU)

On macOS/Windows, use Docker build so the Linux native binary is included:

```bash
npm run build:docker
```

## Lambda consumer

| Lambda           | Layer         | Purpose                                               |
| ---------------- | ------------- | ----------------------------------------------------- |
| `jwt-authorizer` | `elasticache` | Cache Cognito JWKS signing keys in ValKey/ElastiCache |

CI attaches this layer automatically via `.github/workflows/cd-deploy-elasticache-layer.yml`. See `document/standardization/lambda-layers-deploy.md` for manual deploy steps.

## Runtime usage (`jwt-authorizer`)

Flow on each token verification:

1. `JwtSigningKeyRepo.getSigningKey(kid)` reads ValKey key `jwk-kid:{kid}`.
2. On cache miss, fetch JWKS from Cognito and write all keys back to ValKey.
3. If ValKey is unavailable, log a warning and fall back to Cognito JWKS (authorizer still works).

Client selection (`ElastiCacheCacheDatasource.getClient()`):

- `ELASTICACHE_CLUSTER_MODE=false` → `GlideClient` (single node / serverless)
- `ELASTICACHE_CLUSTER_MODE=true` → `GlideClusterClient` with `readFrom: 'preferReplica'`

## Environment variables

Set these on the **`jwt-authorizer`** Lambda (not on the layer itself). Source of truth: `app/lambda/src/jwt-authorizer/.env.example` and `app/lambda/src/config/app.config.ts`.

| Variable                            | Required | Default | Description                               |
| ----------------------------------- | -------- | ------- | ----------------------------------------- |
| `ELASTICACHE_HOST`                  | Yes      | —       | ValKey/ElastiCache cluster endpoint       |
| `ELASTICACHE_PORT`                  | Yes      | —       | Port (typically `6379`)                   |
| `ELASTICACHE_TTL`                   | No       | `86400` | Cache TTL in seconds                      |
| `ELASTICACHE_SLIDING_EXPIRATION`    | No       | `true`  | Refresh TTL on read (`GETEX`) when `true` |
| `ELASTICACHE_USE_TLS`               | No       | `true`  | Enable TLS for ValKey connection          |
| `ELASTICACHE_CLUSTER_MODE`          | No       | `false` | Use cluster client when `true`            |
| `ELASTICACHE_REQUEST_TIMEOUT_MS`    | No       | `15000` | Request timeout in milliseconds           |
| `ELASTICACHE_CONNECTION_TIMEOUT_MS` | No       | `15000` | Connection timeout in milliseconds        |

Example (AWS Lambda / simulator):

```bash
ELASTICACHE_HOST=your-cluster.xxxxx.cache.amazonaws.com
ELASTICACHE_PORT=6379
ELASTICACHE_TTL=86400
ELASTICACHE_SLIDING_EXPIRATION=true
ELASTICACHE_USE_TLS=true
ELASTICACHE_CLUSTER_MODE=false
ELASTICACHE_REQUEST_TIMEOUT_MS=15000
ELASTICACHE_CONNECTION_TIMEOUT_MS=15000
```

## Cache keys

| Key pattern     | Value                              | Set by              |
| --------------- | ---------------------------------- | ------------------- |
| `jwk-kid:{kid}` | JSON signing key from Cognito JWKS | `JwtSigningKeyRepo` |

## Building the layer

From repository root:

```bash
# Linux (CI / Amazon Linux)
bash app/lambda/layer/elasticache/prepare-elasticache.sh

# macOS / Windows (recommended)
bash app/lambda/layer/elasticache/prepare-elasticache-docker.sh
```

Or from this directory:

```bash
cd app/lambda/layer/elasticache
npm run build          # Linux native
npm run build:docker   # Docker (cross-platform)
```

Output: `app/lambda/layer/elasticache/output.zip`

CI wrapper: `deploy/scripts/002_prepare-elasticache-layer.sh` → `layers/elasticache/elasticache-layer.zip`

## Verifying cache in production

Check CloudWatch Logs for `jwt-authorizer`:

- `JWK found in cache for kid: ...` — cache hit
- `JWK not found in cache for kid: ...` — cache miss (first request or expired key)
- `Valkey cache unavailable, skipping cache read/write` — ValKey unreachable (check env, VPC, security groups, TLS)

## Related docs

- `app/lambda/src/jwt-authorizer/.env.example` — Lambda env template
- `document/standardization/lambda-layers-deploy.md` — publish and attach layer
- `out/simulator/env.yml` — local simulator env (`ELASTICACHE_HOST: localhost`)
