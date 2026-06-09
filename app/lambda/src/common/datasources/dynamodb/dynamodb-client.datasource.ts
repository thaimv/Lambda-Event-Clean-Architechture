import type { DynamoDbDocumentClient } from '@common/types/datasources/dynamodb.type';

/**
 * Interface for a provider that returns a DynamoDB Document Client instance.
 * Uses the high-level DocumentClient which handles marshalling/unmarshalling automatically.
 */
export interface IDynamoDBClientDatasource {
  /**
   * Returns the DynamoDB Document Client instance.
   */
  getClient(): DynamoDbDocumentClient;
}
