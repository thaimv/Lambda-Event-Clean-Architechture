import { ERROR_MESSAGE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';
import { InternalServerError } from '@common/errors/internal-server-error';
import { ValidationError } from '@common/errors/validation-error';
import { LambdaErrorHandlingPipe } from '@common/lambda/pipes/error-handling.pipe';
import type { LambdaExecutionInput, LambdaExecutionOutput } from '@common/types/lambda.type';
import type { Context } from 'aws-lambda';
import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ZodError } from 'zod';
import { z } from 'zod';

describe('LambdaErrorHandlingPipe', () => {
  let errorHandlingPipe: LambdaErrorHandlingPipe<unknown, unknown>;
  let mockNext: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandlingPipe = new LambdaErrorHandlingPipe();
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

  describe('handle - success path', () => {
    test('should pass through when no error occurs', async () => {
      const passable = createPassable();
      const expectedOutput: LambdaExecutionOutput<unknown> = {
        output: {
          result: { code: '200', message: 'Success' },
          data: { success: true },
        },
      };
      mockNext.mockResolvedValue(expectedOutput);

      const result = await errorHandlingPipe.handle(passable, mockNext);

      expect(mockNext).toHaveBeenCalledWith(passable);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('handle - error path', () => {
    test('should catch and transform generic Error', async () => {
      const passable = createPassable();
      const error = new Error('Something went wrong');
      mockNext.mockRejectedValue(error);

      const result = await errorHandlingPipe.handle(passable, mockNext);

      expect(result.error).toBe(error);
      expect(result.output).toBeDefined();
    });

    test('should catch and transform BaseError', async () => {
      const passable = createPassable();
      const error = new BaseError('Custom error message', 'CUSTOM_ERROR', 403);
      mockNext.mockRejectedValue(error);

      const result = await errorHandlingPipe.handle(passable, mockNext);

      expect(result.error).toBe(error);
      expect(result.output).toBeDefined();
    });

    test('should catch and transform ZodError', async () => {
      const passable = createPassable();
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      let zodError: ZodError | null = null;
      try {
        schema.parse({ name: 123, age: 'invalid' });
      } catch (e) {
        zodError = e as ZodError;
      }

      mockNext.mockRejectedValue(zodError);

      const result = await errorHandlingPipe.handle(passable, mockNext);

      expect(result.error).toBe(zodError);
      expect(result.output).toBeDefined();
    });
  });

  describe('transformError', () => {
    describe('ZodError handling', () => {
      test('should return ValidationError for ZodError', () => {
        const schema = z.object({
          email: z.string().email(),
          age: z.number().min(18),
        });

        let zodError: ZodError | null = null;
        try {
          schema.parse({ email: 'invalid', age: 10 });
        } catch (e) {
          zodError = e as ZodError;
        }

        const result = errorHandlingPipe.transformError(zodError!);

        expect(result).toBeInstanceOf(ValidationError);
        expect(result.message).toContain('Failed to validate');
        expect(result.message).toContain('email');
        expect(result.message).toContain('age');
      });

      test('should include all validation errors in message', () => {
        const schema = z.object({
          field1: z.string(),
          field2: z.number(),
          field3: z.boolean(),
        });

        let zodError: ZodError | null = null;
        try {
          schema.parse({ field1: 123, field2: 'not a number', field3: 'not a boolean' });
        } catch (e) {
          zodError = e as ZodError;
        }

        const result = errorHandlingPipe.transformError(zodError!);

        expect(result.message).toContain('field1');
        expect(result.message).toContain('field2');
        expect(result.message).toContain('field3');
      });
    });

    describe('BaseError handling', () => {
      test('should return the same BaseError instance', () => {
        const error = new BaseError('Not found', 'NOT_FOUND', 404);

        const result = errorHandlingPipe.transformError(error);

        expect(result).toBe(error);
      });

      test('should handle different BaseError subclasses', () => {
        const validationError = new ValidationError('Invalid input');
        const internalError = new InternalServerError('Server error');

        expect(errorHandlingPipe.transformError(validationError)).toBe(validationError);
        expect(errorHandlingPipe.transformError(internalError)).toBe(internalError);
      });
    });

    describe('Generic Error handling', () => {
      test('should return InternalServerError for generic Error', () => {
        const error = new Error('Unexpected error');

        const result = errorHandlingPipe.transformError(error);

        expect(result).toBeInstanceOf(InternalServerError);
        expect(result.message).toBe(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
      });

      test('should handle TypeError', () => {
        const error = new TypeError('Cannot read property');

        const result = errorHandlingPipe.transformError(error);

        expect(result).toBeInstanceOf(InternalServerError);
      });

      test('should handle RangeError', () => {
        const error = new RangeError('Invalid range');

        const result = errorHandlingPipe.transformError(error);

        expect(result).toBeInstanceOf(InternalServerError);
      });
    });
  });

  describe('integration scenarios', () => {
    test('should preserve original passable data when error occurs', async () => {
      const passable = createPassable({
        input: { userId: '123' },
      });
      const error = new Error('Database connection failed');
      mockNext.mockRejectedValue(error);

      const result = await errorHandlingPipe.handle(passable, mockNext);

      expect(result.error).toBe(error);
      expect(result.output).toBeDefined();
    });

    test('should handle async errors properly', async () => {
      const passable = createPassable();
      mockNext.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new BaseError('Async operation failed', 'ASYNC_ERROR', 422);
      });

      const result = await errorHandlingPipe.handle(passable, mockNext);

      expect(result.error).toBeDefined();
      expect(result.output).toBeDefined();
    });
  });
});
