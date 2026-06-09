export const RESULT_CODE = {
  // Success codes
  SUCCESS: 'SC-001',

  // System errors
  INTERNAL_SERVER_ERROR: 'ES-001',
  SECRETS_NOT_FOUND: 'ES-002',
  DATABASE_URL_NOT_FOUND: 'ES-003',

  // Business errors
  UNAUTHORIZED: 'EB-001',
  BAD_REQUEST: 'EB-002',
  NOT_FOUND: 'EB-003',
  VALIDATION_BUSINESS_ERROR: 'EB-004',
  EXISTED: 'EB-009',
};

export const STATUS_CODE = {
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
};

export const ERROR_MESSAGE = {
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred.',
  UNAUTHORIZED: 'Unauthorized',
  BAD_REQUEST: 'Invalid input.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Failed to validate <argument_name>',
  SECRETS_NOT_FOUND: 'Secrets not found.',
  DATABASE_URL_NOT_FOUND: 'Database url not found.',
  NO_DATA_FOUND_IN_CSV: 'No data found in CSV.',
  INVALID_TIMEZONE_OFFSET: 'Invalid timezone offset.',
  INVALID_DATE_FORMAT: 'Invalid date format. Expected <date_format>.',
  FILE_NOT_FOUND: 'File <file_name> not found.',
  UPLOAD_FILE_FAILED: 'Failed to upload file.',
  FAILED_TO_ASSUME_ROLE: 'Failed to assume role.',
  SNS_GET_ENDPOINT_ATTRIBUTES_ERROR: 'Failed to get endpoint attributes',
  SNS_CREATE_ENDPOINT_ERROR: 'Failed to create endpoint',
  SNS_DELETE_ENDPOINT_ERROR: 'Failed to delete endpoint',
};
