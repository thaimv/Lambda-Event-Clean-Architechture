# Environment files

| File               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `.env.e2e.example` | Template for E2E tests — copy and fill in values  |
| `.env.e2e`         | Your local E2E values (do **not** commit secrets) |

## Quick start

```bash
cp envs/.env.e2e.example envs/.env.e2e
# Fill in AWS credentials and ARNs, then:
npm run test:e2e
```

## Variables

| Variable                              | Required                   | Description                                                    |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| `AWS_REGION`                          | Yes                        | AWS region where Lambdas are deployed                          |
| `AWS_ACCESS_KEY_ID`                   | Yes                        | IAM key — needs `lambda:InvokeFunction` + `logs:StartLiveTail` |
| `AWS_SECRET_ACCESS_KEY`               | Yes                        | IAM secret                                                     |
| `AWS_SESSION_TOKEN`                   | No                         | Required when using temporary credentials (SSO, assumed role)  |
| `DELETE_USER_LAMBDA_ARN`              | Yes (delete-user tests)    | Full ARN of the deployed delete-user Lambda                    |
| `JWT_AUTHORIZER_LAMBDA_ARN`           | Yes (jwt-authorizer tests) | Full ARN of the deployed jwt-authorizer Lambda                 |
| `DELETE_USER_LAMBDA_LOG_GROUP_ARN`    | Yes (delete-user tests)    | CloudWatch log group ARN for delete-user                       |
| `JWT_AUTHORIZER_LAMBDA_LOG_GROUP_ARN` | Yes (jwt-authorizer tests) | CloudWatch log group ARN for jwt-authorizer                    |
| `CLOUDWATCH_LOG_FLUSH_WAIT`           | No                         | Seconds to wait for logs to flush (default: 20)                |

## IAM permissions required

The IAM user / role must have:

```json
{
  "Effect": "Allow",
  "Action": ["lambda:InvokeFunction", "logs:StartLiveTail"],
  "Resource": "*"
}
```

> Unit tests (`npm run test:ci`) do **not** use `envs/.env.e2e` — they use mocks only.
