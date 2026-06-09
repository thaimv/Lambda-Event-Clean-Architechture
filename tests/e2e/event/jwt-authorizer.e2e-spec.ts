/* eslint-disable max-lines-per-function */

import {
  cloudwatchConfig,
  cognitoConfig,
  e2eHookTimeouts,
  lambdaConfig,
  testUserConfig,
} from '@e2e/config';
import { CognitoAuth } from '@e2e/helpers/cognito-auth';
import { getEventTestApp } from '@e2e/helpers/event-test-app';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

/**
 * Black-box E2E Test Suite for jwt-authorizer
 *
 * Spec: document/detail-designs/lambdas/jwt-authorizer/index.md
 * Trigger: APIGatewayRequestAuthorizerEvent
 *
 * Auth for the test runner: none — uses getEventTestApp() (direct Lambda invoke).
 * Auth for S01/S02 only: a real Cognito idToken must appear in the event payload
 * (via E2E_COGNITO_ID_TOKEN or TEST_USER_* login). A/E tests use dummy tokens.
 *
 * DB: none — skip DB assertions.
 */

/** Synthetic execute-api ARN for the authorizer event — not the Lambda ARN (see design doc E2E notes). */
const MOCK_METHOD_ARN = 'arn:aws:execute-api:eu-west-2:000000000000:apiid/dev/GET/mock';

/** Dummy JWT for deny-path tests — signature verification is not expected to pass. */
const INVALID_JWT = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ0ZXN0In0.invalid-signature';

type AuthorizerHeader = 'cookie' | 'bearer' | 'none';

function isPlaceholderValue(value: string): boolean {
  return /x{3,}|your-|example\.com/i.test(value);
}

function canResolveHappyPathToken(): boolean {
  if (process.env.E2E_COGNITO_ID_TOKEN) {
    return true;
  }
  const { userPoolId, clientId } = cognitoConfig;
  const { username, password } = testUserConfig;
  return Boolean(
    userPoolId &&
    clientId &&
    username &&
    password &&
    !isPlaceholderValue(clientId) &&
    !isPlaceholderValue(userPoolId),
  );
}

async function resolveValidIdToken(): Promise<string> {
  if (process.env.E2E_COGNITO_ID_TOKEN) {
    return process.env.E2E_COGNITO_ID_TOKEN;
  }
  const auth = new CognitoAuth(cognitoConfig);
  return auth.getIdToken(testUserConfig.username, testUserConfig.password);
}

function buildAuthorizerEvent(options: {
  idToken?: string;
  methodArn?: string;
  header?: AuthorizerHeader;
}) {
  const methodArn = options.methodArn ?? MOCK_METHOD_ARN;
  const header = options.header ?? 'cookie';

  if (header === 'none' || !options.idToken) {
    return { type: 'REQUEST', methodArn, headers: {} };
  }

  if (header === 'bearer') {
    return {
      type: 'REQUEST',
      methodArn,
      headers: { Authorization: `Bearer ${options.idToken}` },
    };
  }

  return {
    type: 'REQUEST',
    methodArn,
    headers: { Cookie: `project_access_token=${options.idToken}` },
  };
}

describe('jwt-authorizer - E2E (Black-box)', () => {
  const app = getEventTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.jwtAuthorizer].filter(Boolean),
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate();
  }, e2eHookTimeouts.afterAll);

  // =========================================================
  // S: Functional - Happy Path (requires real Cognito idToken in event)
  // =========================================================
  describe.skipIf(!canResolveHappyPathToken())('Functional - Happy Path', () => {
    let validIdToken: string;

    beforeAll(async () => {
      validIdToken = await resolveValidIdToken();
    });

    test('S01: should return Allow policy when valid idToken is sent via cookie', async () => {
      // Arrange
      const event = buildAuthorizerEvent({ idToken: validIdToken });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.jwtAuthorizer, event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.functionError).toBeUndefined();
      expect(result.authorizer?.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(result.authorizer?.policyDocument.Statement[0].Resource).toBe(MOCK_METHOD_ARN);
    });

    test('S02: should return Allow policy when valid idToken is sent via Authorization bearer', async () => {
      // Arrange
      const event = buildAuthorizerEvent({ idToken: validIdToken, header: 'bearer' });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.jwtAuthorizer, event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.functionError).toBeUndefined();
      expect(result.authorizer?.policyDocument.Statement[0].Effect).toBe('Allow');
    });
  });

  // =========================================================
  // A: Authorization / Security (no Cognito login needed)
  // =========================================================
  describe('Authorization', () => {
    test('A01: should reject invocation when token is missing', async () => {
      // Arrange
      const event = buildAuthorizerEvent({ header: 'none' });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.jwtAuthorizer, event);

      // Assert — authorizer throws Unauthorized
      expect(result.statusCode).toBe(200);
      expect(result.functionError).toBeDefined();
      expect(result.authorizer).toBeUndefined();
    });

    test('A02: should reject invocation when token signature is invalid', async () => {
      // Arrange
      const event = buildAuthorizerEvent({ idToken: INVALID_JWT });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.jwtAuthorizer, event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.functionError).toBeDefined();
      expect(result.authorizer).toBeUndefined();
    });
  });

  // =========================================================
  // E: Negative - Error Handling (no Cognito login needed)
  // =========================================================
  describe('Negative - Error Handling', () => {
    test('E01: should reject invocation when methodArn is missing', async () => {
      // Arrange — token present but methodArn omitted; Zod fails before signature check
      const event = {
        type: 'REQUEST',
        headers: { Cookie: `project_access_token=${INVALID_JWT}` },
      };

      // Act
      const result = await app.invoker.invoke(lambdaConfig.jwtAuthorizer, event);

      // Assert — ValidationError → Unauthorized throw
      expect(result.statusCode).toBe(200);
      expect(result.functionError).toBeDefined();
      expect(result.authorizer).toBeUndefined();
    });
  });
});
