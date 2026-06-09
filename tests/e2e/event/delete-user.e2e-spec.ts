/* eslint-disable max-lines-per-function */
import { randomUUID } from 'node:crypto';

import { cloudwatchConfig, e2eHookTimeouts, lambdaConfig } from '@e2e/config';
import { getEventTestApp } from '@e2e/helpers/event-test-app';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

/**
 * Black-box E2E Test Suite for delete-user
 *
 * Spec: document/detail-designs/lambdas/delete-user/index.md
 * Trigger: APIGatewayProxyEvent (event body is ignored)
 *
 * Business Logic:
 *   1. Compute cutoff datetime from DELETE_USER_SOFT_DELETE_RETENTION_YEARS (default 1 year)
 *   2. Hard-delete users where delete_datetime IS NOT NULL and delete_datetime <= cutoff
 *   3. Return SC-001
 *
 * Error Conditions (RESULT_CODE):
 *   - ES-001: unexpected server error (DB/infra) — not black-box testable; covered by unit tests
 */

/** Must match DELETE_USER_SOFT_DELETE_RETENTION_YEARS on the deployed Lambda. */
const RETENTION_YEARS = 1;

const VALID_EVENT = {};

function getRetentionCutoffDatetime(): Date {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  return cutoff;
}

function buildSoftDeletedUserData(cognitoSub: string, deleteDatetime: Date) {
  return {
    cognitoSub,
    userNickname: `e2e-delete-user-${cognitoSub.slice(0, 8)}`,
    createAuthor: 'e2e-test',
    updateAuthor: 'e2e-test',
    deleteDatetime,
    deleteAuthor: 'e2e-test',
  };
}

function buildActiveUserData(cognitoSub: string) {
  return {
    cognitoSub,
    userNickname: `e2e-delete-user-${cognitoSub.slice(0, 8)}`,
    createAuthor: 'e2e-test',
    updateAuthor: 'e2e-test',
  };
}

describe('delete-user - E2E (Black-box)', () => {
  const app = getEventTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.deleteUser],
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate();
  }, e2eHookTimeouts.afterAll);

  // =========================================================
  // S: Functional - Happy Path
  // =========================================================
  describe('Functional - Happy Path', () => {
    test('S01: should return SC-001 and hard-delete expired soft-deleted users', async () => {
      // Arrange — soft-deleted well before retention cutoff
      const cognitoSub = randomUUID();
      const cutoff = getRetentionCutoffDatetime();
      const expiredDeleteDatetime = new Date(cutoff);
      expiredDeleteDatetime.setDate(expiredDeleteDatetime.getDate() - 30);

      await app.db.client.user.create({
        data: buildSoftDeletedUserData(cognitoSub, expiredDeleteDatetime),
      });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);

      // Assert — response
      expect(result.statusCode).toBe(200);
      expect(result.result?.code).toBe('SC-001');

      // Assert — eligible row removed from DB
      const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
      expect(row).toBeNull();
    });

    test('S02: should return SC-001 and preserve recently soft-deleted users within retention', async () => {
      // Arrange — soft-deleted after cutoff (still within retention window)
      const cognitoSub = randomUUID();
      const recentDeleteDatetime = new Date();

      await app.db.client.user.create({
        data: buildSoftDeletedUserData(cognitoSub, recentDeleteDatetime),
      });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);

      // Assert — response
      expect(result.statusCode).toBe(200);
      expect(result.result?.code).toBe('SC-001');

      // Assert — row still present
      const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
      expect(row).not.toBeNull();
      expect(row?.deleteDatetime).not.toBeNull();
    });

    test('S03: should return SC-001 and preserve active users without delete_datetime', async () => {
      // Arrange
      const cognitoSub = randomUUID();

      await app.db.client.user.create({
        data: buildActiveUserData(cognitoSub),
      });

      // Act
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);

      // Assert — response
      expect(result.statusCode).toBe(200);
      expect(result.result?.code).toBe('SC-001');

      // Assert — active row unchanged
      const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
      expect(row).not.toBeNull();
      expect(row?.deleteDatetime).toBeNull();
    });
  });

  // =========================================================
  // ST: State Transition
  // =========================================================
  describe('State Transition', () => {
    test('ST01: should delete only eligible rows and succeed on repeated invocation', async () => {
      // Arrange — one expired soft-deleted, one recent soft-deleted, one active
      const expiredSub = randomUUID();
      const recentSub = randomUUID();
      const activeSub = randomUUID();
      const cutoff = getRetentionCutoffDatetime();
      const expiredDeleteDatetime = new Date(cutoff);
      expiredDeleteDatetime.setDate(expiredDeleteDatetime.getDate() - 1);

      await app.db.client.user.createMany({
        data: [
          buildSoftDeletedUserData(expiredSub, expiredDeleteDatetime),
          buildSoftDeletedUserData(recentSub, new Date()),
          buildActiveUserData(activeSub),
        ],
      });

      // Act — first cleanup pass
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);
      expect(result.result?.code).toBe('SC-001');

      // Assert — only expired soft-deleted row removed
      expect(await app.db.client.user.findUnique({ where: { cognitoSub: expiredSub } })).toBeNull();
      expect(
        await app.db.client.user.findUnique({ where: { cognitoSub: recentSub } }),
      ).not.toBeNull();
      expect(
        await app.db.client.user.findUnique({ where: { cognitoSub: activeSub } }),
      ).not.toBeNull();

      // Act — second pass with no eligible rows left
      const result2 = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);

      // Assert — idempotent success, remaining rows untouched
      expect(result2.statusCode).toBe(200);
      expect(result2.result?.code).toBe('SC-001');
      expect(
        await app.db.client.user.findUnique({ where: { cognitoSub: recentSub } }),
      ).not.toBeNull();
      expect(
        await app.db.client.user.findUnique({ where: { cognitoSub: activeSub } }),
      ).not.toBeNull();
    });
  });

  // =========================================================
  // N: Null / Optional Fields (event is ignored)
  // =========================================================
  describe('Null / Optional Fields', () => {
    test('N01: should return SC-001 when event contains ignored payload fields', async () => {
      // Arrange — arbitrary event shape; Lambda ignores the body
      const event = {
        body: JSON.stringify({ unexpectedField: 'ignored' }),
        headers: { 'X-Custom': 'test' },
      };

      // Act
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.result?.code).toBe('SC-001');
    });
  });

  // =========================================================
  // I: Idempotency
  // =========================================================
  describe('Idempotency', () => {
    test('I01: should return SC-001 when invoked twice with identical event', async () => {
      // Arrange — eligible row so first invocation performs work
      const cognitoSub = randomUUID();
      const cutoff = getRetentionCutoffDatetime();
      const expiredDeleteDatetime = new Date(cutoff);
      expiredDeleteDatetime.setFullYear(expiredDeleteDatetime.getFullYear() - 1);

      await app.db.client.user.create({
        data: buildSoftDeletedUserData(cognitoSub, expiredDeleteDatetime),
      });

      // Act
      await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);
      const result = await app.invoker.invoke(lambdaConfig.deleteUser, VALID_EVENT);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.result?.code).toBe('SC-001');
      expect(await app.db.client.user.findUnique({ where: { cognitoSub } })).toBeNull();
    });
  });
});
