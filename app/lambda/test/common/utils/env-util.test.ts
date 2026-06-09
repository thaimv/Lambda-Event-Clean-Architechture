import { getEnv } from '@common/utils/env-util';
import { afterEach, describe, expect, test } from 'vitest';

describe('getEnv', () => {
  const originalEnv = process.env.TEST_ENV_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TEST_ENV_KEY;
    } else {
      process.env.TEST_ENV_KEY = originalEnv;
    }
  });

  test('returns environment variable when set', () => {
    process.env.TEST_ENV_KEY = 'value';

    expect(getEnv('TEST_ENV_KEY')).toBe('value');
  });

  test('returns default value when env is missing', () => {
    delete process.env.TEST_ENV_KEY;

    expect(getEnv('TEST_ENV_KEY', 'default')).toBe('default');
  });

  test('throws when env is missing and no default provided', () => {
    delete process.env.TEST_ENV_KEY;

    expect(() => getEnv('TEST_ENV_KEY')).toThrow('TEST_ENV_KEY environment variable does not set');
  });
});
