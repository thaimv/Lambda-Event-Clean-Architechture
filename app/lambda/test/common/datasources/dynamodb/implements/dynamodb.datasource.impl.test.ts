import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDatasource } from '@common/datasources/dynamodb/implements/dynamodb.datasource.impl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

const dynamoDbBatchConfig = vi.hoisted(() => ({
  DYNAMODB_BATCH_DELETE_MAX_RETRIES: 5,
  DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS: 100,
  DYNAMODB_BATCH_WRITE_ITEM_SIZE: 25,
}));

vi.mock('@common/constants/app.const', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get DYNAMODB_BATCH_DELETE_MAX_RETRIES() {
      return dynamoDbBatchConfig.DYNAMODB_BATCH_DELETE_MAX_RETRIES;
    },
    get DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS() {
      return dynamoDbBatchConfig.DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS;
    },
    get DYNAMODB_BATCH_WRITE_ITEM_SIZE() {
      return dynamoDbBatchConfig.DYNAMODB_BATCH_WRITE_ITEM_SIZE;
    },
  };
});

vi.mock('@common/logger', () => ({
  logger: mockLogger,
}));

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  BatchWriteItemCommand: vi.fn(),
  DeleteItemCommand: vi.fn(),
  QueryCommand: vi.fn(),
  ScanCommand: vi.fn(),
}));

// Mock inversify
vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => {},
}));

// eslint-disable-next-line max-lines-per-function
describe('DynamoDBDatasource', () => {
  let datasource: DynamoDBDatasource;
  let mockSend: ReturnType<typeof vi.fn>;
  let batchWriteItemSize = 25;
  let batchDeleteMaxRetries = 5;
  let batchDeleteRetryDelayMs = 100;

  const updateDynamoDbBatchConfig = async ({
    maxRetries = batchDeleteMaxRetries,
    retryDelayMs = batchDeleteRetryDelayMs,
    writeItemSize = batchWriteItemSize,
  }: {
    maxRetries?: number;
    retryDelayMs?: number;
    writeItemSize?: number;
  }) => {
    batchDeleteMaxRetries = maxRetries;
    batchDeleteRetryDelayMs = retryDelayMs;
    batchWriteItemSize = writeItemSize;
    dynamoDbBatchConfig.DYNAMODB_BATCH_DELETE_MAX_RETRIES = maxRetries;
    dynamoDbBatchConfig.DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS = retryDelayMs;
    dynamoDbBatchConfig.DYNAMODB_BATCH_WRITE_ITEM_SIZE = writeItemSize;
    vi.resetModules();
    const { DynamoDBDatasource: ReloadedDynamoDBDatasource } =
      await import('@common/datasources/dynamodb/implements/dynamodb.datasource.impl');
    const { DynamoDBClient: ReloadedDynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const mockClient = new ReloadedDynamoDBClient({});
    datasource = new ReloadedDynamoDBDatasource(mockClient);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    batchWriteItemSize = 25;
    batchDeleteMaxRetries = 5;
    batchDeleteRetryDelayMs = 100;
    dynamoDbBatchConfig.DYNAMODB_BATCH_DELETE_MAX_RETRIES = 5;
    dynamoDbBatchConfig.DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS = 100;
    dynamoDbBatchConfig.DYNAMODB_BATCH_WRITE_ITEM_SIZE = 25;
    mockSend = vi.fn();
    vi.mocked(DynamoDBClient).mockImplementation(
      () =>
        ({
          send: mockSend,
        }) as unknown as DynamoDBClient,
    );
    const mockClient = new DynamoDBClient({});
    datasource = new DynamoDBDatasource(mockClient);
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      const tableName = 'test-table';
      const key = { id: { S: 'test-id' } };
      mockSend.mockResolvedValue({});

      await datasource.deleteItem(tableName, key);

      expect(DeleteItemCommand).toHaveBeenCalledWith({
        TableName: tableName,
        Key: key,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error when deletion fails', async () => {
      const error = new Error('DynamoDB error');
      mockSend.mockRejectedValue(error);

      await expect(datasource.deleteItem('table', { id: { S: 'id' } })).rejects.toThrow(
        'DynamoDB error',
      );
    });
  });

  describe('query', () => {
    it('should query items successfully', async () => {
      const input = {
        TableName: 'test-table',
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': { S: 'value' } },
      };
      const mockResponse = { Items: [{ id: { S: 'item-1' } }] };
      mockSend.mockResolvedValue(mockResponse);

      const result = await datasource.query(input);

      expect(QueryCommand).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when query fails', async () => {
      const error = new Error('Query error');
      mockSend.mockRejectedValue(error);

      await expect(datasource.query({ TableName: 'table' })).rejects.toThrow('Query error');
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe('batchDeleteItems', () => {
    it('should resolve when all items are processed', async () => {
      const keys = [{ id: { S: 'test-id-1' } }, { id: { S: 'test-id-2' } }];
      mockSend.mockResolvedValue({});

      await expect(datasource.batchDeleteItems('test-table', keys)).resolves.toBeUndefined();

      expect(BatchWriteItemCommand).toHaveBeenCalledWith({
        RequestItems: {
          'test-table': keys.map((key) => ({
            DeleteRequest: {
              Key: key,
            },
          })),
        },
      });
    });

    it('should use the configured batch size when the env value is below 25', async () => {
      await updateDynamoDbBatchConfig({ writeItemSize: 10 });
      const keys = Array.from({ length: 11 }, (_, index) => ({
        id: { S: `test-id-${index + 1}` },
      }));
      mockSend.mockResolvedValue({});

      await datasource.batchDeleteItems('test-table', keys);

      expect(BatchWriteItemCommand).toHaveBeenCalledTimes(2);
      expect(BatchWriteItemCommand).toHaveBeenNthCalledWith(1, {
        RequestItems: {
          'test-table': keys.slice(0, 10).map((key) => ({
            DeleteRequest: {
              Key: key,
            },
          })),
        },
      });
      expect(BatchWriteItemCommand).toHaveBeenNthCalledWith(2, {
        RequestItems: {
          'test-table': keys.slice(10, 11).map((key) => ({
            DeleteRequest: {
              Key: key,
            },
          })),
        },
      });
    });

    it('should cap the configured batch size at 25 when the env value is larger', async () => {
      await updateDynamoDbBatchConfig({ writeItemSize: 25 });
      const keys = Array.from({ length: 26 }, (_, index) => ({
        id: { S: `test-id-${index + 1}` },
      }));
      mockSend.mockResolvedValue({});

      await datasource.batchDeleteItems('test-table', keys);

      expect(BatchWriteItemCommand).toHaveBeenCalledTimes(2);
      expect(BatchWriteItemCommand).toHaveBeenNthCalledWith(1, {
        RequestItems: {
          'test-table': keys.slice(0, 25).map((key) => ({
            DeleteRequest: {
              Key: key,
            },
          })),
        },
      });
      expect(BatchWriteItemCommand).toHaveBeenNthCalledWith(2, {
        RequestItems: {
          'test-table': keys.slice(25, 26).map((key) => ({
            DeleteRequest: {
              Key: key,
            },
          })),
        },
      });
    });

    it('should retry unprocessed items and resolve when a later attempt succeeds', async () => {
      vi.useFakeTimers();
      try {
        const retryKey = { id: { S: 'retry-id' } };
        mockSend
          .mockResolvedValueOnce({
            UnprocessedItems: {
              'test-table': [
                {
                  DeleteRequest: {
                    Key: retryKey,
                  },
                },
              ],
            },
          })
          .mockResolvedValueOnce({});

        const promise = datasource.batchDeleteItems('test-table', [retryKey]);
        const assertion = expect(promise).resolves.toBeUndefined();

        await vi.runAllTimersAsync();
        await assertion;

        expect(BatchWriteItemCommand).toHaveBeenCalledTimes(2);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Retrying DynamoDB batch delete for unprocessed items',
          expect.objectContaining({
            attempt: 1,
            maxRetries: 5,
            pendingRequestCount: 1,
            tableName: 'test-table',
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('should retry throttling errors and resolve when a later attempt succeeds', async () => {
      vi.useFakeTimers();
      try {
        const throttlingError = Object.assign(new Error('throttled'), {
          name: 'ProvisionedThroughputExceededException',
        });
        const key = { id: { S: 'retry-id' } };
        mockSend.mockRejectedValueOnce(throttlingError).mockResolvedValueOnce({});

        const promise = datasource.batchDeleteItems('test-table', [key]);
        const assertion = expect(promise).resolves.toBeUndefined();

        await vi.runAllTimersAsync();
        await assertion;

        expect(BatchWriteItemCommand).toHaveBeenCalledTimes(2);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Retrying DynamoDB batch delete after retryable error',
          expect.objectContaining({
            attempt: 1,
            errorMessage: 'throttled',
            errorName: 'ProvisionedThroughputExceededException',
            maxRetries: 5,
            pendingRequestCount: 1,
            tableName: 'test-table',
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('should use configured retry count and delay for unprocessed items', async () => {
      vi.useFakeTimers();
      try {
        await updateDynamoDbBatchConfig({ maxRetries: 2, retryDelayMs: 50 });
        const unprocessedKey = { id: { S: 'unprocessed-id' } };
        mockSend.mockResolvedValue({
          UnprocessedItems: {
            'test-table': [
              {
                DeleteRequest: {
                  Key: unprocessedKey,
                },
              },
            ],
          },
        });

        const promise = datasource.batchDeleteItems('test-table', [unprocessedKey]);
        const assertion = expect(promise).rejects.toThrow(
          'Batch delete returned 1 unprocessed items after 3 retries',
        );

        await vi.advanceTimersByTimeAsync(50);
        await vi.advanceTimersByTimeAsync(100);
        await assertion;

        expect(BatchWriteItemCommand).toHaveBeenCalledTimes(3);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'DynamoDB batch delete exhausted retries for unprocessed items',
          expect.objectContaining({
            attemptedRequestCount: 1,
            maxRetries: 2,
            pendingRequestCount: 1,
            tableName: 'test-table',
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('should throw immediately for non-retryable batch delete errors', async () => {
      const nonRetryableError = new Error('AccessDenied');
      mockSend.mockRejectedValueOnce(nonRetryableError);

      await expect(
        datasource.batchDeleteItems('test-table', [{ id: { S: 'id-1' } }]),
      ).rejects.toThrow('AccessDenied');

      expect(BatchWriteItemCommand).toHaveBeenCalledTimes(1);
    });

    it('should throw retryable error after max retry attempts are exhausted', async () => {
      vi.useFakeTimers();
      try {
        const throttlingError = Object.assign(new Error('throttled'), {
          name: 'ProvisionedThroughputExceededException',
        });
        mockSend.mockRejectedValue(throttlingError);

        const promise = datasource.batchDeleteItems('test-table', [{ id: { S: 'retry-id' } }]);
        const assertion = expect(promise).rejects.toThrow('throttled');

        await vi.runAllTimersAsync();
        await assertion;

        expect(BatchWriteItemCommand).toHaveBeenCalledTimes(6);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should throw when the batch write result contains unprocessed keys', async () => {
      vi.useFakeTimers();
      try {
        const unprocessedKey = { id: { S: 'unprocessed-id' } };
        mockSend.mockResolvedValue({
          UnprocessedItems: {
            'test-table': [
              {
                DeleteRequest: {
                  Key: unprocessedKey,
                },
              },
            ],
          },
        });

        const promise = datasource.batchDeleteItems('test-table', [unprocessedKey]);
        const assertion = expect(promise).rejects.toThrow(
          'Batch delete returned 1 unprocessed items after 6 retries',
        );

        await vi.runAllTimersAsync();
        await assertion;
      } finally {
        vi.useRealTimers();
      }
    });

    it('should stop before the next batch when the first batch exhausts retries', async () => {
      vi.useFakeTimers();
      try {
        const keys = Array.from({ length: 26 }, (_, index) => ({
          id: { S: `test-id-${index + 1}` },
        }));
        const firstBatchUnprocessedKey = keys[5];
        mockSend.mockResolvedValue({
          UnprocessedItems: {
            'test-table': [
              {
                DeleteRequest: {
                  Key: firstBatchUnprocessedKey,
                },
              },
            ],
          },
        });

        const promise = datasource.batchDeleteItems('test-table', keys);
        const assertion = expect(promise).rejects.toThrow(
          'Batch delete returned 1 unprocessed items after 6 retries',
        );

        await vi.runAllTimersAsync();
        await assertion;

        expect(BatchWriteItemCommand).toHaveBeenCalledTimes(6);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('scan', () => {
    it('should scan items successfully', async () => {
      const input = {
        TableName: 'test-table',
        FilterExpression: 'attr = :val',
        ExpressionAttributeValues: { ':val': { S: 'value' } },
      };
      const mockResponse = { Items: [{ id: { S: 'item-1' } }] };
      mockSend.mockResolvedValue(mockResponse);

      const result = await datasource.scan(input);

      expect(ScanCommand).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when scan fails', async () => {
      const error = new Error('Scan error');
      mockSend.mockRejectedValue(error);

      await expect(datasource.scan({ TableName: 'table' })).rejects.toThrow('Scan error');
    });
  });
});
