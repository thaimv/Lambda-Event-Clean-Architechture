# {lambda-name}

> Loaded when reviewing or developing this Lambda function.

## Overview

- **Lambda**: `{lambda-name}`
- **Trigger**: `{APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSEvent | ...}`
- **Purpose**: {one-line description}
- **Dependencies**: {datasources / layers — e.g. Prisma layer, ElastiCache layer}

## Folder Structure

```
app/lambda/src/{lambda-name}/
├── consts.ts
├── module.ts
├── index.ts
├── presenter/index.presenter.ts
├── dtos/requests/
├── repos/implements/
└── usecases/implements/
```

Tests: `app/lambda/test/{lambda-name}/`

## Key Flow

1. {Presenter step}
2. {Use case step}
3. {Repository / external step}

## Business Rules

- {Key rule 1}
- {Key rule 2}

## Known Patterns / Notes

- {Lambda-specific quirks, env vars, layers}
