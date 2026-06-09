import { SENSITIVE_FIELDS } from '@common/constants/app.const';
import { CryptoUtil } from '@common/utils/crypto.util';
import { maskValue, hashValue, jsonReplacerFn } from '@common/utils/sensitive-data.util';
import { afterEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line max-lines-per-function
describe('sensitive-data.util', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('maskValue', () => {
    it('should return asterisks with same length as input string', () => {
      expect(maskValue('JohnDoe')).toBe('*******');
    });

    it('should mask number values converted to string', () => {
      expect(maskValue(12345)).toBe('*****');
    });

    it('should return null for null input', () => {
      expect(maskValue(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(maskValue(undefined)).toBeUndefined();
    });

    it('should return empty string for empty string input', () => {
      expect(maskValue('')).toBe('');
    });
  });

  describe('hashValue', () => {
    it('should hash a valid ID using SHA-256', () => {
      const id = 'test-resource-id';
      const result = hashValue(id);

      // Should return a SHA-256 hash (64 hex characters)
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]+$/);

      // Should match the expected hash from CryptoUtil
      const expectedHash = CryptoUtil.hashString(id, '');
      expect(result).toBe(expectedHash);
    });

    it('should return null for null input', () => {
      expect(hashValue(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(hashValue(undefined)).toBeUndefined();
    });

    it('should return empty string for empty string input', () => {
      const result = hashValue('');
      expect(result).toBe('');
    });

    it('should hash zero value (0 is not skipped)', () => {
      const result = hashValue(0);
      const expectedHash = CryptoUtil.hashString('0', '');
      expect(result).toBe(expectedHash);
      expect(result).toHaveLength(64);
    });

    it('should hash false value (false is not skipped)', () => {
      const result = hashValue(false);
      const expectedHash = CryptoUtil.hashString('false', '');
      expect(result).toBe(expectedHash);
    });

    it('should hash number values converted to string', () => {
      const result = hashValue(12345);
      const expectedHash = CryptoUtil.hashString('12345', '');
      expect(result).toBe(expectedHash);
    });
  });

  describe('jsonReplacerFn', () => {
    it('should hash fields in SENSITIVE_FIELDS.hash (snake_case)', () => {
      const testFields = ['cognito_sub'];

      testFields.forEach((field) => {
        const value = 'test-value-123';
        const result = jsonReplacerFn(field, value);

        expect(result).toHaveLength(64);
        expect(result).not.toBe(value);
      });
    });

    it('should hash camelCase fields by converting them to snake_case', () => {
      const testCases = [{ camelCase: 'cognitoSub', snakeCase: 'cognito_sub' }];

      testCases.forEach(({ camelCase, snakeCase }) => {
        const value = 'test-value-123';
        const camelResult = jsonReplacerFn(camelCase, value);
        const snakeResult = jsonReplacerFn(snakeCase, value);

        // Both should produce the same hash
        expect(camelResult).toBe(snakeResult);
        expect(camelResult).toHaveLength(64);
        expect(camelResult).not.toBe(value);
      });
    });

    it('should mask fields in SENSITIVE_FIELDS.mask', () => {
      // Note: mask array is currently empty, but this test ensures future compatibility
      SENSITIVE_FIELDS.mask.forEach((field) => {
        const value = 'SensitiveNickname';
        const result = jsonReplacerFn(field, value);

        expect(result).toBe('*'.repeat(value.length));
      });
    });

    it('should return unchanged value for non-sensitive fields', () => {
      const result = jsonReplacerFn('normalField', 'normalValue');
      expect(result).toBe('normalValue');
    });

    it('should preserve null values for sensitive fields', () => {
      const result = jsonReplacerFn('cognito_sub', null);
      expect(result).toBeNull();
    });

    it('should preserve undefined values for sensitive fields', () => {
      const result = jsonReplacerFn('cognito_sub', undefined);
      expect(result).toBeUndefined();
    });

    it('should hash all defined sensitive hash fields', () => {
      const testValue = 'test-sensitive-value';

      SENSITIVE_FIELDS.hash.forEach((field) => {
        const result = jsonReplacerFn(field, testValue);
        const expectedHash = CryptoUtil.hashString(testValue, '');

        expect(result).toBe(expectedHash);
        expect(result).toHaveLength(64);
      });
    });

    it('should preserve objects and arrays unchanged (JSON.stringify handles recursion)', () => {
      const nestedObj = { inner: 'data' };
      const result = jsonReplacerFn('someObject', nestedObj);

      expect(result).toEqual(nestedObj);
    });

    it('should handle numeric keys (as strings)', () => {
      const result = jsonReplacerFn('0', 'value');
      expect(result).toBe('value');
    });

    it('should parse JSON body in SQS message objects', () => {
      const sqsMessage = {
        messageId: 'msg-1',
        receiptHandle: 'handle-1',
        body: JSON.stringify({ userId: '123' }),
      };

      const result = jsonReplacerFn('messages', sqsMessage) as typeof sqsMessage & {
        body: { userId: string };
      };

      expect(result.body).toEqual({ userId: '123' });
    });

    it('should keep SQS message body unchanged when body is not JSON', () => {
      const sqsMessage = {
        messageId: 'msg-1',
        receiptHandle: 'handle-1',
        body: 'plain-text-body',
      };

      expect(jsonReplacerFn('messages', sqsMessage)).toEqual(sqsMessage);
    });

    it('should hash Cognito subs embedded in containing-sensitive field values', () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const value = `/files/${cognitoSub}/report.csv`;
      const result = jsonReplacerFn('file_path', value) as string;

      expect(result).not.toContain(cognitoSub);
      expect(result).toMatch(/^\/files\/[a-f0-9]{64}\/report\.csv$/);
    });

    it('should keep original Cognito sub when hash result is not a string', () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const value = `/files/${cognitoSub}/report.csv`;
      vi.spyOn(CryptoUtil, 'hashString').mockReturnValue(null as unknown as string);

      expect(jsonReplacerFn('file_path', value)).toBe(value);
    });

    it('should skip snake_case conversion for non-string keys', () => {
      const symbolKey = Symbol('field');

      expect(jsonReplacerFn(symbolKey as unknown as string, 'plain-value')).toBe('plain-value');
    });

    it('should mask fields configured in SENSITIVE_FIELDS.mask', () => {
      SENSITIVE_FIELDS.mask.push('user_nickname');

      try {
        expect(jsonReplacerFn('user_nickname', 'SecretName')).toBe('**********');
        expect(jsonReplacerFn('userNickname', 'SecretName')).toBe('**********');
      } finally {
        SENSITIVE_FIELDS.mask.pop();
      }
    });
  });

  describe('jsonReplacerFn integration with JSON.stringify', () => {
    it('should sanitize sensitive fields when used with JSON.stringify', () => {
      const data = {
        cognito_sub: 'user-123',
        vin_code: 'VIN456',
        normalField: 'unchanged',
        nested: {
          ccu_id: 'ccu-789',
        },
      };

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      // Hash fields should be hashed (64 char hex)
      expect(result.cognito_sub).toHaveLength(64);
      expect(result.vin_code).toBe('VIN456');
      expect(result.nested.ccu_id).toBe('ccu-789');

      // Non-sensitive field unchanged
      expect(result.normalField).toBe('unchanged');
    });

    it('should sanitize camelCase sensitive fields by converting to snake_case', () => {
      const data = {
        cognitoSub: 'user-123',
        vinCode: 'VIN456',
        normalField: 'unchanged',
        nested: {
          ccuId: 'ccu-789',
        },
      };

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      // Hash fields should be hashed (64 char hex)
      expect(result.cognitoSub).toHaveLength(64);
      expect(result.vinCode).toBe('VIN456');
      expect(result.nested.ccuId).toBe('ccu-789');

      // Non-sensitive field unchanged
      expect(result.normalField).toBe('unchanged');
    });

    it('should sanitize arrays of objects', () => {
      const data = [{ du_serial: 'serial-1' }, { du_serial: 'serial-2' }];

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      expect(result[0].du_serial).toBe('serial-1');
      expect(result[1].du_serial).toBe('serial-2');
    });

    it('should handle deeply nested sensitive fields', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              cognito_sub: 'deep-uuid',
            },
          },
        },
      };

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      expect(result.level1.level2.level3.cognito_sub).toHaveLength(64);
    });
  });
});
