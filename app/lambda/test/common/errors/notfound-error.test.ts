import { NotFoundError } from '@common/errors/notfound-error';
import { describe, expect, test } from 'vitest';

describe('NotFoundError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new NotFoundError('test not found error');
    }).toThrowError('test not found error');
  });

  test('toCustomError should return correct shape', () => {
    const error = new NotFoundError('test error');
    expect(error.toCustomError()).toEqual({
      error: {
        message: 'test error',
        extensions: {
          code: 'EB-003',
          statusCode: 404,
          details: null,
        },
      },
    });
  });
});
