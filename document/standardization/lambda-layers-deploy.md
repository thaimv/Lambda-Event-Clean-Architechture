# Lambda Layers — Deploy Guide

Guide to build, publish, and attach Lambda layers for the `LambdaEvents` repo.

## Overview

This repo has 2 Lambda layers:

| Layer         | Directory                      | Used by                                       |
| ------------- | ------------------------------ | --------------------------------------------- |
| `prisma`      | `app/lambda/layer/prisma`      | Lambdas using Prisma (`delete-user`, …)       |
| `elasticache` | `app/lambda/layer/elasticache` | Lambdas using ValKey/Redis (`jwt-authorizer`) |

Layers hold heavy dependencies or native binaries. Lambda functions **do not** bundle these packages in the deploy zip — they are mounted at `/opt/nodejs/node_modules`.

**CI/CD:** The CD pipeline (`.github/workflows/cd.yml`) automatically publishes layers when the fingerprint changes via `cd-deploy-prisma-layer.yml` and `cd-deploy-elasticache-layer.yml`. You can deploy layers manually using the steps below when needed.

## Deploy flow

```
Build layer zip  →  PublishLayerVersion  →  Attach layer to Lambda  →  Deploy function code
```

Deploy the layer **before** or **independently** of function code. Publish a new layer only when dependencies change (Prisma schema, `@valkey/valkey-glide` version bump, …).

## Prerequisites

- Node.js 22.x (matches Lambda runtime)
- AWS CLI configured with credentials
- Docker (required when building `elasticache` on macOS/Windows)

## Step 1: Build layer zip

Run from the **repo root** `LambdaEvents`.

### Prisma layer

```bash
cd app/lambda/layer/prisma
./prepare-prisma.sh
```

Output: `app/lambda/layer/prisma/output.zip`

Zip structure:

```
nodejs/
  node_modules/
    @prisma/client/
    .prisma/
```

Generate Prisma client separately (if needed, before building the layer):

```bash
npx prisma generate
```

### ElastiCache (ValKey) layer

**On macOS or Windows** — use Docker to get the correct Linux binary for Lambda:

```bash
cd app/lambda/layer/elasticache
./prepare-elasticache-docker.sh
```

**On Linux or CI (Ubuntu):**

```bash
cd app/lambda/layer/elasticache
./prepare-elasticache.sh
```

Output: `app/lambda/layer/elasticache/output.zip`

Zip structure:

```
nodejs/
  node_modules/
    @valkey/valkey-glide/
    @valkey/valkey-glide-linux-x64-gnu/
```

## Step 2: Publish layer to AWS

### Option A — AWS Console

1. Open **AWS Lambda → Layers → Create layer**
2. **Name:** `prisma` or `elasticache`
3. **Upload:** the corresponding `output.zip` file
4. **Compatible runtimes:** `Node.js 22.x` (must match Lambda runtime)
5. **Compatible architectures:** `x86_64` (or `arm64` if Lambda uses Graviton)
6. Create

### Option B — AWS CLI

```bash
export AWS_REGION=ap-northeast-1   # change per environment

# Prisma
aws lambda publish-layer-version \
  --layer-name prisma \
  --zip-file fileb://app/lambda/layer/prisma/output.zip \
  --compatible-runtimes nodejs22.x \
  --compatible-architectures x86_64

# ElastiCache
aws lambda publish-layer-version \
  --layer-name elasticache \
  --zip-file fileb://app/lambda/layer/elasticache/output.zip \
  --compatible-runtimes nodejs22.x \
  --compatible-architectures x86_64
```

Response returns `LayerVersionArn`, for example:

```
arn:aws:lambda:ap-northeast-1:123456789012:layer:prisma:3
```

## Step 3: Attach layer to Lambda function

| Lambda module    | Required layers |
| ---------------- | --------------- |
| `delete-user`    | `prisma`        |
| `jwt-authorizer` | `elasticache`   |

### Console

1. **Lambda → select function → Configuration → Layers**
2. **Add a layer**
3. Select the layer and version you just published

### CLI

```bash
aws lambda update-function-configuration \
  --function-name YOUR_FUNCTION_NAME \
  --layers arn:aws:lambda:REGION:ACCOUNT:layer:prisma:VERSION
```

**Note:** The `--layers` flag **replaces the entire** current layer list. If the function already has other layers, pass all ARNs.

Verify attached layers:

```bash
aws lambda get-function-configuration \
  --function-name YOUR_FUNCTION_NAME \
  --query Layers
```

## Step 4: Deploy function code

After the layer is attached, deploy Lambda code as usual:

- **CI:** push to `develop` (→ `event-develop`) or `staging` / `master` (→ `event-staging`) → orchestrator `cd.yml`
- **Local:** `npm run build:lambdas` (or `build:all:lambdas`) then `aws lambda update-function-code`

The function code zip **does not** need to contain `@prisma/client` or `@valkey/valkey-glide` if the corresponding layer is attached.

## When to redeploy a layer?

| Change                                   | Redeploy layer?                                 |
| ---------------------------------------- | ----------------------------------------------- |
| Handler / business logic changes         | No                                              |
| `schema.prisma` or `@prisma/client` bump | Yes — `prisma`                                  |
| `@valkey/valkey-glide` bump              | Yes — `elasticache`                             |
| Lambda runtime change (e.g. 20 → 22)     | Yes — publish layer with new compatible runtime |
| Architecture change (x86_64 ↔ arm64)     | Yes — rebuild and publish with correct arch     |

## Technical notes

1. **Size limit:** unzipped layer max ~250 MB. Build scripts strip extra docs/test files.
2. **Runtime must match:** `compatible-runtimes` when publishing must match the Lambda function runtime.
3. **Architecture must match:** native binaries (Prisma engine, ValKey Glide) must be built for the Lambda architecture in use.
4. **ElastiCache on Mac:** always use `prepare-elasticache-docker.sh`; local builds often lack Linux binaries.
5. **Prisma binary targets:** `schema.prisma` configures `rhel-openssl-3.0.x` for Amazon Linux Lambda.
6. **Layer version retention:** CI (`cd-deploy-*-layer.yml`) deletes old layer versions after publish, keeping `KEEP_LAMBDA_VERSIONS` most recent (default `5`). Versions still referenced by a Lambda function version may fail to delete (logged as warning).

## Reference scripts

| Script                                                       | Purpose                                            |
| ------------------------------------------------------------ | -------------------------------------------------- |
| `app/lambda/layer/prisma/prepare-prisma.sh`                  | Build prisma layer zip                             |
| `app/lambda/layer/elasticache/prepare-elasticache.sh`        | Build elasticache layer (Linux)                    |
| `app/lambda/layer/elasticache/prepare-elasticache-docker.sh` | Build elasticache layer via Docker (macOS/Windows) |
| `deploy/scripts/005_delete-old-layer-versions.sh`            | Delete old published layer versions (CI)           |

More details on the elasticache layer: `app/lambda/layer/elasticache/README.md`
