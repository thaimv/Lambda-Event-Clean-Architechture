/* eslint-disable max-lines-per-function */

import { LambdaLoggingPipe } from '@common/lambda/pipes/logging.pipe';
import { primaryLogger } from '@common/logger';
import type { LambdaExecutionInput, LambdaExecutionOutput } from '@common/types/lambda.type';
import { CryptoUtil } from '@common/utils/crypto.util';
import { jsonReplacerFn } from '@common/utils/sensitive-data.util';
import type { Context } from 'aws-lambda';
import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock logger
vi.mock('../../../../src/common/logger', () => ({
  logger: {
    addContext: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
  primaryLogger: {
    addContext: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LambdaLoggingPipe', () => {
  let loggingPipe: LambdaLoggingPipe<unknown, unknown>;
  let mockNext: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    loggingPipe = new LambdaLoggingPipe();
    mockNext = vi.fn();
  });

  const createPassable = (
    overrides: Partial<LambdaExecutionInput<unknown>> = {},
  ): LambdaExecutionInput<unknown> => ({
    input: { test: 'data' },
    context: {
      functionName: 'test-function',
      awsRequestId: 'test-request-id',
    } as Context,
    ...overrides,
  });

  const createOutput = <T>(
    data: T,
    code: string,
    message: string,
    error?: Error,
  ): LambdaExecutionOutput<T> => ({
    output: {
      result: {
        code,
        message,
      },
      data,
    },
    error,
  });

  describe('handle', () => {
    test('should add context to logger', async () => {
      const passable = createPassable();
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      expect(primaryLogger.addContext).toHaveBeenCalledWith(passable.context);
    });

    test('should call next and pass passable', async () => {
      const passable = createPassable();
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      expect(mockNext).toHaveBeenCalledWith(passable);
    });

    test('should log success with correct format when result is successful', async () => {
      const passable = createPassable();
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      expect(primaryLogger.info).toHaveBeenCalledWith(
        'Success',
        expect.objectContaining({
          apiName: 'test-function',
          input: { test: 'data' },
          result: {
            code: 'SC-001',
            status: 'Success',
            message: 'Success',
          },
          error: undefined,
        }),
      );
    });

    test('should log only user payload for API Gateway input', async () => {
      const passable = createPassable({
        input: {
          httpMethod: 'POST',
          path: '/identity-token',
          body: JSON.stringify({ idToken: 'token-value' }),
          headers: { cookie: 'access_token=secret' },
          requestContext: { identity: { sourceIp: '1.2.3.4' } },
        },
      });
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      const callArgs = (primaryLogger.info as Mock).mock.calls[0][1];
      expect(callArgs.input).toEqual({ body: { idToken: 'token-value' } });
      expect(callArgs.input).not.toHaveProperty('headers');
      expect(callArgs.input).not.toHaveProperty('requestContext');
    });

    test('should log full SQS event in input', async () => {
      const sqsInput = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'handle-1',
            body: JSON.stringify({ userId: '123' }),
            eventSource: 'aws:sqs',
          },
        ],
      };
      const passable = createPassable({ input: sqsInput });
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      const callArgs = (primaryLogger.info as Mock).mock.calls[0][1];
      expect(callArgs.input).toBe(sqsInput);
    });

    test('should log failure with error when error is present', async () => {
      const passable = createPassable();
      const testError = new Error('Test error');
      testError.stack = 'Error stack trace';
      const output: LambdaExecutionOutput<unknown> = {
        output: {
          result: {
            code: 'ES-051-001',
            message: 'Internal Server Error',
          },
          error: {
            error_message: 'Internal Server Error',
            error_detail: null,
          },
        },
        error: testError,
      };
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      expect(primaryLogger.info).toHaveBeenCalledWith(
        'Internal Server Error',
        expect.objectContaining({
          apiName: 'test-function',
          result: {
            code: 'ES-051-001',
            status: 'Failure',
            message: 'Internal Server Error',
          },
          output: {
            error_message: 'Internal Server Error',
            error_detail: null,
          },
          error: {
            message: 'Test error',
            trace: 'Error stack trace',
          },
        }),
      );
    });

    test('should return output from next', async () => {
      const passable = createPassable();
      const expectedOutput = createOutput({ result: 'success' }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(expectedOutput);

      const result = await loggingPipe.handle(passable, mockNext);

      expect(result).toBe(expectedOutput);
    });

    test('should handle empty data in output', async () => {
      const passable = createPassable();
      const output: LambdaExecutionOutput<unknown> = {
        output: {
          result: {
            code: 'SC-001',
            message: 'No Content',
          },
          data: undefined,
        },
      };
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      expect(primaryLogger.info).toHaveBeenCalledWith(
        'No Content',
        expect.objectContaining({
          apiName: 'test-function',
          result: {
            code: 'SC-001',
            status: 'Success',
            message: 'No Content',
          },
          error: undefined,
        }),
      );
    });

    test('should handle error without stack trace', async () => {
      const passable = createPassable();
      const testError = new Error('No stack');
      delete testError.stack;
      const output = createOutput(null, 'ES-051-001', 'Error', testError);
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      expect(primaryLogger.info).toHaveBeenCalledWith(
        'Error',
        expect.objectContaining({
          apiName: 'test-function',
          result: {
            code: 'ES-051-001',
            status: 'Failure',
            message: 'Error',
          },
          error: {
            message: 'No stack',
            trace: undefined,
          },
        }),
      );
    });

    test('should sanitize Cognito sub in input when logging', async () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const inputWithCognitoSub = {
        identity: {
          cognitoIdentityAuthProvider: `cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:${cognitoSub}`,
          username: 'test-user',
        },
        resourceId: '88d5fb8f-11bc-47b2-8812-d5da6caac820',
      };
      const passable = createPassable({ input: inputWithCognitoSub });
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      const callArgs = (primaryLogger.info as Mock).mock.calls[0][1];

      const sanitizedInput = JSON.stringify(callArgs.input, jsonReplacerFn);
      const hashedSub = CryptoUtil.hashString(cognitoSub, '');

      expect(sanitizedInput).toContain(hashedSub);
      expect(sanitizedInput).not.toContain(cognitoSub);
    });

    test('should sanitize Cognito sub in output when logging', async () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const passable = createPassable();
      const outputWithCognitoSub = createOutput({ filePath: cognitoSub }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(outputWithCognitoSub);

      await loggingPipe.handle(passable, mockNext);

      const callArgs = (primaryLogger.info as Mock).mock.calls[0][1];
      const sanitizedOutput = JSON.stringify(callArgs.output, jsonReplacerFn);

      expect(sanitizedOutput).not.toContain(cognitoSub);
    });

    test('should handle Cognito sub in nested array structures', async () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const inputWithNestedCognitoSub = {
        copies: [
          {
            srcS3FilePath: `riding_data/${cognitoSub}/file.json`,
          },
          {
            srcS3FilePath: 'riding_data/88d5fb8f-11bc-47b2-8812-d5da6caac820/file.json',
          },
        ],
      };
      const passable = createPassable({ input: inputWithNestedCognitoSub });
      const output = createOutput({ success: true }, 'SC-001', 'Success');
      mockNext.mockResolvedValue(output);

      await loggingPipe.handle(passable, mockNext);

      const callArgs = (primaryLogger.info as Mock).mock.calls[0][1];
      const sanitizedInput = JSON.stringify(callArgs.input, jsonReplacerFn);

      // srcS3FilePath is not configured for embedded sub sanitization
      expect(sanitizedInput).toContain(cognitoSub);
    });
  });
});
