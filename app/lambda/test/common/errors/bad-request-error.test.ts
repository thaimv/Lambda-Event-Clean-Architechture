import { BadRequestError } from '@common/errors/bad-request-error';
import { describe, expect, test } from 'vitest';

describe('BadRequestError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new BadRequestError('test bad request error');
    }).toThrowError('test bad request error');
  });
});
