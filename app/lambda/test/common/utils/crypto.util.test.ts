import * as crypto from 'crypto';

import { CryptoUtil } from '@common/utils/crypto.util';
import { describe, test, expect } from 'vitest';

describe('CryptoUtil', () => {
  const secretKey = 'mysecretpassword'; // 16+ characters for AES-128-GCM
  const plainText = 'Hello World!';

  describe('encryptString and decryptString', () => {
    test('should encrypt and decrypt a string correctly', () => {
      const encrypted = CryptoUtil.encryptString(plainText, secretKey);
      const decrypted = CryptoUtil.decryptString(encrypted, secretKey);

      expect(encrypted).toBeDefined();
      expect(decrypted).toBeDefined();
      expect(decrypted).toBe(plainText);
    });

    test('should throw an error for invalid decryption when secret key is different', () => {
      const encrypted = CryptoUtil.encryptString(plainText, secretKey);
      const wrongKey = 'wrongsecretkeypass';

      expect(() => {
        CryptoUtil.decryptString(encrypted, wrongKey);
      }).toThrowError();
    });
  });

  describe('hashString', () => {
    test('should generate a valid sha256 hash', () => {
      const hash = CryptoUtil.hashString(plainText, secretKey);
      const expectedHash = crypto.createHmac('sha256', secretKey).update(plainText).digest('hex');

      expect(hash).toBe(expectedHash);
    });

    test('should generate a valid sha1 hash', () => {
      const hash = CryptoUtil.hashString(plainText, secretKey, 'sha1');
      const expectedHash = crypto.createHmac('sha1', secretKey).update(plainText).digest('hex');

      expect(hash).toBe(expectedHash);
    });
  });

  describe('CryptoUtil.generateMD5', () => {
    test('should generate the correct MD5 hash with default encoding (base64)', () => {
      const data = 'Hello, world!';
      const expectedHash = crypto.createHash('md5').update(data).digest('base64');
      const actualHash = CryptoUtil.generateMD5(data);
      expect(actualHash).toBe(expectedHash);
    });
  });
});
