import { ValidationError } from '@common/errors/validation-error';
import { describe, expect, test } from 'vitest';

describe('ValidationError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new ValidationError('test validation error');
    }).toThrowError('test validation error');
  });
});
