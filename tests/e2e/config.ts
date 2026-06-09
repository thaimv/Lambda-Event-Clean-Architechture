import { config } from 'dotenv';

config({ path: './envs/.env.e2e' });

export const awsConfig = {
  region: process.env.AWS_REGION ?? 'eu-west-2',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
};

export const cloudwatchConfig = {
  logFlushWait: Number(process.env.CLOUDWATCH_LOG_FLUSH_WAIT) || 20,
  logGroupArns: {
    deleteUser: process.env.DELETE_USER_LAMBDA_LOG_GROUP_ARN ?? '',
    jwtAuthorizer: process.env.JWT_AUTHORIZER_LAMBDA_LOG_GROUP_ARN ?? '',
  },
};

export const lambdaConfig = {
  deleteUser: process.env.DELETE_USER_LAMBDA_ARN ?? '',
  jwtAuthorizer: process.env.JWT_AUTHORIZER_LAMBDA_ARN ?? '',
};

export const cognitoConfig = {
  region: process.env.AWS_REGION ?? 'eu-west-2',
  userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
  clientId: process.env.COGNITO_CLIENT_ID ?? '',
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID ?? '',
};

export const testUserConfig = {
  username: process.env.TEST_USER_USERNAME ?? '',
  password: process.env.TEST_USER_PASSWORD ?? '',
};

export const graphqlConfig = {
  endpoint: process.env.GRAPHQL_ENDPOINT ?? '',
};

export const restApiConfig = {
  publicApi: process.env.PUBLIC_API_BASE_URL ?? '',
  authApi: process.env.AUTH_API_BASE_URL ?? '',
};

/**
 * Vitest hook timeouts for E2E suites.
 * afterAll must exceed `logFlushWait` (seconds) — terminate() sleeps that long before log assertions.
 */
export const e2eHookTimeouts = {
  beforeAll: 60_000,
  afterAll: Math.max(60_000, (cloudwatchConfig.logFlushWait + 10) * 1000),
} as const;
