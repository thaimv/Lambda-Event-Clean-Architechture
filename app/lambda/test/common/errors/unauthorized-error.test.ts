import { UnauthorizedError } from '@common/errors/unauthorized-error';
import { describe, expect, test } from 'vitest';

describe('UnauthorizedError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new UnauthorizedError('test unauthorized error');
    }).toThrowError('test unauthorized error');
  });
});
