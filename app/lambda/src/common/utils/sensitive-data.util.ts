import { CONTAINING_SENSITIVE_FIELDS, SENSITIVE_FIELDS } from '@common/constants/app.const';
import { CryptoUtil } from '@common/utils/crypto.util';

// Pattern to match gigyaId (32 hex characters)
export const COGNITO_SUB_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Masks a nickname completely.
 * @returns Masked string
 */
export const maskValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  const str = String(value);

  return '*'.repeat(str.length);
};

/**
 * Hashes a sensitive value using SHA-256.
 * @param value - The value to hash
 * @returns Hashed string or original value if null/undefined/empty string
 */
export const hashValue = (value: unknown): unknown => {
  // Only skip null, undefined, and empty string
  if (value === null || value === undefined || value === '') return value;
  return CryptoUtil.hashString(String(value), '');
};

/**
 * Converts a camelCase string to snake_case.
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 */
const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// eslint-disable-next-line complexity
export const jsonReplacerFn = (key: string, value: unknown) => {
  // Convert camelCase keys to snake_case before checking sensitive fields
  const snakeCaseKey = typeof key === 'string' ? toSnakeCase(key) : key;

  // Check for SQS message structure
  if (
    value &&
    typeof value === 'object' &&
    'messageId' in value &&
    'receiptHandle' in value &&
    'body' in value
  ) {
    try {
      return {
        ...value,
        body: JSON.parse(value.body as string),
      };
    } catch {
      // If body is not JSON, return as is
      return value;
    }
  }

  // Check if this field contains a Cognito sub in its value (like file paths)
  if (
    typeof value === 'string' &&
    typeof snakeCaseKey === 'string' &&
    CONTAINING_SENSITIVE_FIELDS.includes(snakeCaseKey)
  ) {
    return value.replace(COGNITO_SUB_PATTERN, (match: string) => {
      const hashed = hashValue(match);
      return typeof hashed === 'string' ? hashed : match;
    });
  }

  // Hash entire value if the field name is in the hash list
  if (typeof snakeCaseKey === 'string' && SENSITIVE_FIELDS.hash.includes(snakeCaseKey)) {
    return hashValue(value);
  }

  // Mask entire value if the field name is in the mask list
  if (typeof snakeCaseKey === 'string' && SENSITIVE_FIELDS.mask.includes(snakeCaseKey)) {
    return maskValue(value);
  }

  return value;
};
