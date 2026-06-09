import { CookieUtil } from '@common/utils/cookie-util';
import { describe, test, expect } from 'vitest';

describe('cookie-util test', () => {
  describe('getValue', () => {
    test('success', () => {
      const result = CookieUtil.getValue('test=testValue', 'test');
      expect(result).toEqual('testValue');
    });

    test('empty value', () => {
      const result = CookieUtil.getValue('test=', 'test');
      expect(result).toEqual('');
    });

    test('empty key', () => {
      const result = CookieUtil.getValue('test2=test2Value', 'test');
      expect(result).toEqual('');
    });
  });
});
