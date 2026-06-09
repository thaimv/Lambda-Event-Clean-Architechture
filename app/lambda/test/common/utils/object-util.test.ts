import { ObjectUtil } from '@common/utils/object-util';
import { describe, expect, test } from 'vitest';

describe('ObjectUtil', () => {
  test('isNil returns true for null and undefined', () => {
    expect(ObjectUtil.isNil(null)).toBe(true);
    expect(ObjectUtil.isNil(undefined)).toBe(true);
  });

  test('isNil returns false for other values', () => {
    expect(ObjectUtil.isNil('')).toBe(false);
    expect(ObjectUtil.isNil(0)).toBe(false);
    expect(ObjectUtil.isNil(false)).toBe(false);
    expect(ObjectUtil.isNil({})).toBe(false);
  });
});
