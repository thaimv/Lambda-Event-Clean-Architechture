import * as dotenv from 'dotenv';

dotenv.config();

export const CONST = {
  SERVICE_NAME: 'LambdaEventService',
};

export const COOKIE_CONST = {
  ACCESS_TOKEN_NAME: 'project_access_token',
};

export const APP_CONST = {
  NODE_ENV: process.env.NODE_ENV || 'dev',
  ENVIRONMENTS: {
    LOCAL: 'local',
    DEV: 'dev',
    STAGING: 'stg',
    PROD: 'prd',
    TEST: 'test',
  },
};

export const DB_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_REPLICA: process.env.DATABASE_URL_REPLICA,
  RDS_PROXY_ENDPOINT: process.env.RDS_PROXY_ENDPOINT,
};

export const AWS_CONFIG = {
  REGION: process.env.AWS_REGION,
  RDS_SECRET_ARN: process.env.RDS_SECRET_ARN,
  LAMBDA_GRAPHQL_API_ARN: process.env.LAMBDA_GRAPHQL_API_ARN,
  IAM_SWITCH_ROLE_ARN: process.env.IAM_SWITCH_ROLE_ARN,
  EXTERNAL_ACCOUNT_REGION: process.env.EXTERNAL_ACCOUNT_REGION,
  GCS_SECRET_NAME: process.env.GCS_SECRET_NAME,
};

// DynamoDB table names for deletion
export const DYNAMODB_TABLE_NAMES = {
  USER_EVENT_TABLE: process.env.DYNAMODB_USER_EVENT_TABLE!,
  USER_NOTIFICATION_TABLE: process.env.DYNAMODB_USER_NOTIFICATION_TABLE!,
};

// DynamoDB GSI names
export const DYNAMODB_GSI_NAMES = {
  USER_EVENT_TABLE_GSI: process.env.DYNAMODB_USER_EVENT_TABLE_GSI!,
};

// DynamoDB batch write item size configuration
const DEFAULT_DYNAMODB_BATCH_WRITE_ITEM_SIZE = 25;
const dynamodbBatchWriteItemSizeEnvValue = Number(process.env.DYNAMODB_BATCH_WRITE_ITEM_SIZE);
const DEFAULT_DYNAMODB_BATCH_DELETE_MAX_RETRIES = 5;
const dynamodbBatchDeleteMaxRetriesEnvValue = Number(process.env.DYNAMODB_BATCH_DELETE_MAX_RETRIES);
const DEFAULT_DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS = 100;
const dynamodbBatchDeleteRetryDelayMsEnvValue = Number(
  process.env.DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS,
);

// Cap the batch write item size to DynamoDB's maximum of 25, with a default of 25 if not set or invalid
export const DYNAMODB_BATCH_WRITE_ITEM_SIZE =
  Number.isInteger(dynamodbBatchWriteItemSizeEnvValue) && dynamodbBatchWriteItemSizeEnvValue > 0
    ? Math.min(dynamodbBatchWriteItemSizeEnvValue, DEFAULT_DYNAMODB_BATCH_WRITE_ITEM_SIZE)
    : DEFAULT_DYNAMODB_BATCH_WRITE_ITEM_SIZE;

export const DYNAMODB_BATCH_DELETE_MAX_RETRIES =
  Number.isInteger(dynamodbBatchDeleteMaxRetriesEnvValue) &&
  dynamodbBatchDeleteMaxRetriesEnvValue >= 0
    ? dynamodbBatchDeleteMaxRetriesEnvValue
    : DEFAULT_DYNAMODB_BATCH_DELETE_MAX_RETRIES;

export const DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS =
  Number.isInteger(dynamodbBatchDeleteRetryDelayMsEnvValue) &&
  dynamodbBatchDeleteRetryDelayMsEnvValue >= 0
    ? dynamodbBatchDeleteRetryDelayMsEnvValue
    : DEFAULT_DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS;

// Common cross-account configuration for external bucket access
export const CROSS_ACCOUNT_CONFIG = {
  roleArn: AWS_CONFIG.IAM_SWITCH_ROLE_ARN,
  region: AWS_CONFIG.EXTERNAL_ACCOUNT_REGION,
  sessionName: 'data-migration-session',
};

export const DATE_FORMAT = {
  YYYY_MM_DD: 'YYYY-MM-DD',
  YYYY_MM_DD_SLASH: 'YYYY/MM/DD',
  YYYYMMDD: 'YYYYMMDD',
  YYYYMM: 'YYYYMM',
  YYYY: 'YYYY',
  MM: 'MM',
  DD: 'DD',
  YYYY_MM_DD_HH: 'YYYY-MM-DD-HH',
  YYYYMMDDHHmmss: 'YYYYMMDDHHmmss',
  YYYY_MM_DDTHH_mm_ss_SSSZ: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

export const REGEX = {
  // Regex pattern for validating timezone offsets (e.g., +09:00, -05:00)
  TIMEZONE_OFFSET: /^[+-](0[0-9]|1[0-4]):[0-5][0-9]$/,

  // Regex patterns for validating ISO8601 datetime with timezone
  ISO8601_TIMEZONE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/,

  // Regex patterns for S3 file path validation
  S3_URI: /^s3:\/\/([^/]+)\/(.+)$/,
};

export const MAX_ROW = 1000000;

export const ENCODING = {
  SHIFT_JIS: 'shift_jis',
  UTF_8: 'utf8',
};

// Environment variables
export const PARALLEL_NUM = parseInt(process.env.PARALLEL_NUM || '5', 10);
export const MAX_FILES_NUM = parseInt(process.env.MAX_FILES_NUM || '1000', 10);
const deleteUserSoftDeleteRetentionYearsEnvValue = Number(
  process.env.DELETE_USER_SOFT_DELETE_RETENTION_YEARS,
);

const DEFAULT_DELETE_USER_SOFT_DELETE_RETENTION_YEARS = 1;

export const DELETE_USER_SOFT_DELETE_RETENTION_YEARS =
  Number.isInteger(deleteUserSoftDeleteRetentionYearsEnvValue) &&
  deleteUserSoftDeleteRetentionYearsEnvValue > 0
    ? deleteUserSoftDeleteRetentionYearsEnvValue
    : DEFAULT_DELETE_USER_SOFT_DELETE_RETENTION_YEARS;

// Prisma transaction timeout configuration
export const PRISMA_TRANSACTION_CONFIG = {
  MAX_WAIT: parseInt(process.env.TRANSACTION_MAX_WAIT || '10000'), // Default: 10s
  TIMEOUT: parseInt(process.env.TRANSACTION_TIMEOUT || '30000'), // Default: 30s
};

export const RETRY_PRISMA_CLIENT_TIMEOUT_MS = parseInt(
  process.env.RETRY_PRISMA_CLIENT_TIMEOUT_MS || '1000',
  10,
); // 1 seconds

export const PRISMA_CLIENT_MAX_RETRIES = parseInt(process.env.PRISMA_CLIENT_MAX_RETRIES || '3', 10); // 3 retries

/**
 * Sensitive data field names to be masked or hashed in logs
 */
export const SENSITIVE_FIELDS: { hash: string[]; mask: string[] } = {
  /** Fields that should be hashed using SHA-256 */
  hash: [
    // User identifiers
    'cognito_sub',
    'create_author',
    'update_author',
  ],
  /** Fields that should be fully masked */
  mask: [],
};

export const CONTAINING_SENSITIVE_FIELDS: string[] = [
  'file_path',
  'cognito_identity_auth_provider',
  'source_key',
  'dest_key',
  'api_name',
  'proxy',
  'url',
  'response',
  'message',
  'error',
];
