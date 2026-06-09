import type {
  AttributeValue,
  DynamoDbDeleteItemOutput,
  DynamoDbQueryInput,
  DynamoDbQueryOutput,
  DynamoDbScanInput,
  DynamoDbScanOutput,
} from '@common/types/datasources/dynamodb.type';

/**
 * Interface for low-level DynamoDB datasource operations.
 * Uses explicit AttributeValue marshalling.
 * For operations that need automatic marshalling, use IDynamoDBServiceDatasource instead.
 */
export interface IDynamoDBDatasource {
  /**
   * Delete a single item from a DynamoDB table by its key.
   * @param tableName - Target table name
   * @param key - Primary key of the item (e.g. `{ id: { S: 'abc' } }`)
   */
  deleteItem(
    tableName: string,
    key: Record<string, AttributeValue>,
  ): Promise<DynamoDbDeleteItemOutput>;

  /**
   * Batch delete items from a DynamoDB table.
   * Automatically handles chunking (max 25 per request) and retries on throttle errors.
   * @param tableName - Target table name
   * @param keys - Array of primary keys to delete
   * @throws Error when unprocessed items remain after max retries
   */
  batchDeleteItems(tableName: string, keys: Record<string, AttributeValue>[]): Promise<void>;

  /**
   * Query items from a DynamoDB table or index.
   */
  query(input: DynamoDbQueryInput): Promise<DynamoDbQueryOutput>;

  /**
   * Scan all items from a DynamoDB table.
   */
  scan(input: DynamoDbScanInput): Promise<DynamoDbScanOutput>;
}
