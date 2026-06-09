/* eslint-disable max-lines-per-function */

import { BadRequestError } from '@common/errors/bad-request-error';
import { BaseError } from '@common/errors/base-error';
import { DatabaseUrlNotFoundError } from '@common/errors/database-url-notfound-error';
import { InternalServerError } from '@common/errors/internal-server-error';
import { NotFoundError } from '@common/errors/notfound-error';
import { SecretsNotFoundError } from '@common/errors/secrets-notfound-error';
import { ValidationError } from '@common/errors/validation-error';
import { ErrorResponse } from '@common/responses/error.response';
import { describe, test, expect } from 'vitest';

describe('ErrorResponse', () => {
  describe('constructor and render method', () => {
    test('should create error response with code, message, and detail', () => {
      const errorResponse = new ErrorResponse('TEST_CODE', 'Test message', { field: 'test' });
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'TEST_CODE',
          message: 'Test message',
        },
        error: {
          error_message: 'Test message',
          error_detail: { field: 'test' },
        },
      });
    });

    test('should handle null detail', () => {
      const errorResponse = new ErrorResponse('NULL_DETAIL', 'Null detail message', null);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'NULL_DETAIL',
          message: 'Null detail message',
        },
        error: {
          error_message: 'Null detail message',
          error_detail: null,
        },
      });
    });

    test('should handle undefined detail', () => {
      const errorResponse = new ErrorResponse(
        'UNDEFINED_DETAIL',
        'Undefined detail message',
        undefined,
      );
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'UNDEFINED_DETAIL',
          message: 'Undefined detail message',
        },
        error: {
          error_message: 'Undefined detail message',
          error_detail: null,
        },
      });
    });

    test('should handle complex detail objects', () => {
      const complexDetail = {
        validation: {
          field1: ['error1', 'error2'],
          field2: ['error3'],
        },
        metadata: {
          timestamp: '2023-01-01T00:00:00Z',
          requestId: 'req-123',
        },
      };

      const errorResponse = new ErrorResponse(
        'COMPLEX_DETAIL',
        'Complex detail message',
        complexDetail,
      );
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'COMPLEX_DETAIL',
          message: 'Complex detail message',
        },
        error: {
          error_message: 'Complex detail message',
          error_detail: complexDetail,
        },
      });
    });

    test('should handle empty strings', () => {
      const errorResponse = new ErrorResponse('', '', '');
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: '',
          message: '',
        },
        error: {
          error_message: '',
          error_detail: '',
        },
      });
    });
  });

  describe('fromError static method', () => {
    test('should handle BadRequestError', () => {
      const badRequestError = new BadRequestError('Invalid input data');
      const errorResponse = ErrorResponse.fromError(badRequestError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'EB-002',
          message: 'Invalid input data',
        },
        error: {
          error_message: 'Invalid input data',
          error_detail: null,
        },
      });
    });

    test('should handle DatabaseUrlNotFoundError', () => {
      const dbError = new DatabaseUrlNotFoundError('Database connection failed');
      const errorResponse = ErrorResponse.fromError(dbError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'ES-003',
          message: 'Database connection failed',
        },
        error: {
          error_message: 'Database connection failed',
          error_detail: null,
        },
      });
    });

    test('should handle SecretsNotFoundError', () => {
      const secretsError = new SecretsNotFoundError('Secret key not found');
      const errorResponse = ErrorResponse.fromError(secretsError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'ES-002',
          message: 'Secret key not found',
        },
        error: {
          error_message: 'Secret key not found',
          error_detail: null,
        },
      });
    });

    test('should handle NotFoundError', () => {
      const notFoundError = new NotFoundError('Resource not found');
      const errorResponse = ErrorResponse.fromError(notFoundError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'EB-003',
          message: 'Resource not found',
        },
        error: {
          error_message: 'Resource not found',
          error_detail: null,
        },
      });
    });

    test('should handle ValidationError with details', () => {
      const validationDetails = {
        email: ['Invalid email format'],
        password: ['Password too short', 'Password must contain numbers'],
      };
      const validationError = new ValidationError('Validation failed', validationDetails);
      const errorResponse = ErrorResponse.fromError(validationError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'EB-004',
          message: 'Validation failed',
        },
        error: {
          error_message: 'Validation failed',
          error_detail: validationDetails,
        },
      });
    });

    test('should handle InternalServerError (default case)', () => {
      const internalError = new InternalServerError('Something went wrong');
      const errorResponse = ErrorResponse.fromError(internalError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'ES-001',
          message: 'Something went wrong',
        },
        error: {
          error_message: 'Something went wrong',
          error_detail: null,
        },
      });
    });

    test('should handle custom BaseError that does not match specific types', () => {
      const customError = new BaseError('Custom error message', 'CUSTOM_ERROR', 500, {
        custom: 'data',
      });
      const errorResponse = ErrorResponse.fromError(customError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'CUSTOM_ERROR',
          message: 'Custom error message',
        },
        error: {
          error_message: 'Custom error message',
          error_detail: { custom: 'data' },
        },
      });
    });

    test('should handle BaseError with null details', () => {
      const baseError = new BaseError('Base error', 'BASE_ERROR', 400, null);
      const errorResponse = ErrorResponse.fromError(baseError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'BASE_ERROR',
          message: 'Base error',
        },
        error: {
          error_message: 'Base error',
          error_detail: null,
        },
      });
    });

    test('should handle BaseError with undefined details', () => {
      const baseError = new BaseError('Base error', 'BASE_ERROR', 400, undefined);
      const errorResponse = ErrorResponse.fromError(baseError);
      const result = errorResponse.render();

      expect(result).toEqual({
        result: {
          code: 'BASE_ERROR',
          message: 'Base error',
        },
        error: {
          error_message: 'Base error',
          error_detail: null,
        },
      });
    });
  });

  describe('edge cases', () => {
    test('should handle error with very long message', () => {
      const longMessage = 'A'.repeat(1000);
      const longError = new BadRequestError(longMessage);
      const errorResponse = ErrorResponse.fromError(longError);
      const result = errorResponse.render();

      expect(result.result.message).toBe(longMessage);
      expect(result.error.error_message).toBe(longMessage);
    });

    test('should handle error with special characters in message', () => {
      const specialMessage = 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialError = new BadRequestError(specialMessage);
      const errorResponse = ErrorResponse.fromError(specialError);
      const result = errorResponse.render();

      expect(result.result.message).toBe(specialMessage);
      expect(result.error.error_message).toBe(specialMessage);
    });
  });

  describe('type safety', () => {
    test('should maintain proper typing for generic detail type', () => {
      interface CustomDetail {
        field1: string;
        field2: number;
      }

      const customDetail: CustomDetail = { field1: 'test', field2: 42 };
      const errorResponse = new ErrorResponse<CustomDetail>(
        'TYPED_ERROR',
        'Typed error',
        customDetail,
      );
      const result = errorResponse.render();

      expect(result.error.error_detail).toEqual(customDetail);
      expect(typeof result.error.error_detail?.field1).toBe('string');
      expect(typeof result.error.error_detail?.field2).toBe('number');
    });

    test('should handle array detail type', () => {
      const arrayDetail = ['error1', 'error2', 'error3'];
      const errorResponse = new ErrorResponse<string[]>('ARRAY_ERROR', 'Array error', arrayDetail);
      const result = errorResponse.render();

      expect(result.error.error_detail).toEqual(arrayDetail);
      expect(Array.isArray(result.error.error_detail)).toBe(true);
    });
  });
});
