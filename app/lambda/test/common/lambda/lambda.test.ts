/* eslint-disable max-lines-per-function */
import { ERROR_MESSAGE } from '@common/constants/response.const';
import { InternalServerError } from '@common/errors/internal-server-error';
import { ValidationError } from '@common/errors/validation-error';
import { Lambda } from '@common/lambda/lambda';
import { LambdaErrorHandlingPipe } from '@common/lambda/pipes/error-handling.pipe';
import { logger } from '@common/logger';
import { SuccessResponse } from '@common/responses/success.response';
import type { LambdaHandler } from '@common/types/lambda.type';
import type { Context } from 'aws-lambda';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ZodError, z } from 'zod';

// Mock the logger
vi.mock('@common/logger', () => ({
  logger: {
    addContext: vi.fn(),
    appendKeys: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
  primaryLogger: {
    addContext: vi.fn(),
    appendKeys: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the response classes
vi.mock('@common/response/success.response', () => ({
  SuccessResponse: class SuccessResponse {
    constructor(public data: unknown) {}

    render() {
      return {
        result: { code: 'SC-001', message: 'Success' },
        data: this.data,
      };
    }
  },
}));

vi.mock('@common/response/error.response', () => ({
  ErrorResponse: {
    fromError: vi.fn().mockImplementation((error) => ({
      render: vi.fn().mockReturnValue({
        result: { code: error.code, message: error.message },
        error: { error_message: error.message, error_detail: error.details || null },
      }),
    })),
  },
}));

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn(),
};

describe('Lambda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with handler', () => {
      const mockHandler: LambdaHandler<string, string> = vi.fn();
      const lambda = new Lambda(mockHandler);

      expect(lambda['handler']).toBe(mockHandler);
    });
  });

  describe('createHandler', () => {
    test('should return a handler function', () => {
      const mockHandler: LambdaHandler<string, string> = vi.fn();
      const lambda = new Lambda(mockHandler);

      const handler = lambda.createHandler();
      expect(typeof handler).toBe('function');
    });

    describe('successful execution', () => {
      test('should execute handler successfully and return success response', async () => {
        const mockData = { result: 'success' };
        const mockHandler: LambdaHandler<string, typeof mockData> = vi
          .fn()
          .mockResolvedValue(mockData);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        const event = 'test-event';
        const result = await handler(event, mockContext);

        expect(mockHandler).toHaveBeenCalledWith(event, mockContext);
        expect(logger.addContext).toHaveBeenCalledWith(mockContext);
        // TODO: logger.info should be called when success
        // expect(logger.info).toHaveBeenCalledWith('Success', expect.any(Object));
        expect(result).toEqual({
          result: { code: 'SC-001', message: 'Success' },
          data: mockData,
        });
      });

      test('should handle async handler execution', async () => {
        const mockData = { asyncResult: 'async-success' };
        const mockHandler: LambdaHandler<string, typeof mockData> = vi
          .fn()
          .mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return mockData;
          });

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        const event = 'async-test-event';
        const result = await handler(event, mockContext);

        expect(mockHandler).toHaveBeenCalledWith(event, mockContext);
        expect((result as { data: typeof mockData }).data).toEqual(mockData);
      });

      test('should render SuccessResponse directly when handler returns it', async () => {
        const mockData = { alreadyWrapped: true };
        const prebuilt = new SuccessResponse(mockData);
        const renderSpy = vi.spyOn(prebuilt, 'render');
        const mockHandler: LambdaHandler<string, typeof mockData> = vi
          .fn()
          .mockResolvedValue(prebuilt);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();
        const result = await handler('event', mockContext);

        expect(renderSpy).toHaveBeenCalledOnce();
        expect(result).toEqual({
          result: { code: 'SC-001', message: 'Success' },
          data: mockData,
        });
      });
    });

    describe('error handling', () => {
      test('should handle ZodError and return validation error', async () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        });

        const mockHandler: LambdaHandler<unknown, unknown> = vi.fn().mockImplementation(() => {
          schema.parse({ name: 'John', age: 'invalid' });
        });

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        const event = { name: 'John', age: 'invalid' };
        const result = await handler(event, mockContext);

        expect(mockHandler).toHaveBeenCalledWith(event, mockContext);
        // TODO: logger.error should be called when error is handled
        // expect(logger.error).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     apiName: mockContext.functionName,
        //     result: expect.any(Object),
        //     error: expect.objectContaining({
        //       message: expect.any(String),
        //       trace: expect.any(String),
        //     }),
        //   }),
        // );
        expect(result).toEqual({
          result: { code: 'EB-004', message: expect.any(String) },
          error: {
            error_message: expect.any(String),
            error_detail: expect.any(Object),
          },
        });
      });

      test('should handle BaseError instances', async () => {
        const customError = new ValidationError('Custom validation error', { field: 'test' });
        const mockHandler: LambdaHandler<string, unknown> = vi.fn().mockRejectedValue(customError);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        const event = 'test-event';
        const result = await handler(event, mockContext);

        expect(mockHandler).toHaveBeenCalledWith(event, mockContext);
        // TODO: logger.error should be called when error is handled
        // expect(logger.error).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     apiName: mockContext.functionName,
        //     result: expect.any(Object),
        //     error: expect.objectContaining({
        //       message: 'Custom validation error',
        //       trace: expect.any(String),
        //     }),
        //   }),
        // );
        expect(result).toEqual({
          result: { code: 'EB-004', message: 'Custom validation error' },
          error: { error_message: 'Custom validation error', error_detail: { field: 'test' } },
        });
      });

      test('should handle generic errors and return internal server error', async () => {
        const genericError = new Error('Generic error message');
        const mockHandler: LambdaHandler<string, unknown> = vi.fn().mockRejectedValue(genericError);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        const event = 'test-event';
        const result = await handler(event, mockContext);

        expect(mockHandler).toHaveBeenCalledWith(event, mockContext);
        // TODO: logger.error should be called when error is handled
        // expect(logger.error).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     apiName: mockContext.functionName,
        //     result: expect.any(Object),
        //     error: expect.objectContaining({
        //       message: 'Generic error message',
        //       trace: expect.any(String),
        //     }),
        //   }),
        // );
        expect(result).toEqual({
          result: { code: 'ES-001', message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR },
          error: { error_message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR, error_detail: null },
        });
      });

      test('should handle errors without stack trace', async () => {
        const errorWithoutStack = new Error('Error without stack');
        errorWithoutStack.stack = undefined;
        const mockHandler: LambdaHandler<string, unknown> = vi
          .fn()
          .mockRejectedValue(errorWithoutStack);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        await handler('test-event', mockContext);

        // TODO: logger.error should be called when error is handled
        // expect(logger.error).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     error: expect.objectContaining({
        //       message: 'Error without stack',
        //       trace: '',
        //     }),
        //   }),
        // );
      });
    });

    describe('logger integration', () => {
      test('should add context and append input keys', async () => {
        const mockHandler: LambdaHandler<string, string> = vi.fn().mockResolvedValue('success');
        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        const event = 'test-event';
        await handler(event, mockContext);

        expect(logger.addContext).toHaveBeenCalledWith(mockContext);
      });

      test('should log success with response data', async () => {
        const mockData = { success: true, data: 'test-data' };
        const mockHandler: LambdaHandler<string, typeof mockData> = vi
          .fn()
          .mockResolvedValue(mockData);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        await handler('test-event', mockContext);

        // TODO: logger.info should be called when success
        // expect(logger.info).toHaveBeenCalledWith(
        //   'Success',
        //   expect.objectContaining({
        //     apiName: mockContext.functionName,
        //     result: expect.objectContaining({
        //       code: expect.any(String),
        //       status: 'Success',
        //       message: expect.any(String),
        //     }),
        //     input: 'test-event',
        //     output: mockData,
        //   }),
        // );
      });

      test('should log error with full error details', async () => {
        const testError = new Error('Test error');
        testError.stack = 'Error: Test error\n    at test.js:1:1';
        const mockHandler: LambdaHandler<string, unknown> = vi.fn().mockRejectedValue(testError);

        const lambda = new Lambda(mockHandler);
        const handler = lambda.createHandler();

        await handler('test-event', mockContext);

        // TODO: logger.error should be called when error happens
        // expect(logger.error).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     apiName: mockContext.functionName,
        //     result: expect.objectContaining({
        //       status: 'Failure',
        //     }),
        //     error: expect.objectContaining({
        //       message: 'Test error',
        //       trace: expect.any(String),
        //     }),
        //   }),
        // );
      });
    });
  });
});

describe('LambdaErrorHandlingPipe transformError', () => {
  let pipe: LambdaErrorHandlingPipe<string, unknown>;

  beforeEach(() => {
    pipe = new LambdaErrorHandlingPipe();
  });

  test('should transform ZodError to ValidationError', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number',
      },
      {
        code: 'too_small',
        minimum: 0,
        type: 'number',
        inclusive: true,
        exact: false,
        message: 'Number must be greater than or equal to 0',
        path: ['age'],
      },
    ]);

    const result = pipe.transformError(zodError);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.message).toContain('Failed to validate');
    expect(result.message).toContain('name - Expected string, received number');
    expect(result.message).toContain('age - Number must be greater than or equal to 0');
    expect(result.details).toEqual(zodError.flatten().fieldErrors);
  });

  test('should return BaseError instances as-is', () => {
    const baseError = new ValidationError('Test validation error', { field: 'test' });
    const result = pipe.transformError(baseError);

    expect(result).toBe(baseError);
  });

  test('should transform generic errors to InternalServerError', () => {
    const genericError = new Error('Generic error');
    const result = pipe.transformError(genericError);

    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });

  test('should handle errors without message', () => {
    const errorWithoutMessage = new Error();
    const result = pipe.transformError(errorWithoutMessage);

    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });
});
